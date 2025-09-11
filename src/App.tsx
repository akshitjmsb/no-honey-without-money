import React, { useState, useMemo, useRef, useCallback } from 'react';
import { PortfolioCard } from './components/PortfolioCard';
import { SummaryCard } from './components/SummaryCard';
import { ChatComponent } from './components/ChatComponent';
import { DeepDiveModal } from './components/DeepDiveModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PortfolioErrorBoundary } from './components/PortfolioErrorBoundary';
import { ChatErrorBoundary } from './components/ChatErrorBoundary';
import { HeaderControls } from './components/HeaderControls';
import { CardNavigation } from './components/CardNavigation';
import { CardDeck } from './components/CardDeck';
import { useFinancialData } from './hooks/useFinancialData';
import { useDeepDive } from './hooks/useDeepDive';
import type { AimDataItem, Holding } from './types';
import { portfolioData, initialAimDataRaw, initialTargetInvestment } from './data/portfolioData';
import { formatCurrency } from './utils/formatters';
import { EXCHANGE_RATES, UI_CONFIG } from './utils/constants';

const App: React.FC = () => {
  // State management
  const [aimData, setAimData] = useState<AimDataItem[]>(() => {
    const filteredAimDataRaw = initialAimDataRaw.filter(item => item.ticker !== 'CASH');
    
    return filteredAimDataRaw.map((item, index) => ({
      id: index,
      ticker: item.ticker,
      targetPercent: initialTargetInvestment > 0 ? item.amountCAD / initialTargetInvestment : 0,
      currency: item.currency,
      completed: item.completed,
      notes: '',
    }));
  });

  const [targetDate, setTargetDate] = useState('2025-12-31');
  const [targetInvestment, setTargetInvestment] = useState(initialTargetInvestment);
  const [cashBalance, setCashBalance] = useState(() => {
    const cashItem = initialAimDataRaw.find(item => item.ticker === 'CASH');
    return cashItem ? cashItem.amountCAD : 0;
  });
  const [displayCurrency, setDisplayCurrency] = useState<'CAD' | 'USD'>('CAD');
  const [title, setTitle] = useState('No Honey without Money');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  
  
  const [whatIfPrices] = useState<{ [key: string]: string }>({});


  // Custom hooks
  const { 
    financialData, 
    startDataRefresh, 
    stopDataRefresh, 
    globalLoading, 
    globalError, 
    retryGlobal, 
    canRetryGlobal 
  } = useFinancialData();
  const {
    deepDiveTicker,
    isDeepDiveModalOpen,
    deepDiveReport,
    isDeepDiveLoading,
    generateDeepDiveReport,
    closeDeepDiveModal,
  } = useDeepDive();

  // Holdings calculation
  const holdings = useMemo<{ [key: string]: Holding }>(() => {
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
  }, []);

  // All cards including summary
  const allCards = useMemo(() => [{ isSummary: true, id: 'summary-card' }, ...aimData], [aimData]);

  // Portfolio value calculation
  const totalPortfolioValue = useMemo(() => {
    let totalValue = 0;
    aimData.forEach(item => {
      const price = parseFloat(String(whatIfPrices[item.ticker] || financialData[item.ticker]?.currentPrice || '0')) || 0;
      const holding = holdings[item.ticker] || { numberOfShares: 0, currency: item.currency };
      let value = holding.numberOfShares * price;
      
      if (holding.currency === 'USD' && displayCurrency === 'CAD') {
        value /= EXCHANGE_RATES.CAD_TO_USD;
      } else if (holding.currency === 'CAD' && displayCurrency === 'USD') {
        value *= EXCHANGE_RATES.CAD_TO_USD;
      }
      totalValue += value;
    });
    
    const cashInDisplayCurrency = displayCurrency === 'USD' ? cashBalance * EXCHANGE_RATES.CAD_TO_USD : cashBalance;
    return totalValue + cashInDisplayCurrency;
  }, [holdings, financialData, whatIfPrices, cashBalance, displayCurrency, aimData]);


  // Event handlers with useCallback for performance
  const handleUpdateAimData = useCallback((id: number, field: keyof AimDataItem, value: any) => {
    setAimData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  }, []);

  const handleUpdateHolding = useCallback((ticker: string, field: keyof Holding, value: any) => {
    // This would need to be implemented to actually update holdings
    console.log('Update holding:', ticker, field, value);
  }, []);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (direction === 'right') {
      setCurrentCardIndex(prev => {
        const newIndex = Math.max(0, prev - 1);
        return newIndex;
      });
    } else {
      setCurrentCardIndex(prev => {
        const newIndex = Math.min(allCards.length - 1, prev + 1);
        return newIndex;
      });
    }
  }, [allCards.length]);


  // Header control handlers
  const handleTitleChange = useCallback((title: string) => setTitle(title), []);
  const handleTargetDateChange = useCallback((date: string) => setTargetDate(date), []);
  const handleTargetInvestmentChange = useCallback((amount: number) => setTargetInvestment(amount), []);
  const handleCashBalanceChange = useCallback((amount: number) => setCashBalance(amount), []);
  const handleDisplayCurrencyChange = useCallback((currency: 'CAD' | 'USD') => setDisplayCurrency(currency), []);
  const handleChatOpen = useCallback(() => setIsChatOpen(true), []);
  const handleChatClose = useCallback(() => setIsChatOpen(false), []);


  // Effect to handle card changes and data refresh
  React.useEffect(() => {
    const currentCard = allCards[currentCardIndex];
    const ticker = currentCard && !('isSummary' in currentCard) ? (currentCard as AimDataItem).ticker : undefined;
  
    if (ticker) {
      startDataRefresh(ticker);
    } else {
      stopDataRefresh();
    }

    return () => {
      stopDataRefresh();
    };
  }, [currentCardIndex, startDataRefresh, stopDataRefresh]); // Removed allCards dependency to prevent loops


  return (
    <ErrorBoundary>
      <div className="a4-page">
        {/* Global Loading Indicator */}
        {globalLoading && (
          <div className="global-loading-banner">
            <LoadingSpinner size="sm" message="Loading market data..." variant="dots" />
          </div>
        )}
        
        {/* Global Error Banner */}
        {globalError && (
          <div className="global-error-banner">
            <div className="error-content">
              <span className="error-text">{globalError}</span>
              {canRetryGlobal && (
                <button 
                  onClick={retryGlobal}
                  className="retry-button"
                  aria-label="Retry loading data"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        <HeaderControls
          title={title}
          onTitleChange={handleTitleChange}
          targetDate={targetDate}
          onTargetDateChange={handleTargetDateChange}
          targetInvestment={targetInvestment}
          onTargetInvestmentChange={handleTargetInvestmentChange}
          totalPortfolioValue={totalPortfolioValue}
          cashBalance={cashBalance}
          onCashBalanceChange={handleCashBalanceChange}
          displayCurrency={displayCurrency}
          onDisplayCurrencyChange={handleDisplayCurrencyChange}
        />

      <main>
        <PortfolioErrorBoundary ticker={allCards[currentCardIndex] && !('isSummary' in allCards[currentCardIndex]) ? (allCards[currentCardIndex] as AimDataItem).ticker : undefined}>
          <CardDeck
            allCards={allCards}
            currentCardIndex={currentCardIndex}
            aimData={aimData}
            holdings={holdings}
            financialData={financialData}
            targetInvestment={targetInvestment}
            displayCurrency={displayCurrency}
            cadToUsdRate={EXCHANGE_RATES.CAD_TO_USD}
            onUpdateAimData={handleUpdateAimData}
            onUpdateHolding={handleUpdateHolding}
            onGenerateDeepDive={generateDeepDiveReport}
            isDeepDiveLoading={isDeepDiveLoading}
            deepDiveTicker={deepDiveTicker}
            whatIfPrices={whatIfPrices}
            onSwipe={handleSwipe}
          />
        </PortfolioErrorBoundary>
        
        <CardNavigation
          currentIndex={currentCardIndex}
          totalCards={allCards.length}
          onPrevious={() => handleSwipe('right')}
          onNext={() => handleSwipe('left')}
        />
      </main>

      <DeepDiveModal
        isOpen={isDeepDiveModalOpen}
        onClose={closeDeepDiveModal}
        ticker={deepDiveTicker}
        report={deepDiveReport}
        isLoading={isDeepDiveLoading}
      />

      <button
        onClick={handleChatOpen}
        className="chat-fab"
        aria-label="Open chat with AI assistant"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
        </svg>
      </button>

      <ChatErrorBoundary>
        <ChatComponent
          isOpen={isChatOpen}
          onClose={handleChatClose}
          aimData={aimData}
          holdings={holdings}
          displayCurrency={displayCurrency}
        />
      </ChatErrorBoundary>
      </div>
    </ErrorBoundary>
  );
};

export default App;
