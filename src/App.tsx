import React, { useState, useMemo, useRef } from 'react';
import { PortfolioCard } from './components/PortfolioCard';
import { SummaryCard } from './components/SummaryCard';
import { ChatComponent } from './components/ChatComponent';
import { DeepDiveModal } from './components/DeepDiveModal';
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

  // Event handlers
  const handleUpdateAimData = (id: number, field: keyof AimDataItem, value: any) => {
    setAimData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleUpdateHolding = (ticker: string, field: keyof Holding, value: any) => {
    // This would need to be implemented to actually update holdings
    console.log('Update holding:', ticker, field, value);
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
              aria-label="Portfolio title"
            />
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-subtle text-sm">Display:</span>
            <div className="bg-gray-100 p-1 rounded-md">
              <button
                onClick={() => setDisplayCurrency('CAD')}
                className={`currency-toggle text-sm ${displayCurrency === 'CAD' ? 'active' : ''}`}
                aria-label="Switch to CAD currency"
              >
                CAD
              </button>
              <button
                onClick={() => setDisplayCurrency('USD')}
                className={`currency-toggle text-sm ${displayCurrency === 'USD' ? 'active' : ''}`}
                aria-label="Switch to USD currency"
              >
                USD
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <label className="block text-subtle">Target Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="font-semibold header-input w-full"
              aria-label="Target investment date"
            />
          </div>
          <div>
            <label className="block text-subtle">Target Investment</label>
            <input
              type="number"
              value={targetInvestment}
              onChange={(e) => setTargetInvestment(parseFloat(e.target.value) || 0)}
              className="font-semibold header-input w-full"
              aria-label="Target investment amount"
            />
          </div>
          <div>
            <label className="block text-subtle">Current Portfolio Value</label>
            <p className="font-semibold">{formatCurrency(totalPortfolioValue, displayCurrency)}</p>
          </div>
          <div>
            <label className="block text-subtle">Cash Balance</label>
            <input
              type="number"
              value={cashBalance}
              onChange={(e) => setCashBalance(parseFloat(e.target.value) || 0)}
              className="font-semibold header-input w-full"
              aria-label="Cash balance"
            />
          </div>
        </div>
      </header>

      <main>
        <div className="card-deck-container">
          <div className="card-stack">
            {allCards.map((card, index) => {
              if (index < currentCardIndex) return null;
              const isCurrent = index === currentCardIndex;
              
              // const cardStyle = {
              //   transform: isCurrent ? `translateX(${dragDeltaX.current}px) rotate(${dragDeltaX.current / 20}deg)` : `translateY(${(index - currentCardIndex) * -10}px) scale(${1 - (index - currentCardIndex) * 0.05})`,
              //   zIndex: allCards.length - index,
              //   opacity: index > currentCardIndex + 2 ? 0 : 1
              // };
              
              const dragHandlers = {
                ...(isCurrent && { onMouseDown: startDrag }),
                ...(isCurrent && { onMouseMove: onDrag }),
                ...(isCurrent && { onMouseUp: endDrag }),
                ...(isCurrent && { onMouseLeave: endDrag }),
                ...(isCurrent && { onTouchStart: startDrag }),
                ...(isCurrent && { onTouchMove: onDrag }),
                ...(isCurrent && { onTouchEnd: endDrag }),
              };

              if ('isSummary' in card) {
                return (
                  <SummaryCard
                    key={card.id}
                    aimData={aimData}
                    isCurrent={isCurrent}
                    dragHandlers={dragHandlers}
                  />
                );
              }

              const item = card as AimDataItem;
              const holding = holdings[item.ticker] || { numberOfShares: 0, costPerShare: 0, currency: item.currency };
              const data = financialData[item.ticker] || { isLoading: true };

              return (
                <PortfolioCard
                  key={item.id}
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
                />
              );
            })}
          </div>
        </div>
        
        <div className="card-navigation">
          <button
            onClick={() => handleSwipe('right')}
            disabled={currentCardIndex === 0}
            className="card-nav-button"
            aria-label="Previous card"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="text-sm text-subtle">{currentCardIndex + 1} / {allCards.length}</span>
          <button
            onClick={() => handleSwipe('left')}
            disabled={currentCardIndex === allCards.length - 1}
            className="card-nav-button"
            aria-label="Next card"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </main>

      <DeepDiveModal
        isOpen={isDeepDiveModalOpen}
        onClose={closeDeepDiveModal}
        ticker={deepDiveTicker}
        report={deepDiveReport}
        isLoading={isDeepDiveLoading}
      />

      <button
        onClick={() => setIsChatOpen(true)}
        className="chat-fab"
        aria-label="Open chat with AI assistant"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
        </svg>
      </button>

      <ChatComponent
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        aimData={aimData}
        holdings={holdings}
        displayCurrency={displayCurrency}
      />
    </div>
  );
};

export default App;
