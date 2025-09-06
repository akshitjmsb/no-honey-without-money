/**
 * Application constants
 */

export const CURRENCIES = {
  CAD: 'CAD' as const,
  USD: 'USD' as const,
} as const;

export type Currency = typeof CURRENCIES[keyof typeof CURRENCIES];

// Exchange rates - should be fetched from API in production
export const EXCHANGE_RATES = {
  CAD_TO_USD: 0.73,
  USD_TO_CAD: 1.37,
} as const;

// API Configuration
export const API_CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // milliseconds
  REFRESH_INTERVAL: 120000, // 2 minutes
  DEBOUNCE_DELAY: 500, // milliseconds
} as const;

// UI Configuration
export const UI_CONFIG = {
  SWIPE_THRESHOLD: 100, // pixels
  MAX_NOTES_LENGTH: 1000,
  MAX_TICKER_LENGTH: 10,
  MAX_PERCENTAGE: 100,
  MAX_SHARES: 1000000,
  MAX_COST_PER_SHARE: 100000,
  MAX_INVESTMENT_AMOUNT: 10000000,
} as const;

// Validation Messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_NUMBER: 'Must be a valid number',
  NEGATIVE_VALUE: 'Value cannot be negative',
  TOO_HIGH: 'Value seems too high',
  INVALID_TICKER: 'Invalid ticker format',
  NOTES_TOO_LONG: 'Notes cannot exceed 1000 characters',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  API_BUSY: 'The API is busy at the moment. Please wait and try again shortly.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  TIMEOUT: 'Request timed out. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  RATE_LIMIT: 'Rate limit reached. Please wait a moment.',
} as const;
