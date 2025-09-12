import React, { useCallback } from 'react';
import { ChatComponent } from './components/ChatComponent';
import { DeepDiveModal } from './components/DeepDiveModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PortfolioErrorBoundary } from './components/PortfolioErrorBoundary';
import { ChatErrorBoundary } from './components/ChatErrorBoundary';
import { HeaderControls } from './components/HeaderControls';
import { CardNavigation } from './components/CardNavigation';
import { CardDeck } from './components/CardDeck';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useFinancialData } from './hooks/useFinancialData';
import { useDeepDive } from './hooks/useDeepDive';
import { usePortfolioState } from './hooks/usePortfolioState';
import { usePortfolioCalculations } from './hooks/usePortfolioCalculations';
import { useCardNavigation } from './hooks/useCardNavigation';
import { EXCHANGE_RATES } from './utils/constants';
import { isAimDataItem } from './types';

const App: React.FC = () => {
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

  // Portfolio state management
  const {
    aimData,
    targetDate,
    targetInvestment,
    cashBalance,
    displayCurrency,
    title,
    isChatOpen,
    whatIfPrices,
    holdings,
    handleUpdateAimData,
    handleUpdateHolding,
    handleTitleChange,
    handleTargetDateChange,
    handleTargetInvestmentChange,
    handleCashBalanceChange,
    handleDisplayCurrencyChange,
    handleChatOpen,
    handleChatClose,
  } = usePortfolioState();

  // Card navigation
  const {
    currentCardIndex,
    allCards,
    handleSwipe,
    goToPrevious,
    goToNext,
  } = useCardNavigation({ aimData });

  // Portfolio calculations
  const { totalPortfolioValue } = usePortfolioCalculations({
    aimData,
    holdings,
    financialData,
    whatIfPrices,
    cashBalance,
    displayCurrency,
  });

  // Effect to handle card changes and data refresh
  React.useEffect(() => {
    const currentCard = allCards[currentCardIndex];
    const ticker = isAimDataItem(currentCard) ? currentCard.ticker : undefined;
  
    if (ticker) {
      startDataRefresh(ticker);
    } else {
      stopDataRefresh();
    }

    return () => {
      stopDataRefresh();
    };
  }, [currentCardIndex, startDataRefresh, stopDataRefresh, allCards]);


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
        <PortfolioErrorBoundary ticker={isAimDataItem(allCards[currentCardIndex]) ? allCards[currentCardIndex].ticker : undefined}>
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
          onPrevious={goToPrevious}
          onNext={goToNext}
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
