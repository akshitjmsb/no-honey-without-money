import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercent, formatNumber } from '../formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('should format USD currency correctly', () => {
      expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
    });

    it('should format CAD currency correctly', () => {
      expect(formatCurrency(1234.56, 'CAD')).toBe('CA$1,234.56');
    });

    it('should handle zero values', () => {
      expect(formatCurrency(0, 'USD')).toBe('$0.00');
    });

    it('should handle negative values', () => {
      expect(formatCurrency(-1234.56, 'USD')).toBe('-$1,234.56');
    });

    it('should handle large numbers', () => {
      expect(formatCurrency(1234567.89, 'USD')).toBe('$1,234,567.89');
    });

    it('should handle small decimal values', () => {
      expect(formatCurrency(0.01, 'USD')).toBe('$0.01');
    });
  });

  describe('formatPercent', () => {
    it('should format decimal as percentage', () => {
      expect(formatPercent(0.1234)).toBe('12.34%');
    });

    it('should format whole numbers as percentage', () => {
      expect(formatPercent(1)).toBe('100.00%');
    });

    it('should handle zero', () => {
      expect(formatPercent(0)).toBe('0.00%');
    });

    it('should handle negative values', () => {
      expect(formatPercent(-0.05)).toBe('-5.00%');
    });

    it('should handle very small values', () => {
      expect(formatPercent(0.0001)).toBe('0.01%');
    });
  });

  describe('formatNumber', () => {
    it('should format with default 2 decimals', () => {
      expect(formatNumber(1234.5678)).toBe('1,234.57');
    });

    it('should format with custom decimal places', () => {
      expect(formatNumber(1234.5678, 3)).toBe('1,234.568');
    });

    it('should format with zero decimals', () => {
      expect(formatNumber(1234.5678, 0)).toBe('1,235');
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0.00');
    });

    it('should handle negative values', () => {
      expect(formatNumber(-1234.5678)).toBe('-1,234.57');
    });

    it('should handle large numbers', () => {
      expect(formatNumber(1234567.89)).toBe('1,234,567.89');
    });
  });
});