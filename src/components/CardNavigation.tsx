import React, { memo } from 'react';

interface CardNavigationProps {
  currentIndex: number;
  totalCards: number;
  onPrevious: () => void;
  onNext: () => void;
}

export const CardNavigation: React.FC<CardNavigationProps> = memo(({
  currentIndex,
  totalCards,
  onPrevious,
  onNext,
}) => {
  return (
    <div className="card-navigation">
      <button
        onClick={onPrevious}
        disabled={currentIndex === 0}
        className="card-nav-button touch-target"
        aria-label="Previous card"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>
      <span className="text-xs md:text-sm text-subtle px-2">{currentIndex + 1} / {totalCards}</span>
      <button
        onClick={onNext}
        disabled={currentIndex === totalCards - 1}
        className="card-nav-button touch-target"
        aria-label="Next card"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );
});

CardNavigation.displayName = 'CardNavigation';
