<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🍯 No Honey Without Money - Portfolio Rebalancing App

A sophisticated React-based portfolio management application that helps investors track, analyze, and rebalance their investment portfolios using AI-powered insights.

## 🚀 Recent Updates

- ✅ Dependencies updated and optimized (Vite 6.3.6, server dependencies)
- ✅ GitHub Actions workflows fixed and stable
- ✅ CI/CD pipeline fully functional
- ✅ All tests passing
- ✅ ESLint configuration fixed and working

## ✨ Features

- **📊 Portfolio Management**: Track holdings across multiple accounts (TFSA, FHSA, trading)
- **🎯 Rebalancing Tools**: Set target allocations and track progress toward goals
- **🤖 AI-Powered Analysis**: Deep dive reports and portfolio insights using Google Gemini
- **💬 Smart Chat Assistant**: Ask questions about your portfolio and get AI-powered answers
- **📱 Responsive Design**: Beautiful card-based interface with swipe navigation
- **💰 Multi-Currency Support**: CAD/USD with automatic conversion
- **📈 Real-Time Data**: Live stock prices, trends, and financial metrics
- **📝 Editable Fields**: In-place editing for portfolio adjustments

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/no-honey-without-money.git
   cd no-honey-without-money
   ```

2. **Install all dependencies (frontend + backend)**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   
   **Backend (Required):**
   ```bash
   cp server/env.example server/.env
   # Edit server/.env and add your API key:
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   
   **Frontend (Optional):**
   ```bash
   cp env.template .env.local
   # Edit .env.local if you want to change the API URL
   ```

4. **Run the full application**
   ```bash
   npm run dev:full
   ```

5. **Open your browser**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3001`

## 🔧 Available Scripts

### Frontend
- `npm run dev` - Start frontend development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

### Backend
- `npm run server:dev` - Start backend in development mode
- `npm run server:start` - Start backend in production mode

### Full Stack
- `npm run dev:full` - Start both frontend and backend
- `npm run install:all` - Install all dependencies

## 🏗️ Project Structure

```
no-honey-without-money/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API client
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript types
│   ├── data/              # Static data
│   └── App.tsx            # Main application
├── server/                # Backend server
│   ├── index.js           # Express server
│   ├── package.json       # Backend dependencies
│   └── env.example        # Environment template
├── index.html             # Main HTML entry point
├── index.tsx              # React entry point
├── index.css              # Application styles
├── package.json           # Frontend dependencies
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite build configuration
├── SECURITY_SETUP.md      # Security setup guide
└── README.md              # This file
```

## 🛠️ Technology Stack

- **Frontend**: React 19 + TypeScript
- **Backend**: Express.js + Node.js
- **Styling**: Tailwind CSS + Custom CSS
- **Build Tool**: Vite
- **AI Integration**: Google Gemini API (via secure backend)
- **State Management**: React Hooks
- **Testing**: Vitest + React Testing Library
- **Package Manager**: npm

## 🔐 Environment Variables

### Backend (Server)
| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Your Google Gemini API key | Yes |
| `PORT` | Server port (default: 3001) | No |

### Frontend
| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL (default: http://localhost:3001) | No |

> **🔒 Security Note**: API keys are now stored securely on the backend server and never exposed to the frontend.

## 📱 Features in Detail

### Portfolio Cards
- Individual stock information with real-time data
- Progress bars showing allocation targets
- Editable fields for portfolio adjustments
- News sentiment indicators
- 24-hour price trend sparklines

### AI Chat Assistant
- Ask questions about your portfolio
- Get insights on allocation strategies
- Understand market trends and analysis

### Deep Dive Reports
- Comprehensive company analysis
- Financial health assessment
- Growth catalysts and risks
- Investment thesis summaries

### Summary Dashboard
- Overview of all target allocations
- Total portfolio allocation tracking
- Quick navigation between holdings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Important Notes

- **Never commit your API keys or environment files**
- **The `.env` and `.env.local` files are already in `.gitignore`**
- **API keys are now stored securely on the backend server**
- **See [SECURITY_SETUP.md](SECURITY_SETUP.md) for detailed security information**

## 🆘 Support

If you encounter any issues:
1. Check that your environment variables are set correctly
2. Ensure you have a valid Gemini API key
3. Check the browser console for error messages
4. Open an issue on GitHub with detailed information

## 🔮 Roadmap

- [ ] Portfolio performance analytics
- [ ] Export functionality for tax reporting
- [ ] Mobile app version
- [ ] Additional AI models support
- [ ] Social sharing features
- [ ] Advanced charting and technical analysis

---

**Disclaimer**: This application is for educational and personal use. Always consult with financial professionals before making investment decisions.
