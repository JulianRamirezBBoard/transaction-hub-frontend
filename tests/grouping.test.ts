import { groupTransactions, flattenGroups } from '../src/features/transactions/logic'
import { getPeriodKey, getPeriodLabel } from '../src/features/transactions/dateUtils'
import { idsOf, makeTransaction } from './helpers'

describe('groupTransactions', () => {
  it('groups transactions by month', () => {
    const groups = groupTransactions(
      [
        makeTransaction({ id: 'txn-1', date: '2026-07-15' }),
        makeTransaction({ id: 'txn-2', date: '2026-07-20' }),
        makeTransaction({ id: 'txn-3', date: '2026-06-10' }),
      ],
      'monthly',
    )

    expect(groups.size).toBe(2)
    expect([...groups.keys()]).toEqual(['2026-06', '2026-07'])
  })

  it('groups transactions by week', () => {
    const groups = groupTransactions(
      [
        makeTransaction({ id: 'txn-1', date: '2026-07-13' }),
        makeTransaction({ id: 'txn-2', date: '2026-07-20' }),
        makeTransaction({ id: 'txn-3', date: '2026-06-29' }),
      ],
      'weekly',
    )

    expect(groups.size).toBe(3)
  })

  it('resets the running total at each period boundary', () => {
    const groups = groupTransactions(
      [
        makeTransaction({ id: 'txn-1', date: '2026-07-15', amount: 100 }),
        makeTransaction({ id: 'txn-2', date: '2026-07-20', amount: 50 }),
        makeTransaction({ id: 'txn-3', date: '2026-06-10', amount: 200 }),
      ],
      'monthly',
    )

    const july = groups.get('2026-07')!.transactions
    expect(july.map((t) => t.runningTotal)).toEqual([100, 150])

    const june = groups.get('2026-06')!.transactions
    expect(june.map((t) => t.runningTotal)).toEqual([200])
  })

  it('handles zero-amount transactions', () => {
    const groups = groupTransactions(
      [
        makeTransaction({ id: 'txn-1', date: '2026-07-15', amount: 0 }),
        makeTransaction({ id: 'txn-2', date: '2026-07-20', amount: 50 }),
      ],
      'monthly',
    )

    expect(groups.get('2026-07')!.transactions.map((t) => t.runningTotal)).toEqual([0, 50])
  })

  it('handles negative amounts', () => {
    const groups = groupTransactions(
      [
        makeTransaction({ id: 'txn-1', date: '2026-07-15', amount: -100 }),
        makeTransaction({ id: 'txn-2', date: '2026-07-20', amount: -50 }),
      ],
      'monthly',
    )

    expect(groups.get('2026-07')!.transactions.map((t) => t.runningTotal)).toEqual([-100, -150])
  })

  it('orders transactions chronologically within a group, tie-breaking by id', () => {
    const groups = groupTransactions(
      [
        makeTransaction({ id: 'txn-3', date: '2026-07-20' }),
        makeTransaction({ id: 'txn-1', date: '2026-07-15' }),
        makeTransaction({ id: 'txn-2', date: '2026-07-15' }),
      ],
      'monthly',
    )

    expect(idsOf(groups.get('2026-07')!.transactions)).toEqual(['txn-1', 'txn-2', 'txn-3'])
  })

  it('tags every row with its own period key', () => {
    const groups = groupTransactions(
      [
        makeTransaction({ id: 'txn-1', date: '2026-07-15' }),
        makeTransaction({ id: 'txn-2', date: '2026-06-10' }),
      ],
      'monthly',
    )

    expect(groups.get('2026-07')!.transactions[0].periodKey).toBe('2026-07')
    expect(groups.get('2026-06')!.transactions[0].periodKey).toBe('2026-06')
  })

  describe('period summaries', () => {
    it('computes count, total and average over the whole period', () => {
      const groups = groupTransactions(
        [
          makeTransaction({ id: 'txn-1', date: '2026-07-01', amount: 100 }),
          makeTransaction({ id: 'txn-2', date: '2026-07-02', amount: 200 }),
          makeTransaction({ id: 'txn-3', date: '2026-07-03', amount: 300 }),
        ],
        'monthly',
      )

      const { summary } = groups.get('2026-07')!
      expect(summary.periodKey).toBe('2026-07')
      expect(summary.periodLabel).toBe('July 2026')
      expect(summary.transactionCount).toBe(3)
      expect(summary.totalAmount).toBe(600)
      expect(summary.averageAmount).toBe(200)
    })

    it('handles repeated amounts and a net-zero period', () => {
      const groups = groupTransactions(
        [
          makeTransaction({ id: 'txn-1', date: '2026-07-01', amount: 50 }),
          makeTransaction({ id: 'txn-2', date: '2026-07-02', amount: -50 }),
        ],
        'monthly',
      )

      const { summary } = groups.get('2026-07')!
      expect(summary.totalAmount).toBe(0)
      expect(summary.averageAmount).toBe(0)
    })
  })
})

/**
 * Regression cover for the ISO-8601 year boundary: dates in early January belong to the
 * final week of the *previous* ISO year. Getting this wrong produced a `W00` key and split
 * one real calendar week into two groups sharing an identical header.
 */
describe('ISO week boundaries', () => {
  it.each([
    ['2027-01-01', '2026-W53'],
    ['2022-01-01', '2021-W52'],
    ['2021-01-01', '2020-W53'],
    ['2026-01-01', '2026-W01'],
  ])('maps %s to %s', (date, expectedKey) => {
    expect(getPeriodKey(date, 'weekly')).toBe(expectedKey)
  })

  it('never produces a week 00', () => {
    for (let year = 2018; year <= 2032; year++) {
      for (const day of ['01', '02', '03', '04']) {
        expect(getPeriodKey(`${year}-01-${day}`, 'weekly')).not.toMatch(/-W00$/)
      }
    }
  })

  it('keeps one calendar week in a single group across a year boundary', () => {
    // Mon 2021-12-27 → Sun 2022-01-02 is one ISO week.
    const groups = groupTransactions(
      [
        makeTransaction({ id: 'txn-1', date: '2021-12-31', amount: 10 }),
        makeTransaction({ id: 'txn-2', date: '2022-01-01', amount: 20 }),
      ],
      'weekly',
    )

    expect(groups.size).toBe(1)
    const [group] = [...groups.values()]
    expect(group.summary.periodLabel).toBe('Week of December 27, 2021')
    expect(group.summary.totalAmount).toBe(30)
  })

  it('gives distinct labels to distinct week keys', () => {
    const keysByLabel = new Map<string, Set<string>>()

    for (let offset = 0; offset < 400; offset++) {
      const d = new Date(Date.UTC(2021, 0, 1))
      d.setUTCDate(d.getUTCDate() + offset)
      const date = d.toISOString().slice(0, 10)

      const label = getPeriodLabel(date, 'weekly')
      const keys = keysByLabel.get(label) ?? new Set<string>()
      keys.add(getPeriodKey(date, 'weekly'))
      keysByLabel.set(label, keys)
    }

    for (const [label, keys] of keysByLabel) {
      expect({ label, keys: [...keys] }).toEqual({ label, keys: [...keys].slice(0, 1) })
    }
  })
})

describe('flattenGroups', () => {
  it('flattens grouped transactions back into one chronological array', () => {
    const groups = groupTransactions(
      [
        makeTransaction({ id: 'txn-1', date: '2026-07-15' }),
        makeTransaction({ id: 'txn-2', date: '2026-06-10' }),
      ],
      'monthly',
    )

    expect(idsOf(flattenGroups(groups))).toEqual(['txn-2', 'txn-1'])
  })
})
