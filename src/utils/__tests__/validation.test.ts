import { describe, it, expect } from 'vitest';
import {
  validateTicker,
  validatePercentage,
  validateShares,
  validateCostPerShare,
  validateInvestmentAmount,
  validateNotes,
  sanitizeInput,
} from '../validation';

describe('Validation Utils', () => {
  describe('validateTicker', () => {
    it('should validate correct ticker formats', () => {
      expect(validateTicker('AAPL')).toEqual({ isValid: true });
      expect(validateTicker('BRK.B')).toEqual({ isValid: true });
      expect(validateTicker('GOOGL')).toEqual({ isValid: true });
    });

    it('should reject invalid ticker formats', () => {
      expect(validateTicker('')).toEqual({ isValid: false, error: 'Ticker is required' });
      expect(validateTicker('a')).toEqual({ isValid: true }); // Will be converted to uppercase
      expect(validateTicker('TOOLONGTICKER')).toEqual({ isValid: false, error: 'Ticker must be 1-10 characters' });
      expect(validateTicker('AAPL!')).toEqual({ isValid: false, error: 'Ticker can only contain letters, numbers, and dots' });
    });
  });

  describe('validatePercentage', () => {
    it('should validate correct percentages', () => {
      expect(validatePercentage(50)).toEqual({ isValid: true });
      expect(validatePercentage('25.5')).toEqual({ isValid: true });
      expect(validatePercentage(0)).toEqual({ isValid: true });
      expect(validatePercentage(100)).toEqual({ isValid: true });
    });

    it('should reject invalid percentages', () => {
      expect(validatePercentage(-10)).toEqual({ isValid: false, error: 'Percentage cannot be negative' });
      expect(validatePercentage(150)).toEqual({ isValid: false, error: 'Percentage cannot exceed 100%' });
      expect(validatePercentage('invalid')).toEqual({ isValid: false, error: 'Must be a valid number' });
    });
  });

  describe('validateShares', () => {
    it('should validate correct share amounts', () => {
      expect(validateShares(100)).toEqual({ isValid: true });
      expect(validateShares('50.5')).toEqual({ isValid: true });
      expect(validateShares(0)).toEqual({ isValid: true });
    });

    it('should reject invalid share amounts', () => {
      expect(validateShares(-10)).toEqual({ isValid: false, error: 'Shares cannot be negative' });
      expect(validateShares(2000000)).toEqual({ isValid: false, error: 'Shares value seems too high' });
      expect(validateShares('invalid')).toEqual({ isValid: false, error: 'Must be a valid number' });
    });
  });

  describe('validateCostPerShare', () => {
    it('should validate correct cost per share', () => {
      expect(validateCostPerShare(150.25)).toEqual({ isValid: true });
      expect(validateCostPerShare('50.00')).toEqual({ isValid: true });
      expect(validateCostPerShare(0)).toEqual({ isValid: true });
    });

    it('should reject invalid cost per share', () => {
      expect(validateCostPerShare(-10)).toEqual({ isValid: false, error: 'Cost per share cannot be negative' });
      expect(validateCostPerShare(200000)).toEqual({ isValid: false, error: 'Cost per share seems too high' });
      expect(validateCostPerShare('invalid')).toEqual({ isValid: false, error: 'Must be a valid number' });
    });
  });

  describe('validateInvestmentAmount', () => {
    it('should validate correct investment amounts', () => {
      expect(validateInvestmentAmount(10000)).toEqual({ isValid: true });
      expect(validateInvestmentAmount('5000.50')).toEqual({ isValid: true });
      expect(validateInvestmentAmount(0)).toEqual({ isValid: true });
    });

    it('should reject invalid investment amounts', () => {
      expect(validateInvestmentAmount(-1000)).toEqual({ isValid: false, error: 'Investment amount cannot be negative' });
      expect(validateInvestmentAmount(20000000)).toEqual({ isValid: false, error: 'Investment amount seems too high' });
      expect(validateInvestmentAmount('invalid')).toEqual({ isValid: false, error: 'Must be a valid number' });
    });
  });

  describe('validateNotes', () => {
    it('should validate correct notes', () => {
      expect(validateNotes('This is a valid note')).toEqual({ isValid: true });
      expect(validateNotes('')).toEqual({ isValid: true });
    });

    it('should reject notes that are too long', () => {
      const longNote = 'a'.repeat(1001);
      expect(validateNotes(longNote)).toEqual({ isValid: false, error: 'Notes cannot exceed 1000 characters' });
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize input correctly', () => {
      expect(sanitizeInput('  hello world  ')).toBe('hello world');
      expect(sanitizeInput('test<script>alert("xss")</script>')).toBe('testscriptalert("xss")/script');
      expect(sanitizeInput('normal text')).toBe('normal text');
    });
  });
});
