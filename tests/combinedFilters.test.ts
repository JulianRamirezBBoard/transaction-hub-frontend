import { makeFilters, makeTransaction, runPipeline } from './helpers'
import type { Transaction } from '../src/features/transactions/types'

const transactions: Transaction[] = [
  makeTransaction({ id: 'txn-1', date: '2026-07-20', description: 'Grocery', amount: -50 }),
  makeTransaction({
    id: 'txn-2',
    date: '2026-07-15',
    description: 'Rent',
    category: 'Rent',
    amount: -1500,
  }),
  makeTransaction({
    id: 'txn-3',
    date: '2026-07-10',
    description: 'Salary',
    category: 'Salary',
    amount: 5000,
  }),
  makeTransaction({
    id: 'txn-4',
    date: '2026-06-20',
    description: 'Dining',
    category: 'Dining',
    amount: -30,
  }),
  makeTransaction({
    id: 'txn-5',
    date: '2026-06-15',
    description: 'Salary',
    category: 'Salary',
    amount: 5000,
  }),
]

describe('Full pipeline integration', () => {
  it('applies filters and pagination end to end', () => {
    const { filtered, flatRows, pageRows, pageGroups } = runPipeline(transactions, {
      filters: makeFilters({
        dateRange: { preset: null, startDate: '2026-07-01', endDate: '2026-07-31' },
      }),
      pagination: { page: 1, pageSize: 10 },
    })

    expect(filtered).toHaveLength(3)
    expect(flatRows).toHaveLength(3)
    expect(pageRows).toHaveLength(3)
    expect(pageGroups).toHaveLength(1)
    expect(pageGroups[0].summary.transactionCount).toBe(3)
  })

  it('keeps multiple months on one page in chronological order', () => {
    const { pageGroups } = runPipeline(transactions, { pagination: { page: 1, pageSize: 10 } })

    expect(pageGroups).toHaveLength(2)
    expect(pageGroups.map((g) => g.summary.periodKey)).toEqual(['2026-06', '2026-07'])
  })

  it('handles an empty result set', () => {
    const { filtered, flatRows, pageRows, pageGroups } = runPipeline(transactions, {
      filters: makeFilters({
        dateRange: { preset: null, startDate: '2026-08-01', endDate: '2026-08-31' },
      }),
    })

    expect(filtered).toHaveLength(0)
    expect(flatRows).toHaveLength(0)
    expect(pageRows).toHaveLength(0)
    expect(pageGroups).toHaveLength(0)
  })

  it('reports full-period summaries, not page-slice summaries', () => {
    const { pageGroups } = runPipeline(transactions, { pagination: { page: 1, pageSize: 10 } })

    const july = pageGroups.find((g) => g.summary.periodKey === '2026-07')!
    expect(july.summary.transactionCount).toBe(3)
    expect(july.summary.totalAmount).toBe(3450)
    expect(july.summary.averageAmount).toBeCloseTo(1150, 5)

    const june = pageGroups.find((g) => g.summary.periodKey === '2026-06')!
    expect(june.summary.transactionCount).toBe(2)
    expect(june.summary.totalAmount).toBe(4970)
    expect(june.summary.averageAmount).toBeCloseTo(2485, 5)
  })
})

/**
 * Regression cover for the `continued` marker. The flag must describe *this* group's own
 * first row, not the first row of the page — otherwise every group after the first on a
 * page is wrongly labelled "(continued)".
 */
describe('continued marker', () => {
  // 30 rows in June then 10 in July: page 2 at size 25 starts mid-June and contains all
  // of July, so June is genuinely continued and July genuinely is not.
  const split: Transaction[] = [
    ...Array.from({ length: 30 }, (_, i) =>
      makeTransaction({ id: `jun-${String(i).padStart(2, '0')}`, date: '2026-06-10', amount: 1 }),
    ),
    ...Array.from({ length: 10 }, (_, i) =>
      makeTransaction({ id: `jul-${String(i).padStart(2, '0')}`, date: '2026-07-10', amount: 1 }),
    ),
  ]

  it('marks a group continued only when its rows began on an earlier page', () => {
    const { pageGroups } = runPipeline(split, { pagination: { page: 2, pageSize: 25 } })

    expect(pageGroups.map((g) => [g.summary.periodKey, g.continued])).toEqual([
      ['2026-06', true],
      ['2026-07', false],
    ])
  })

  it('does not mark the first page of a period as continued', () => {
    const { pageGroups } = runPipeline(split, { pagination: { page: 1, pageSize: 25 } })

    expect(pageGroups).toHaveLength(1)
    expect(pageGroups[0].summary.periodKey).toBe('2026-06')
    expect(pageGroups[0].continued).toBe(false)
  })

  it('keeps the full-period summary on a continued group', () => {
    const { pageGroups } = runPipeline(split, { pagination: { page: 2, pageSize: 25 } })

    const june = pageGroups[0]
    expect(june.continued).toBe(true)
    expect(june.transactions).toHaveLength(5) // only the rows on this page
    expect(june.summary.transactionCount).toBe(30) // but stats cover the whole month
    expect(june.summary.totalAmount).toBe(30)
  })
})
