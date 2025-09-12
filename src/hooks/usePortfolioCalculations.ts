import { useMemo } from 'react';
import type { AimDataItem, Holding } from '../types';
import { EXCHANGE_RATES } from '../utils/constants';

interface UsePortfolioCalculationsProps {
  aimData: AimDataItem[];
  holdings: { [key: string]: Holding };
  financialData: { [key: string]: any };
  whatIfPrices: { [key: string]: string };
  cashBalance: number;
  displayCurrency: 'CAD' | 'USD';
}

export const usePortfolioCalculations = ({
  aimData,
  holdings,
  financialData,
  whatIfPrices,
  cashBalance,
  displayCurrency,
}: UsePortfolioCalculationsProps) => {
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

  return {
    totalPortfolioValue,
  };
};
