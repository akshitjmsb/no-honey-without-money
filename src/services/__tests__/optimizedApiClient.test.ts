import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OptimizedApiClient } from '../optimizedApiClient';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console methods
const consoleSpy = {
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

describe('OptimizedApiClient', () => {
  let client: OptimizedApiClient;
  const mockBaseUrl = 'https://api.example.com';

  beforeEach(() => {
    client = new OptimizedApiClient(mockBaseUrl);
    mockFetch.mockClear();
    consoleSpy.warn.mockClear();
    consoleSpy.error.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('request deduplication', () => {
    it('should deduplicate concurrent requests', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const promise1 = client.getFinancialData('AAPL');
      const promise2 = client.getFinancialData('AAPL');

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toEqual(mockResponse);
      expect(result2).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle different tickers separately', async () => {
      const mockResponse1 = { data: 'AAPL' };
      const mockResponse2 = { data: 'GOOGL' };
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse1),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse2),
        });

      const promise1 = client.getFinancialData('AAPL');
      const promise2 = client.getFinancialData('GOOGL');

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toEqual(mockResponse1);
      expect(result2).toEqual(mockResponse2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('caching', () => {
    it('should cache successful responses', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // First call
      const result1 = await client.getFinancialData('AAPL');
      expect(result1).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await client.getFinancialData('AAPL');
      expect(result2).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not cache failed responses', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: 'success' }),
        });

      // First call fails
      await expect(client.getFinancialData('AAPL')).rejects.toThrow();

      // Second call should retry
      const result = await client.getFinancialData('AAPL');
      expect(result).toEqual({ data: 'success' });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should clear cache for specific ticker', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // Cache data
      await client.getFinancialData('AAPL');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clear cache
      client.clearCacheForTicker('AAPL');

      // Should make new request
      await client.getFinancialData('AAPL');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should clear all cache', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // Cache data
      await client.getFinancialData('AAPL');
      await client.getFinancialData('GOOGL');
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Clear all cache
      client.clearCache();

      // Should make new requests
      await client.getFinancialData('AAPL');
      await client.getFinancialData('GOOGL');
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(client.getFinancialData('AAPL')).rejects.toThrow('Network error');
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      await expect(client.getFinancialData('AAPL')).rejects.toThrow('Server error');
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        })
      );

      await expect(client.getFinancialData('AAPL')).rejects.toThrow();
    });
  });

  describe('cache statistics', () => {
    it('should return cache statistics', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const statsBefore = client.getCacheStats();
      expect(statsBefore.size).toBe(0);

      await client.getFinancialData('AAPL');
      
      const statsAfter = client.getCacheStats();
      expect(statsAfter.size).toBe(1);
      expect(statsAfter.keys).toContain('financial-data:AAPL');
    });
  });

  describe('API methods', () => {
    it('should call correct endpoint for getFinancialData', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await client.getFinancialData('AAPL');

      expect(mockFetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/financial-data`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ ticker: 'AAPL' }),
        })
      );
    });

    it('should call correct endpoint for generateDeepDiveReport', async () => {
      const mockResponse = { report: 'test report' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await client.generateDeepDiveReport('AAPL');

      expect(mockFetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/deep-dive`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ ticker: 'AAPL' }),
        })
      );
    });

    it('should call correct endpoint for sendChatMessage', async () => {
      const mockResponse = { response: 'test response' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await client.sendChatMessage('Hello', { aimData: [], holdings: {} }, 'USD');

      expect(mockFetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/chat`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            message: 'Hello',
            portfolioData: { aimData: [], holdings: {} },
            displayCurrency: 'USD',
          }),
        })
      );
    });

    it('should call correct endpoint for healthCheck', async () => {
      const mockResponse = { status: 'ok', timestamp: '2023-01-01T00:00:00Z' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await client.healthCheck();

      expect(mockFetch).toHaveBeenCalledWith(`${mockBaseUrl}/health`);
    });
  });
});
