/**
 * Optimized API client with request deduplication and better caching
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

// Request deduplication cache
const pendingRequests = new Map<string, Promise<any>>();

// Enhanced cache with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class OptimizedApiClient {
  private baseUrl: string;
  private cache = new Map<string, CacheEntry<any>>();

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

  private getCacheKey(endpoint: string, body?: any): string {
    return `${endpoint}:${body ? JSON.stringify(body) : ''}`;
  }

  private isCacheValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && this.isCacheValid(entry)) {
      return entry.data;
    }
    if (entry) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCache<T>(key: string, data: T, ttl: number = API_CONFIG.CACHE_DURATION): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private async deduplicatedRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    cacheKey?: string
  ): Promise<T> {
    const key = cacheKey || this.getCacheKey(endpoint, options.body);
    
    // Check cache first
    const cached = this.getFromCache<T>(key);
    if (cached) {
      return cached;
    }

    // Check if request is already pending
    if (pendingRequests.has(key)) {
      return pendingRequests.get(key)!;
    }

    // Create new request
    const requestPromise = this.request<T>(endpoint, options);
    pendingRequests.set(key, requestPromise);

    try {
      const result = await requestPromise;
      this.setCache(key, result);
      return result;
    } finally {
      pendingRequests.delete(key);
    }
  }

  async getFinancialData(ticker: string): Promise<FinancialData> {
    const cacheKey = `financial-data:${ticker}`;
    
    try {
      return await this.deduplicatedRequest<FinancialData>('/api/financial-data', {
        method: 'POST',
        body: JSON.stringify({ ticker }),
      }, cacheKey);
    } catch (error) {
      console.warn('⚠️ API request failed, using mock data:', error);
      return MockDataService.getFinancialData(ticker);
    }
  }

  async generateDeepDiveReport(ticker: string): Promise<{ report: string }> {
    const cacheKey = `deep-dive:${ticker}`;
    
    try {
      return await this.deduplicatedRequest<{ report: string }>('/api/deep-dive', {
        method: 'POST',
        body: JSON.stringify({ ticker }),
      }, cacheKey);
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
    // Chat messages are not cached as they should be unique
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

  // Cache management methods
  clearCache(): void {
    this.cache.clear();
  }

  clearCacheForTicker(ticker: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(`:${ticker}`)
    );
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create a singleton instance
export const optimizedApiClient = new OptimizedApiClient();

// Export the class for testing
export { OptimizedApiClient };
