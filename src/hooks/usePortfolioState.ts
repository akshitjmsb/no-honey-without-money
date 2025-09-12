import { useState, useMemo, useCallback } from 'react';
import type { AimDataItem, Holding } from '../types';
import { portfolioData, initialAimDataRaw, initialTargetInvestment } from '../data/portfolioData';
import { handleApiError } from '../utils/errorHandler';

export const usePortfolioState = () => {
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
  const [whatIfPrices] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState<string | null>(null);

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

  // Event handlers
  const handleUpdateAimData = useCallback((id: number, field: keyof AimDataItem, value: any) => {
    try {
      setError(null);
      setAimData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(`Failed to update aim data: ${errorMessage}`);
      console.error('Failed to update aim data:', error);
    }
  }, []);

  const handleUpdateHolding = useCallback((ticker: string, field: keyof Holding, value: any) => {
    try {
      setError(null);
      // Validate input
      if (!ticker || typeof ticker !== 'string') {
        throw new Error('Invalid ticker provided');
      }
      
      if (field === 'numberOfShares' && (typeof value !== 'number' || value < 0)) {
        throw new Error('Number of shares must be a non-negative number');
      }
      
      if (field === 'costPerShare' && (typeof value !== 'number' || value < 0)) {
        throw new Error('Cost per share must be a non-negative number');
      }
      
      if (field === 'currency' && !['USD', 'CAD'].includes(value)) {
        throw new Error('Currency must be either USD or CAD');
      }
      
      // For now, we'll just log the update since holdings are calculated from portfolioData
      // In a real implementation, this would update the underlying data source
      console.log('Update holding:', ticker, field, value);
      
      // TODO: Implement actual holding update logic
      // This would typically involve updating the portfolioData or making an API call
      
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(`Failed to update holding: ${errorMessage}`);
      console.error('Failed to update holding:', error);
    }
  }, []);

  const handleTitleChange = useCallback((title: string) => {
    try {
      setError(null);
      if (typeof title !== 'string') {
        throw new Error('Title must be a string');
      }
      setTitle(title);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(`Failed to update title: ${errorMessage}`);
    }
  }, []);

  const handleTargetDateChange = useCallback((date: string) => {
    try {
      setError(null);
      if (typeof date !== 'string' || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        throw new Error('Date must be in YYYY-MM-DD format');
      }
      setTargetDate(date);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(`Failed to update target date: ${errorMessage}`);
    }
  }, []);

  const handleTargetInvestmentChange = useCallback((amount: number) => {
    try {
      setError(null);
      if (typeof amount !== 'number' || amount < 0) {
        throw new Error('Target investment must be a non-negative number');
      }
      setTargetInvestment(amount);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(`Failed to update target investment: ${errorMessage}`);
    }
  }, []);

  const handleCashBalanceChange = useCallback((amount: number) => {
    try {
      setError(null);
      if (typeof amount !== 'number' || amount < 0) {
        throw new Error('Cash balance must be a non-negative number');
      }
      setCashBalance(amount);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(`Failed to update cash balance: ${errorMessage}`);
    }
  }, []);

  const handleDisplayCurrencyChange = useCallback((currency: 'CAD' | 'USD') => {
    try {
      setError(null);
      if (!['CAD', 'USD'].includes(currency)) {
        throw new Error('Display currency must be either CAD or USD');
      }
      setDisplayCurrency(currency);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(`Failed to update display currency: ${errorMessage}`);
    }
  }, []);

  const handleChatOpen = useCallback(() => setIsChatOpen(true), []);
  const handleChatClose = useCallback(() => setIsChatOpen(false), []);

  const clearError = useCallback(() => setError(null), []);

  return {
    // State
    aimData,
    targetDate,
    targetInvestment,
    cashBalance,
    displayCurrency,
    title,
    isChatOpen,
    whatIfPrices,
    holdings,
    error,
    
    // Handlers
    handleUpdateAimData,
    handleUpdateHolding,
    handleTitleChange,
    handleTargetDateChange,
    handleTargetInvestmentChange,
    handleCashBalanceChange,
    handleDisplayCurrencyChange,
    handleChatOpen,
    handleChatClose,
    clearError,
  };
};
