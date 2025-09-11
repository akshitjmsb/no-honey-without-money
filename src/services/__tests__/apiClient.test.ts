import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from '../apiClient';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock handleApiError
vi.mock('../../utils/errorHandler', () => ({
  handleApiError: vi.fn((error) => error.message || 'Unknown error')
}));

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient('http://localhost:3001');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getFinancialData', () => {
    it('should fetch financial data successfully', async () => {
      const mockData = {
        currentPrice: 150.25,
        priceHistory24h: [148.50, 149.75, 150.25],
        newsSentiment: { sentiment: 'Positive', summary: 'Good news' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const result = await apiClient.getFinancialData('AAPL');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/financial-data',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticker: 'AAPL' })
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Ticker not found' })
      });

      await expect(apiClient.getFinancialData('INVALID')).rejects.toThrow('Ticker not found');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.getFinancialData('AAPL')).rejects.toThrow('Network error');
    });
  });

  describe('generateDeepDiveReport', () => {
    it('should generate deep dive report successfully', async () => {
      const mockReport = {
        report: 'This is a comprehensive analysis of AAPL...'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockReport
      });

      const result = await apiClient.generateDeepDiveReport('AAPL');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/deep-dive',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticker: 'AAPL' })
        })
      );
      expect(result).toEqual(mockReport);
    });

    it('should handle deep dive API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Failed to generate report' })
      });

      await expect(apiClient.generateDeepDiveReport('AAPL')).rejects.toThrow('Failed to generate report');
    });
  });

  describe('sendChatMessage', () => {
    it('should send chat message successfully', async () => {
      const mockResponse = {
        response: 'Here is my analysis of your portfolio...'
      };

      const portfolioData = {
        aimData: [{ id: 1, ticker: 'AAPL', targetPercent: 0.5, currency: 'USD' as const, completed: false, notes: '' }],
        holdings: { AAPL: { numberOfShares: 10, costPerShare: 150, currency: 'USD' as const } }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await apiClient.sendChatMessage(
        'Analyze my portfolio',
        portfolioData,
        'USD'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/chat',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Analyze my portfolio',
            portfolioData,
            displayCurrency: 'USD'
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should send chat message without portfolio data', async () => {
      const mockResponse = {
        response: 'How can I help you?'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await apiClient.sendChatMessage('Hello');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/chat',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            message: 'Hello',
            portfolioData: undefined,
            displayCurrency: undefined
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('healthCheck', () => {
    it('should perform health check successfully', async () => {
      const mockHealth = {
        status: 'ok',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealth
      });

      const result = await apiClient.healthCheck();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/health',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' }
        })
      );
      expect(result).toEqual(mockHealth);
    });
  });

  describe('request method', () => {
    it('should merge headers correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      await apiClient.getFinancialData('AAPL');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      await expect(apiClient.getFinancialData('AAPL')).rejects.toThrow('Invalid JSON');
    });
  });
});
