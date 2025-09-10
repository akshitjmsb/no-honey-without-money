import React, { memo } from 'react';
import { formatCurrency } from '../utils/formatters';

interface HeaderControlsProps {
  title: string;
  onTitleChange: (title: string) => void;
  targetDate: string;
  onTargetDateChange: (date: string) => void;
  targetInvestment: number;
  onTargetInvestmentChange: (amount: number) => void;
  totalPortfolioValue: number;
  cashBalance: number;
  onCashBalanceChange: (amount: number) => void;
  displayCurrency: 'CAD' | 'USD';
  onDisplayCurrencyChange: (currency: 'CAD' | 'USD') => void;
}

export const HeaderControls: React.FC<HeaderControlsProps> = memo(({
  title,
  onTitleChange,
  targetDate,
  onTargetDateChange,
  targetInvestment,
  onTargetInvestmentChange,
  totalPortfolioValue,
  cashBalance,
  onCashBalanceChange,
  displayCurrency,
  onDisplayCurrencyChange,
}) => {
  return (
    <header className="mb-6 md:mb-8 pb-4 border-b border-color">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
        <div className="logo-title-container">
          <svg className="header-logo" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
          </svg>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="text-xl md:text-2xl font-bold title-input text-main"
            aria-label="Portfolio title"
          />
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-subtle text-sm">Display:</span>
          <div className="bg-gray-100 p-1 rounded-md">
            <button
              onClick={() => onDisplayCurrencyChange('CAD')}
              className={`currency-toggle text-sm ${displayCurrency === 'CAD' ? 'active' : ''}`}
              aria-label="Switch to CAD currency"
            >
              CAD
            </button>
            <button
              onClick={() => onDisplayCurrencyChange('USD')}
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
            onChange={(e) => onTargetDateChange(e.target.value)}
            className="font-semibold header-input w-full"
            aria-label="Target investment date"
          />
        </div>
        <div>
          <label className="block text-subtle">Target Investment</label>
          <input
            type="number"
            value={targetInvestment}
            onChange={(e) => onTargetInvestmentChange(parseFloat(e.target.value) || 0)}
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
            onChange={(e) => onCashBalanceChange(parseFloat(e.target.value) || 0)}
            className="font-semibold header-input w-full"
            aria-label="Cash balance"
          />
        </div>
      </div>
    </header>
  );
});

HeaderControls.displayName = 'HeaderControls';
