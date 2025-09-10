import React, { useState, useMemo, useRef, useCallback } from 'react';
import { PortfolioCard } from './components/PortfolioCard';
import { SummaryCard } from './components/SummaryCard';
import { ChatComponent } from './components/ChatComponent';
import { DeepDiveModal } from './components/DeepDiveModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HeaderControls } from './components/HeaderControls';
import { CardNavigation } from './components/CardNavigation';
import { useFinancialData } from './hooks/useFinancialData';
import { useDeepDive } from './hooks/useDeepDive';
import type { AimDataItem, Holding } from './types';
import { portfolioData, initialAimDataRaw, initialTargetInvestment } from './data/portfolioData';
import { formatCurrency } from './utils/formatters';
import { EXCHANGE_RATES } from './utils/constants';

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
  // const [editingField] = useState<EditingField | null>(null);

  // Drag and drop state
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragDeltaX = useRef(0);

  // Custom hooks
  const { financialData, startDataRefresh, stopDataRefresh } = useFinancialData();
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

  // Time calculations
  // const daysLeft = useMemo(() => {
  //   const diff = new Date(targetDate).getTime() - new Date().getTime();
  //   return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  // }, [targetDate]);

  // const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
  // const investmentNeeded = targetInvestment - totalPortfolioValue;
  // const weeklyInvestment = investmentNeeded > 0 ? investmentNeeded / weeksLeft : 0;

  // Event handlers with useCallback for performance
  const handleUpdateAimData = useCallback((id: number, field: keyof AimDataItem, value: any) => {
    setAimData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  }, []);

  const handleUpdateHolding = useCallback((ticker: string, field: keyof Holding, value: any) => {
    // This would need to be implemented to actually update holdings
    console.log('Update holding:', ticker, field, value);
  }, []);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    // Clear any existing drag transforms
    const allCards = document.querySelectorAll('.portfolio-card');
    allCards.forEach(card => {
      (card as HTMLElement).style.transform = '';
    });
    
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

  const startDrag = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    isDragging.current = true;
    dragStartX.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
    e.currentTarget.classList.add('is-dragging');
    e.preventDefault();
  }, []);

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
  }, [currentCardIndex, allCards, startDataRefresh, stopDataRefresh]);

  // Global drag event listeners
  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const currentX = e.clientX;
      dragDeltaX.current = currentX - dragStartX.current;
      const currentCard = document.querySelector('.portfolio-card.is-current');
      if (currentCard) {
        (currentCard as HTMLElement).style.transform = `translateX(${dragDeltaX.current}px) rotate(${dragDeltaX.current / 20}deg)`;
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      const currentCard = document.querySelector('.portfolio-card.is-current');
      if (currentCard) {
        currentCard.classList.remove('is-dragging');
        if (Math.abs(dragDeltaX.current) > 100) {
          handleSwipe(dragDeltaX.current < 0 ? 'left' : 'right');
        } else {
          (currentCard as HTMLElement).style.transform = '';
        }
      }
      dragDeltaX.current = 0;
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const currentX = e.touches[0].clientX;
      dragDeltaX.current = currentX - dragStartX.current;
      const currentCard = document.querySelector('.portfolio-card.is-current');
      if (currentCard) {
        (currentCard as HTMLElement).style.transform = `translateX(${dragDeltaX.current}px) rotate(${dragDeltaX.current / 20}deg)`;
      }
    };

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      const currentCard = document.querySelector('.portfolio-card.is-current');
      if (currentCard) {
        currentCard.classList.remove('is-dragging');
        if (Math.abs(dragDeltaX.current) > 100) {
          handleSwipe(dragDeltaX.current < 0 ? 'left' : 'right');
        } else {
          (currentCard as HTMLElement).style.transform = '';
        }
      }
      dragDeltaX.current = 0;
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className="a4-page">
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
        <div className="card-deck-container">
          <div className="card-stack">
            {allCards.map((card, index) => {
              const isCurrent = index === currentCardIndex;
              const isBehind = index === currentCardIndex + 1;
              const isBehind2 = index === currentCardIndex + 2;
              
              const cardStyle = {
                zIndex: isCurrent ? allCards.length + 1 : allCards.length - index,
                opacity: index > currentCardIndex + 2 ? 0 : 1
              };
              
              const cardClassName = `portfolio-card ${isCurrent ? 'is-current' : ''} ${isBehind ? 'is-behind' : ''} ${isBehind2 ? 'is-behind-2' : ''} ${index < currentCardIndex ? 'is-past' : ''}`;
              
              const dragHandlers = {
                ...(isCurrent && { onMouseDown: startDrag }),
                ...(isCurrent && { onTouchStart: startDrag }),
              };

              if ('isSummary' in card) {
                return (
                  <SummaryCard
                    key={`${card.id}-${currentCardIndex}`}
                    aimData={aimData}
                    isCurrent={isCurrent}
                    dragHandlers={dragHandlers}
                    style={cardStyle}
                    className={cardClassName}
                  />
                );
              }

              const item = card as AimDataItem;
              const holding = holdings[item.ticker] || { numberOfShares: 0, costPerShare: 0, currency: item.currency };
              const data = financialData[item.ticker] || { isLoading: true };

              return (
                <PortfolioCard
                  key={`${item.id}-${currentCardIndex}`}
                  item={item}
                  holding={holding}
                  financialData={data}
                  targetInvestment={targetInvestment}
                  displayCurrency={displayCurrency}
                  cadToUsdRate={EXCHANGE_RATES.CAD_TO_USD}
                  isCurrent={isCurrent}
                  dragHandlers={dragHandlers}
                  onUpdateAimData={handleUpdateAimData}
                  onUpdateHolding={handleUpdateHolding}
                  onGenerateDeepDive={generateDeepDiveReport}
                  isDeepDiveLoading={isDeepDiveLoading}
                  deepDiveTicker={deepDiveTicker}
                  whatIfPrices={whatIfPrices}
                  style={cardStyle}
                  className={cardClassName}
                />
              );
            })}
          </div>
        </div>
        
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

      <ChatComponent
        isOpen={isChatOpen}
        onClose={handleChatClose}
        aimData={aimData}
        holdings={holdings}
        displayCurrency={displayCurrency}
      />
      </div>
    </ErrorBoundary>
  );
};

export default App;
