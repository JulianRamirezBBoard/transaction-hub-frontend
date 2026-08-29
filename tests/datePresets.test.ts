import { computePresetRange } from '../src/features/transactions/dateUtils'
import { resolveFilters, applyFilters } from '../src/features/transactions/logic'
import { idsOf, makeFilters, makeTransaction, runPipeline } from './helpers'
import type { Transaction } from '../src/features/transactions/types'

const NOW = new Date('2026-07-23T00:00:00Z')

describe('computePresetRange', () => {
  it('resolves last30 to a 30-day inclusive window ending today', () => {
    expect(computePresetRange('last30', NOW)).toEqual({
      startDate: '2026-06-24',
      endDate: '2026-07-23',
    })
  })

  it('resolves last3months to the same day three months back', () => {
    expect(computePresetRange('last3months', NOW)).toEqual({
      startDate: '2026-04-23',
      endDate: '2026-07-23',
    })
  })

  it('resolves ytd to January 1st of the current year', () => {
    expect(computePresetRange('ytd', NOW)).toEqual({
      startDate: '2026-01-01',
      endDate: '2026-07-23',
    })
  })

  it('clamps the day when the target month is shorter', () => {
    // 3 months before May 31 is Feb 28 (2026 is not a leap year), not "Feb 31".
    expect(computePresetRange('last3months', new Date('2026-05-31T00:00:00Z')).startDate).toBe(
      '2026-02-28',
    )
  })

  it('handles a preset spanning a year boundary', () => {
    expect(computePresetRange('last30', new Date('2026-01-10T00:00:00Z'))).toEqual({
      startDate: '2025-12-12',
      endDate: '2026-01-10',
    })
  })
})

describe('resolveFilters', () => {
  it('fills in concrete bounds for a relative preset', () => {
    const resolved = resolveFilters(
      makeFilters({ dateRange: { preset: 'last30', startDate: null, endDate: null } }),
      NOW,
    )

    expect(resolved.dateRange.startDate).toBe('2026-06-24')
    expect(resolved.dateRange.endDate).toBe('2026-07-23')
  })

  it('leaves custom ranges untouched', () => {
    const filters = makeFilters({
      dateRange: { preset: 'custom', startDate: '2026-01-01', endDate: '2026-03-01' },
    })

    expect(resolveFilters(filters, NOW)).toEqual(filters)
  })

  it('leaves filters untouched when no preset is selected', () => {
    const filters = makeFilters()
    expect(resolveFilters(filters, NOW)).toBe(filters)
  })
})

describe('presets actually filter', () => {
  const transactions: Transaction[] = [
    makeTransaction({ id: 'today', date: '2026-07-23' }),
    makeTransaction({ id: 'within-30', date: '2026-07-01' }),
    makeTransaction({ id: 'within-3mo', date: '2026-05-15' }),
    makeTransaction({ id: 'this-year', date: '2026-02-10' }),
    makeTransaction({ id: 'last-year', date: '2025-11-05' }),
  ]

  it.each([
    ['last30', ['within-30', 'today']],
    ['last3months', ['within-3mo', 'within-30', 'today']],
    ['ytd', ['this-year', 'within-3mo', 'within-30', 'today']],
  ] as const)('%s narrows the result set', (preset, expectedIds) => {
    const { flatRows } = runPipeline(transactions, {
      filters: makeFilters({ dateRange: { preset, startDate: null, endDate: null } }),
      now: NOW,
    })

    expect(idsOf(flatRows)).toEqual(expectedIds)
  })

  it('returns everything when no preset is active', () => {
    const { flatRows } = runPipeline(transactions, { now: NOW })
    expect(flatRows).toHaveLength(5)
  })

  it('is not satisfied by the unresolved filters alone', () => {
    const filters = makeFilters({
      dateRange: { preset: 'last30', startDate: null, endDate: null },
    })

    expect(applyFilters(transactions, filters)).toHaveLength(5)
    expect(applyFilters(transactions, resolveFilters(filters, NOW))).toHaveLength(2)
  })
})
