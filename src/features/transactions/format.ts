const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function formatCurrency(amount: number): string {
  return CURRENCY_FORMATTER.format(amount)
}
