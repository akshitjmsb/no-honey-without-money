import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePortfolioState } from '../usePortfolioState';
import { handleApiError } from '../../utils/errorHandler';

// Mock the error handler
vi.mock('../../utils/errorHandler', () => ({
  handleApiError: vi.fn((error) => error.message || 'Unknown error')
}));

// Mock the portfolio data
vi.mock('../../data/portfolioData', () => ({
  portfolioData: [
    { ticker: 'AAPL', totalCost: 1500, numberOfShares: 10, currency: 'USD' },
    { ticker: 'MSFT', totalCost: 1500, numberOfShares: 5, currency: 'USD' },
  ],
  initialAimDataRaw: [
    { ticker: 'AAPL', amountCAD: 3000, currency: 'USD', completed: false },
    { ticker: 'MSFT', amountCAD: 4000, currency: 'USD', completed: false },
    { ticker: 'CASH', amountCAD: 1000, currency: 'CAD', completed: false },
  ],
  initialTargetInvestment: 7000,
}));

describe('usePortfolioState', () => {
  const mockHandleApiError = vi.mocked(handleApiError);

  beforeEach(() => {
    vi.clearAllMocks();
    mockHandleApiError.mockImplementation((error) => error.message || 'Unknown error');
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => usePortfolioState());
    
    expect(result.current.aimData).toHaveLength(2); // CASH filtered out
    expect(result.current.targetDate).toBe('2025-12-31');
    expect(result.current.targetInvestment).toBe(7000);
    expect(result.current.cashBalance).toBe(1000);
    expect(result.current.displayCurrency).toBe('CAD');
    expect(result.current.title).toBe('No Honey without Money');
    expect(result.current.isChatOpen).toBe(false);
    expect(result.current.whatIfPrices).toEqual({});
    expect(result.current.error).toBeNull();
  });

  it('should calculate holdings correctly', () => {
    const { result } = renderHook(() => usePortfolioState());
    
    expect(result.current.holdings).toEqual({
      AAPL: { numberOfShares: 10, costPerShare: 150, currency: 'USD' },
      MSFT: { numberOfShares: 5, costPerShare: 300, currency: 'USD' },
    });
  });

  it('should update aim data successfully', () => {
    const { result } = renderHook(() => usePortfolioState());
    
    act(() => {
      result.current.handleUpdateAimData(0, 'targetPercent', 0.5);
    });
    
    expect(result.current.aimData[0].targetPercent).toBe(0.5);
    expect(result.current.error).toBeNull();
  });

  it('should handle aim data update errors', () => {
    const { result } = renderHook(() => usePortfolioState());
    
    // Mock an error in the update
    const originalMap = Array.prototype.map;
    vi.spyOn(Array.prototype, 'map').mockImplementationOnce(() => {
      throw new Error('Update failed');
    });
    
    act(() => {
      result.current.handleUpdateAimData(0, 'targetPercent', 0.5);
    });
    
    expect(result.current.error).toBe('Failed to update aim data: Update failed');
    expect(mockHandleApiError).toHaveBeenCalled();
    
    // Restore original method
    Array.prototype.map = originalMap;
  });

  it('should validate holding updates', () => {
    const { result } = renderHook(() => usePortfolioState());
    
    // Valid update
    act(() => {
      result.current.handleUpdateHolding('AAPL', 'numberOfShares', 15);
    });
    
    expect(result.current.error).toBeNull();
    
    // Invalid ticker
    act(() => {
      result.current.handleUpdateHolding('', 'numberOfShares', 15);
    });
    
    expect(result.current.error).toBe('Failed to update holding: Invalid ticker provided');
    
    // Invalid number of shares
    act(() => {
      result.current.handleUpdateHolding('AAPL', 'numberOfShares', -5);
    });
    
    expect(result.current.error).toBe('Failed to update holding: Number of shares must be a non-negative number');
    
    // Invalid cost per share
    act(() => {
      result.current.handleUpdateHolding('AAPL', 'costPerShare', -100);
    });
    
    expect(result.current.error).toBe('Failed to update holding: Cost per share must be a non-negative number');
    
    // Invalid currency
    act(() => {
      result.current.handleUpdateHolding('AAPL', 'currency', 'EUR');
    });
    
    expect(result.current.error).toBe('Failed to update holding: Currency must be either USD or CAD');
  });

  it('should update title successfully', () => {
    const { result } = renderHook(() => usePortfolioState());
    
    act(() => {
      result.current.handleTitleChange('New Portfolio Title');
    });
    
    expect(result.current.title).toBe('New Portfolio Title');
    expect(result.current.error).toBeNull();
  });

  it('should validate title updates', () => {
    const { result } = renderHook(() => usePortfolioState());
    
    // Invalid title type
    act(() => {
      result.current.handleTitleChange(123 as any);
    });
    
    expect(result.current.error).toBe('Failed to update title: Title must be a string');
  });

  it('should update target date successfully', () => {
    const { result } = renderHook(() => usePortfolioState());
    
    act(() => {
      result.current.handleTargetDateChange('2026-01-01');
    });
    
    expect(result.current.targetDate).toBe('2026-01-01');
    expect(result.current.error).toBeNull();
  });

  it('should validate target date format', () => {
    const { result } = renderHook(() => usePortfolioState());
    
    // Invalid date format
    act(() => {
      result.current.handleTargetDateChange('01/01/2026');
    });
    
    expect(result.current.error).toBe('Failed to update target date: Date must be in YYYY-MM-DD format');
    
    // Invalid date type
    act(() => {
      result.current.handleTargetDateChange(123 as any);
    });
    
    expect(result.current.error).toBe('Failed to update target date: Date must be in YYYY-MM-DD format');
  });

  it('should update target investment successfully', () => {
    const { result } = renderHook(() => usePortfolioState());
    
    act(() => {
      result.current.handleTargetInvestmentChange(8000);
    });
    
    expect(result.current.targetInvestment).toBe(8000);
    expect(result.current.error).toBeNull();
  });

  it('should validate target investment', () => {
    const { result } = renderHook(() => usePortfolioState());
    
    // Negative amount
    act(() => {
      result.current.handleTargetInvestmentChange(-1000);
    });
    
    expect(result.current.error).toBe('Failed to update target investment: Target investment must be a non-negative number');
    
    // Invalid type
    act(() => {
      result.current.handleTargetInvestmentChange('invalid' as any);
    });
    
    expect(result.current.error).toBe('Failed to update target investment: Target investment must be a non-negative number');
  });

  it('should update cash balance successfully', () => {
    const { result } = renderHook(() => usePortfolioState());
    
    act(() => {
      result.current.handleCashBalanceChange(2000);
    });
    
    expect(result.current.cashBalance).toBe(2000);
    expect(result.current.error).toBeNull();
  });

  it('should validate cash balance', () => {
    const { result } = renderHook(() => usePortfolioState());
    
    // Negative amount
    act(() => {
      result.current.handleCashBalanceChange(-500);
    });
    
    expect(result.current.error).toBe('Failed to update cash balance: Cash balance must be a non-negative number');
  });

  it('should update display currency successfully', () => {
    const { result } = renderHook(() => usePortfolioState());
    
    act(() => {
      result.current.handleDisplayCurrencyChange('USD');
    });
    
    expect(result.current.displayCurrency).toBe('USD');
    expect(result.current.error).toBeNull();
  });

  it('should validate display currency', () => {
    const { result } = renderHook(() => usePortfolioState());
    
    // Invalid currency
    act(() => {
      result.current.handleDisplayCurrencyChange('EUR' as any);
    });
    
    expect(result.current.error).toBe('Failed to update display currency: Display currency must be either CAD or USD');
  });

  it('should handle chat open/close', () => {
    const { result } = renderHook(() => usePortfolioState());
    
    expect(result.current.isChatOpen).toBe(false);
    
    act(() => {
      result.current.handleChatOpen();
    });
    
    expect(result.current.isChatOpen).toBe(true);
    
    act(() => {
      result.current.handleChatClose();
    });
    
    expect(result.current.isChatOpen).toBe(false);
  });

  it('should clear error', () => {
    const { result } = renderHook(() => usePortfolioState());
    
    // Create an error first
    act(() => {
      result.current.handleTitleChange(123 as any);
    });
    
    expect(result.current.error).toBeTruthy();
    
    // Clear the error
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.error).toBeNull();
  });

  it('should filter out CASH from aim data', () => {
    const { result } = renderHook(() => usePortfolioState());
    
    // CASH should be filtered out from aimData
    const cashItems = result.current.aimData.filter(item => item.ticker === 'CASH');
    expect(cashItems).toHaveLength(0);
    
    // But cash balance should be set from CASH item
    expect(result.current.cashBalance).toBe(1000);
  });

  it('should calculate target percentages correctly', () => {
    const { result } = renderHook(() => usePortfolioState());
    
    // AAPL: 3000 / 7000 = 0.428...
    // MSFT: 4000 / 7000 = 0.571...
    expect(result.current.aimData[0].targetPercent).toBeCloseTo(0.428, 3);
    expect(result.current.aimData[1].targetPercent).toBeCloseTo(0.571, 3);
  });
});
