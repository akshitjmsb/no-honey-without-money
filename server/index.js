const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

// Simple in-memory rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP

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
app.use(rateLimitMiddleware);

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

// Financial data endpoint
app.post('/api/financial-data', async (req, res) => {
  try {
    const { ticker } = req.body;
    
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker is required' });
    }

    const validatedTicker = validateTicker(ticker);

    const prompt = `Provide the following real-time financial data for the stock ticker "${validatedTicker}" in a single, minified JSON object. Do not include any markdown formatting or explanations, only the raw JSON.
    - currentPrice: The most recent trading price.
    - priceHistory24h: An array of ~24 hourly price points for the last 24 hours. If unavailable, provide an empty array.
    - newsSentiment: Analyze recent news headlines and provide a 'sentiment' ('Positive', 'Neutral', 'Negative', 'N/A') and a brief 'summary'.
    - analystRatings: Provide 'recommendation', and 'targetLow', 'targetAverage', 'targetHigh'. Use null if a value is not available.
    - keyMetrics: Provide 'beta', 'fiftyTwoWeekHigh', and 'fiftyTwoWeekLow'. Use null if a value is not available.
    - upcomingEvents: Provide 'nextEarningsDate' in 'YYYY-MM-DD' format, or null if none is scheduled soon.`;

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            currentPrice: { type: 'number', description: 'The current stock price as a float.' },
            priceHistory24h: { type: 'array', items: { type: 'number' }, description: 'An array of ~24 hourly price points for the last day. Can be an empty array if not available.' },
            newsSentiment: {
              type: 'object',
              properties: {
                sentiment: { type: 'string', enum: ['Positive', 'Neutral', 'Negative', 'N/A'], description: 'Overall news sentiment.' },
                summary: { type: 'string', description: 'A brief, one-sentence summary of the key news driving the sentiment.' }
              }
            },
            analystRatings: {
              type: 'object',
              properties: {
                recommendation: { type: 'string', description: 'Consensus recommendation (e.g., \'Strong Buy\', \'Hold\', \'N/A\').' },
                targetLow: { type: 'number', nullable: true, description: 'The low-end analyst price target.' },
                targetAverage: { type: 'number', nullable: true, description: 'The average analyst price target.' },
                targetHigh: { type: 'number', nullable: true, description: 'The high-end analyst price target.' }
              }
            },
            keyMetrics: {
              type: 'object',
              properties: {
                beta: { type: 'number', nullable: true, description: 'The stock\'s beta (volatility metric).' },
                fiftyTwoWeekHigh: { type: 'number', nullable: true, description: 'The 52-week high price.' },
                fiftyTwoWeekLow: { type: 'number', nullable: true, description: 'The 52-week low price.' }
              }
            },
            upcomingEvents: {
              type: 'object',
              properties: {
                nextEarningsDate: { type: 'string', nullable: true, description: 'The next earnings date in YYYY-MM-DD format, or null if not scheduled.' }
              }
            }
          }
        }
      },
    });

    let rawText = response.text;
    let parsedData;

    try {
      const startIndex = rawText.indexOf('{');
      const endIndex = rawText.lastIndexOf('}');
      if (startIndex > -1 && endIndex > -1 && endIndex > startIndex) {
        rawText = rawText.substring(startIndex, endIndex + 1);
      }
      parsedData = JSON.parse(rawText);
    } catch (parseError) {
      console.error(`Failed to parse JSON for ${validatedTicker}:`, parseError);
      return res.status(500).json({ error: 'Failed to parse financial data' });
    }

    res.json(parsedData);

  } catch (error) {
    console.error('Financial data API error:', error);
    
    if (error.message?.includes('Ticker must be') || error.message?.includes('Invalid ticker')) {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.message?.includes('429') || error.message?.toLowerCase().includes('quota')) {
      return res.status(429).json({ error: 'Rate limit reached. Please wait a moment.' });
    }
    
    res.status(500).json({ error: 'Failed to fetch financial data' });
  }
});

// Deep dive report endpoint
app.post('/api/deep-dive', async (req, res) => {
  try {
    const { ticker } = req.body;
    
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker is required' });
    }

    const validatedTicker = validateTicker(ticker);

    const prompt = `Generate a concise investment "deep dive" report for the company with ticker "${validatedTicker}". The report should be structured with the following sections, using markdown for formatting:

### 1. Company Overview
- A brief description of the company, its business model, and its primary revenue streams.

### 2. Financial Health
- A summary of recent performance (revenue growth, profitability, and key financial ratios like P/E, P/S).
- A comment on the company's balance sheet strength (debt levels, cash flow).

### 3. Growth Catalysts & Competitive Advantages
- What are the primary drivers for future growth? (e.g., new products, market expansion, industry trends).
- What is the company's "moat"? (e.g., brand recognition, network effects, technology).

### 4. Risks & Headwinds
- What are the main risks facing the company? (e.g., competition, regulatory changes, economic factors).

### 5. Investment Thesis Summary
- A concluding paragraph summarizing why this might be (or might not be) a compelling investment right now.`;

    const stream = await genAI.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let reportText = '';
    for await (const chunk of stream) {
      reportText += chunk.text;
    }

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
