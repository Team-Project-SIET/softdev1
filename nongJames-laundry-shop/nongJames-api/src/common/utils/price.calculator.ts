export function calculateProfit(revenue: number, expenses: number): number {
  return revenue - expenses;
}

export function calculateMarginPercentage(profit: number, revenue: number): number {
  if (revenue === 0) return 0;
  return (profit / revenue) * 100;
}

export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatPrice(price: number, currency: string = 'THB'): string {
  return `${currency} ${price.toFixed(2)}`;
}
