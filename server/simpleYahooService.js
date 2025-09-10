/**
 * Simple Yahoo Finance Service - Works without additional dependencies
 * Uses fetch API (available in Node.js 18+) instead of axios
 */

class SimpleYahooFinanceService {
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

  async getFinancialData(ticker) {
    try {
      console.log(`📊 Fetching real market data for ${ticker} from Yahoo Finance...`);
      
      // Get current price data
      const priceData = await this.getPriceData(ticker);
      
      // Get 24-hour price history for sparkline
      const priceHistory = await this.getPriceHistory(ticker, '1d', '1h');

      return {
        currentPrice: priceData.regularMarketPrice,
        priceHistory24h: priceHistory,
        newsSentiment: {
          sentiment: 'Neutral',
          summary: 'Market data from Yahoo Finance'
        },
        analystRatings: {
          recommendation: 'N/A',
          targetLow: null,
          targetAverage: null,
          targetHigh: null
        },
        keyMetrics: {
          beta: null,
          fiftyTwoWeekHigh: null,
          fiftyTwoWeekLow: null
        },
        upcomingEvents: {
          nextEarningsDate: null
        }
      };
    } catch (error) {
      console.error(`Error fetching data for ${ticker}:`, error.message);
      throw new Error(`Failed to fetch financial data for ${ticker}: ${error.message}`);
    }
  }

  async getPriceData(ticker) {
    try {
      // Convert ticker to Yahoo Finance format
      const yahooTicker = this.convertToYahooFormat(ticker);
      const url = `${this.baseUrl}/${yahooTicker}`;
      
      console.log(`Trying ${ticker} as ${yahooTicker}`);
      const response = await fetch(url, { headers: this.headers });
      
      if (!response.ok) {
        // Try alternative formats for Canadian stocks
        if (ticker.includes('.') && !ticker.includes('.TO')) {
          const altTicker = ticker.replace('.', '.TO');
          console.log(`Trying alternative format: ${altTicker}`);
          const altUrl = `${this.baseUrl}/${altTicker}`;
          const altResponse = await fetch(altUrl, { headers: this.headers });
          
          if (altResponse.ok) {
            const altData = await altResponse.json();
            if (altData.chart.result && altData.chart.result.length > 0) {
              const result = altData.chart.result[0];
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
            }
          }
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.chart.result || data.chart.result.length === 0) {
        throw new Error(`No data found for ticker: ${ticker}`);
      }

      const result = data.chart.result[0];
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

  convertToYahooFormat(ticker) {
    // Handle special cases for Yahoo Finance
    const tickerMap = {
      'BRK.B': 'BRK-B',
      'GOOGL': 'GOOGL',
      'GOOG': 'GOOG',
      'BEP.UN': 'BEP-UN.TO',
      'GRT.UN': 'GRT-UN.TO',
      'XGD': 'XGD.TO',
      'XRE': 'XRE.TO',
      'ZWT': 'ZWT.TO'
    };
    
    if (tickerMap[ticker]) {
      return tickerMap[ticker];
    }
    
    // For Canadian stocks without .TO, add it
    if (ticker.match(/^[A-Z]{1,4}$/) && !ticker.includes('.')) {
      // Check if it's a known Canadian stock
      const canadianStocks = ['ATD', 'CNQ', 'DOO', 'EIF', 'FTS', 'BN', 'POW', 'T', 'WELL', 'BYD', 'NA', 'CP', 'CSU', 'IFC', 'EQB', 'ASML'];
      if (canadianStocks.includes(ticker)) {
        return `${ticker}.TO`;
      }
    }
    
    return ticker;
  }

  async getPriceHistory(ticker, range = '1d', interval = '1h') {
    try {
      const yahooTicker = this.convertToYahooFormat(ticker);
      const url = `${this.baseUrl}/${yahooTicker}?interval=${interval}&range=${range}`;
      const response = await fetch(url, { headers: this.headers });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.chart.result || data.chart.result.length === 0) {
        return [];
      }

      const result = data.chart.result[0];
      const closes = result.indicators.quote[0].close;
      
      // Filter out null values and return clean price array
      const prices = [];
      for (let i = 0; i < closes.length; i++) {
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

  isValidTicker(ticker) {
    if (!ticker || typeof ticker !== 'string') return false;
    const cleanTicker = ticker.trim().toUpperCase();
    return /^[A-Z0-9.-]+$/.test(cleanTicker) && cleanTicker.length <= 10;
  }

  cleanTicker(ticker) {
    if (!ticker) return '';
    return ticker.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, '');
  }
}

export default new SimpleYahooFinanceService();
