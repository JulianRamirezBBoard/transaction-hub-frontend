export const TRANSACTION_CATEGORIES = [
  'Salary',
  'Groceries',
  'Dining',
  'Transport',
  'Utilities',
  'Rent',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Subscriptions',
  'Travel',
  'Transfer',
  'Other',
] as const

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number]

export interface Transaction {
  id: string
  date: string
  description: string
  category: TransactionCategory
  amount: number
}

export const FILTER_LOGIC_OPTIONS = ['AND', 'OR'] as const
export type FilterLogic = (typeof FILTER_LOGIC_OPTIONS)[number]

export const DATE_PRESETS = ['last30', 'last3months', 'ytd', 'custom'] as const

/** A preset the user can pick. Absence of a preset is modelled as `null` at the field, not here. */
export type DatePreset = (typeof DATE_PRESETS)[number]

/** Presets that resolve to a date range relative to "now"; `custom` carries explicit dates instead. */
export type RelativeDatePreset = Exclude<DatePreset, 'custom'>

export const isRelativeDatePreset = (preset: DatePreset): preset is RelativeDatePreset => {
  return preset !== 'custom'
}

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  last30: 'Last 30 days',
  last3months: 'Last 3 months',
  ytd: 'YTD',
  custom: 'Custom',
}

export const MOBILE_DATE_PRESET_LABELS: Record<DatePreset, string> = {
  last30: '30d',
  last3months: '3mo',
  ytd: 'YTD',
  custom: 'Custom',
}

export const FILTER_LOGIC_LABELS: Record<FilterLogic, string> = {
  AND: 'AND (All)',
  OR: 'OR (Any)',
}

export interface DateRangeFilter {
  preset: DatePreset | null
  startDate: string | null
  endDate: string | null
}

export interface AmountRangeFilter {
  min: number | null
  max: number | null
}

export interface FiltersState {
  logic: FilterLogic
  dateRange: DateRangeFilter
  categories: TransactionCategory[]
  amountRange: AmountRangeFilter
}

export const GROUPING_PERIOD_OPTIONS = ['weekly', 'monthly'] as const
export type GroupingPeriod = (typeof GROUPING_PERIOD_OPTIONS)[number]

export const GROUPING_PERIOD_LABELS: Record<GroupingPeriod, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
}

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number]

export const isPageSizeOption = (value: number): value is PageSizeOption => {
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(value)
}

export interface PaginationState {
  page: number
  pageSize: PageSizeOption
}

export interface PeriodSummary {
  periodKey: string
  periodLabel: string
  transactionCount: number
  totalAmount: number
  averageAmount: number
}

export interface TransactionWithRunningTotal extends Transaction {
  /** Sum of amounts within this row's period, up to and including this row. Resets per period. */
  runningTotal: number
  /** Period bucket this row belongs to. Carried on the row so downstream steps never recompute it. */
  periodKey: string
}

/** A complete period bucket: every transaction in the period, plus stats over all of them. */
export interface TransactionGroup {
  summary: PeriodSummary
  transactions: TransactionWithRunningTotal[]
}

/**
 * One period as rendered on a single page. `transactions` holds only the rows on this
 * page, while `summary` always describes the whole period.
 */
export interface TransactionGroupPage {
  summary: PeriodSummary
  transactions: TransactionWithRunningTotal[]
  /** True when this period's rows began on an earlier page. */
  continued: boolean
}

export interface TransactionsQueryArgs {
  filters: FiltersState
  grouping: GroupingPeriod
  pagination: PaginationState
}

export interface TransactionsQueryResult {
  pageGroups: TransactionGroupPage[]
  /** Number of rows matching the filters, across all pages. */
  totalItems: number
  totalPages: number
  /** The page actually served, after clamping the requested page into range. */
  page: number
}

export type TransactionKind = 'income' | 'expense' | 'neutral'

export interface TransactionsState {
  filters: FiltersState
  grouping: GroupingPeriod
  pagination: PaginationState
}
