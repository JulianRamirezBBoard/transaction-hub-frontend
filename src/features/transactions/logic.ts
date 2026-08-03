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

export function getTransactionKind(amount: number): TransactionKind {
  if (amount > 0) return 'income'
  if (amount < 0) return 'expense'
  return 'neutral'
}

/**
 * Turns a relative preset into the concrete bounds `applyFilters` needs. Done at query time,
 * so a preset can't go stale while the app sits open; `now` is injected to stay deterministic.
 */
export function resolveFilters(filters: FiltersState, now: Date): FiltersState {
  const { preset } = filters.dateRange
  if (preset === null || !isRelativeDatePreset(preset)) {
    return filters
  }

  const { startDate, endDate } = computePresetRange(preset, now)
  return { ...filters, dateRange: { ...filters.dateRange, startDate, endDate } }
}

/** True when any dimension would narrow the result set. Here, not in the UI, so it means one thing. */
export function hasActiveFilters(filters: FiltersState): boolean {
  const { dateRange, categories, amountRange } = filters

  return (
    dateRange.preset !== null ||
    dateRange.startDate !== null ||
    dateRange.endDate !== null ||
    categories.length > 0 ||
    amountRange.min !== null ||
    amountRange.max !== null
  )
}

export function applyFilters(transactions: Transaction[], filters: FiltersState): Transaction[] {
  const { logic, dateRange, categories, amountRange } = filters

  const predicates: ((txn: Transaction) => boolean)[] = []

  // Date range predicate — bounds are inclusive.
  if (dateRange.startDate || dateRange.endDate) {
    predicates.push((txn) => {
      if (dateRange.startDate && txn.date < dateRange.startDate) return false
      if (dateRange.endDate && txn.date > dateRange.endDate) return false
      return true
    })
  }

  // Categories predicate — always a union within the list, regardless of the global AND/OR logic.
  if (categories.length > 0) {
    predicates.push((txn) => categories.includes(txn.category))
  }

  // Amount range predicate — bounds are inclusive.
  if (amountRange.min !== null || amountRange.max !== null) {
    predicates.push((txn) => {
      if (amountRange.min !== null && txn.amount < amountRange.min) return false
      if (amountRange.max !== null && txn.amount > amountRange.max) return false
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
export function groupTransactions(
  transactions: Transaction[],
  period: GroupingPeriod,
): Map<string, TransactionGroup> {
  const sorted = [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
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
    group.transactions.push({ ...txn, runningTotal: previousTotal + txn.amount, periodKey })
  }

  for (const group of groups.values()) {
    const { transactions: rows } = group
    // The last running total already is the period sum — no second pass needed.
    const totalAmount = rows[rows.length - 1].runningTotal
    group.summary.transactionCount = rows.length
    group.summary.totalAmount = totalAmount
    group.summary.averageAmount = totalAmount / rows.length
  }

  return groups
}

export function flattenGroups(
  groups: Map<string, TransactionGroup>,
): TransactionWithRunningTotal[] {
  const flattened: TransactionWithRunningTotal[] = []
  for (const group of groups.values()) {
    flattened.push(...group.transactions)
  }
  return flattened
}

export function paginate(
  items: TransactionWithRunningTotal[],
  pagination: PaginationState,
): { items: TransactionWithRunningTotal[]; page: number; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / pagination.pageSize))
  const page = clampPage(pagination.page, totalPages)
  const startIdx = (page - 1) * pagination.pageSize

  return {
    items: items.slice(startIdx, startIdx + pagination.pageSize),
    page,
    totalPages,
  }
}

/** Single source of truth for what counts as a valid page number. */
export function clampPage(page: number, totalPages: number): number {
  if (!Number.isFinite(page)) return 1
  return Math.max(1, Math.min(Math.trunc(page), Math.max(1, totalPages)))
}

/**
 * Reconstructs the period groups visible on the current page. Rows arrive tagged with
 * `periodKey` and contiguous by period, so this is one linear pass with O(1) lookups, and
 * each group keeps its full-period summary rather than one derived from the page slice.
 */
export function buildPageGroups(
  groups: Map<string, TransactionGroup>,
  pageSlice: TransactionWithRunningTotal[],
): TransactionGroupPage[] {
  const pageGroups: TransactionGroupPage[] = []

  for (const txn of pageSlice) {
    const currentGroup = pageGroups[pageGroups.length - 1]

    if (currentGroup?.summary.periodKey === txn.periodKey) {
      currentGroup.transactions.push(txn)
      continue
    }

    const fullGroup = groups.get(txn.periodKey)
    if (!fullGroup) continue

    pageGroups.push({
      summary: fullGroup.summary,
      transactions: [txn],
      // Continued when this period's first row on the page isn't the period's first row overall.
      continued: txn.id !== fullGroup.transactions[0].id,
    })
  }

  return pageGroups
}
