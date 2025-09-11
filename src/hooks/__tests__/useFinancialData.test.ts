import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFinancialData } from '../useFinancialData';
import { apiClient } from '../../services/apiClient';
import { isRateLimitError } from '../../utils/errorHandler';

// Mock the API client
vi.mock('../../services/apiClient', () => ({
  apiClient: {
    getFinancialData: vi.fn()
  }
}));

// Mock the error handler
vi.mock('../../utils/errorHandler', () => ({
  isRateLimitError: vi.fn()
}));

// Mock timers
vi.useFakeTimers();

describe('useFinancialData', () => {
  const mockGetFinancialData = vi.mocked(apiClient.getFinancialData);
  const mockIsRateLimitError = vi.mocked(isRateLimitError);

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsRateLimitError.mockReturnValue(false);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.useFakeTimers();
  });

  it('should initialize with empty financial data', () => {
    const { result } = renderHook(() => useFinancialData());
    
    expect(result.current.financialData).toEqual({});
    expect(result.current.globalLoading).toBe(false);
    expect(result.current.globalError).toBe(null);
  });

  it('should fetch financial data successfully', async () => {
    const mockData = {
      currentPrice: 150.25,
      priceHistory24h: [148.50, 149.75, 150.25],
      newsSentiment: { sentiment: 'Positive' as const, summary: 'Good news' }
    };

    mockGetFinancialData.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useFinancialData());

    await act(async () => {
      await result.current.fetchFinancialData('AAPL');
    });

    expect(mockGetFinancialData).toHaveBeenCalledWith('AAPL');
    expect(result.current.financialData['AAPL']).toEqual({
      ...mockData,
      isLoading: false
    });
  });

  it('should handle loading state during fetch', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    mockGetFinancialData.mockReturnValueOnce(promise as any);

    const { result } = renderHook(() => useFinancialData());

    act(() => {
      result.current.fetchFinancialData('AAPL');
    });

    // Check loading state
    expect(result.current.financialData['AAPL']?.isLoading).toBe(true);

    // Resolve the promise
    await act(async () => {
      resolvePromise!({
        currentPrice: 150.25,
        priceHistory24h: [],
        newsSentiment: { sentiment: 'Neutral' as const, summary: '' }
      });
    });

    expect(result.current.financialData['AAPL']?.isLoading).toBe(false);
  });

  it('should handle API errors', async () => {
    const error = new Error('API Error');
    mockGetFinancialData.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useFinancialData());

    await act(async () => {
      await result.current.fetchFinancialData('INVALID');
    });

    expect(result.current.financialData['INVALID']?.error).toBe('API request failed. Please try again.');
    expect(result.current.financialData['INVALID']?.isLoading).toBe(false);
  });

  it('should handle rate limit errors', async () => {
    const error = new Error('Rate limit exceeded');
    mockGetFinancialData.mockRejectedValueOnce(error);
    mockIsRateLimitError.mockReturnValueOnce(true);

    const { result } = renderHook(() => useFinancialData());

    await act(async () => {
      await result.current.fetchFinancialData('AAPL');
    });

    expect(result.current.financialData['AAPL']?.error).toBe('Rate limit reached. Please wait a moment.');
  });

  it('should not fetch if already loading', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    mockGetFinancialData.mockReturnValueOnce(promise as any);

    const { result } = renderHook(() => useFinancialData());

    // Start first fetch
    act(() => {
      result.current.fetchFinancialData('AAPL');
    });

    // Try to fetch again while loading
    await act(async () => {
      await result.current.fetchFinancialData('AAPL');
    });

    expect(mockGetFinancialData).toHaveBeenCalledTimes(1);
  });

  it('should not fetch if ticker is empty', async () => {
    const { result } = renderHook(() => useFinancialData());

    await act(async () => {
      await result.current.fetchFinancialData('');
    });

    expect(mockGetFinancialData).not.toHaveBeenCalled();
  });

  it('should start data refresh with debounce', async () => {
    const mockData = {
      currentPrice: 150.25,
      priceHistory24h: [],
      newsSentiment: { sentiment: 'Neutral' as const, summary: '' }
    };

    mockGetFinancialData.mockResolvedValue(mockData);

    const { result } = renderHook(() => useFinancialData());

    act(() => {
      result.current.startDataRefresh('AAPL');
    });

    // Should not fetch immediately due to debounce
    expect(mockGetFinancialData).not.toHaveBeenCalled();

    // Fast-forward debounce delay
    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(mockGetFinancialData).toHaveBeenCalledWith('AAPL');
    });
  });

  it('should stop data refresh', () => {
    const { result } = renderHook(() => useFinancialData());

    act(() => {
      result.current.startDataRefresh('AAPL');
      result.current.stopDataRefresh();
    });

    // Fast-forward time to ensure no fetch happens
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(mockGetFinancialData).not.toHaveBeenCalled();
  });

  it('should clean up intervals on unmount', () => {
    const { result, unmount } = renderHook(() => useFinancialData());

    act(() => {
      result.current.startDataRefresh('AAPL');
    });

    unmount();

    // Fast-forward time to ensure no fetch happens after unmount
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(mockGetFinancialData).not.toHaveBeenCalled();
  });

  it('should handle multiple tickers', async () => {
    const mockData1 = { currentPrice: 150.25, priceHistory24h: [], newsSentiment: { sentiment: 'Neutral' as const, summary: '' } };
    const mockData2 = { currentPrice: 300.50, priceHistory24h: [], newsSentiment: { sentiment: 'Positive' as const, summary: '' } };

    mockGetFinancialData
      .mockResolvedValueOnce(mockData1)
      .mockResolvedValueOnce(mockData2);

    const { result } = renderHook(() => useFinancialData());

    await act(async () => {
      await result.current.fetchFinancialData('AAPL');
    });

    await act(async () => {
      await result.current.fetchFinancialData('MSFT');
    });

    expect(result.current.financialData['AAPL']).toEqual({
      ...mockData1,
      isLoading: false
    });
    expect(result.current.financialData['MSFT']).toEqual({
      ...mockData2,
      isLoading: false
    });
  });

  it('should provide global loading state', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    mockGetFinancialData.mockReturnValueOnce(promise as any);

    const { result } = renderHook(() => useFinancialData());

    act(() => {
      result.current.fetchFinancialData('AAPL');
    });

    expect(result.current.globalLoading).toBe(true);

    await act(async () => {
      resolvePromise!({
        currentPrice: 150.25,
        priceHistory24h: [],
        newsSentiment: { sentiment: 'Neutral' as const, summary: '' }
      });
    });

    expect(result.current.globalLoading).toBe(false);
  });

  it('should provide retry functionality', async () => {
    const error = new Error('API Error');
    mockGetFinancialData.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useFinancialData());

    await act(async () => {
      await result.current.fetchFinancialData('AAPL');
    });

    expect(result.current.globalError).toBeTruthy();
    expect(result.current.canRetryGlobal).toBe(true);

    // Mock successful retry
    mockGetFinancialData.mockResolvedValueOnce({
      currentPrice: 150.25,
      priceHistory24h: [],
      newsSentiment: { sentiment: 'Neutral' as const, summary: '' }
    });

    act(() => {
      result.current.retryGlobal();
    });

    expect(result.current.globalLoading).toBe(true);
  });
});
