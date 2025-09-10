import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import yahooFinanceService from './services/yahooFinanceService.js';
import dotenv from 'dotenv';

dotenv.config();

// Simple in-memory rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 50; // 50 requests per minute per IP

const rateLimitMiddleware = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!rateLimitMap.has(clientIP)) {
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  const clientData = rateLimitMap.get(clientIP);
  
  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + RATE_LIMIT_WINDOW;
    return next();
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ 
      error: 'Too many requests. Please wait a moment before trying again.',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }
  
  clientData.count++;
  next();
};

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
// app.use(rateLimitMiddleware); // Temporarily disabled for testing

// Validate environment variables
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable is required');
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
  try {
    const { ticker } = req.body;
    
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker is required' });
    }

    const validatedTicker = validateTicker(ticker);
    
    // Validate ticker format using Yahoo Finance service
    if (!yahooFinanceService.isValidTicker(validatedTicker)) {
      return res.status(400).json({ error: 'Invalid ticker format' });
    }

    console.log(`📊 Fetching real market data for ${validatedTicker} from Yahoo Finance...`);
    
    // Get real financial data from Yahoo Finance
    const financialData = await yahooFinanceService.getFinancialData(validatedTicker);
    
    console.log(`✅ Successfully fetched data for ${validatedTicker}: $${financialData.currentPrice}`);
    res.json(financialData);

  } catch (error) {
    console.error('Financial data API error:', error);
    
    if (error.message?.includes('Ticker must be') || error.message?.includes('Invalid ticker')) {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.message?.includes('No data found')) {
      return res.status(404).json({ error: `No data found for ticker: ${req.body.ticker}` });
    }
    
    res.status(500).json({ error: 'Failed to fetch financial data from Yahoo Finance' });
  }
});

// Deep dive report endpoint - Enhanced with real market data
app.post('/api/deep-dive', async (req, res) => {
  try {
    const { ticker } = req.body;
    
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker is required' });
    }

    const validatedTicker = validateTicker(ticker);
    
    // Validate ticker format
    if (!yahooFinanceService.isValidTicker(validatedTicker)) {
      return res.status(400).json({ error: 'Invalid ticker format' });
    }

    console.log(`🔍 Generating deep dive report for ${validatedTicker} with real market data...`);
    
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

    console.log(`✅ Deep dive report generated for ${validatedTicker}`);
    res.json({ report: reportText });

  } catch (error) {
    console.error('Deep dive API error:', error);
    
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
  try {
    const { message, portfolioData, displayCurrency } = req.body;
    
    if (!message) {
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

    res.json({ response: responseText });

  } catch (error) {
    console.error('Chat API error:', error);
    
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
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
