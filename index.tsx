import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Chat as GeminiChat, Type } from "@google/genai";
import './index.css';

// Type definitions
interface PortfolioItem {
    ticker: string;
    account: string;
    totalCost: number;
    numberOfShares: number;
    currency: 'USD' | 'CAD';
    dividendYield: number;
    sector: string;
}

interface AimDataItem {
    id: number;
    ticker: string;
    targetPercent: number; // e.g., 0.071 for 7.1%
    currency: 'USD' | 'CAD';
    completed: boolean;
    notes: string;
}

interface InitialAimDataRaw {
    ticker: string;
    amountCAD: number;
    currency: 'USD' | 'CAD';
    completed: boolean;
}

interface Message {
    role: 'user' | 'model';
    text: string;
}

interface Holding {
    numberOfShares: number;
    costPerShare: number;
    currency: 'USD' | 'CAD';
}

interface FinancialData {
    isLoading: boolean;
    error?: string;
    currentPrice?: number;
    priceHistory24h?: number[];
    newsSentiment?: {
        sentiment: 'Positive' | 'Neutral' | 'Negative' | 'N/A';
        summary: string;
    };
    analystRatings?: {
        recommendation: string;
        targetLow: number;
        targetAverage: number;
        targetHigh: number;
    };
    keyMetrics?: {
        beta: number;
        fiftyTwoWeekHigh: number;
        fiftyTwoWeekLow: number;
    };
    upcomingEvents?: {
        nextEarningsDate: string | null;
    };
}


// Constants from original script
const portfolioData: PortfolioItem[] = [
    { ticker: 'AMZN', account: 'TFSA', totalCost: 2962.94, numberOfShares: 16, currency: 'USD', dividendYield: 0.00, sector: 'Consumer Discretionary' },
    { ticker: 'ATD', account: 'TFSA', totalCost: 811.74, numberOfShares: 10, currency: 'CAD', dividendYield: 0.88, sector: 'Consumer Staples' },
    { ticker: 'BEP.UN', account: 'TFSA', totalCost: 2137.93, numberOfShares: 65, currency: 'CAD', dividendYield: 7.21, sector: 'Utilities' },
    { ticker: 'BLK', account: 'TFSA', totalCost: 330.28, numberOfShares: 0.42, currency: 'USD', dividendYield: 2.54, sector: 'Financials' },
    { ticker: 'BN', account: 'TFSA', totalCost: 1801.59, numberOfShares: 33, currency: 'CAD', dividendYield: 0.85, sector: 'Financials' },
    { ticker: 'CNQ', account: 'TFSA', totalCost: 1189.72, numberOfShares: 14, currency: 'CAD', dividendYield: 4.15, sector: 'Energy' },
    { ticker: 'DOO', account: 'TFSA', totalCost: 1279.81, numberOfShares: 14, currency: 'CAD', dividendYield: 0.00, sector: 'Consumer Discretionary' },
    { ticker: 'EIF', account: 'TFSA', totalCost: 929.69, numberOfShares: 28, currency: 'CAD', dividendYield: 7.45, sector: 'Industrials' },
    { ticker: 'FTS', account: 'TFSA', totalCost: 582.20, numberOfShares: 11, currency: 'CAD', dividendYield: 4.41, sector: 'Utilities' },
    { ticker: 'HD', account: 'TFSA', totalCost: 381.67, numberOfShares: 1.15, currency: 'USD', dividendYield: 2.51, sector: 'Consumer Discretionary' },
    { ticker: 'LMT', account: 'TFSA', totalCost: 1218.64, numberOfShares: 2.65, currency: 'USD', dividendYield: 2.78, sector: 'Industrials' },
    { ticker: 'POW', account: 'TFSA', totalCost: 982.76, numberOfShares: 24, currency: 'CAD', dividendYield: 5.23, sector: 'Financials' },
    { ticker: 'T', account: 'TFSA', totalCost: 1926.43, numberOfShares: 87, currency: 'CAD', dividendYield: 6.51, sector: 'Communication Services' },
    { ticker: 'VOO', account: 'TFSA', totalCost: 1267.30, numberOfShares: 2.64, currency: 'USD', dividendYield: 1.34, sector: 'ETF' },
    { ticker: 'WELL', account: 'TFSA', totalCost: 1426.46, numberOfShares: 356, currency: 'CAD', dividendYield: 0.00, sector: 'Health Care' },
    { ticker: 'ATD', account: 'FHSA', totalCost: 813.84, numberOfShares: 11, currency: 'CAD', dividendYield: 0.88, sector: 'Consumer Staples' },
    { ticker: 'BEP.UN', account: 'FHSA', totalCost: 1198.42, numberOfShares: 36, currency: 'CAD', dividendYield: 7.21, sector: 'Utilities' },
    { ticker: 'BRK.B', account: 'FHSA', totalCost: 835.54, numberOfShares: 2, currency: 'USD', dividendYield: 0.00, sector: 'Financials' },
    { ticker: 'BYD', account: 'FHSA', totalCost: 4049.48, numberOfShares: 30, currency: 'CAD', dividendYield: 1.45, sector: 'Industrials' },
    { ticker: 'CNQ', account: 'FHSA', totalCost: 1295.13, numberOfShares: 15, currency: 'CAD', dividendYield: 4.15, sector: 'Energy' },
    { ticker: 'DOO', account: 'FHSA', totalCost: 404.48, numberOfShares: 4.5, currency: 'CAD', dividendYield: 0.00, sector: 'Consumer Discretionary' },
    { ticker: 'FTS', account: 'FHSA', totalCost: 557.33, numberOfShares: 11, currency: 'CAD', dividendYield: 4.41, sector: 'Utilities' },
    { ticker: 'GOOG', account: 'FHSA', totalCost: 1671.88, numberOfShares: 9.5, currency: 'USD', dividendYield: 0.56, sector: 'Communication Services' },
    { ticker: 'GRT.UN', account: 'FHSA', totalCost: 2207.16, numberOfShares: 170, currency: 'CAD', dividendYield: 6.83, sector: 'Real Estate' },
    { ticker: 'LMT', account: 'FHSA', totalCost: 1468.23, numberOfShares: 3.2, currency: 'USD', dividendYield: 2.78, sector: 'Industrials' },
    { ticker: 'NA', account: 'FHSA', totalCost: 1115.65, numberOfShares: 10, currency: 'CAD', dividendYield: 3.89, sector: 'Financials' },
    { ticker: 'T', account: 'FHSA', totalCost: 1002.14, numberOfShares: 45, currency: 'CAD', dividendYield: 6.51, sector: 'Communication Services' },
    { ticker: 'V', account: 'FHSA', totalCost: 836.35, numberOfShares: 3, currency: 'USD', dividendYield: 0.73, sector: 'Fintech' },
    { ticker: 'WELL', account: 'FHSA', totalCost: 550.50, numberOfShares: 137, currency: 'CAD', dividendYield: 0.00, sector: 'Health Care' },
    { ticker: 'XGD', account: 'FHSA', totalCost: 509.59, numberOfShares: 25, currency: 'CAD', dividendYield: 0.00, sector: 'ETF' },
    { ticker: 'XRE', account: 'FHSA', totalCost: 536.02, numberOfShares: 33, currency: 'CAD', dividendYield: 4.88, sector: 'ETF' },
    { ticker: 'ZWT', account: 'FHSA', totalCost: 560.36, numberOfShares: 46, currency: 'CAD', dividendYield: 8.12, sector: 'ETF' },
    { ticker: 'CLOV', account: 'Trady', totalCost: 1958.38, numberOfShares: 1958, currency: 'USD', dividendYield: 0.00, sector: 'Health Care' },
    { ticker: 'CNQ', account: 'Trady', totalCost: 1125.04, numberOfShares: 13, currency: 'CAD', dividendYield: 4.15, sector: 'Energy' },
    { ticker: 'DOO', account: 'Trady', totalCost: 1579.40, numberOfShares: 17, currency: 'CAD', dividendYield: 0.00, sector: 'Consumer Discretionary' },
    { ticker: 'GOOG', account: 'Trady', totalCost: 1923.80, numberOfShares: 11, currency: 'USD', dividendYield: 0.56, sector: 'Communication Services' },
    { ticker: 'GRT.UN', account: 'Trady', totalCost: 1739.00, numberOfShares: 133, currency: 'CAD', dividendYield: 6.83, sector: 'Real Estate' },
    { ticker: 'T', account: 'Trady', totalCost: 1646.05, numberOfShares: 75, currency: 'CAD', dividendYield: 6.51, sector: 'Communication Services' },
    { ticker: 'UBER', account: 'Trady', totalCost: 638.81, numberOfShares: 9, currency: 'USD', dividendYield: 0.00, sector: 'Industrials' },
    { ticker: 'UNH', account: 'Trady', totalCost: 771.34, numberOfShares: 1.57, currency: 'USD', dividendYield: 1.51, sector: 'Health Care' }
];


const initialAimDataRaw: InitialAimDataRaw[] = [
    { ticker: 'IBIT', amountCAD: 5150.00, currency: 'USD', completed: false }, 
    { ticker: 'BRK.B', amountCAD: 4950.00, currency: 'USD', completed: false },
    { ticker: 'CSU', amountCAD: 2900.00, currency: 'CAD', completed: false }, 
    { ticker: 'IFC', amountCAD: 3500.00, currency: 'CAD', completed: false },
    { ticker: 'HD', amountCAD: 3400.00, currency: 'USD', completed: false }, 
    { ticker: 'BLK', amountCAD: 2900.00, currency: 'USD', completed: false },
    { ticker: 'AMZN', amountCAD: 3750.00, currency: 'USD', completed: false }, 
    { ticker: 'GOOGL', amountCAD: 2600.00, currency: 'USD', completed: false },
    { ticker: 'T', amountCAD: 2600.00, currency: 'CAD', completed: false }, 
    { ticker: 'V', amountCAD: 2450.00, currency: 'USD', completed: false },
    { ticker: 'SBUX', amountCAD: 2400.00, currency: 'USD', completed: false }, 
    { ticker: 'BYD', amountCAD: 2400.00, currency: 'CAD', completed: false },
    { ticker: 'ATD', amountCAD: 1650.00, currency: 'CAD', completed: false }, 
    { ticker: 'ASML', amountCAD: 2250.00, currency: 'USD', completed: false },
    { ticker: 'FTS', amountCAD: 2150.00, currency: 'CAD', completed: false }, 
    { ticker: 'BN', amountCAD: 2100.00, currency: 'CAD', completed: false },
    { ticker: 'EQB', amountCAD: 2050.00, currency: 'CAD', completed: false }, 
    { ticker: 'LMT', amountCAD: 1950.00, currency: 'USD', completed: false },
    { ticker: 'NA', amountCAD: 1950.00, currency: 'CAD', completed: false }, 
    { ticker: 'BEP.UN', amountCAD: 1800.00, currency: 'CAD', completed: false },
    { ticker: 'CP', amountCAD: 1750.00, currency: 'CAD', completed: false }, 
    { ticker: 'XGD', amountCAD: 500.00, currency: 'CAD', completed: false },
    { ticker: 'CASH', amountCAD: 15350.00, currency: 'CAD', completed: false }
];

const initialTargetInvestment = 72500;

const cashItem = initialAimDataRaw.find(item => item.ticker === 'CASH');
const initialCashBalance = cashItem ? cashItem.amountCAD : 0;
const filteredAimDataRaw = initialAimDataRaw.filter(item => item.ticker !== 'CASH');

const initialAimData: AimDataItem[] = filteredAimDataRaw.map((item, index) => ({
    id: index,
    ticker: item.ticker,
    targetPercent: initialTargetInvestment > 0 ? item.amountCAD / initialTargetInvestment : 0,
    currency: item.currency,
    completed: item.completed,
    notes: '',
}));

const cadToUsdRate = 0.73;

// Helper functions
const formatCurrency = (value: number, currency: 'CAD' | 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
const formatPercent = (value: number) => new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2 }).format(value);

const ChatComponent = ({ isOpen, onClose, aimData, holdings, displayCurrency }) => {
    if (!isOpen) return null;

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatInstance = useRef<GeminiChat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        chatInstance.current = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: `You are a helpful financial assistant. Analyze the provided portfolio data and answer questions about it. The data is about portfolio rebalancing, holdings, and targets. The user's primary display currency is ${displayCurrency}.`,
            },
        });
    }, [displayCurrency]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !chatInstance.current || isLoading) return;

        const userMessage: Message = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage, { role: 'model', text: '...' }]);
        setInput('');
        setIsLoading(true);

        try {
            let messageToSend = input;
            if (messages.length <= 1) { // Check if this is the first user message
                 messageToSend = `Here is the current portfolio data in JSON format. Please analyze it to answer my questions. \n\nTARGET DATA:\n${JSON.stringify(aimData, null, 2)}\n\nHOLDINGS DATA:\n${JSON.stringify(holdings, null, 2)}\n\nMy question is: ${input}`;
            }

            const stream = await chatInstance.current.sendMessageStream({ message: messageToSend });
            
            let modelResponse = '';
            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = modelResponse;
                    return newMessages;
                });
            }
            if (modelResponse === '') {
                 setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = "I don't have a response for that.";
                    return newMessages;
                });
            }
        } catch (error: any) {
            console.error('Gemini API error:', error);
            const errorMessage = typeof error.message === 'string' ? error.message : '';
            let friendlyMessage = 'Sorry, I encountered an error. Please try again.';
            if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota')) {
                friendlyMessage = "The API is busy at the moment. Please wait and try your question again shortly.";
            }
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].text = friendlyMessage;
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="chat-window">
            <div className="chat-header">
                <h3 className="font-bold">Ask Gemini</h3>
                <button onClick={onClose} className="chat-close-btn">&times;</button>
            </div>
            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.role}`}>
                        <p>{msg.text}</p>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="chat-input-form">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about your portfolio..."
                    disabled={isLoading}
                    className="chat-input"
                />
                <button type="submit" disabled={isLoading} className="chat-send-btn">
                    Send
                </button>
            </form>
        </div>
    );
};


const App = () => {
    const [aimData, setAimData] = useState<AimDataItem[]>(initialAimData);
    const [targetDate, setTargetDate] = useState('2025-12-31');
    const [targetInvestment, setTargetInvestment] = useState(initialTargetInvestment);
    const [cashBalance, setCashBalance] = useState(initialCashBalance);
    const [displayCurrency, setDisplayCurrency] = useState<'CAD' | 'USD'>('CAD');
    const [title, setTitle] = useState('No Honey without Money');
    const [isChatOpen, setIsChatOpen] = useState(false);
    
    // State for Deep Dive feature
    const [deepDiveTicker, setDeepDiveTicker] = useState('');
    const [isDeepDiveModalOpen, setIsDeepDiveModalOpen] = useState(false);
    const [deepDiveReport, setDeepDiveReport] = useState('');
    const [isDeepDiveLoading, setIsDeepDiveLoading] = useState(false);
    
    // State for Card Deck
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const isDragging = useRef(false);
    const dragStartX = useRef(0);
    const dragDeltaX = useRef(0);
    const [editingField, setEditingField] = useState<{ id: number | string; field: 'ticker' | 'targetPercent' | 'numberOfShares' | 'costPerShare' | 'notes' } | null>(null);

    // State for new financial data
    const [financialData, setFinancialData] = useState<{ [key: string]: FinancialData }>({});
    const [whatIfPrices, setWhatIfPrices] = useState<{ [key: string]: string }>({});
    const refreshIntervalRef = useRef<number | null>(null);
    const debounceTimerRef = useRef<number | null>(null);


    const [holdings, setHoldings] = useState<{ [key: string]: Holding }>(() => {
        const aggregated: { [key: string]: { totalCost: number; numberOfShares: number; currency: 'USD' | 'CAD' } } = {};
        portfolioData.forEach(item => {
            if (!aggregated[item.ticker]) {
                aggregated[item.ticker] = { totalCost: 0, numberOfShares: 0, currency: item.currency };
            }
            aggregated[item.ticker].totalCost += item.totalCost;
            aggregated[item.ticker].numberOfShares += item.numberOfShares;
        });

        const finalHoldings: { [key: string]: Holding } = {};
        for (const ticker in aggregated) {
            const item = aggregated[ticker];
            finalHoldings[ticker] = {
                numberOfShares: item.numberOfShares,
                costPerShare: item.numberOfShares > 0 ? item.totalCost / item.numberOfShares : 0,
                currency: item.currency
            };
        }
        return finalHoldings;
    });

    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY }), []);

    const allCards = useMemo(() => [{ isSummary: true, id: 'summary-card' }, ...aimData], [aimData]);
    
    const financialDataSchema = {
        type: Type.OBJECT,
        properties: {
            currentPrice: { type: Type.NUMBER, description: "The current stock price as a float." },
            priceHistory24h: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "An array of ~24 hourly price points for the last day. Can be an empty array if not available." },
            newsSentiment: {
                type: Type.OBJECT,
                properties: {
                    sentiment: { type: Type.STRING, enum: ['Positive', 'Neutral', 'Negative', 'N/A'], description: "Overall news sentiment." },
                    summary: { type: Type.STRING, description: "A brief, one-sentence summary of the key news driving the sentiment." }
                }
            },
            analystRatings: {
                type: Type.OBJECT,
                properties: {
                    recommendation: { type: Type.STRING, description: "Consensus recommendation (e.g., 'Strong Buy', 'Hold', 'N/A')." },
                    targetLow: { type: Type.NUMBER, nullable: true, description: "The low-end analyst price target." },
                    targetAverage: { type: Type.NUMBER, nullable: true, description: "The average analyst price target." },
                    targetHigh: { type: Type.NUMBER, nullable: true, description: "The high-end analyst price target." }
                }
            },
            keyMetrics: {
                type: Type.OBJECT,
                properties: {
                    beta: { type: Type.NUMBER, nullable: true, description: "The stock's beta (volatility metric)." },
                    fiftyTwoWeekHigh: { type: Type.NUMBER, nullable: true, description: "The 52-week high price." },
                    fiftyTwoWeekLow: { type: Type.NUMBER, nullable: true, description: "The 52-week low price." }
                }
            },
            upcomingEvents: {
                type: Type.OBJECT,
                properties: {
                    nextEarningsDate: { type: Type.STRING, nullable: true, description: "The next earnings date in YYYY-MM-DD format, or null if not scheduled." }
                }
            }
        }
    };
    
    const fetchFinancialData = useCallback(async (ticker: string) => {
        if (!ticker || financialData[ticker]?.isLoading) {
            return;
        }
    
        setFinancialData(prev => ({
            ...prev,
            [ticker]: {
                ...prev[ticker],
                isLoading: true,
                error: undefined,
            }
        }));
    
        const prompt = `Provide the following real-time financial data for the stock ticker "${ticker}" in a single, minified JSON object. Do not include any markdown formatting or explanations, only the raw JSON.
        - currentPrice: The most recent trading price.
        - priceHistory24h: An array of ~24 hourly price points for the last 24 hours. If unavailable, provide an empty array.
        - newsSentiment: Analyze recent news headlines and provide a 'sentiment' ('Positive', 'Neutral', 'Negative', 'N/A') and a brief 'summary'.
        - analystRatings: Provide 'recommendation', and 'targetLow', 'targetAverage', 'targetHigh'. Use null if a value is not available.
        - keyMetrics: Provide 'beta', 'fiftyTwoWeekHigh', and 'fiftyTwoWeekLow'. Use null if a value is not available.
        - upcomingEvents: Provide 'nextEarningsDate' in 'YYYY-MM-DD' format, or null if none is scheduled soon.`;
        
        const MAX_RETRIES = 3;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: { responseMimeType: "application/json", responseSchema: financialDataSchema },
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
                    console.error(`Failed to parse JSON for ${ticker} on attempt ${attempt}:\n`, parseError, "\nRaw response:\n", response.text);
                    if (attempt === MAX_RETRIES) throw new Error('Failed to parse financial data after multiple attempts.');
                    continue;
                }
    
                setFinancialData(prev => ({ ...prev, [ticker]: { isLoading: false, ...parsedData } }));
                return;
    
            } catch (fetchError: any) {
                console.error(`Failed to fetch financial data for ${ticker} on attempt ${attempt}:\n`, fetchError);
                
                const errorMessage = typeof fetchError.message === 'string' ? fetchError.message : '';
                if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota')) {
                     setFinancialData(prev => ({ ...prev, [ticker]: { ...prev[ticker], isLoading: false, error: 'Rate limit reached. Please wait a moment.' } }));
                     break;
                }

                if (attempt === MAX_RETRIES) {
                    setFinancialData(prev => ({ ...prev, [ticker]: { ...prev[ticker], isLoading: false, error: 'API request failed. Please try again.' } }));
                }
                await new Promise(res => setTimeout(res, 1000 * attempt)); 
            }
        }
    }, [ai, financialData, financialDataSchema]);


    const generateDeepDiveReport = useCallback(async (ticker: string) => {
        if (!ticker) return;
        
        setIsDeepDiveLoading(true);
        setDeepDiveReport('');
        setDeepDiveTicker(ticker);
        setIsDeepDiveModalOpen(true);

        const prompt = `Generate a concise investment "deep dive" report for the company with ticker "${ticker}". The report should be structured with the following sections, using markdown for formatting:

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

        try {
            const stream = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            let reportText = '';
            for await (const chunk of stream) {
                reportText += chunk.text;
                setDeepDiveReport(reportText);
            }
        } catch (error: any) {
            console.error("Deep Dive Generation Error:", error);
            const errorMessage = typeof error.message === 'string' ? error.message : '';
            if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota')) {
                setDeepDiveReport("The API is busy right now. Please try again in a few moments.");
            } else {
                setDeepDiveReport("Sorry, I was unable to generate the report. Please try again.");
            }
        } finally {
            setIsDeepDiveLoading(false);
        }
    }, [ai]);

    const totalPortfolioValue = useMemo(() => {
        let totalValue = 0;
        aimData.forEach(item => {
            const price = parseFloat(String(whatIfPrices[item.ticker] || financialData[item.ticker]?.currentPrice || '0')) || 0;
            const holding = holdings[item.ticker] || { numberOfShares: 0, currency: item.currency };
            let value = holding.numberOfShares * price;
            if (holding.currency === 'USD' && displayCurrency === 'CAD') {
                value /= cadToUsdRate;
            } else if (holding.currency === 'CAD' && displayCurrency === 'USD') {
                value *= cadToUsdRate;
            }
            totalValue += value;
        });
        const cashInDisplayCurrency = displayCurrency === 'USD' ? cashBalance * cadToUsdRate : cashBalance;
        return totalValue + cashInDisplayCurrency;
    }, [holdings, financialData, whatIfPrices, cashBalance, displayCurrency, aimData]);

    const daysLeft = useMemo(() => {
        const diff = new Date(targetDate).getTime() - new Date().getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }, [targetDate]);

    const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
    const investmentNeeded = targetInvestment - totalPortfolioValue;
    const weeklyInvestment = investmentNeeded > 0 ? investmentNeeded / weeksLeft : 0;
    
    const handleUpdateAimData = (id: number, field: keyof AimDataItem, value: any) => {
        setAimData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleUpdateHolding = (ticker: string, field: keyof Holding, value: any) => {
        setHoldings(prev => ({
            ...prev,
            [ticker]: {
                ...prev[ticker],
                [field]: value,
            }
        }));
    };

    const handleSwipe = (direction: 'left' | 'right') => {
        if (direction === 'right') {
            setCurrentCardIndex(prev => Math.max(0, prev - 1));
        } else {
            setCurrentCardIndex(prev => Math.min(allCards.length - 1, prev + 1));
        }
    };
    
    const startDrag = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        isDragging.current = true;
        dragStartX.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
        e.currentTarget.classList.add('is-dragging');
    };

    const onDrag = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        if (!isDragging.current) return;
        const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        dragDeltaX.current = currentX - dragStartX.current;
        const card = e.currentTarget;
        card.style.transform = `translateX(${dragDeltaX.current}px) rotate(${dragDeltaX.current / 20}deg)`;
    };

    const endDrag = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        e.currentTarget.classList.remove('is-dragging');

        if (Math.abs(dragDeltaX.current) > 100) { // Swipe threshold
            handleSwipe(dragDeltaX.current < 0 ? 'left' : 'right');
        } else { // Reset card position
            e.currentTarget.style.transform = '';
        }
        dragDeltaX.current = 0;
    };
    
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

    const handleUpdateField = (id: number, field: 'ticker' | 'targetPercent', value: string) => {
         if (field === 'targetPercent') {
            const numericValue = parseFloat(value) / 100;
            if (!isNaN(numericValue)) {
                handleUpdateAimData(id, 'targetPercent', numericValue);
            }
        } else {
             handleUpdateAimData(id, 'ticker', value.toUpperCase());
        }
    };
    
    const handleUpdateSharesCost = (ticker: string, field: 'numberOfShares' | 'costPerShare', value: string) => {
        const numericValue = parseFloat(value);
        if (!isNaN(numericValue)) {
            handleUpdateHolding(ticker, field, numericValue);
        }
    };

    const handleBlur = () => {
        setEditingField(null);
    };

    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
        }
    
        debounceTimerRef.current = window.setTimeout(() => {
            const currentCard = allCards[currentCardIndex];
            const ticker = currentCard && !('isSummary' in currentCard) ? (currentCard as AimDataItem).ticker : undefined;
        
            if (ticker) {
                fetchFinancialData(ticker);
        
                refreshIntervalRef.current = window.setInterval(() => {
                    fetchFinancialData(ticker);
                }, 120000); // 120 seconds
            }
        }, 500); // Debounce for 500ms
    
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [currentCardIndex, allCards, fetchFinancialData]);

    const renderEditableField = (item, field: 'ticker' | 'targetPercent') => {
        const isEditing = editingField?.id === item.id && editingField?.field === field;

        if (isEditing) {
            return (
                <input
                    type={field === 'targetPercent' ? 'number' : 'text'}
                    defaultValue={field === 'targetPercent' ? (item.targetPercent * 100).toFixed(2) : item.ticker}
                    onBlur={handleBlur}
                    onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
                    onChange={(e) => handleUpdateField(item.id, field, e.target.value)}
                    onFocus={handleFocus}
                    autoFocus
                    className={field === 'ticker' ? "ticker-input-card" : "card-value-input"}
                />
            );
        }

        return (
            <span onClick={() => setEditingField({ id: item.id, field })} className="editable-field">
                {field === 'targetPercent' ? formatPercent(item.targetPercent) : item.ticker}
            </span>
        );
    };
    
    const renderEditableHoldingField = (holding, ticker, field: 'numberOfShares' | 'costPerShare') => {
        const item = aimData.find(d => d.ticker === ticker);
        const isEditing = item && editingField?.id === item.id && editingField?.field === field;

        if (isEditing) {
            return (
                 <input
                    type="number"
                    defaultValue={holding[field]?.toFixed(2) || '0.00'}
                    onBlur={handleBlur}
                    onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
                    onChange={(e) => handleUpdateSharesCost(ticker, field, e.target.value)}
                    onFocus={handleFocus}
                    autoFocus
                    className="card-value-input"
                />
            );
        }
        
        return (
            <span onClick={() => item && setEditingField({ id: item.id, field })} className="editable-field">
               {field === 'costPerShare' ? formatCurrency(holding[field] || 0, holding.currency || 'CAD') : (holding[field] || 0)?.toLocaleString()}
            </span>
        )
    };
    
    const renderEditableNotes = (item) => {
        const isEditing = editingField?.id === item.id && editingField.field === 'notes';
        if (isEditing) {
            return (
                <textarea
                    defaultValue={item.notes}
                    onBlur={(e) => {
                        handleUpdateAimData(item.id, 'notes', e.target.value);
                        handleBlur();
                    }}
                    autoFocus
                    className="notes-textarea"
                />
            );
        }
        return (
            <div onClick={() => setEditingField({ id: item.id, field: 'notes' })} className="notes-text">
                {item.notes || 'Click to add notes...'}
            </div>
        );
    };
    
    const DeepDiveModal = () => {
        if (!isDeepDiveModalOpen) return null;

        return (
            <div className="modal-overlay" onClick={() => setIsDeepDiveModalOpen(false)}>
                <div className="deep-dive-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="deep-dive-modal-header">
                        <h2 className="text-xl font-bold">Deep Dive: {deepDiveTicker}</h2>
                        <button onClick={() => setIsDeepDiveModalOpen(false)} className="text-2xl font-bold">&times;</button>
                    </div>
                    <div className="deep-dive-report-content">
                        {isDeepDiveLoading && !deepDiveReport ? (
                             <div className="spinner-container">
                                <div className="spinner"></div>
                                <p className="mt-4 text-subtle">Generating Report...</p>
                            </div>
                        ) : (
                            <div dangerouslySetInnerHTML={{ __html: deepDiveReport.replace(/\n/g, '<br />') }} />
                        )}
                    </div>
                </div>
            </div>
        );
    };
    
    const Sparkline = ({ data, width = 100, height = 30, stroke = "#263238" }) => {
        if (!data || data.length < 2) {
            return <div className="sparkline-container-empty" style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="text-xs text-subtle">No Data</span></div>;
        }

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min;

        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((d - min) / (range || 1)) * height;
            return `${x},${y}`;
        }).join(' ');

        return (
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="sparkline-svg">
                <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.5" />
            </svg>
        );
    };
    
    const RangeBar = ({ low, high, current, average = null, width = 100 }) => {
        if (low == null || high == null || current == null) return <div className="text-xs text-subtle">N/A</div>;
        
        const range = high - low;
        const currentPosition = range > 0 ? ((current - low) / range) * 100 : 50;
        const avgPosition = average != null && range > 0 ? ((average - low) / range) * 100 : null;

        return (
            <div className="range-bar-container" style={{ width }}>
                <div className="range-bar-labels">
                    <span>{low.toFixed(2)}</span>
                    <span>{high.toFixed(2)}</span>
                </div>
                <div className="range-bar-track">
                    <div className="range-bar-marker" style={{ left: `calc(${Math.max(0, Math.min(100, currentPosition))}% - 5px)` }}></div>
                    {avgPosition != null && <div className="range-bar-avg-marker" style={{ left: `${Math.max(0, Math.min(100, avgPosition))}%`}}></div>}
                </div>
            </div>
        );
    };

    return (
        <div className="a4-page">
            <header className="mb-8 pb-4 border-b border-color">
                <div className="flex justify-between items-center mb-4">
                     <div className="logo-title-container">
                        <svg className="header-logo" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                        </svg>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-2xl font-bold title-input text-main"
                        />
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-subtle text-sm">Display:</span>
                         <div className="bg-gray-100 p-1 rounded-md">
                            <button onClick={() => setDisplayCurrency('CAD')} className={`currency-toggle text-sm ${displayCurrency === 'CAD' ? 'active' : ''}`}>CAD</button>
                            <button onClick={() => setDisplayCurrency('USD')} className={`currency-toggle text-sm ${displayCurrency === 'USD' ? 'active' : ''}`}>USD</button>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <label className="block text-subtle">Target Date</label>
                        <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="font-semibold header-input w-full"/>
                    </div>
                    <div>
                        <label className="block text-subtle">Target Investment</label>
                        {/* FIX: Explicitly parse input value to float to fix type error */}
                        <input type="number" value={targetInvestment} onChange={(e) => setTargetInvestment(parseFloat(e.target.value) || 0)} className="font-semibold header-input w-full"/>
                    </div>
                    <div>
                        <label className="block text-subtle">Current Portfolio Value</label>
                        <p className="font-semibold">{formatCurrency(totalPortfolioValue, displayCurrency)}</p>
                    </div>
                    <div>
                        <label className="block text-subtle">Cash Balance</label>
                         {/* FIX: Explicitly parse input value to float to fix type error */}
                         <input type="number" value={cashBalance} onChange={(e) => setCashBalance(parseFloat(e.target.value) || 0)} className="font-semibold header-input w-full"/>
                    </div>
                </div>
            </header>

            <main>
                <div className="card-deck-container">
                    <div className="card-stack">
                        {allCards.map((card, index) => {
                            if (index < currentCardIndex) return null;
                            const isCurrent = index === currentCardIndex;
                            
                            const cardStyle = {
                                transform: isCurrent ? `translateX(${dragDeltaX.current}px) rotate(${dragDeltaX.current / 20}deg)` : `translateY(${(index - currentCardIndex) * -10}px) scale(${1 - (index - currentCardIndex) * 0.05})`,
                                zIndex: allCards.length - index,
                                opacity: index > currentCardIndex + 2 ? 0 : 1
                            };
                            
                             const dragHandlers = {
                                onMouseDown: isCurrent ? startDrag : undefined,
                                onMouseMove: isCurrent ? onDrag : undefined,
                                onMouseUp: isCurrent ? endDrag : undefined,
                                onMouseLeave: isCurrent ? endDrag : undefined,
                                onTouchStart: isCurrent ? startDrag : undefined,
                                onTouchMove: isCurrent ? onDrag : undefined,
                                onTouchEnd: isCurrent ? endDrag : undefined,
                            };

                            if ('isSummary' in card) {
                                const totalAllocation = aimData.reduce((sum, item) => sum + item.targetPercent, 0);

                                return (
                                    <div key={card.id} className={`portfolio-card ${isCurrent ? 'is-front' : ''}`} style={cardStyle} {...dragHandlers}>
                                        <div className="card-header">
                                            <h2 className="card-ticker">Portfolio Summary</h2>
                                        </div>
                                        <div className="card-body summary-card-body">
                                            <div className="summary-table-header">
                                                <span>Ticker</span>
                                                <span>Target %</span>
                                            </div>
                                            <div className="summary-table-content">
                                                {aimData.map(item => (
                                                    <div key={item.id} className="summary-table-row">
                                                        <span>{item.ticker}</span>
                                                        <span>{formatPercent(item.targetPercent)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="summary-card-footer">
                                            <div className="summary-table-row is-total">
                                                <span>Total Allocation</span>
                                                <span className={Math.abs(totalAllocation - 1) < 0.0001 ? 'buy-color' : 'sell-color'}>
                                                    {formatPercent(totalAllocation)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            const item = card as AimDataItem;
                            const holding = holdings[item.ticker] || { numberOfShares: 0, costPerShare: 0, currency: item.currency };
                            const price = parseFloat(String(whatIfPrices[item.ticker] || financialData[item.ticker]?.currentPrice || '0')) || 0;
                            
                            let currentMarketValue = holding.numberOfShares * price;
                            let targetAmount = targetInvestment * item.targetPercent;

                            if (displayCurrency === 'CAD') {
                                if (item.currency === 'USD') targetAmount /= cadToUsdRate;
                                if (holding.currency === 'USD') currentMarketValue /= cadToUsdRate;
                            } else { // displayCurrency is USD
                                if (item.currency === 'CAD') targetAmount *= cadToUsdRate;
                                if (holding.currency === 'CAD') currentMarketValue *= cadToUsdRate;
                            }

                            const amountToInvest = targetAmount - currentMarketValue;
                            const progress = targetAmount > 0 ? (currentMarketValue / targetAmount) * 100 : 0;
                            const data = financialData[item.ticker] || { isLoading: true };
                            const sentiment = data.newsSentiment?.sentiment?.toLowerCase() || 'neutral';
                            
                            return (
                                <div
                                    key={item.id}
                                    className={`portfolio-card ${isCurrent ? 'is-front' : ''} ${item.completed ? 'is-completed' : ''}`}
                                    style={cardStyle}
                                    {...dragHandlers}
                                >
                                     <div className="card-header">
                                        <div>
                                            <h2 className="card-ticker">{renderEditableField(item, 'ticker')}</h2>
                                            <p className="card-type">{item.currency}</p>
                                        </div>
                                        <div className="card-header-actions">
                                            {data.newsSentiment && (
                                                <span className={`sentiment-badge ${sentiment}`}>
                                                    {data.newsSentiment.sentiment}
                                                </span>
                                            )}
                                            <label className="completed-toggle">
                                                <input type="checkbox" checked={item.completed} onChange={(e) => handleUpdateAimData(item.id, 'completed', e.target.checked)} />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                    </div>
                                    
                                     {item.completed && <div className="completed-badge-overlay">COMPLETED</div>}
                                     
                                    <div className="progress-bar-container">
                                        <div className="progress-bar" style={{ width: `${Math.min(100, progress)}%` }}></div>
                                    </div>

                                    <div className="card-body">
                                        {data.isLoading && !data.currentPrice && <div className="card-row"><span className="price-spinner"></span><span className="ml-2 text-subtle">Loading market data...</span></div>}
                                        {data.error && <div className="card-row"><span className="text-sm text-red-500">{data.error}</span></div>}

                                        <div className="card-row">
                                            <span className="card-label">Current Price</span>
                                            <span className="card-value">{data.currentPrice ? formatCurrency(data.currentPrice, item.currency) : 'N/A'}</span>
                                        </div>

                                        <div className="card-row">
                                            <span className="card-label">24h Trend</span>
                                            <div>
                                                <Sparkline data={data.priceHistory24h} width={120} height={30} />
                                            </div>
                                        </div>
                                        <hr className="my-3 border-color" />
                                        <div className="card-row">
                                            <span className="card-label">Target %</span>
                                            <span className="card-value">{renderEditableField(item, 'targetPercent')}</span>
                                        </div>
                                        <div className="card-row">
                                            <span className="card-label">Target Amount</span>
                                            <span className="card-value-small">{formatCurrency(targetAmount, displayCurrency)}</span>
                                        </div>
                                         <div className="card-row">
                                            <span className="card-label">Market Value</span>
                                            <span className="card-value-small">{formatCurrency(currentMarketValue, displayCurrency)}</span>
                                        </div>
                                        <div className="card-row">
                                            <span className="card-label font-bold">Invest/Divest</span>
                                            <span className={`card-value font-bold ${amountToInvest >= 0 ? 'buy-color' : 'sell-color'}`}>
                                                {formatCurrency(amountToInvest, displayCurrency)}
                                            </span>
                                        </div>
                                        <hr className="my-3 border-color" />
                                        <div className="card-row">
                                            <span className="card-label">Shares Held</span>
                                            <span className="card-value">{renderEditableHoldingField(holding, item.ticker, 'numberOfShares')}</span>
                                        </div>
                                        <div className="card-row">
                                            <span className="card-label">Avg Cost/Share</span>
                                            <span className="card-value">{renderEditableHoldingField(holding, item.ticker, 'costPerShare')}</span>
                                        </div>
                                         <hr className="my-3 border-color" />
                                        <div className="card-row-vertical">
                                            <span className="card-label mb-1">52-Week Range</span>
                                            <RangeBar low={data.keyMetrics?.fiftyTwoWeekLow} high={data.keyMetrics?.fiftyTwoWeekHigh} current={data.currentPrice} average={null} width="100%" />
                                        </div>
                                         <div className="card-row-vertical">
                                            <span className="card-label mb-1">Analyst Target</span>
                                            <RangeBar low={data.analystRatings?.targetLow} high={data.analystRatings?.targetHigh} current={data.currentPrice} average={data.analystRatings?.targetAverage} width="100%" />
                                        </div>
                                        <div className="card-row">
                                            <span className="card-label">Analyst Rating</span>
                                            <span className="card-value-small">{data.analystRatings?.recommendation || 'N/A'}</span>
                                        </div>
                                         <hr className="my-3 border-color" />
                                        <div className="card-row">
                                            <span className="card-label">Volatility (Beta)</span>
                                            <span className="card-value-small">{data.keyMetrics?.beta?.toFixed(2) || 'N/A'}</span>
                                        </div>
                                        <div className="card-row">
                                            <span className="card-label">Next Earnings</span>
                                            <span className="card-value-small">{data.upcomingEvents?.nextEarningsDate || 'N/A'}</span>
                                        </div>
                                        <hr className="my-3 border-color" />
                                        <div className="notes-section">
                                            <h4 className="card-label mb-1">Notes</h4>
                                             {renderEditableNotes(item)}
                                        </div>

                                    </div>
                                    <div className="card-footer">
                                         <button onClick={() => generateDeepDiveReport(item.ticker)} className="card-deep-dive-btn" disabled={isDeepDiveLoading && deepDiveTicker === item.ticker}>
                                            {isDeepDiveLoading && deepDiveTicker === item.ticker ? <div className="button-spinner"></div> : 'Deep Dive'}
                                         </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                 <div className="card-navigation">
                    <button onClick={() => handleSwipe('right')} disabled={currentCardIndex === 0} className="card-nav-button">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                    </button>
                    <span className="text-sm text-subtle">{currentCardIndex + 1} / {allCards.length}</span>
                    <button onClick={() => handleSwipe('left')} disabled={currentCardIndex === allCards.length - 1} className="card-nav-button">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                    </button>
                </div>
            </main>
            <DeepDiveModal />
             <button onClick={() => setIsChatOpen(true)} className="chat-fab">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>
            </button>
            <ChatComponent isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} aimData={aimData} holdings={holdings} displayCurrency={displayCurrency} />
        </div>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);