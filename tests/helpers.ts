import {
  resolveFilters,
  applyFilters,
  groupTransactions,
  flattenGroups,
  paginate,
  buildPageGroups,
} from '../src/features/transactions/logic'
import type {
  FiltersState,
  GroupingPeriod,
  PaginationState,
  Transaction,
  TransactionGroupPage,
  TransactionWithRunningTotal,
  TransactionsState,
} from '../src/features/transactions/types'

/** Filters with nothing active; spread overrides on top for the dimension under test. */
export function makeFilters(overrides: Partial<FiltersState> = {}): FiltersState {
  return {
    logic: 'AND',
    dateRange: { preset: null, startDate: null, endDate: null },
    categories: [],
    amountRange: { min: null, max: null },
    ...overrides,
  }
}

export function makeState(overrides: Partial<TransactionsState> = {}): TransactionsState {
  return {
    filters: makeFilters(),
    grouping: 'monthly',
    pagination: { page: 1, pageSize: 25 },
    ...overrides,
  }
}

export function makeTransaction(overrides: Partial<Transaction> & { id: string }): Transaction {
  return {
    date: '2026-07-15',
    description: 'Test',
    category: 'Groceries',
    amount: -50,
    ...overrides,
  }
}

/** A transaction as it looks after grouping, for tests that start downstream. */
export function makeRow(
  overrides: Partial<TransactionWithRunningTotal> & { id: string },
): TransactionWithRunningTotal {
  const { runningTotal, periodKey, ...transaction } = overrides

  return {
    ...makeTransaction(transaction),
    runningTotal: runningTotal ?? -50,
    periodKey: periodKey ?? '2026-07',
  }
}

/** Which rows came back, in order: what most assertions actually care about. */
export const idsOf = (rows: { id: string }[]) => rows.map((row) => row.id)

interface PipelineOptions {
  filters?: FiltersState
  grouping?: GroupingPeriod
  pagination?: PaginationState
  /** Reference instant for resolving relative date presets. */
  now?: Date
}

interface PipelineResult {
  filtered: Transaction[]
  flatRows: TransactionWithRunningTotal[]
  pageRows: TransactionWithRunningTotal[]
  pageGroups: TransactionGroupPage[]
  page: number
  totalPages: number
}

/** Runs the same sequence the API layer does, so tests exercise the real composition. */
export function runPipeline(
  transactions: Transaction[],
  {
    filters = makeFilters(),
    grouping = 'monthly',
    pagination = { page: 1, pageSize: 25 },
    now = new Date('2026-07-23T00:00:00Z'),
  }: PipelineOptions = {},
): PipelineResult {
  const filtered = applyFilters(transactions, resolveFilters(filters, now))
  const groups = groupTransactions(filtered, grouping)
  const flatRows = flattenGroups(groups)
  const { items, page, totalPages } = paginate(flatRows, pagination)
  const pageGroups = buildPageGroups(groups, items)

  return { filtered, flatRows, pageRows: items, pageGroups, page, totalPages }
}
