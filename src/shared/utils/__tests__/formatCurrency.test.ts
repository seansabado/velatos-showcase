import { formatCurrency, calculateTax } from '../formatCurrency';

describe('formatCurrency', () => {
  it('formats zero JPY with no decimals', () => {
    expect(formatCurrency(0, 'JPY')).toBe('¥0');
  });

  it('formats large JPY values with comma separators', () => {
    expect(formatCurrency(123456789, 'JPY')).toBe('¥123,456,789');
  });

  it('formats USD with two decimals', () => {
    expect(formatCurrency(19.9, 'USD')).toBe('$19.90');
  });
});

describe('calculateTax', () => {
  it('rounds down JPY tax', () => {
    expect(calculateTax(999, 10, 'JPY')).toBe(99);
  });

  it('rounds USD tax to two decimals', () => {
    expect(calculateTax(12.34, 8.5, 'USD')).toBe(1.05);
  });
});
