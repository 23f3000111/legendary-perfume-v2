export function formatRM(value: number): string {
  return 'RM ' + value.toLocaleString('en-MY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export function discountPct(price: number, compareAt?: number): number | null {
  if (!compareAt || compareAt <= price) return null
  return Math.round(((compareAt - price) / compareAt) * 100)
}
