import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercent, formatNumber } from '../formatters';

describe('Formatters', () => {
  describe('formatCurrency', () => {
    it('should format USD currency correctly', () => {
      expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
      expect(formatCurrency(0, 'USD')).toBe('$0.00');
      expect(formatCurrency(1000000, 'USD')).toBe('$1,000,000.00');
    });

    it('should format CAD currency correctly', () => {
      expect(formatCurrency(1234.56, 'CAD')).toBe('CA$1,234.56');
      expect(formatCurrency(0, 'CAD')).toBe('CA$0.00');
      expect(formatCurrency(1000000, 'CAD')).toBe('CA$1,000,000.00');
    });
  });

  describe('formatPercent', () => {
    it('should format percentages correctly', () => {
      expect(formatPercent(0.1234)).toBe('12.34%');
      expect(formatPercent(0)).toBe('0.00%');
      expect(formatPercent(1)).toBe('100.00%');
      expect(formatPercent(0.5)).toBe('50.00%');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with default 2 decimals', () => {
      expect(formatNumber(1234.5678)).toBe('1,234.57');
      expect(formatNumber(0)).toBe('0.00');
      expect(formatNumber(1000000)).toBe('1,000,000.00');
    });

    it('should format numbers with custom decimal places', () => {
      expect(formatNumber(1234.5678, 0)).toBe('1,235');
      expect(formatNumber(1234.5678, 4)).toBe('1,234.5678');
      expect(formatNumber(1234.5678, 1)).toBe('1,234.6');
    });
  });
});
