/**
 * Input validation utilities
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateTicker = (ticker: string): ValidationResult => {
  if (!ticker || typeof ticker !== 'string') {
    return { isValid: false, error: 'Ticker is required' };
  }

  const cleanTicker = ticker.trim().toUpperCase();
  
  if (cleanTicker.length < 1 || cleanTicker.length > 10) {
    return { isValid: false, error: 'Ticker must be 1-10 characters' };
  }

  if (!/^[A-Z0-9.]+$/.test(cleanTicker)) {
    return { isValid: false, error: 'Ticker can only contain letters, numbers, and dots' };
  }

  return { isValid: true };
};

export const validatePercentage = (value: string | number): ValidationResult => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Must be a valid number' };
  }

  if (numValue < 0) {
    return { isValid: false, error: 'Percentage cannot be negative' };
  }

  if (numValue > 100) {
    return { isValid: false, error: 'Percentage cannot exceed 100%' };
  }

  return { isValid: true };
};

export const validateShares = (value: string | number): ValidationResult => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Must be a valid number' };
  }

  if (numValue < 0) {
    return { isValid: false, error: 'Shares cannot be negative' };
  }

  if (numValue > 1000000) {
    return { isValid: false, error: 'Shares value seems too high' };
  }

  return { isValid: true };
};

export const validateCostPerShare = (value: string | number): ValidationResult => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Must be a valid number' };
  }

  if (numValue < 0) {
    return { isValid: false, error: 'Cost per share cannot be negative' };
  }

  if (numValue > 100000) {
    return { isValid: false, error: 'Cost per share seems too high' };
  }

  return { isValid: true };
};

export const validateInvestmentAmount = (value: string | number): ValidationResult => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Must be a valid number' };
  }

  if (numValue < 0) {
    return { isValid: false, error: 'Investment amount cannot be negative' };
  }

  if (numValue > 10000000) {
    return { isValid: false, error: 'Investment amount seems too high' };
  }

  return { isValid: true };
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const validateNotes = (notes: string): ValidationResult => {
  if (notes.length > 1000) {
    return { isValid: false, error: 'Notes cannot exceed 1000 characters' };
  }

  return { isValid: true };
};
