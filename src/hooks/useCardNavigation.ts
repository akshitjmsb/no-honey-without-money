import { useState, useCallback, useMemo } from 'react';
import type { AimDataItem, CardData, SummaryCard } from '../types';

interface UseCardNavigationProps {
  aimData: AimDataItem[];
}

export const useCardNavigation = ({ aimData }: UseCardNavigationProps) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // All cards including summary
  const allCards = useMemo((): CardData[] => 
    [{ isSummary: true, id: 'summary-card' } as SummaryCard, ...aimData], 
    [aimData]
  );

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (direction === 'right') {
      setCurrentCardIndex(prev => Math.max(0, prev - 1));
    } else {
      setCurrentCardIndex(prev => Math.min(allCards.length - 1, prev + 1));
    }
  }, [allCards.length]);

  const goToPrevious = useCallback(() => handleSwipe('right'), [handleSwipe]);
  const goToNext = useCallback(() => handleSwipe('left'), [handleSwipe]);

  return {
    currentCardIndex,
    allCards,
    handleSwipe,
    goToPrevious,
    goToNext,
  };
};
