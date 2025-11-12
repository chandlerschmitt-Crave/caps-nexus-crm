export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '$0';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatCurrencyMillions(value: number | null | undefined): string {
  if (value === null || value === undefined) return '$0M';
  return `$${(value / 1000000).toFixed(2)}M`;
}
