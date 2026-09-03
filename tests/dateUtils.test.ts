import { getPeriodKey, getPeriodLabel } from '../src/features/transactions/dateUtils'

describe('date validation in the grouping helpers', () => {
  it('accepts a well-formed ISO date', () => {
    expect(getPeriodKey('2026-07-15', 'monthly')).toBe('2026-07')
    expect(getPeriodLabel('2026-07-15', 'monthly')).toBe('July 2026')
  })

  it.each([
    ['2026-7-5', 'wrong number of digits'],
    ['2026/07/15', 'slashes instead of dashes'],
    ['15-07-2026', 'day first'],
    ['not-a-date', 'plain text'],
    ['', 'empty string'],
  ])('rejects "%s" (%s)', (badDate) => {
    expect(() => getPeriodKey(badDate, 'monthly')).toThrow(/Invalid date/)
  })

  it('rejects a date that has the right shape but no such day', () => {
    expect(() => getPeriodKey('2026-13-40', 'monthly')).toThrow(/Invalid date/)
  })
})
