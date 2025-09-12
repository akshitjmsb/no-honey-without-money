import { useState, useCallback, useRef, useEffect } from 'react';
import type { FinancialData } from '../types';
import { isRateLimitError } from '../utils/errorHandler';
import { API_CONFIG } from '../utils/constants';
import { apiClient } from '../services/apiClient';
import { useLoadingState } from './useLoadingState';

export const useFinancialData = () => {
  const [financialData, setFinancialData] = useState<{ [key: string]: FinancialData }>({});
  const refreshIntervalRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const cacheRef = useRef<Map<string, { data: FinancialData; timestamp: number }>>(new Map());
  const lastFetchTimeRef = useRef<Map<string, number>>(new Map());
  const globalLoadingState = useLoadingState({
    maxRetries: API_CONFIG.RETRY_ATTEMPTS,
    retryDelay: API_CONFIG.RETRY_DELAY
  });


  const fetchFinancialData = useCallback(async (ticker: string) => {
    if (!ticker || financialData[ticker]?.isLoading) {
      return;
    }

    // Per-ticker rate limiting: prevent too many rapid calls for the same ticker
    const lastFetchTime = lastFetchTimeRef.current.get(ticker) || 0;
    const now = Date.now();
    if (now - lastFetchTime < API_CONFIG.RATE_LIMIT_INTERVAL) { // Minimum 10 seconds between calls for same ticker
      return;
    }
    lastFetchTimeRef.current.set(ticker, now);

    // Check cache first
    const cached = cacheRef.current.get(ticker);
    if (cached && (now - cached.timestamp) < API_CONFIG.CACHE_DURATION) {
      setFinancialData(prev => ({
        ...prev,
        [ticker]: cached.data
      }));
      return;
    }

    setFinancialData(prev => ({
      ...prev,
      [ticker]: {
        ...prev[ticker],
        isLoading: true,
        error: '',
      }
    }));
    
    try {
      const data = await globalLoadingState.executeWithRetry(
        () => apiClient.getFinancialData(ticker)
      );
      
      if (data) {
        const financialDataWithLoading = { ...data, isLoading: false };
        // Cache the data
        cacheRef.current.set(ticker, { data: financialDataWithLoading, timestamp: Date.now() });
        setFinancialData(prev => ({ ...prev, [ticker]: financialDataWithLoading }));
      } else {
        // Handle retry or error state
        const errorMessage = globalLoadingState.error || 'API request failed. Please try again.';
        setFinancialData(prev => ({ 
          ...prev, 
          [ticker]: { 
            ...prev[ticker], 
            isLoading: false, 
            error: errorMessage
          } 
        }));
      }
    } catch (fetchError) {
      console.error(`Failed to fetch financial data for ${ticker}:`, fetchError);
      
      let errorMessage = 'API request failed. Please try again.';
      
      if (isRateLimitError(fetchError)) {
        errorMessage = 'Rate limit reached. Please wait a moment.';
      }
      
      setFinancialData(prev => ({ 
        ...prev, 
        [ticker]: { 
          ...prev[ticker], 
          isLoading: false, 
          error: errorMessage
        } 
      }));
    }
  }, [financialData, globalLoadingState]);

  const startDataRefresh = useCallback((ticker: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      fetchFinancialData(ticker);

      refreshIntervalRef.current = window.setInterval(() => {
        fetchFinancialData(ticker);
      }, API_CONFIG.REFRESH_INTERVAL);
    }, API_CONFIG.DEBOUNCE_DELAY);
  }, [fetchFinancialData]);

  const stopDataRefresh = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
  }, []);

  // Cleanup old cache entries
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    for (const [ticker, cached] of cacheRef.current.entries()) {
      if (now - cached.timestamp > API_CONFIG.CACHE_DURATION * 2) {
        cacheRef.current.delete(ticker);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      stopDataRefresh();
    };
  }, [stopDataRefresh]);

  // Periodic cache cleanup
  useEffect(() => {
    const cleanupInterval = setInterval(cleanupCache, API_CONFIG.CACHE_DURATION); // Clean every 5 minutes
    return () => clearInterval(cleanupInterval);
  }, [cleanupCache]);

  return {
    financialData,
    fetchFinancialData,
    startDataRefresh,
    stopDataRefresh,
    globalLoading: globalLoadingState.isLoading,
    globalError: globalLoadingState.error,
    retryGlobal: globalLoadingState.retry,
    canRetryGlobal: globalLoadingState.canRetry
  };
};
