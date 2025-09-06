import { useState, useCallback, useRef, useEffect } from 'react';
import type { FinancialData } from '../types';
import { handleApiError, isRateLimitError } from '../utils/errorHandler';
import { API_CONFIG } from '../utils/constants';
import { apiClient } from '../services/apiClient';

export const useFinancialData = () => {
  const [financialData, setFinancialData] = useState<{ [key: string]: FinancialData }>({});
  const refreshIntervalRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<number | null>(null);


  const fetchFinancialData = useCallback(async (ticker: string) => {
    if (!ticker || financialData[ticker]?.isLoading) {
      return;
    }

    setFinancialData(prev => ({
      ...prev,
      [ticker]: {
        ...prev[ticker],
        isLoading: true,
        error: undefined,
      }
    }));
    
    for (let attempt = 1; attempt <= API_CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        const data = await apiClient.getFinancialData(ticker);
        setFinancialData(prev => ({ ...prev, [ticker]: { isLoading: false, ...data } }));
        return;

      } catch (fetchError) {
        console.error(`Failed to fetch financial data for ${ticker} on attempt ${attempt}:`, fetchError);
        
        if (isRateLimitError(fetchError)) {
          setFinancialData(prev => ({ 
            ...prev, 
            [ticker]: { 
              ...prev[ticker], 
              isLoading: false, 
              error: 'Rate limit reached. Please wait a moment.' 
            } 
          }));
          break;
        }

        if (attempt === API_CONFIG.RETRY_ATTEMPTS) {
          setFinancialData(prev => ({ 
            ...prev, 
            [ticker]: { 
              ...prev[ticker], 
              isLoading: false, 
              error: 'API request failed. Please try again.' 
            } 
          }));
        }
        
        await new Promise(res => setTimeout(res, API_CONFIG.RETRY_DELAY * attempt)); 
      }
    }
  }, [financialData]);

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

  useEffect(() => {
    return () => {
      stopDataRefresh();
    };
  }, [stopDataRefresh]);

  return {
    financialData,
    fetchFinancialData,
    startDataRefresh,
    stopDataRefresh,
  };
};
