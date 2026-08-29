import {
  transactionsSlice,
  setDateRangePreset,
  setCustomDateRange,
  toggleCategory,
  setAmountRange,
  setFilterLogic,
  setGrouping,
  setPage,
  setPageSize,
  clearAllFilters,
} from '../src/features/transactions/transactionsSlice'
import { makeState } from './helpers'

const reduce = transactionsSlice.reducer

describe('transactionsSlice', () => {
  it('starts with no filters active', () => {
    const state = reduce(undefined, { type: 'unknown' })

    expect(state).toEqual(makeState())
  })

  it('records a date preset without keeping stale explicit bounds', () => {
    const state = reduce(
      makeState({
        filters: {
          logic: 'AND',
          dateRange: { preset: 'custom', startDate: '2026-01-01', endDate: '2026-02-01' },
          categories: [],
          amountRange: { min: null, max: null },
        },
      }),
      setDateRangePreset('last30'),
    )

    expect(state.filters.dateRange).toEqual({ preset: 'last30', startDate: null, endDate: null })
  })

  it('records a custom range', () => {
    const state = reduce(
      makeState(),
      setCustomDateRange({ startDate: '2026-07-01', endDate: '2026-07-31' }),
    )

    expect(state.filters.dateRange).toEqual({
      preset: 'custom',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    })
  })

  it('toggles a category on and back off', () => {
    const added = reduce(makeState(), toggleCategory('Groceries'))
    expect(added.filters.categories).toEqual(['Groceries'])

    const removed = reduce(added, toggleCategory('Groceries'))
    expect(removed.filters.categories).toEqual([])
  })

  it('records an amount range', () => {
    const state = reduce(makeState(), setAmountRange({ min: -100, max: -10 }))
    expect(state.filters.amountRange).toEqual({ min: -100, max: -10 })
  })

  it('records filter logic', () => {
    const state = reduce(makeState(), setFilterLogic('OR'))
    expect(state.filters.logic).toBe('OR')
  })

  describe('pagination interaction', () => {
    const onPageThree = makeState({ pagination: { page: 3, pageSize: 25 } })

    it.each([
      ['setDateRangePreset', setDateRangePreset('last30')],
      ['setCustomDateRange', setCustomDateRange({ startDate: '2026-07-01', endDate: null })],
      ['toggleCategory', toggleCategory('Groceries')],
      ['setAmountRange', setAmountRange({ min: -100, max: null })],
      ['setFilterLogic', setFilterLogic('OR')],
      ['setPageSize', setPageSize(50)],
    ])('%s returns to page 1', (_name, action) => {
      expect(reduce(onPageThree, action).pagination.page).toBe(1)
    })

    it('setGrouping keeps the current page', () => {
      const state = reduce(onPageThree, setGrouping('weekly'))
      expect(state.grouping).toBe('weekly')
      expect(state.pagination.page).toBe(3)
    })

    it('setPage stores a valid page', () => {
      expect(reduce(makeState(), setPage(5)).pagination.page).toBe(5)
    })

    it.each([
      [0, 1],
      [-4, 1],
      [2.9, 2],
      [Number.NaN, 1],
    ])('setPage(%p) is sanitised to %p', (input, expected) => {
      expect(reduce(makeState(), setPage(input)).pagination.page).toBe(expected)
    })
  })

  describe('clearAllFilters', () => {
    const dirty = makeState({
      filters: {
        logic: 'OR',
        dateRange: { preset: 'last30', startDate: '2026-07-01', endDate: '2026-07-31' },
        categories: ['Groceries', 'Dining'],
        amountRange: { min: -100, max: -10 },
      },
      grouping: 'weekly',
      pagination: { page: 3, pageSize: 50 },
    })

    it('resets every filter dimension and returns to page 1', () => {
      const state = reduce(dirty, clearAllFilters())

      expect(state.filters).toEqual(makeState().filters)
      expect(state.pagination.page).toBe(1)
    })

    it('preserves the grouping and page-size the user chose', () => {
      const state = reduce(dirty, clearAllFilters())

      expect(state.grouping).toBe('weekly')
      expect(state.pagination.pageSize).toBe(50)
    })
  })
})
