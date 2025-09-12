/**
 * Centralized error handling utility
 * @deprecated Use standardizedErrorHandler.ts for new code
 */

import { handleStandardizedError, getErrorMessage, ErrorCodes } from './standardizedErrorHandler';

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
  const standardError = handleStandardizedError(error, 'API');
  return getErrorMessage(standardError);
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
