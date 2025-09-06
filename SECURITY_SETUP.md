# 🔒 Security Setup Guide

This guide explains how to set up the application with proper security measures to protect your API keys.

## 🎯 Overview

The application has been refactored to use a secure backend architecture where:
- **Frontend**: No longer contains API keys
- **Backend**: Securely handles all API calls to Google Gemini
- **Communication**: Frontend and backend communicate via REST API

## 🏗️ Architecture

```
┌─────────────────┐    HTTP Requests    ┌─────────────────┐    API Calls    ┌─────────────────┐
│                 │ ──────────────────► │                 │ ──────────────► │                 │
│   Frontend      │                     │   Backend       │                 │  Google Gemini  │
│   (React App)   │ ◄────────────────── │   (Express)     │ ◄────────────── │      API        │
│                 │    JSON Responses   │                 │   API Key Here  │                 │
└─────────────────┘                     └─────────────────┘                 └─────────────────┘
```

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
# Install all dependencies (frontend + backend)
npm run install:all
```

### 2. Set Up Environment Variables

#### Backend Environment (Server)
```bash
# Copy the example file
cp server/env.example server/.env

# Edit server/.env and add your API key
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=3001
```

#### Frontend Environment (Optional)
```bash
# Copy the example file
cp env.template .env.local

# Edit .env.local if you want to change the API URL
VITE_API_URL=http://localhost:3001
```

### 3. Start the Application

#### Option A: Start Both Frontend and Backend
```bash
npm run dev:full
```

#### Option B: Start Separately
```bash
# Terminal 1: Start backend
npm run server:dev

# Terminal 2: Start frontend
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🔧 Development Commands

### Frontend Commands
```bash
npm run dev              # Start frontend development server
npm run build            # Build frontend for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm run test             # Run tests
```

### Backend Commands
```bash
npm run server:dev       # Start backend in development mode
npm run server:start     # Start backend in production mode
```

### Full Stack Commands
```bash
npm run dev:full         # Start both frontend and backend
npm run install:all      # Install all dependencies
```

## 🛡️ Security Features

### ✅ What's Now Secure

1. **API Key Protection**
   - API key is only stored on the backend server
   - Frontend never has access to the API key
   - Environment variables are properly managed

2. **Input Validation**
   - All user inputs are validated on both frontend and backend
   - XSS protection through input sanitization
   - Rate limiting to prevent abuse

3. **Error Handling**
   - Secure error messages that don't leak sensitive information
   - Proper HTTP status codes
   - Graceful degradation

4. **CORS Configuration**
   - Backend configured with proper CORS settings
   - Only allows requests from the frontend domain

### 🔍 Security Checklist

- [ ] API key is stored in `server/.env` (not committed to git)
- [ ] Frontend `.env.local` doesn't contain API keys
- [ ] Backend is running on a secure port
- [ ] CORS is properly configured
- [ ] Input validation is enabled
- [ ] Error messages don't leak sensitive data

## 🚀 Production Deployment

### Backend Deployment

1. **Set Environment Variables**
   ```bash
   export GEMINI_API_KEY=your_production_api_key
   export PORT=3001
   export NODE_ENV=production
   ```

2. **Start the Server**
   ```bash
   cd server
   npm install --production
   npm start
   ```

### Frontend Deployment

1. **Update API URL**
   ```bash
   # In .env.local or build environment
   VITE_API_URL=https://your-backend-domain.com
   ```

2. **Build and Deploy**
   ```bash
   npm run build
   # Deploy the dist/ folder to your hosting service
   ```

## 🔧 API Endpoints

The backend provides the following secure endpoints:

### Health Check
```
GET /health
```

### Financial Data
```
POST /api/financial-data
Body: { "ticker": "AAPL" }
```

### Deep Dive Report
```
POST /api/deep-dive
Body: { "ticker": "AAPL" }
```

### Chat
```
POST /api/chat
Body: {
  "message": "What's my portfolio performance?",
  "portfolioData": { "aimData": [...], "holdings": {...} },
  "displayCurrency": "CAD"
}
```

## 🐛 Troubleshooting

### Common Issues

1. **"API key not found" error**
   - Check that `server/.env` exists and contains `GEMINI_API_KEY`
   - Verify the API key is valid

2. **CORS errors**
   - Ensure the backend is running on the correct port
   - Check that `VITE_API_URL` matches the backend URL

3. **Connection refused**
   - Make sure the backend server is running
   - Check the port configuration

4. **Rate limit errors**
   - The application now handles rate limits gracefully
   - Wait a moment and try again

### Debug Mode

Enable debug logging by setting:
```bash
export DEBUG=portfolio:*
```

## 📚 Additional Resources

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [React Security Guidelines](https://reactjs.org/docs/security.html)

## 🆘 Support

If you encounter any issues:

1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure both frontend and backend are running
4. Check the network tab for API call failures

The application is now much more secure and follows industry best practices for API key management!
