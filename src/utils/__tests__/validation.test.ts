import { describe, it, expect } from 'vitest';
import {
  validateTicker,
  validatePercentage,
  validateShares,
  validateCostPerShare,
  validateInvestmentAmount,
  sanitizeInput,
  validateNotes
} from '../validation';

describe('validation', () => {
  describe('validateTicker', () => {
    it('should validate correct tickers', () => {
      expect(validateTicker('AAPL')).toEqual({ isValid: true });
      expect(validateTicker('MSFT')).toEqual({ isValid: true });
      expect(validateTicker('GOOGL')).toEqual({ isValid: true });
      expect(validateTicker('BRK.B')).toEqual({ isValid: true });
      expect(validateTicker('ATD.TO')).toEqual({ isValid: true });
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
      expect(validateTicker('INVALID!')).toEqual({ 
        isValid: false, 
        error: 'Ticker can only contain letters, numbers, and dots' 
      });
      expect(validateTicker('VERY_LONG_TICKER')).toEqual({ 
        isValid: false, 
        error: 'Ticker must be 1-10 characters' 
      });
    });

    it('should handle non-string inputs', () => {
      expect(validateTicker(null as any)).toEqual({ 
        isValid: false, 
        error: 'Ticker is required' 
      });
      expect(validateTicker(123 as any)).toEqual({ 
        isValid: false, 
        error: 'Ticker is required' 
      });
    });

    it('should trim whitespace', () => {
      expect(validateTicker('  AAPL  ')).toEqual({ isValid: true });
    });
  });

  describe('validatePercentage', () => {
    it('should validate correct percentages', () => {
      expect(validatePercentage(0)).toEqual({ isValid: true });
      expect(validatePercentage(50)).toEqual({ isValid: true });
      expect(validatePercentage(100)).toEqual({ isValid: true });
      expect(validatePercentage('75.5')).toEqual({ isValid: true });
    });

    it('should reject invalid percentages', () => {
      expect(validatePercentage(-10)).toEqual({ 
        isValid: false, 
        error: 'Percentage cannot be negative' 
      });
      expect(validatePercentage(150)).toEqual({ 
        isValid: false, 
        error: 'Percentage cannot exceed 100%' 
      });
      expect(validatePercentage('invalid')).toEqual({ 
        isValid: false, 
        error: 'Must be a valid number' 
      });
      expect(validatePercentage(NaN)).toEqual({ 
        isValid: false, 
        error: 'Must be a valid number' 
      });
    });
  });

  describe('validateShares', () => {
    it('should validate correct share amounts', () => {
      expect(validateShares(0)).toEqual({ isValid: true });
      expect(validateShares(100)).toEqual({ isValid: true });
      expect(validateShares(1000000)).toEqual({ isValid: true });
      expect(validateShares('500')).toEqual({ isValid: true });
    });

    it('should reject invalid share amounts', () => {
      expect(validateShares(-10)).toEqual({ 
        isValid: false, 
        error: 'Shares cannot be negative' 
      });
      expect(validateShares(2000000)).toEqual({ 
        isValid: false, 
        error: 'Shares value seems too high' 
      });
      expect(validateShares('invalid')).toEqual({ 
        isValid: false, 
        error: 'Must be a valid number' 
      });
    });
  });

  describe('validateCostPerShare', () => {
    it('should validate correct cost per share', () => {
      expect(validateCostPerShare(0)).toEqual({ isValid: true });
      expect(validateCostPerShare(150.25)).toEqual({ isValid: true });
      expect(validateCostPerShare(100000)).toEqual({ isValid: true });
      expect(validateCostPerShare('75.50')).toEqual({ isValid: true });
    });

    it('should reject invalid cost per share', () => {
      expect(validateCostPerShare(-10)).toEqual({ 
        isValid: false, 
        error: 'Cost per share cannot be negative' 
      });
      expect(validateCostPerShare(200000)).toEqual({ 
        isValid: false, 
        error: 'Cost per share seems too high' 
      });
      expect(validateCostPerShare('invalid')).toEqual({ 
        isValid: false, 
        error: 'Must be a valid number' 
      });
    });
  });

  describe('validateInvestmentAmount', () => {
    it('should validate correct investment amounts', () => {
      expect(validateInvestmentAmount(0)).toEqual({ isValid: true });
      expect(validateInvestmentAmount(10000)).toEqual({ isValid: true });
      expect(validateInvestmentAmount(10000000)).toEqual({ isValid: true });
      expect(validateInvestmentAmount('5000')).toEqual({ isValid: true });
    });

    it('should reject invalid investment amounts', () => {
      expect(validateInvestmentAmount(-1000)).toEqual({ 
        isValid: false, 
        error: 'Investment amount cannot be negative' 
      });
      expect(validateInvestmentAmount(20000000)).toEqual({ 
        isValid: false, 
        error: 'Investment amount seems too high' 
      });
      expect(validateInvestmentAmount('invalid')).toEqual({ 
        isValid: false, 
        error: 'Must be a valid number' 
      });
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize input correctly', () => {
      expect(sanitizeInput('  normal text  ')).toBe('normal text');
      expect(sanitizeInput('text<with>tags')).toBe('textwithtags');
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput('   ')).toBe('');
    });
  });

  describe('validateNotes', () => {
    it('should validate correct notes', () => {
      expect(validateNotes('')).toEqual({ isValid: true });
      expect(validateNotes('Short note')).toEqual({ isValid: true });
      expect(validateNotes('A'.repeat(1000))).toEqual({ isValid: true });
    });

    it('should reject notes that are too long', () => {
      expect(validateNotes('A'.repeat(1001))).toEqual({ 
        isValid: false, 
        error: 'Notes cannot exceed 1000 characters' 
      });
    });
  });
});