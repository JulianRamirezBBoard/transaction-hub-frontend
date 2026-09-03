import type {
  Transaction,
  FiltersState,
  GroupingPeriod,
  PaginationState,
  TransactionWithRunningTotal,
  TransactionGroup,
  TransactionGroupPage,
  TransactionKind,
} from './types'
import { isRelativeDatePreset } from './types'
import { computePresetRange, getPeriodKey, getPeriodLabel } from './dateUtils'

/**
 * Rounds a money value to whole cents. Used to keep a chained running-total sum from drifting
 * into fractions of a cent, and to trim a computed average to a displayable value. Rounds half
 * away from zero, so a value and its negative round to the same magnitude.
 */
const roundToCents = (amount: number): number => {
  const sign = amount < 0 ? -1 : 1
  return (sign * Math.round(Math.abs(amount) * 100)) / 100
}

export const getTransactionKind = (amount: number): TransactionKind => {
  if (amount > 0) {
    return 'income'
  }
  if (amount < 0) {
    return 'expense'
  }
  return 'neutral'
}

/**
 * Turns a relative preset into the concrete bounds `applyFilters` needs. Done at query time,
 * so a preset can't go stale while the app sits open; `now` is injected to stay deterministic.
 */
export const resolveFilters = (filters: FiltersState, now: Date): FiltersState => {
  const { preset } = filters.dateRange
  if (preset === null || !isRelativeDatePreset(preset)) {
    return filters
  }

  const { startDate, endDate } = computePresetRange(preset, now)
  return { ...filters, dateRange: { ...filters.dateRange, startDate, endDate } }
}

/** True when any dimension would narrow the result set. Here, not in the UI, so it means one thing. */
export const hasActiveFilters = (filters: FiltersState): boolean => {
  const { dateRange, categories, amountRange } = filters

  // A relative preset always narrows. "Custom" with no dates set does not, so it does not count.
  const dateActive =
    (dateRange.preset !== null && isRelativeDatePreset(dateRange.preset)) ||
    dateRange.startDate !== null ||
    dateRange.endDate !== null

  return dateActive || categories.length > 0 || amountRange.min !== null || amountRange.max !== null
}

export const applyFilters = (transactions: Transaction[], filters: FiltersState): Transaction[] => {
  const { logic, dateRange, categories, amountRange } = filters

  const predicates: ((txn: Transaction) => boolean)[] = []

  // Date range predicate. Bounds inclusive.
  if (dateRange.startDate || dateRange.endDate) {
    predicates.push((txn) => {
      if (dateRange.startDate && txn.date < dateRange.startDate) {
        return false
      }
      if (dateRange.endDate && txn.date > dateRange.endDate) {
        return false
      }
      return true
    })
  }

  // Categories predicate. Always a union within the list, regardless of the global AND/OR logic.
  if (categories.length > 0) {
    predicates.push((txn) => categories.includes(txn.category))
  }

  // Amount range predicate. Bounds inclusive.
  if (amountRange.min !== null || amountRange.max !== null) {
    predicates.push((txn) => {
      if (amountRange.min !== null && txn.amount < amountRange.min) {
        return false
      }
      if (amountRange.max !== null && txn.amount > amountRange.max) {
        return false
      }
      return true
    })
  }

  if (predicates.length === 0) {
    return transactions
  }

  return logic === 'AND'
    ? transactions.filter((txn) => predicates.every((pred) => pred(txn)))
    : transactions.filter((txn) => predicates.some((pred) => pred(txn)))
}

/**
 * Buckets transactions into chronological periods, with a running total that resets at each
 * boundary. Summaries are computed over the whole period so pagination can't distort them.
 */
export const groupTransactions = (
  transactions: Transaction[],
  period: GroupingPeriod,
): Map<string, TransactionGroup> => {
  const sorted = [...transactions].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date)
    }
    return a.id.localeCompare(b.id)
  })

  // Insertion order over date-sorted input gives chronological group order for free.
  const groups = new Map<string, TransactionGroup>()

  for (const txn of sorted) {
    const periodKey = getPeriodKey(txn.date, period)

    let group = groups.get(periodKey)
    if (!group) {
      group = {
        summary: {
          periodKey,
          periodLabel: getPeriodLabel(txn.date, period),
          transactionCount: 0,
          totalAmount: 0,
          averageAmount: 0,
        },
        transactions: [],
      }
      groups.set(periodKey, group)
    }

    const previousTotal = group.transactions[group.transactions.length - 1]?.runningTotal ?? 0
    const runningTotal = roundToCents(previousTotal + txn.amount)
    group.transactions.push({ ...txn, runningTotal, periodKey })
  }

  for (const group of groups.values()) {
    const { transactions: rows } = group
    // The last running total already is the period sum. No second pass needed.
    const totalAmount = rows[rows.length - 1].runningTotal
    group.summary.transactionCount = rows.length
    group.summary.totalAmount = totalAmount
    group.summary.averageAmount = roundToCents(totalAmount / rows.length)
  }

  return groups
}

export const flattenGroups = (
  groups: Map<string, TransactionGroup>,
): TransactionWithRunningTotal[] => {
  const flattened: TransactionWithRunningTotal[] = []
  for (const group of groups.values()) {
    flattened.push(...group.transactions)
  }
  return flattened
}

/** Single source of truth for what counts as a valid page number. */
export const clampPage = (page: number, totalPages: number): number => {
  if (!Number.isFinite(page)) {
    return 1
  }
  return Math.max(1, Math.min(Math.trunc(page), Math.max(1, totalPages)))
}

/**
 * The lower half of the page-number rule: an integer, at least 1. The reducer calls this
 * because it cannot know `totalPages`; `paginate` still applies the upper bound.
 */
export const normalizePageInput = (page: number): number => {
  return clampPage(page, Number.POSITIVE_INFINITY)
}

/** The 1-based row range shown on the current page, for "Showing X to Y of Z" text. */
export const getPageItemRange = (
  page: number,
  pageSize: number,
  totalItems: number,
): { startItem: number; endItem: number } => {
  if (totalItems === 0) {
    return { startItem: 0, endItem: 0 }
  }
  return {
    startItem: (page - 1) * pageSize + 1,
    endItem: Math.min(page * pageSize, totalItems),
  }
}

export const paginate = (
  items: TransactionWithRunningTotal[],
  pagination: PaginationState,
): { items: TransactionWithRunningTotal[]; page: number; totalPages: number } => {
  const totalPages = Math.max(1, Math.ceil(items.length / pagination.pageSize))
  const page = clampPage(pagination.page, totalPages)
  const startIdx = (page - 1) * pagination.pageSize

  return {
    items: items.slice(startIdx, startIdx + pagination.pageSize),
    page,
    totalPages,
  }
}

/**
 * Reconstructs the period groups visible on the current page. Rows arrive tagged with
 * `periodKey` and contiguous by period, so this is one linear pass with O(1) lookups, and
 * each group keeps its full-period summary rather than one derived from the page slice.
 */
export const buildPageGroups = (
  groups: Map<string, TransactionGroup>,
  pageSlice: TransactionWithRunningTotal[],
): TransactionGroupPage[] => {
  const pageGroups: TransactionGroupPage[] = []

  for (const txn of pageSlice) {
    const currentGroup = pageGroups[pageGroups.length - 1]

    if (currentGroup?.summary.periodKey === txn.periodKey) {
      currentGroup.transactions.push(txn)
      continue
    }

    const fullGroup = groups.get(txn.periodKey)
    if (!fullGroup) {
      continue
    }

    pageGroups.push({
      summary: fullGroup.summary,
      transactions: [txn],
      // Continued when this period's first row on the page isn't the period's first row overall.
      continued: txn.id !== fullGroup.transactions[0].id,
    })
  }

  return pageGroups
}
