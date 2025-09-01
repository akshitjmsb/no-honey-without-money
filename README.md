<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🍯 No Honey Without Money - Portfolio Rebalancing App

A sophisticated React-based portfolio management application that helps investors track, analyze, and rebalance their investment portfolios using AI-powered insights.

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

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🏗️ Project Structure

```
no-honey-without-money/
├── index.html          # Main HTML entry point
├── index.tsx           # React application component
├── index.css           # Application styles
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite build configuration
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## 🛠️ Technology Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS + Custom CSS
- **Build Tool**: Vite
- **AI Integration**: Google Gemini API
- **State Management**: React Hooks
- **Package Manager**: npm

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Your Google Gemini API key | Yes |

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
- **The `.env.local` file is already in `.gitignore`**
- **Always use environment variables for sensitive configuration**

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
