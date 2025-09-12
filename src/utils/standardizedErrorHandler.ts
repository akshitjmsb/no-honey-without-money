/**
 * Standardized error handling utility for consistent error management across the application
 */

export interface StandardError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  context?: string;
}

export enum ErrorCodes {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  COMPONENT_ERROR = 'COMPONENT_ERROR'
}

export class StandardizedError extends Error {
  public readonly code: ErrorCodes;
  public readonly details?: any;
  public readonly context?: string;
  public readonly timestamp: string;

  constructor(
    code: ErrorCodes,
    message: string,
    details?: any,
    context?: string
  ) {
    super(message);
    this.name = 'StandardizedError';
    this.code = code;
    this.details = details;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Creates a standardized error from various error types
 */
export const createStandardError = (
  error: unknown,
  context?: string
): StandardError => {
  if (error instanceof StandardizedError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return new StandardizedError(
        ErrorCodes.NETWORK_ERROR,
        'Network error. Please check your connection and try again.',
        { originalError: error.message },
        context
      );
    }

    // Rate limit errors
    if (message.includes('429') || message.includes('quota') || message.includes('rate limit')) {
      return new StandardizedError(
        ErrorCodes.RATE_LIMIT_ERROR,
        'Rate limit reached. Please wait a moment before trying again.',
        { originalError: error.message },
        context
      );
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('abort')) {
      return new StandardizedError(
        ErrorCodes.TIMEOUT_ERROR,
        'Request timed out. Please try again.',
        { originalError: error.message },
        context
      );
    }

    // API errors
    if (message.includes('http') || message.includes('api')) {
      return new StandardizedError(
        ErrorCodes.API_ERROR,
        'API request failed. Please try again.',
        { originalError: error.message },
        context
      );
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return new StandardizedError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid input provided. Please check your data and try again.',
        { originalError: error.message },
        context
      );
    }

    // Default error
    return new StandardizedError(
      ErrorCodes.UNKNOWN_ERROR,
      'An unexpected error occurred. Please try again.',
      { originalError: error.message },
      context
    );
  }

  // Non-Error objects
  return new StandardizedError(
    ErrorCodes.UNKNOWN_ERROR,
    'An unknown error occurred. Please try again.',
    { originalError: String(error) },
    context
  );
};

/**
 * Handles errors consistently across the application
 */
export const handleStandardizedError = (
  error: unknown,
  context?: string
): StandardError => {
  const standardError = createStandardError(error, context);
  
  // Log error for debugging
  console.error(`[${standardError.code}] ${standardError.message}`, {
    context: standardError.context,
    details: standardError.details,
    timestamp: standardError.timestamp
  });

  return standardError;
};

/**
 * Gets user-friendly error message for display
 */
export const getErrorMessage = (error: StandardError): string => {
  return error.message;
};

/**
 * Checks if an error is retryable
 */
export const isRetryableError = (error: StandardError): boolean => {
  const retryableCodes = [
    ErrorCodes.NETWORK_ERROR,
    ErrorCodes.API_ERROR,
    ErrorCodes.TIMEOUT_ERROR
  ];
  
  return retryableCodes.includes(error.code);
};

/**
 * Gets retry delay based on error type
 */
export const getRetryDelay = (error: StandardError, attempt: number): number => {
  const baseDelay = 1000; // 1 second
  const maxDelay = 10000; // 10 seconds
  
  if (error.code === ErrorCodes.RATE_LIMIT_ERROR) {
    return Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  }
  
  return Math.min(baseDelay * attempt, maxDelay);
};

/**
 * Error boundary helper for React components
 */
export const createErrorBoundaryHandler = (context: string) => {
  return (error: Error, errorInfo: any) => {
    const standardError = createStandardError(error, context);
    
    // Log to console for debugging
    console.error('Error Boundary caught error:', {
      error: standardError,
      componentStack: errorInfo.componentStack,
      errorBoundary: context
    });

    // In a real app, you might want to send this to an error reporting service
    // errorReportingService.captureException(standardError, { context, errorInfo });
  };
};
