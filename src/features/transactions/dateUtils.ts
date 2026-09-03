import type { GroupingPeriod, RelativeDatePreset } from './types'

const MS_PER_DAY = 86_400_000

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Parses an ISO `YYYY-MM-DD` string as a UTC midnight instant. Rejects any other shape. */
const parseIsoDate = (date: string): Date => {
  if (!ISO_DATE_PATTERN.test(date)) {
    throw new Error(`Invalid date "${date}": expected the format YYYY-MM-DD.`)
  }
  const parsed = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date "${date}": that calendar date does not exist.`)
  }
  return parsed
}

/** Formats a Date as an ISO `YYYY-MM-DD` string in UTC. */
const toIsoDateString = (d: Date): string => {
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** The Monday (UTC midnight) of the ISO week containing `d`. All week math goes through here. */
const getIsoWeekStart = (d: Date): Date => {
  const dayOfWeek = d.getUTCDay() // 0 = Sunday .. 6 = Saturday
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(d)
  monday.setUTCDate(d.getUTCDate() + offsetToMonday)
  monday.setUTCHours(0, 0, 0, 0)
  return monday
}

/**
 * ISO-8601 week-numbering year and week for `d`. The ISO year is the year of that week's
 * Thursday, which keeps late-December and early-January dates in one week rather than two.
 */
const getIsoWeek = (d: Date): { isoYear: number; isoWeek: number } => {
  const weekStart = getIsoWeekStart(d)

  const thursday = new Date(weekStart)
  thursday.setUTCDate(weekStart.getUTCDate() + 3)
  const isoYear = thursday.getUTCFullYear()

  // ISO week 1 is by definition the week containing January 4th.
  const week1Start = getIsoWeekStart(new Date(Date.UTC(isoYear, 0, 4)))
  const isoWeek = Math.round((weekStart.getTime() - week1Start.getTime()) / (7 * MS_PER_DAY)) + 1

  return { isoYear, isoWeek }
}

export const getPeriodKey = (date: string, period: GroupingPeriod): string => {
  const d = parseIsoDate(date)

  if (period === 'monthly') {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
  }

  const { isoYear, isoWeek } = getIsoWeek(d)
  return `${isoYear}-W${String(isoWeek).padStart(2, '0')}`
}

export const getPeriodLabel = (date: string, period: GroupingPeriod): string => {
  const d = parseIsoDate(date)

  if (period === 'monthly') {
    return `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`
  }

  const weekStart = getIsoWeekStart(d)
  return `Week of ${MONTH_NAMES[weekStart.getUTCMonth()]} ${weekStart.getUTCDate()}, ${weekStart.getUTCFullYear()}`
}

/** Subtracts whole months, clamping the day to the target month's length (Mar 31 → Feb 28). */
const subtractMonths = (d: Date, months: number): Date => {
  const result = new Date(d)
  const targetDay = d.getUTCDate()
  result.setUTCDate(1)
  result.setUTCMonth(result.getUTCMonth() - months)
  const daysInTargetMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate()
  result.setUTCDate(Math.min(targetDay, daysInTargetMonth))
  return result
}

/** Resolves a relative preset into inclusive `YYYY-MM-DD` bounds. `now` is injected, not read. */
export const computePresetRange = (
  preset: RelativeDatePreset,
  now: Date,
): { startDate: string; endDate: string } => {
  const end = new Date(now)
  end.setUTCHours(0, 0, 0, 0)

  let start: Date
  switch (preset) {
    case 'last30': {
      start = new Date(end)
      start.setUTCDate(end.getUTCDate() - 29)
      break
    }
    case 'last3months': {
      start = subtractMonths(end, 3)
      break
    }
    case 'ytd': {
      start = new Date(Date.UTC(end.getUTCFullYear(), 0, 1))
      break
    }
  }

  return { startDate: toIsoDateString(start), endDate: toIsoDateString(end) }
}
