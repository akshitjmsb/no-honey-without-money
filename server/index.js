import express from 'express';
import cors from 'cors';
import pkg from 'helmet';
const helmet = pkg.default || pkg;
import rateLimit from 'express-rate-limit';
import { GoogleGenAI } from '@google/genai';
import yahooFinanceService from './simpleYahooService.js';
import rateLimiter from './utils/rateLimiter.js';
import logger from './utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize rate limiter (optional - will fallback to in-memory if Redis unavailable)
try {
  await rateLimiter.connect();
  logger.info('Redis rate limiter connected successfully');
} catch (error) {
  logger.warn('Redis not available, using in-memory rate limiting fallback:', error.message);
}

// Express rate limiter as backup
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Custom Redis-based rate limiter middleware
const redisRateLimitMiddleware = async (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  try {
    const result = await rateLimiter.checkRateLimit(clientIP, 60000, 50); // 50 requests per minute
    
    if (!result.allowed) {
      logger.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return res.status(429).json({
        error: 'Too many requests. Please wait a moment before trying again.',
        retryAfter: result.retryAfter
      });
    }
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': '50',
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
    });
    
    next();
  } catch (error) {
    logger.warn('Redis rate limiter unavailable, falling back to express-rate-limit:', error.message);
    // Allow request to proceed if rate limiter fails
    next();
  }
};

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Add request size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Add URL encoded limit

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Apply rate limiting
app.use('/api/', redisRateLimitMiddleware);
app.use(limiter); // Express rate limiter as backup

// Validate environment variables
if (!process.env.GEMINI_API_KEY) {
  logger.error('GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

// Initialize Google GenAI
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Input validation helpers
const validateTicker = (ticker) => {
  if (!ticker || typeof ticker !== 'string') {
    throw new Error('Ticker must be a non-empty string');
  }
  if (ticker.length > 10 || !/^[A-Z0-9.]+$/.test(ticker)) {
    throw new Error('Invalid ticker format. Must be 1-10 alphanumeric characters');
  }
  return ticker.trim().toUpperCase();
};

const validateMessage = (message) => {
  if (!message || typeof message !== 'string') {
    throw new Error('Message must be a non-empty string');
  }
  if (message.length > 1000) {
    throw new Error('Message too long. Maximum 1000 characters');
  }
  return message.trim();
};

// Financial data endpoint - Now using Yahoo Finance (FREE!)
app.post('/api/financial-data', async (req, res) => {
  const startTime = Date.now();
  const { ticker } = req.body;
  
  try {
    logger.info(`Financial data request for ticker: ${ticker}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    if (!ticker) {
      logger.warn('Financial data request missing ticker');
      return res.status(400).json({ error: 'Ticker is required' });
    }

    const validatedTicker = validateTicker(ticker);
    
    // Validate ticker format using Yahoo Finance service
    if (!yahooFinanceService.isValidTicker(validatedTicker)) {
      logger.warn(`Invalid ticker format: ${ticker}`);
      return res.status(400).json({ error: 'Invalid ticker format' });
    }

    logger.info(`Fetching market data for ${validatedTicker} from Yahoo Finance`);
    
    // Get real financial data from Yahoo Finance
    const financialData = await yahooFinanceService.getFinancialData(validatedTicker);
    
    const duration = Date.now() - startTime;
    logger.info(`Successfully fetched data for ${validatedTicker}`, {
      price: financialData.currentPrice,
      duration: `${duration}ms`
    });
    
    res.json(financialData);

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Financial data API error', {
      ticker,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    
    if (error.message?.includes('Ticker must be') || error.message?.includes('Invalid ticker')) {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.message?.includes('No data found')) {
      return res.status(404).json({ error: `No data found for ticker: ${ticker}` });
    }
    
    res.status(500).json({ error: 'Failed to fetch financial data from Yahoo Finance' });
  }
});

// Deep dive report endpoint - Enhanced with real market data
app.post('/api/deep-dive', async (req, res) => {
  const startTime = Date.now();
  const { ticker } = req.body;
  
  try {
    logger.info(`Deep dive request for ticker: ${ticker}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    if (!ticker) {
      logger.warn('Deep dive request missing ticker');
      return res.status(400).json({ error: 'Ticker is required' });
    }

    const validatedTicker = validateTicker(ticker);
    
    // Validate ticker format
    if (!yahooFinanceService.isValidTicker(validatedTicker)) {
      logger.warn(`Invalid ticker format for deep dive: ${ticker}`);
      return res.status(400).json({ error: 'Invalid ticker format' });
    }

    logger.info(`Generating deep dive report for ${validatedTicker}`);
    
    // Get real market data to enhance the analysis
    let marketData = {};
    try {
      marketData = await yahooFinanceService.getFinancialData(validatedTicker);
    } catch (error) {
      console.warn(`Could not fetch market data for ${validatedTicker}:`, error.message);
    }

    // Create enhanced prompt with real market data
    const marketDataContext = marketData.currentPrice ? 
      `\n\n**Current Market Data for ${validatedTicker}:**
- Current Price: $${marketData.currentPrice}
- 52-Week High: ${marketData.keyMetrics?.fiftyTwoWeekHigh ? '$' + marketData.keyMetrics.fiftyTwoWeekHigh : 'N/A'}
- 52-Week Low: ${marketData.keyMetrics?.fiftyTwoWeekLow ? '$' + marketData.keyMetrics.fiftyTwoWeekLow : 'N/A'}
- Beta: ${marketData.keyMetrics?.beta || 'N/A'}
- Analyst Recommendation: ${marketData.analystRatings?.recommendation || 'N/A'}
- Next Earnings: ${marketData.upcomingEvents?.nextEarningsDate || 'N/A'}` : '';

    const prompt = `Generate a concise investment "deep dive" report for the company with ticker "${validatedTicker}". Use the provided market data to enhance your analysis. The report should be structured with the following sections, using markdown for formatting:

### 1. Company Overview
- A brief description of the company, its business model, and its primary revenue streams.

### 2. Financial Health
- A summary of recent performance (revenue growth, profitability, and key financial ratios like P/E, P/S).
- A comment on the company's balance sheet strength (debt levels, cash flow).
- Include analysis of the current market data provided.

### 3. Growth Catalysts & Competitive Advantages
- What are the primary drivers for future growth? (e.g., new products, market expansion, industry trends).
- What is the company's "moat"? (e.g., brand recognition, network effects, technology).

### 4. Risks & Headwinds
- What are the main risks facing the company? (e.g., competition, regulatory changes, economic factors).

### 5. Investment Thesis Summary
- A concluding paragraph summarizing why this might be (or might not be) a compelling investment right now.
- Consider the current market data and analyst sentiment in your conclusion.${marketDataContext}`;

    const stream = await genAI.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let reportText = '';
    for await (const chunk of stream) {
      reportText += chunk.text;
    }

    const duration = Date.now() - startTime;
    logger.info(`Deep dive report generated for ${validatedTicker}`, {
      duration: `${duration}ms`,
      reportLength: reportText.length
    });
    
    res.json({ report: reportText });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Deep dive API error', {
      ticker,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    
    if (error.message?.includes('Ticker must be') || error.message?.includes('Invalid ticker')) {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.message?.includes('429') || error.message?.toLowerCase().includes('quota')) {
      return res.status(429).json({ error: 'Rate limit reached. Please wait a moment.' });
    }
    
    res.status(500).json({ error: 'Failed to generate deep dive report' });
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const startTime = Date.now();
  const { message, portfolioData, displayCurrency } = req.body;
  
  try {
    logger.info('Chat request received', {
      messageLength: message?.length || 0,
      hasPortfolioData: !!portfolioData,
      displayCurrency,
      ip: req.ip
    });
    
    if (!message) {
      logger.warn('Chat request missing message');
      return res.status(400).json({ error: 'Message is required' });
    }

    const validatedMessage = validateMessage(message);

    const chat = genAI.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `You are a helpful financial assistant. Analyze the provided portfolio data and answer questions about it. The data is about portfolio rebalancing, holdings, and targets. The user's primary display currency is ${displayCurrency || 'CAD'}.`,
      },
    });

    let messageToSend = validatedMessage;
    if (portfolioData) {
      messageToSend = `Here is the current portfolio data in JSON format. Please analyze it to answer my questions. \n\nTARGET DATA:\n${JSON.stringify(portfolioData.aimData, null, 2)}\n\nHOLDINGS DATA:\n${JSON.stringify(portfolioData.holdings, null, 2)}\n\nMy question is: ${validatedMessage}`;
    }

    const stream = await chat.sendMessageStream({ message: messageToSend });
    
    let responseText = '';
    for await (const chunk of stream) {
      responseText += chunk.text;
    }

    const duration = Date.now() - startTime;
    logger.info('Chat response generated', {
      responseLength: responseText.length,
      duration: `${duration}ms`
    });
    
    res.json({ response: responseText });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Chat API error', {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    
    if (error.message?.includes('Message must be') || error.message?.includes('Message too long')) {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.message?.includes('429') || error.message?.toLowerCase().includes('quota')) {
      return res.status(429).json({ error: 'Rate limit reached. Please wait a moment.' });
    }
    
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  logger.warn('404 - Endpoint not found', {
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await rateLimiter.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await rateLimiter.disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    healthCheck: `http://localhost:${PORT}/health`
  });
});
