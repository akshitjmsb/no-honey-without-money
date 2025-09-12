/**
 * API client for communicating with the backend server
 */

import { handleApiError } from '../utils/errorHandler';
import { getEnvConfig } from '../utils/envValidation';
import { API_CONFIG } from '../utils/constants';
import type { FinancialData, AimDataItem, Holding } from '../types';

const { VITE_API_URL } = getEnvConfig();
const API_BASE_URL = VITE_API_URL || 'http://localhost:3001';

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
      
      throw handleApiError(error);
    }
  }

  async getFinancialData(ticker: string): Promise<FinancialData> {
    return this.request<FinancialData>('/api/financial-data', {
      method: 'POST',
      body: JSON.stringify({ ticker }),
    });
  }

  async generateDeepDiveReport(ticker: string): Promise<{ report: string }> {
    return this.request<{ report: string }>('/api/deep-dive', {
      method: 'POST',
      body: JSON.stringify({ ticker }),
    });
  }

  async sendChatMessage(
    message: string,
    portfolioData?: { aimData: AimDataItem[]; holdings: { [key: string]: Holding } },
    displayCurrency?: string
  ): Promise<{ response: string }> {
    return this.request<{ response: string }>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        portfolioData,
        displayCurrency,
      }),
    });
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

// Export the class for testing
export { ApiClient };
