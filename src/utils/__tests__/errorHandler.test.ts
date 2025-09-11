import { describe, it, expect } from 'vitest';
import { 
  handleApiError, 
  handleValidationError, 
  isRateLimitError, 
  isNetworkError,
  AppError 
} from '../errorHandler';

describe('errorHandler', () => {
  describe('AppError', () => {
    it('should create AppError with message', () => {
      const error = new AppError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('AppError');
      expect(error.isOperational).toBe(true);
      expect(error.code).toBeUndefined();
      expect(error.status).toBeUndefined();
    });

    it('should create AppError with code and status', () => {
      const error = new AppError('Test error', 'VALIDATION_ERROR', 400);
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.status).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it('should create AppError with isOperational false', () => {
      const error = new AppError('Test error', undefined, undefined, false);
      
      expect(error.isOperational).toBe(false);
    });
  });

  describe('handleApiError', () => {
    it('should handle AppError', () => {
      const error = new AppError('Custom error message');
      const result = handleApiError(error);
      
      expect(result).toBe('Custom error message');
    });

    it('should handle rate limit errors', () => {
      const error = new Error('HTTP 429: Too Many Requests');
      const result = handleApiError(error);
      
      expect(result).toBe('The API is busy at the moment. Please wait and try again shortly.');
    });

    it('should handle quota errors', () => {
      const error = new Error('Quota exceeded');
      const result = handleApiError(error);
      
      expect(result).toBe('The API is busy at the moment. Please wait and try again shortly.');
    });

    it('should handle network errors', () => {
      const error = new Error('Network error occurred');
      const result = handleApiError(error);
      
      expect(result).toBe('Network error. Please check your connection and try again.');
    });

    it('should handle fetch errors', () => {
      const error = new Error('Failed to fetch data');
      const result = handleApiError(error);
      
      expect(result).toBe('Network error. Please check your connection and try again.');
    });

    it('should handle timeout errors', () => {
      const error = new Error('Request timeout');
      const result = handleApiError(error);
      
      expect(result).toBe('Request timed out. Please try again.');
    });

    it('should handle generic Error', () => {
      const error = new Error('Some random error');
      const result = handleApiError(error);
      
      expect(result).toBe('An unexpected error occurred. Please try again.');
    });

    it('should handle unknown error types', () => {
      const error = 'String error';
      const result = handleApiError(error);
      
      expect(result).toBe('An unknown error occurred. Please try again.');
    });

    it('should handle null/undefined errors', () => {
      const result1 = handleApiError(null);
      const result2 = handleApiError(undefined);
      
      expect(result1).toBe('An unknown error occurred. Please try again.');
      expect(result2).toBe('An unknown error occurred. Please try again.');
    });
  });

  describe('handleValidationError', () => {
    it('should format validation error message', () => {
      const result = handleValidationError('email', 'invalid@');
      
      expect(result).toBe('Invalid email: invalid@');
    });

    it('should handle different field types', () => {
      const result1 = handleValidationError('ticker', 'INVALID!');
      const result2 = handleValidationError('amount', -100);
      
      expect(result1).toBe('Invalid ticker: INVALID!');
      expect(result2).toBe('Invalid amount: -100');
    });
  });

  describe('isRateLimitError', () => {
    it('should detect rate limit errors', () => {
      expect(isRateLimitError(new Error('HTTP 429'))).toBe(true);
      expect(isRateLimitError(new Error('Rate limit exceeded'))).toBe(true);
      expect(isRateLimitError(new Error('Quota exceeded'))).toBe(true);
    });

    it('should not detect non-rate limit errors', () => {
      expect(isRateLimitError(new Error('Network error'))).toBe(false);
      expect(isRateLimitError(new Error('Validation failed'))).toBe(false);
      expect(isRateLimitError('String error')).toBe(false);
      expect(isRateLimitError(null)).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isRateLimitError(new Error('RATE LIMIT EXCEEDED'))).toBe(true);
      expect(isRateLimitError(new Error('quota exceeded'))).toBe(true);
    });
  });

  describe('isNetworkError', () => {
    it('should detect network errors', () => {
      expect(isNetworkError(new Error('Network error'))).toBe(true);
      expect(isNetworkError(new Error('Failed to fetch'))).toBe(true);
      expect(isNetworkError(new Error('Connection timeout'))).toBe(true);
    });

    it('should not detect non-network errors', () => {
      expect(isNetworkError(new Error('Validation failed'))).toBe(false);
      expect(isNetworkError(new Error('Rate limit exceeded'))).toBe(false);
      expect(isNetworkError('String error')).toBe(false);
      expect(isNetworkError(null)).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isNetworkError(new Error('NETWORK ERROR'))).toBe(true);
      expect(isNetworkError(new Error('failed to fetch'))).toBe(true);
    });
  });
});