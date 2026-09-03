import { formatCurrency, parseNumberOrNull } from '../src/features/transactions/format'

describe('formatCurrency', () => {
  it('formats a number as US dollars', () => {
    expect(formatCurrency(-1234.5)).toBe('-$1,234.50')
    expect(formatCurrency(0)).toBe('$0.00')
  })
})

describe('parseNumberOrNull', () => {
  it('parses a whole numeric string', () => {
    expect(parseNumberOrNull('1500')).toBe(1500)
    expect(parseNumberOrNull('-42.5')).toBe(-42.5)
    expect(parseNumberOrNull('  12  ')).toBe(12)
  })

  it('returns null for empty or missing input', () => {
    expect(parseNumberOrNull('')).toBeNull()
    expect(parseNumberOrNull('   ')).toBeNull()
    expect(parseNumberOrNull(null)).toBeNull()
    expect(parseNumberOrNull(undefined)).toBeNull()
  })

  it('returns null for input that is only partly numeric', () => {
    expect(parseNumberOrNull('12abc')).toBeNull()
    expect(parseNumberOrNull('abc')).toBeNull()
    expect(parseNumberOrNull('1,000')).toBeNull()
  })
})
