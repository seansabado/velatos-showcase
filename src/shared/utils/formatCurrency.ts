// src/shared/utils/formatCurrency.ts
// Currency formatting utility — supports JPY (no decimals) and USD

type SupportedCurrency = 'JPY' | 'USD';

const CURRENCY_CONFIG: Record<SupportedCurrency, { symbol: string; decimals: number }> = {
  JPY: { symbol: '¥', decimals: 0 },
  USD: { symbol: '$', decimals: 2 },
};

/**
 * Formats a numeric amount as a localized currency string.
 *
 * @example
 * formatCurrency(1500, 'JPY') // → "¥1,500"
 * formatCurrency(19.99, 'USD') // → "$19.99"
 */
export function formatCurrency(amount: number, currency: SupportedCurrency = 'JPY'): string {
  const { symbol, decimals } = CURRENCY_CONFIG[currency];
  const formatted = amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${symbol}${formatted}`;
}

/**
 * Calculates a simple tax amount (integer, rounds down for JPY).
 */
export function calculateTax(subtotal: number, ratePercent: number, currency: SupportedCurrency = 'JPY'): number {
  const tax = subtotal * (ratePercent / 100);
  return currency === 'JPY' ? Math.floor(tax) : Math.round(tax * 100) / 100;
}
