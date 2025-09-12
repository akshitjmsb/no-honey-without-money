/**
 * API client for communicating with the backend server
 */

import { handleApiError } from '../utils/errorHandler';
import { getEnvConfig } from '../utils/envValidation';
import { API_CONFIG } from '../utils/constants';
import { MockDataService } from './mockDataService';
import type { FinancialData, AimDataItem, Holding } from '../types';

const { VITE_API_URL } = getEnvConfig();
const API_BASE_URL = VITE_API_URL || 'http://localhost:3001';

// Check if we're in production and the API URL is not set
const isProduction = import.meta.env.PROD;
const hasApiUrl = VITE_API_URL && VITE_API_URL !== 'undefined';

if (isProduction && !hasApiUrl) {
  console.warn('⚠️ VITE_API_URL not set in production. API requests will fail.');
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, { 
        ...defaultOptions, 
        ...options,
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }
      
      // Check if it's a network error in production
      if (isProduction && error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('API server is not available. Please check if the backend is deployed and running.');
      }
      
      throw handleApiError(error);
    }
  }

  async getFinancialData(ticker: string): Promise<FinancialData> {
    try {
      return await this.request<FinancialData>('/api/financial-data', {
        method: 'POST',
        body: JSON.stringify({ ticker }),
      });
    } catch (error) {
      console.warn('⚠️ API request failed, using mock data:', error);
      return MockDataService.getFinancialData(ticker);
    }
  }

  async generateDeepDiveReport(ticker: string): Promise<{ report: string }> {
    try {
      return await this.request<{ report: string }>('/api/deep-dive', {
        method: 'POST',
        body: JSON.stringify({ ticker }),
      });
    } catch (error) {
      console.warn('⚠️ API request failed, using mock data:', error);
      return MockDataService.generateDeepDiveReport(ticker);
    }
  }

  async sendChatMessage(
    message: string,
    portfolioData?: { aimData: AimDataItem[]; holdings: { [key: string]: Holding } },
    displayCurrency?: string
  ): Promise<{ response: string }> {
    try {
      return await this.request<{ response: string }>('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message,
          portfolioData,
          displayCurrency,
        }),
      });
    } catch (error) {
      console.warn('⚠️ API request failed, using mock data:', error);
      return MockDataService.sendChatMessage(message, portfolioData, displayCurrency);
    }
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

// Export the class for testing
export { ApiClient };
