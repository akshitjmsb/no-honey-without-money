import { describe, it, expect } from 'vitest';
import { 
  createStandardError, 
  handleStandardizedError, 
  getErrorMessage, 
  isRetryableError, 
  getRetryDelay,
  ErrorCodes,
  StandardizedError
} from '../standardizedErrorHandler';

describe('standardizedErrorHandler', () => {
  describe('createStandardError', () => {
    it('should create network error from Error with network message', () => {
      const error = new Error('Network request failed');
      const standardError = createStandardError(error, 'API');
      
      expect(standardError.code).toBe(ErrorCodes.NETWORK_ERROR);
      expect(standardError.message).toContain('Network error');
      expect(standardError.context).toBe('API');
    });

    it('should create rate limit error from Error with 429 message', () => {
      const error = new Error('HTTP 429 Too Many Requests');
      const standardError = createStandardError(error, 'API');
      
      expect(standardError.code).toBe(ErrorCodes.RATE_LIMIT_ERROR);
      expect(standardError.message).toContain('Rate limit');
    });

    it('should create timeout error from Error with timeout message', () => {
      const error = new Error('Request timeout');
      const standardError = createStandardError(error, 'API');
      
      expect(standardError.code).toBe(ErrorCodes.TIMEOUT_ERROR);
      expect(standardError.message).toContain('timed out');
    });

    it('should create validation error from Error with validation message', () => {
      const error = new Error('Invalid input validation failed');
      const standardError = createStandardError(error, 'Form');
      
      expect(standardError.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(standardError.message).toContain('Invalid input');
    });

    it('should create unknown error for unrecognized error types', () => {
      const error = new Error('Some random error');
      const standardError = createStandardError(error, 'Component');
      
      expect(standardError.code).toBe(ErrorCodes.UNKNOWN_ERROR);
      expect(standardError.message).toContain('unexpected error');
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';
      const standardError = createStandardError(error, 'Test');
      
      expect(standardError.code).toBe(ErrorCodes.UNKNOWN_ERROR);
      expect(standardError.details?.originalError).toBe('String error');
    });

    it('should preserve existing StandardizedError', () => {
      const originalError = new StandardizedError(
        ErrorCodes.API_ERROR,
        'Original message',
        { data: 'test' },
        'Original context'
      );
      const standardError = createStandardError(originalError, 'New context');
      
      expect(standardError).toBe(originalError);
      expect(standardError.context).toBe('Original context');
    });
  });

  describe('handleStandardizedError', () => {
    it('should log error and return standardized error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      const standardError = handleStandardizedError(error, 'Test context');
      
      expect(standardError).toBeInstanceOf(StandardizedError);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('getErrorMessage', () => {
    it('should return error message', () => {
      const error = new StandardizedError(
        ErrorCodes.NETWORK_ERROR,
        'Network error message',
        {},
        'Test'
      );
      
      expect(getErrorMessage(error)).toBe('Network error message');
    });
  });

  describe('isRetryableError', () => {
    it('should return true for retryable errors', () => {
      const networkError = new StandardizedError(
        ErrorCodes.NETWORK_ERROR,
        'Network error',
        {},
        'Test'
      );
      const apiError = new StandardizedError(
        ErrorCodes.API_ERROR,
        'API error',
        {},
        'Test'
      );
      const timeoutError = new StandardizedError(
        ErrorCodes.TIMEOUT_ERROR,
        'Timeout error',
        {},
        'Test'
      );
      
      expect(isRetryableError(networkError)).toBe(true);
      expect(isRetryableError(apiError)).toBe(true);
      expect(isRetryableError(timeoutError)).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      const validationError = new StandardizedError(
        ErrorCodes.VALIDATION_ERROR,
        'Validation error',
        {},
        'Test'
      );
      const rateLimitError = new StandardizedError(
        ErrorCodes.RATE_LIMIT_ERROR,
        'Rate limit error',
        {},
        'Test'
      );
      
      expect(isRetryableError(validationError)).toBe(false);
      expect(isRetryableError(rateLimitError)).toBe(false);
    });
  });

  describe('getRetryDelay', () => {
    it('should return exponential backoff for rate limit errors', () => {
      const rateLimitError = new StandardizedError(
        ErrorCodes.RATE_LIMIT_ERROR,
        'Rate limit error',
        {},
        'Test'
      );
      
      expect(getRetryDelay(rateLimitError, 1)).toBe(2000);
      expect(getRetryDelay(rateLimitError, 2)).toBe(4000);
      expect(getRetryDelay(rateLimitError, 3)).toBe(8000);
    });

    it('should return linear backoff for other errors', () => {
      const networkError = new StandardizedError(
        ErrorCodes.NETWORK_ERROR,
        'Network error',
        {},
        'Test'
      );
      
      expect(getRetryDelay(networkError, 1)).toBe(1000);
      expect(getRetryDelay(networkError, 2)).toBe(2000);
      expect(getRetryDelay(networkError, 3)).toBe(3000);
    });

    it('should cap delay at maximum', () => {
      const networkError = new StandardizedError(
        ErrorCodes.NETWORK_ERROR,
        'Network error',
        {},
        'Test'
      );
      
      expect(getRetryDelay(networkError, 20)).toBe(10000);
    });
  });
});
