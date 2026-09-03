const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export const formatCurrency = (amount: number): string => {
  return CURRENCY_FORMATTER.format(amount)
}

/**
 * Parses a numeric string with `Number()`. Returns null for empty, nullish, or non-numeric
 * input such as "12abc" or "1,000", so a half-typed field reads as "no value" rather than a
 * wrong bound. `Number()` still accepts exponent and hex literals ("1e3", "0x10").
 */
export const parseNumberOrNull = (value: string | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null
  }
  const trimmed = value.trim()
  if (trimmed === '') {
    return null
  }
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}
