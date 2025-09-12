import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePortfolioCalculations } from '../usePortfolioCalculations';
import type { AimDataItem, Holding } from '../../types';

describe('usePortfolioCalculations', () => {
  const mockAimData: AimDataItem[] = [
    { id: 1, ticker: 'AAPL', targetPercent: 0.3, currency: 'USD', completed: false, notes: '' },
    { id: 2, ticker: 'MSFT', targetPercent: 0.4, currency: 'USD', completed: false, notes: '' },
    { id: 3, ticker: 'GOOGL', targetPercent: 0.3, currency: 'USD', completed: false, notes: '' },
  ];

  const mockHoldings: { [key: string]: Holding } = {
    AAPL: { numberOfShares: 10, costPerShare: 150, currency: 'USD' },
    MSFT: { numberOfShares: 5, costPerShare: 300, currency: 'USD' },
    GOOGL: { numberOfShares: 2, costPerShare: 2500, currency: 'USD' },
  };

  const mockFinancialData = {
    AAPL: { currentPrice: 160, isLoading: false },
    MSFT: { currentPrice: 320, isLoading: false },
    GOOGL: { currentPrice: 2600, isLoading: false },
  };

  const defaultProps = {
    aimData: mockAimData,
    holdings: mockHoldings,
    financialData: mockFinancialData,
    whatIfPrices: {},
    cashBalance: 1000,
    displayCurrency: 'USD' as const,
  };

  it('should calculate total portfolio value correctly in USD', () => {
    const { result } = renderHook(() => usePortfolioCalculations(defaultProps));
    
    // AAPL: 10 shares * $160 = $1,600
    // MSFT: 5 shares * $320 = $1,600
    // GOOGL: 2 shares * $2,600 = $5,200
    // Cash: $1,000
    // Total: $9,400
    expect(result.current.totalPortfolioValue).toBe(9400);
  });

  it('should calculate total portfolio value correctly in CAD', () => {
    const props = { ...defaultProps, displayCurrency: 'CAD' as const };
    const { result } = renderHook(() => usePortfolioCalculations(props));
    
    // All values should be converted to CAD (multiplied by exchange rate)
    // Assuming CAD_TO_USD = 0.75 (1 USD = 1.33 CAD)
    // AAPL: 10 shares * $160 * 1.33 = $2,133.33
    // MSFT: 5 shares * $320 * 1.33 = $2,133.33
    // GOOGL: 2 shares * $2,600 * 1.33 = $6,933.33
    // Cash: $1,000 * 1.33 = $1,333.33
    // Total: $12,533.33 (approximately)
    expect(result.current.totalPortfolioValue).toBeCloseTo(12533.33, 2);
  });

  it('should handle missing financial data', () => {
    const props = {
      ...defaultProps,
      financialData: {
        AAPL: { currentPrice: 160, isLoading: false },
        // MSFT and GOOGL missing
      },
    };
    
    const { result } = renderHook(() => usePortfolioCalculations(props));
    
    // AAPL: 10 shares * $160 = $1,600
    // MSFT: 5 shares * $0 = $0 (missing price)
    // GOOGL: 2 shares * $0 = $0 (missing price)
    // Cash: $1,000
    // Total: $2,600
    expect(result.current.totalPortfolioValue).toBe(2600);
  });

  it('should handle what-if prices', () => {
    const props = {
      ...defaultProps,
      whatIfPrices: {
        AAPL: '200', // Override financial data price
        MSFT: '350',
      },
    };
    
    const { result } = renderHook(() => usePortfolioCalculations(props));
    
    // AAPL: 10 shares * $200 = $2,000
    // MSFT: 5 shares * $350 = $1,750
    // GOOGL: 2 shares * $2,600 = $5,200 (from financial data)
    // Cash: $1,000
    // Total: $9,950
    expect(result.current.totalPortfolioValue).toBe(9950);
  });

  it('should handle missing holdings', () => {
    const props = {
      ...defaultProps,
      holdings: {
        AAPL: { numberOfShares: 10, costPerShare: 150, currency: 'USD' },
        // MSFT and GOOGL missing
      },
    };
    
    const { result } = renderHook(() => usePortfolioCalculations(props));
    
    // AAPL: 10 shares * $160 = $1,600
    // MSFT: 0 shares * $320 = $0
    // GOOGL: 0 shares * $2,600 = $0
    // Cash: $1,000
    // Total: $2,600
    expect(result.current.totalPortfolioValue).toBe(2600);
  });

  it('should handle zero cash balance', () => {
    const props = { ...defaultProps, cashBalance: 0 };
    const { result } = renderHook(() => usePortfolioCalculations(props));
    
    // AAPL: 10 shares * $160 = $1,600
    // MSFT: 5 shares * $320 = $1,600
    // GOOGL: 2 shares * $2,600 = $5,200
    // Cash: $0
    // Total: $8,400
    expect(result.current.totalPortfolioValue).toBe(8400);
  });

  it('should handle empty aim data', () => {
    const props = { ...defaultProps, aimData: [] };
    const { result } = renderHook(() => usePortfolioCalculations(props));
    
    // No holdings, only cash
    expect(result.current.totalPortfolioValue).toBe(1000);
  });

  it('should handle mixed currencies', () => {
    const mixedAimData: AimDataItem[] = [
      { id: 1, ticker: 'AAPL', targetPercent: 0.5, currency: 'USD', completed: false, notes: '' },
      { id: 2, ticker: 'SHOP', targetPercent: 0.5, currency: 'CAD', completed: false, notes: '' },
    ];

    const mixedHoldings: { [key: string]: Holding } = {
      AAPL: { numberOfShares: 10, costPerShare: 150, currency: 'USD' },
      SHOP: { numberOfShares: 5, costPerShare: 100, currency: 'CAD' },
    };

    const mixedFinancialData = {
      AAPL: { currentPrice: 160, isLoading: false },
      SHOP: { currentPrice: 120, isLoading: false },
    };

    const props = {
      aimData: mixedAimData,
      holdings: mixedHoldings,
      financialData: mixedFinancialData,
      whatIfPrices: {},
      cashBalance: 1000,
      displayCurrency: 'USD' as const,
    };

    const { result } = renderHook(() => usePortfolioCalculations(props));
    
    // AAPL: 10 shares * $160 = $1,600 (already USD)
    // SHOP: 5 shares * $120 * 0.75 = $450 (converted from CAD to USD)
    // Cash: $1,000
    // Total: $3,050
    expect(result.current.totalPortfolioValue).toBeCloseTo(3050, 2);
  });

  it('should recalculate when dependencies change', () => {
    const { result, rerender } = renderHook(
      (props) => usePortfolioCalculations(props),
      { initialProps: defaultProps }
    );
    
    expect(result.current.totalPortfolioValue).toBe(9400);
    
    // Change cash balance
    rerender({ ...defaultProps, cashBalance: 2000 });
    expect(result.current.totalPortfolioValue).toBe(10400);
    
    // Change display currency
    rerender({ ...defaultProps, cashBalance: 1000, displayCurrency: 'CAD' });
    expect(result.current.totalPortfolioValue).toBeCloseTo(12533.33, 2);
  });

  it('should handle invalid price strings in whatIfPrices', () => {
    const props = {
      ...defaultProps,
      whatIfPrices: {
        AAPL: 'invalid',
        MSFT: 'not-a-number',
      },
    };
    
    const { result } = renderHook(() => usePortfolioCalculations(props));
    
    // Invalid prices should default to 0
    // AAPL: 10 shares * $0 = $0
    // MSFT: 5 shares * $0 = $0
    // GOOGL: 2 shares * $2,600 = $5,200
    // Cash: $1,000
    // Total: $6,200
    expect(result.current.totalPortfolioValue).toBe(6200);
  });
});
