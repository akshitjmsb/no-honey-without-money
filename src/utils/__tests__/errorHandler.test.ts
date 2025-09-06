import { describe, it, expect } from 'vitest';
import { handleApiError, isRateLimitError, isNetworkError, AppError } from '../errorHandler';

describe('Error Handler', () => {
  describe('handleApiError', () => {
    it('should handle AppError instances', () => {
      const error = new AppError('Custom error message', 'CUSTOM_ERROR', 400);
      expect(handleApiError(error)).toBe('Custom error message');
    });

    it('should handle rate limit errors', () => {
      const error = new Error('Rate limit exceeded (429)');
      expect(handleApiError(error)).toBe('The API is busy at the moment. Please wait and try again shortly.');
    });

    it('should handle network errors', () => {
      const error = new Error('Network request failed');
      expect(handleApiError(error)).toBe('Network error. Please check your connection and try again.');
    });

    it('should handle timeout errors', () => {
      const error = new Error('Request timeout');
      expect(handleApiError(error)).toBe('Request timed out. Please try again.');
    });

    it('should handle unknown errors', () => {
      const error = new Error('Unknown error');
      expect(handleApiError(error)).toBe('An unexpected error occurred. Please try again.');
    });

    it('should handle non-Error objects', () => {
      expect(handleApiError('string error')).toBe('An unknown error occurred. Please try again.');
      expect(handleApiError(null)).toBe('An unknown error occurred. Please try again.');
      expect(handleApiError(undefined)).toBe('An unknown error occurred. Please try again.');
    });
  });

  describe('isRateLimitError', () => {
    it('should identify rate limit errors', () => {
      expect(isRateLimitError(new Error('Rate limit exceeded (429)'))).toBe(true);
      expect(isRateLimitError(new Error('Quota exceeded'))).toBe(true);
      expect(isRateLimitError(new Error('Rate limit reached'))).toBe(true);
    });

    it('should not identify non-rate limit errors', () => {
      expect(isRateLimitError(new Error('Network error'))).toBe(false);
      expect(isRateLimitError(new Error('Unknown error'))).toBe(false);
      expect(isRateLimitError('string')).toBe(false);
    });
  });

  describe('isNetworkError', () => {
    it('should identify network errors', () => {
      expect(isNetworkError(new Error('Network request failed'))).toBe(true);
      expect(isNetworkError(new Error('Fetch error'))).toBe(true);
      expect(isNetworkError(new Error('Connection failed'))).toBe(true);
    });

    it('should not identify non-network errors', () => {
      expect(isNetworkError(new Error('Rate limit exceeded'))).toBe(false);
      expect(isNetworkError(new Error('Unknown error'))).toBe(false);
      expect(isNetworkError('string')).toBe(false);
    });
  });

  describe('AppError', () => {
    it('should create AppError with all properties', () => {
      const error = new AppError('Test error', 'TEST_CODE', 400);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.status).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('AppError');
    });

    it('should create AppError with minimal properties', () => {
      const error = new AppError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.code).toBeUndefined();
      expect(error.status).toBeUndefined();
      expect(error.isOperational).toBe(true);
    });

    it('should maintain stack trace', () => {
      const error = new AppError('Test error');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });
});
