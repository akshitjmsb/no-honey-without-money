import { describe, it, expect } from 'vitest';
import { 
  validateTicker, 
  validatePercentage, 
  validateShares, 
  validateCostPerShare, 
  validateInvestmentAmount,
  validateNotes,
  sanitizeInput
} from '../validation';

describe('validation', () => {
  describe('validateTicker', () => {
    it('should validate correct ticker formats', () => {
      expect(validateTicker('AAPL')).toEqual({ isValid: true });
      expect(validateTicker('GOOGL')).toEqual({ isValid: true });
      expect(validateTicker('BRK.B')).toEqual({ isValid: true });
      expect(validateTicker('TSLA')).toEqual({ isValid: true });
    });

    it('should reject empty or invalid tickers', () => {
      expect(validateTicker('')).toEqual({ 
        isValid: false, 
        error: 'Ticker is required' 
      });
      expect(validateTicker('   ')).toEqual({ 
        isValid: false, 
        error: 'Ticker is required' 
      });
    });

    it('should reject tickers that are too long', () => {
      expect(validateTicker('VERYLONGTICKER')).toEqual({ 
        isValid: false, 
        error: 'Ticker must be 1-10 characters' 
      });
    });

    it('should reject tickers with invalid characters', () => {
      expect(validateTicker('AAPL-')).toEqual({ 
        isValid: false, 
        error: 'Ticker can only contain letters, numbers, and dots' 
      });
      expect(validateTicker('AAPL@')).toEqual({ 
        isValid: false, 
        error: 'Ticker can only contain letters, numbers, and dots' 
      });
    });

    it('should handle case conversion', () => {
      expect(validateTicker('aapl')).toEqual({ isValid: true });
      expect(validateTicker('  aapl  ')).toEqual({ isValid: true });
    });
  });

  describe('validatePercentage', () => {
    it('should validate correct percentages', () => {
      expect(validatePercentage(50)).toEqual({ isValid: true });
      expect(validatePercentage(0)).toEqual({ isValid: true });
      expect(validatePercentage(100)).toEqual({ isValid: true });
      expect(validatePercentage('50')).toEqual({ isValid: true });
    });

    it('should reject invalid numbers', () => {
      expect(validatePercentage('abc')).toEqual({ 
        isValid: false, 
        error: 'Must be a valid number' 
      });
      expect(validatePercentage(NaN)).toEqual({ 
        isValid: false, 
        error: 'Must be a valid number' 
      });
    });

    it('should reject negative percentages', () => {
      expect(validatePercentage(-10)).toEqual({ 
        isValid: false, 
        error: 'Percentage cannot be negative' 
      });
    });

    it('should reject percentages over 100', () => {
      expect(validatePercentage(150)).toEqual({ 
        isValid: false, 
        error: 'Percentage cannot exceed 100%' 
      });
    });
  });

  describe('validateShares', () => {
    it('should validate correct share amounts', () => {
      expect(validateShares(100)).toEqual({ isValid: true });
      expect(validateShares(0)).toEqual({ isValid: true });
      expect(validateShares(1000.5)).toEqual({ isValid: true });
      expect(validateShares('100')).toEqual({ isValid: true });
    });

    it('should reject invalid numbers', () => {
      expect(validateShares('abc')).toEqual({ 
        isValid: false, 
        error: 'Must be a valid number' 
      });
    });

    it('should reject negative shares', () => {
      expect(validateShares(-10)).toEqual({ 
        isValid: false, 
        error: 'Shares cannot be negative' 
      });
    });

    it('should reject shares that are too high', () => {
      expect(validateShares(2000000)).toEqual({ 
        isValid: false, 
        error: 'Shares value seems too high' 
      });
    });
  });

  describe('validateCostPerShare', () => {
    it('should validate correct cost per share', () => {
      expect(validateCostPerShare(100.50)).toEqual({ isValid: true });
      expect(validateCostPerShare(0)).toEqual({ isValid: true });
      expect(validateCostPerShare('100.50')).toEqual({ isValid: true });
    });

    it('should reject invalid numbers', () => {
      expect(validateCostPerShare('abc')).toEqual({ 
        isValid: false, 
        error: 'Must be a valid number' 
      });
    });

    it('should reject negative costs', () => {
      expect(validateCostPerShare(-10)).toEqual({ 
        isValid: false, 
        error: 'Cost per share cannot be negative' 
      });
    });

    it('should reject costs that are too high', () => {
      expect(validateCostPerShare(200000)).toEqual({ 
        isValid: false, 
        error: 'Cost per share seems too high' 
      });
    });
  });

  describe('validateInvestmentAmount', () => {
    it('should validate correct investment amounts', () => {
      expect(validateInvestmentAmount(10000)).toEqual({ isValid: true });
      expect(validateInvestmentAmount(0)).toEqual({ isValid: true });
      expect(validateInvestmentAmount('10000')).toEqual({ isValid: true });
    });

    it('should reject invalid numbers', () => {
      expect(validateInvestmentAmount('abc')).toEqual({ 
        isValid: false, 
        error: 'Must be a valid number' 
      });
    });

    it('should reject negative amounts', () => {
      expect(validateInvestmentAmount(-1000)).toEqual({ 
        isValid: false, 
        error: 'Investment amount cannot be negative' 
      });
    });

    it('should reject amounts that are too high', () => {
      expect(validateInvestmentAmount(20000000)).toEqual({ 
        isValid: false, 
        error: 'Investment amount seems too high' 
      });
    });
  });

  describe('validateNotes', () => {
    it('should validate notes within limit', () => {
      expect(validateNotes('Short note')).toEqual({ isValid: true });
      expect(validateNotes('')).toEqual({ isValid: true });
    });

    it('should reject notes that are too long', () => {
      const longNote = 'a'.repeat(1001);
      expect(validateNotes(longNote)).toEqual({ 
        isValid: false, 
        error: 'Notes cannot exceed 1000 characters' 
      });
    });
  });

  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  test  ')).toBe('test');
    });

    it('should remove angle brackets', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('should handle empty string', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('should handle string with only whitespace', () => {
      expect(sanitizeInput('   ')).toBe('');
    });
  });
});