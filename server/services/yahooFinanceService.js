/**
 * Yahoo Finance Service - Free market data scraping
 * Provides real-time stock data without API keys or rate limits
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

class YahooFinanceService {
  constructor() {
    this.baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
    this.quoteUrl = 'https://query1.finance.yahoo.com/v10/finance/quoteSummary';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://finance.yahoo.com/',
    };
  }

  /**
   * Get comprehensive financial data for a ticker
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<Object>} Financial data object
   */
  async getFinancialData(ticker) {
    try {
      console.log(`Fetching data for ${ticker} from Yahoo Finance...`);
      
      // Fetch all data in parallel for better performance
      const [priceData, quoteData] = await Promise.all([
        this.getPriceData(ticker),
        this.getQuoteData(ticker)
      ]);

      // Get 24-hour price history for sparkline
      const priceHistory = await this.getPriceHistory(ticker, '1d', '1h');

      return {
        currentPrice: priceData.regularMarketPrice,
        priceHistory24h: priceHistory,
        newsSentiment: {
          sentiment: 'Neutral', // Yahoo doesn't provide sentiment in free data
          summary: 'Market data from Yahoo Finance'
        },
        analystRatings: {
          recommendation: quoteData.recommendation || 'N/A',
          targetLow: quoteData.targetLowPrice || null,
          targetAverage: quoteData.targetMeanPrice || null,
          targetHigh: quoteData.targetHighPrice || null
        },
        keyMetrics: {
          beta: quoteData.beta || null,
          fiftyTwoWeekHigh: quoteData.fiftyTwoWeekHigh || null,
          fiftyTwoWeekLow: quoteData.fiftyTwoWeekLow || null
        },
        upcomingEvents: {
          nextEarningsDate: quoteData.nextEarningsDate || null
        }
      };
    } catch (error) {
      console.error(`Error fetching data for ${ticker}:`, error.message);
      throw new Error(`Failed to fetch financial data for ${ticker}: ${error.message}`);
    }
  }

  /**
   * Get current price and basic market data
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<Object>} Price data
   */
  async getPriceData(ticker) {
    try {
      const url = `${this.baseUrl}/${ticker}`;
      const response = await axios.get(url, { headers: this.headers });
      
      if (!response.data.chart.result || response.data.chart.result.length === 0) {
        throw new Error(`No data found for ticker: ${ticker}`);
      }

      const result = response.data.chart.result[0];
      const meta = result.meta;
      
      return {
        regularMarketPrice: meta.regularMarketPrice,
        previousClose: meta.previousClose,
        open: meta.open,
        dayHigh: meta.dayHigh,
        dayLow: meta.dayLow,
        volume: meta.volume,
        marketCap: meta.marketCap,
        currency: meta.currency
      };
    } catch (error) {
      throw new Error(`Failed to fetch price data: ${error.message}`);
    }
  }

  /**
   * Get detailed quote information
   * @param {string} ticker - Stock ticker symbol
   * @returns {Promise<Object>} Quote data
   */
  async getQuoteData(ticker) {
    try {
      const modules = 'defaultKeyStatistics,financialData,recommendationTrend,upcomingEvents';
      const url = `${this.quoteUrl}/${ticker}?modules=${modules}`;
      const response = await axios.get(url, { headers: this.headers });
      
      if (!response.data.quoteSummary.result || response.data.quoteSummary.result.length === 0) {
        throw new Error(`No quote data found for ticker: ${ticker}`);
      }

      const result = response.data.quoteSummary.result[0];
      const stats = result.defaultKeyStatistics || {};
      const financial = result.financialData || {};
      const recommendation = result.recommendationTrend || {};
      const events = result.upcomingEvents || {};

      return {
        beta: stats.beta,
        fiftyTwoWeekHigh: stats.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: stats.fiftyTwoWeekLow,
        marketCap: stats.marketCap,
        recommendation: recommendation.consensus || 'N/A',
        targetLowPrice: recommendation.low || null,
        targetMeanPrice: recommendation.mean || null,
        targetHighPrice: recommendation.high || null,
        nextEarningsDate: events.earnings?.earningsDate?.[0]?.fmt || null
      };
    } catch (error) {
      console.warn(`Failed to fetch quote data for ${ticker}:`, error.message);
      // Return empty object if quote data fails - price data is more important
      return {};
    }
  }

  /**
   * Get price history for sparkline charts
   * @param {string} ticker - Stock ticker symbol
   * @param {string} range - Time range (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
   * @param {string} interval - Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
   * @returns {Promise<Array>} Array of price points
   */
  async getPriceHistory(ticker, range = '1d', interval = '1h') {
    try {
      const url = `${this.baseUrl}/${ticker}?interval=${interval}&range=${range}`;
      const response = await axios.get(url, { headers: this.headers });
      
      if (!response.data.chart.result || response.data.chart.result.length === 0) {
        return [];
      }

      const result = response.data.chart.result[0];
      const timestamps = result.timestamp;
      const closes = result.indicators.quote[0].close;
      
      // Filter out null values and return clean price array
      const prices = [];
      for (let i = 0; i < timestamps.length; i++) {
        if (closes[i] !== null && closes[i] !== undefined) {
          prices.push(closes[i]);
        }
      }
      
      return prices;
    } catch (error) {
      console.warn(`Failed to fetch price history for ${ticker}:`, error.message);
      return [];
    }
  }

  /**
   * Get multiple tickers' current prices (batch request)
   * @param {Array<string>} tickers - Array of ticker symbols
   * @returns {Promise<Object>} Object with ticker as key and price as value
   */
  async getMultiplePrices(tickers) {
    try {
      const tickerString = tickers.join(',');
      const url = `${this.baseUrl}/${tickerString}`;
      const response = await axios.get(url, { headers: this.headers });
      
      const results = {};
      if (response.data.chart.result) {
        response.data.chart.result.forEach((result, index) => {
          const ticker = tickers[index];
          if (result && result.meta) {
            results[ticker] = result.meta.regularMarketPrice;
          }
        });
      }
      
      return results;
    } catch (error) {
      throw new Error(`Failed to fetch multiple prices: ${error.message}`);
    }
  }

  /**
   * Validate ticker symbol
   * @param {string} ticker - Stock ticker symbol
   * @returns {boolean} Whether ticker is valid
   */
  isValidTicker(ticker) {
    if (!ticker || typeof ticker !== 'string') return false;
    const cleanTicker = ticker.trim().toUpperCase();
    return /^[A-Z0-9.-]+$/.test(cleanTicker) && cleanTicker.length <= 10;
  }

  /**
   * Clean and normalize ticker symbol
   * @param {string} ticker - Stock ticker symbol
   * @returns {string} Cleaned ticker symbol
   */
  cleanTicker(ticker) {
    if (!ticker) return '';
    return ticker.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, '');
  }
}

export default new YahooFinanceService();
