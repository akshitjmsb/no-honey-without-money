import React, { memo, useCallback, useRef, useEffect } from 'react';
import { UnifiedPortfolioCard } from './UnifiedPortfolioCard';
import { UnifiedSummaryCard } from './UnifiedSummaryCard';
// Mobile detection is now handled within the unified components
import { portfolioData } from '../data/portfolioData';
import type { AimDataItem, Holding, FinancialData } from '../types';
import { UI_CONFIG } from '../utils/constants';

interface CardDeckProps {
  allCards: Array<{ isSummary?: boolean; id: string } | AimDataItem>;
  currentCardIndex: number;
  aimData: AimDataItem[];
  holdings: { [key: string]: Holding };
  financialData: { [key: string]: FinancialData };
  targetInvestment: number;
  displayCurrency: 'CAD' | 'USD';
  cadToUsdRate: number;
  onUpdateAimData: (id: number, field: keyof AimDataItem, value: any) => void;
  onUpdateHolding: (ticker: string, field: keyof Holding, value: any) => void;
  onGenerateDeepDive: (ticker: string) => void;
  isDeepDiveLoading: boolean;
  deepDiveTicker: string;
  whatIfPrices: { [key: string]: string };
  onSwipe: (direction: 'left' | 'right') => void;
}

// Helper function to get sector information from portfolio data
const getSectorFromPortfolioData = (ticker: string): string | undefined => {
  const portfolioItem = portfolioData.find(item => item.ticker === ticker);
  return portfolioItem?.sector;
};

export const CardDeck: React.FC<CardDeckProps> = memo(({
  allCards,
  currentCardIndex,
  aimData,
  holdings,
  financialData,
  targetInvestment,
  displayCurrency,
  cadToUsdRate,
  onUpdateAimData,
  onUpdateHolding,
  onGenerateDeepDive,
  isDeepDiveLoading,
  deepDiveTicker,
  whatIfPrices,
  onSwipe,
}) => {
  // Mobile detection is now handled within the unified components
  // Drag and drop state
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragDeltaX = useRef(0);

  const startDrag = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    isDragging.current = true;
    dragStartX.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
    e.currentTarget.classList.add('is-dragging');
    e.preventDefault();
  }, []);

  // Global drag event listeners
  useEffect(() => {
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
        if (Math.abs(dragDeltaX.current) > UI_CONFIG.SWIPE_THRESHOLD) {
          onSwipe(dragDeltaX.current < 0 ? 'left' : 'right');
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
        if (Math.abs(dragDeltaX.current) > UI_CONFIG.SWIPE_THRESHOLD) {
          onSwipe(dragDeltaX.current < 0 ? 'left' : 'right');
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
  }, [onSwipe]);

  return (
    <div className="card-deck-container touch-scrollable smooth-scroll">
      <div className="card-stack touch-scrollable no-horizontal-scroll">
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
              <UnifiedSummaryCard
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
          const baseData = financialData[item.ticker] || { isLoading: true };
          
          // Enhance financial data with sector information from portfolio data
          const data = {
            ...baseData,
            sector: baseData.sector || getSectorFromPortfolioData(item.ticker)
          };
          
          return (
            <UnifiedPortfolioCard
              key={`${item.id}-${currentCardIndex}`}
              item={item}
              holding={holding}
              financialData={data}
              targetInvestment={targetInvestment}
              displayCurrency={displayCurrency}
              cadToUsdRate={cadToUsdRate}
              isCurrent={isCurrent}
              dragHandlers={dragHandlers}
              onUpdateAimData={onUpdateAimData}
              onUpdateHolding={onUpdateHolding}
              onGenerateDeepDive={onGenerateDeepDive}
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
  );
});

CardDeck.displayName = 'CardDeck';
