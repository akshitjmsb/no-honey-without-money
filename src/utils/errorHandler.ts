/**
 * Centralized error handling utility
 */

export interface ApiError {
  message: string;
  code?: string | number | undefined;
  status?: number | undefined;
}

export class AppError extends Error {
  public readonly code?: string | number | undefined;
  public readonly status?: number | undefined;
  public readonly isOperational: boolean;

  constructor(message: string, code?: string | number | undefined, status?: number | undefined, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleApiError = (error: unknown): string => {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Handle specific error cases
    if (message.includes('429') || message.includes('quota')) {
      return 'The API is busy at the moment. Please wait and try again shortly.';
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    if (message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    
    return 'An unexpected error occurred. Please try again.';
  }

  return 'An unknown error occurred. Please try again.';
};

export const handleValidationError = (field: string, value: unknown): string => {
  return `Invalid ${field}: ${value}`;
};

export const isRateLimitError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('429') || message.includes('quota') || message.includes('rate limit');
  }
  return false;
};

export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('network') || message.includes('fetch') || message.includes('connection');
  }
  return false;
};
