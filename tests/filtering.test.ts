import { applyFilters, hasActiveFilters } from '../src/features/transactions/logic'
import { idsOf, makeFilters, makeTransaction } from './helpers'
import type { Transaction } from '../src/features/transactions/types'

const transactions: Transaction[] = [
  makeTransaction({ id: 'txn-1', date: '2026-07-15', category: 'Groceries', amount: -50 }),
  makeTransaction({ id: 'txn-2', date: '2026-07-10', category: 'Dining', amount: -25 }),
  makeTransaction({ id: 'txn-3', date: '2026-06-15', category: 'Salary', amount: 4500 }),
  makeTransaction({ id: 'txn-4', date: '2026-06-10', category: 'Rent', amount: -1500 }),
  makeTransaction({ id: 'txn-5', date: '2026-05-15', category: 'Shopping', amount: 0 }),
]

describe('applyFilters', () => {
  it('filters by date range', () => {
    const result = applyFilters(
      transactions,
      makeFilters({
        dateRange: { preset: null, startDate: '2026-07-01', endDate: '2026-07-31' },
      }),
    )

    expect(idsOf(result)).toEqual(['txn-1', 'txn-2'])
  })

  it('includes transactions exactly on the date bounds', () => {
    const result = applyFilters(
      transactions,
      makeFilters({
        dateRange: { preset: null, startDate: '2026-07-10', endDate: '2026-07-15' },
      }),
    )

    expect(idsOf(result)).toEqual(['txn-1', 'txn-2'])
  })

  it('treats an open-ended date range as a one-sided bound', () => {
    const result = applyFilters(
      transactions,
      makeFilters({ dateRange: { preset: null, startDate: '2026-06-15', endDate: null } }),
    )

    expect(idsOf(result)).toEqual(['txn-1', 'txn-2', 'txn-3'])
  })

  it('filters by a single category', () => {
    const result = applyFilters(transactions, makeFilters({ categories: ['Groceries'] }))
    expect(idsOf(result)).toEqual(['txn-1'])
  })

  it('unions multiple categories', () => {
    const result = applyFilters(transactions, makeFilters({ categories: ['Groceries', 'Dining'] }))
    expect(idsOf(result)).toEqual(['txn-1', 'txn-2'])
  })

  it('unions categories even under OR logic', () => {
    const result = applyFilters(
      transactions,
      makeFilters({ logic: 'OR', categories: ['Groceries', 'Dining'] }),
    )

    expect(idsOf(result)).toEqual(['txn-1', 'txn-2'])
  })

  it('filters by amount range inclusively', () => {
    const result = applyFilters(transactions, makeFilters({ amountRange: { min: -50, max: -25 } }))
    expect(idsOf(result)).toEqual(['txn-1', 'txn-2'])
  })

  it('includes zero-amount transactions within a range spanning zero', () => {
    const result = applyFilters(transactions, makeFilters({ amountRange: { min: -10, max: 10 } }))
    expect(idsOf(result)).toEqual(['txn-5'])
  })

  it('applies AND logic across dimensions', () => {
    const result = applyFilters(
      transactions,
      makeFilters({
        dateRange: { preset: null, startDate: '2026-07-01', endDate: '2026-07-31' },
        categories: ['Groceries'],
      }),
    )

    expect(idsOf(result)).toEqual(['txn-1'])
  })

  it('applies OR logic across dimensions', () => {
    const result = applyFilters(
      transactions,
      makeFilters({
        logic: 'OR',
        dateRange: { preset: null, startDate: '2026-07-01', endDate: '2026-07-31' },
        categories: ['Rent'],
      }),
    )

    expect(idsOf(result)).toEqual(['txn-1', 'txn-2', 'txn-4'])
  })

  it('ignores dimensions that are not active', () => {
    // Under OR, an inactive category dimension must not match everything.
    const result = applyFilters(
      transactions,
      makeFilters({
        logic: 'OR',
        dateRange: { preset: null, startDate: '2026-07-01', endDate: '2026-07-31' },
      }),
    )

    expect(idsOf(result)).toEqual(['txn-1', 'txn-2'])
  })

  it('returns the input unchanged when no filters are active', () => {
    const filters = makeFilters()
    expect(applyFilters(transactions, filters)).toBe(transactions)
  })
})

describe('hasActiveFilters', () => {
  it('is false for untouched filters', () => {
    expect(hasActiveFilters(makeFilters())).toBe(false)
  })

  it('ignores the AND/OR choice, which never narrows anything on its own', () => {
    expect(hasActiveFilters(makeFilters({ logic: 'OR' }))).toBe(false)
  })

  it.each([
    ['a preset', makeFilters({ dateRange: { preset: 'last30', startDate: null, endDate: null } })],
    [
      'a start date',
      makeFilters({ dateRange: { preset: null, startDate: '2026-07-01', endDate: null } }),
    ],
    [
      'an end date',
      makeFilters({ dateRange: { preset: null, startDate: null, endDate: '2026-07-31' } }),
    ],
    ['a category', makeFilters({ categories: ['Groceries'] })],
    ['a minimum amount', makeFilters({ amountRange: { min: -100, max: null } })],
    ['a maximum amount', makeFilters({ amountRange: { min: null, max: 100 } })],
  ])('is true with %s active', (_name, filters) => {
    expect(hasActiveFilters(filters)).toBe(true)
  })
})
