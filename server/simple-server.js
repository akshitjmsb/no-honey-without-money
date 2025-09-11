import express from 'express';
import cors from 'cors';
import pkg from 'helmet';
const helmet = pkg.default || pkg;
import rateLimit from 'express-rate-limit';
import { GoogleGenAI } from '@google/genai';
import yahooFinanceService from './simpleYahooService.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs (increased)
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Initialize Google Gemini
const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

// Routes
app.post('/api/financial-data', async (req, res) => {
  try {
    const { ticker } = req.body;
    
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker symbol is required' });
    }

    console.log(`Fetching financial data for ${ticker}`);
    const data = await yahooFinanceService.getFinancialData(ticker);
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching financial data:', error);
    res.status(500).json({ error: 'Failed to fetch financial data' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, portfolioData } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('Processing chat message');
    
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `You are a financial advisor. The user has a portfolio with the following data: ${JSON.stringify(portfolioData)}. 
    User message: ${message}
    
    Please provide helpful financial advice based on their portfolio. Keep your response concise and actionable.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ response: text });
  } catch (error) {
    console.error('Error processing chat:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Financial data endpoint: http://localhost:${PORT}/api/financial-data`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
