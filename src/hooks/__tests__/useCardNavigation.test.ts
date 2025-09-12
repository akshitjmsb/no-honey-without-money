import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCardNavigation } from '../useCardNavigation';
import type { AimDataItem } from '../../types';

describe('useCardNavigation', () => {
  const mockAimData: AimDataItem[] = [
    { id: 1, ticker: 'AAPL', targetPercent: 0.3, currency: 'USD', completed: false, notes: '' },
    { id: 2, ticker: 'MSFT', targetPercent: 0.4, currency: 'USD', completed: false, notes: '' },
    { id: 3, ticker: 'GOOGL', targetPercent: 0.3, currency: 'USD', completed: false, notes: '' },
  ];

  it('should initialize with first card (summary)', () => {
    const { result } = renderHook(() => useCardNavigation({ aimData: mockAimData }));
    
    expect(result.current.currentCardIndex).toBe(0);
    expect(result.current.allCards).toHaveLength(4); // 1 summary + 3 aim data
    expect(result.current.allCards[0]).toEqual({ isSummary: true, id: 'summary-card' });
  });

  it('should include all aim data in allCards', () => {
    const { result } = renderHook(() => useCardNavigation({ aimData: mockAimData }));
    
    expect(result.current.allCards.slice(1)).toEqual(mockAimData);
  });

  it('should navigate to next card', () => {
    const { result } = renderHook(() => useCardNavigation({ aimData: mockAimData }));
    
    act(() => {
      result.current.goToNext();
    });
    
    expect(result.current.currentCardIndex).toBe(1);
  });

  it('should navigate to previous card', () => {
    const { result } = renderHook(() => useCardNavigation({ aimData: mockAimData }));
    
    // Go to second card first
    act(() => {
      result.current.goToNext();
    });
    
    // Then go back
    act(() => {
      result.current.goToPrevious();
    });
    
    expect(result.current.currentCardIndex).toBe(0);
  });

  it('should not go below first card', () => {
    const { result } = renderHook(() => useCardNavigation({ aimData: mockAimData }));
    
    act(() => {
      result.current.goToPrevious();
    });
    
    expect(result.current.currentCardIndex).toBe(0);
  });

  it('should not go beyond last card', () => {
    const { result } = renderHook(() => useCardNavigation({ aimData: mockAimData }));
    
    // Go to last card
    act(() => {
      result.current.goToNext();
      result.current.goToNext();
      result.current.goToNext();
    });
    
    // Try to go beyond
    act(() => {
      result.current.goToNext();
    });
    
    expect(result.current.currentCardIndex).toBe(3); // Last index
  });

  it('should handle swipe left (next)', () => {
    const { result } = renderHook(() => useCardNavigation({ aimData: mockAimData }));
    
    act(() => {
      result.current.handleSwipe('left');
    });
    
    expect(result.current.currentCardIndex).toBe(1);
  });

  it('should handle swipe right (previous)', () => {
    const { result } = renderHook(() => useCardNavigation({ aimData: mockAimData }));
    
    // Go to second card first
    act(() => {
      result.current.goToNext();
    });
    
    // Then swipe right
    act(() => {
      result.current.handleSwipe('right');
    });
    
    expect(result.current.currentCardIndex).toBe(0);
  });

  it('should handle empty aim data', () => {
    const { result } = renderHook(() => useCardNavigation({ aimData: [] }));
    
    expect(result.current.currentCardIndex).toBe(0);
    expect(result.current.allCards).toHaveLength(1); // Only summary card
    expect(result.current.allCards[0]).toEqual({ isSummary: true, id: 'summary-card' });
  });

  it('should update allCards when aimData changes', () => {
    const { result, rerender } = renderHook(
      ({ aimData }) => useCardNavigation({ aimData }),
      { initialProps: { aimData: mockAimData } }
    );
    
    expect(result.current.allCards).toHaveLength(4);
    
    const newAimData = mockAimData.slice(0, 2);
    rerender({ aimData: newAimData });
    
    expect(result.current.allCards).toHaveLength(3); // 1 summary + 2 aim data
  });

  it('should reset to first card when aimData changes and current index is out of bounds', () => {
    const { result, rerender } = renderHook(
      ({ aimData }) => useCardNavigation({ aimData }),
      { initialProps: { aimData: mockAimData } }
    );
    
    // Go to last card
    act(() => {
      result.current.goToNext();
      result.current.goToNext();
      result.current.goToNext();
    });
    
    expect(result.current.currentCardIndex).toBe(3);
    
    // Reduce aim data to 1 item
    const newAimData = mockAimData.slice(0, 1);
    rerender({ aimData: newAimData });
    
    // Should still be at index 3, but now it's the last valid index
    expect(result.current.currentCardIndex).toBe(3);
  });
});
