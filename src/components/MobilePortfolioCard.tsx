import React, { memo, useMemo } from 'react';
import { Sparkline } from './Sparkline';
import { RangeBar } from './RangeBar';
import { EditableField } from './EditableField';
import { LoadingSpinner } from './LoadingSpinner';
import type { AimDataItem, Holding, FinancialData } from '../types';
import { formatCurrency } from '../utils/formatters';

interface MobilePortfolioCardProps {
  item: AimDataItem;
  holding: Holding;
  financialData: FinancialData;
  targetInvestment: number;
  displayCurrency: 'CAD' | 'USD';
  cadToUsdRate: number;
  isCurrent: boolean;
  dragHandlers: {
    onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
    onTouchStart?: (e: React.TouchEvent<HTMLDivElement>) => void;
  };
  onUpdateAimData: (id: number, field: keyof AimDataItem, value: any) => void;
  onUpdateHolding: (ticker: string, field: keyof Holding, value: any) => void;
  onGenerateDeepDive: (ticker: string) => void;
  isDeepDiveLoading: boolean;
  deepDiveTicker: string;
  whatIfPrices: { [key: string]: string };
  style?: React.CSSProperties;
  className?: string;
}

export const MobilePortfolioCard: React.FC<MobilePortfolioCardProps> = memo(({
  item,
  holding,
  financialData,
  targetInvestment,
  displayCurrency,
  cadToUsdRate,
  isCurrent,
  dragHandlers,
  onUpdateAimData,
  onUpdateHolding,
  onGenerateDeepDive,
  isDeepDiveLoading,
  deepDiveTicker,
  whatIfPrices,
  style,
  className,
}) => {
  const price = parseFloat(String(whatIfPrices[item.ticker] || financialData.currentPrice || '0')) || 0;
  
  const { currentMarketValue, targetAmount, amountToInvest, progress, sentiment } = useMemo(() => {
    let currentMarketValue = holding.numberOfShares * price;
    let targetAmount = targetInvestment * item.targetPercent;

    if (displayCurrency === 'CAD') {
      if (item.currency === 'USD') targetAmount /= cadToUsdRate;
      if (holding.currency === 'USD') currentMarketValue /= cadToUsdRate;
    } else { // displayCurrency is USD
      if (item.currency === 'CAD') targetAmount *= cadToUsdRate;
      if (holding.currency === 'CAD') currentMarketValue *= cadToUsdRate;
    }

    const amountToInvest = targetAmount - currentMarketValue;
    const progress = targetAmount > 0 ? (currentMarketValue / targetAmount) * 100 : 0;
    const sentiment = financialData.newsSentiment?.sentiment?.toLowerCase() || 'neutral';

    return { currentMarketValue, targetAmount, amountToInvest, progress, sentiment };
  }, [holding.numberOfShares, price, targetInvestment, item.targetPercent, displayCurrency, item.currency, cadToUsdRate, holding.currency, financialData.newsSentiment?.sentiment]);

  return (
    <div
      className={className || `portfolio-card mobile-optimized ${item.completed ? 'is-completed' : ''}`}
      style={style}
      {...dragHandlers}
      role="article"
      aria-label={`Portfolio card for ${item.ticker}`}
    >
      {/* Compact Header */}
      <div className="card-header mobile-header">
        <div className="header-left">
          <h2 className="card-ticker mobile-ticker">
            <EditableField
              value={item.ticker}
              field="ticker"
              onUpdate={(value) => onUpdateAimData(item.id, 'ticker', value)}
              className="ticker-input-card mobile-ticker-input"
              aria-label="Edit ticker symbol"
            />
          </h2>
          <div className="header-meta">
            <span className="card-type mobile-type">{item.currency}</span>
            {financialData.newsSentiment && (
              <span className={`sentiment-badge mobile-sentiment ${sentiment}`} role="status">
                {financialData.newsSentiment.sentiment}
              </span>
            )}
          </div>
        </div>
        <div className="header-right">
          <label className="completed-toggle mobile-toggle" aria-label={`Mark ${item.ticker} as completed`}>
            <input
              type="checkbox"
              checked={item.completed}
              onChange={(e) => onUpdateAimData(item.id, 'completed', e.target.checked)}
              aria-describedby={`completed-${item.ticker}`}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
      
      {item.completed && (
        <div className="completed-badge-overlay mobile-completed" role="status" aria-live="polite">
          ✓
        </div>
      )}
      
      {/* Compact Progress Bar */}
      <div className="progress-bar-container mobile-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar" style={{ width: `${Math.min(100, progress)}%` }}></div>
      </div>

      {/* Scrollable Content Area */}
      <div className="card-body mobile-body">
        {financialData.isLoading && !financialData.currentPrice && (
          <div className="loading-section">
            <LoadingSpinner 
              size="sm" 
              message="Loading..." 
              variant="dots"
              color="primary"
            />
          </div>
        )}
        
        {financialData.error && (
          <div className="error-section">
            <span className="error-text">{financialData.error}</span>
            <button 
              onClick={() => window.location.reload()} 
              className="retry-button-small"
              aria-label="Retry loading data"
            >
              Retry
            </button>
          </div>
        )}

        {/* Key Metrics Section */}
        <div className="metrics-section">
          <div className="metric-row primary">
            <span className="metric-label">Price</span>
            <span className="metric-value">
              {financialData.currentPrice ? formatCurrency(financialData.currentPrice, item.currency) : 'N/A'}
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">24h</span>
            <div className="metric-chart">
              {financialData.isLoading ? (
                <LoadingSpinner size="sm" variant="skeleton" className="w-16 h-4" />
              ) : (
                <Sparkline data={financialData.priceHistory24h} width={60} height={20} />
              )}
            </div>
          </div>
        </div>
        
        {/* Investment Section */}
        <div className="investment-section">
          <div className="investment-row">
            <span className="investment-label">Target %</span>
            <EditableField
              value={item.targetPercent}
              field="targetPercent"
              onUpdate={(value) => onUpdateAimData(item.id, 'targetPercent', value)}
              className="mobile-input"
              aria-label="Edit target percentage"
            />
          </div>
          
          <div className="investment-row">
            <span className="investment-label">Target</span>
            <span className="investment-value">{formatCurrency(targetAmount, displayCurrency)}</span>
          </div>
          
          <div className="investment-row">
            <span className="investment-label">Current</span>
            <span className="investment-value">{formatCurrency(currentMarketValue, displayCurrency)}</span>
          </div>
          
          <div className="investment-row highlight">
            <span className="investment-label">Action</span>
            <span className={`investment-value ${amountToInvest >= 0 ? 'buy-color' : 'sell-color'}`}>
              {formatCurrency(amountToInvest, displayCurrency)}
            </span>
          </div>
        </div>
        
        {/* Holdings Section */}
        <div className="holdings-section">
          <div className="holding-row">
            <span className="holding-label">Shares</span>
            <EditableField
              value={holding.numberOfShares}
              field="numberOfShares"
              onUpdate={(value) => onUpdateHolding(item.ticker, 'numberOfShares', value)}
              className="mobile-input"
              aria-label="Edit number of shares"
            />
          </div>
          
          <div className="holding-row">
            <span className="holding-label">Avg Cost</span>
            <EditableField
              value={holding.costPerShare}
              field="costPerShare"
              onUpdate={(value) => onUpdateHolding(item.ticker, 'costPerShare', value)}
              className="mobile-input"
              aria-label="Edit average cost per share"
            />
          </div>
        </div>
        
        {/* Analysis Section */}
        <div className="analysis-section">
          <div className="analysis-item">
            <span className="analysis-label">52W Range</span>
            <RangeBar
              low={financialData.keyMetrics?.fiftyTwoWeekLow}
              high={financialData.keyMetrics?.fiftyTwoWeekHigh}
              current={financialData.currentPrice}
              average={null}
              width="100%"
            />
          </div>
          
          <div className="analysis-item">
            <span className="analysis-label">Analyst Target</span>
            <RangeBar
              low={financialData.analystRatings?.targetLow}
              high={financialData.analystRatings?.targetHigh}
              current={financialData.currentPrice}
              average={financialData.analystRatings?.targetAverage ?? null}
              width="100%"
            />
          </div>
          
          <div className="analysis-row">
            <span className="analysis-label">Rating</span>
            <span className="analysis-value">
              {financialData.analystRatings?.recommendation || 'N/A'}
            </span>
          </div>
          
          <div className="analysis-row">
            <span className="analysis-label">Beta</span>
            <span className="analysis-value">
              {financialData.keyMetrics?.beta?.toFixed(2) || 'N/A'}
            </span>
          </div>
          
          <div className="analysis-row">
            <span className="analysis-label">Earnings</span>
            <span className="analysis-value">
              {financialData.upcomingEvents?.nextEarningsDate || 'N/A'}
            </span>
          </div>
        </div>
        
        {/* Notes Section */}
        <div className="notes-section mobile-notes">
          <span className="notes-label">Notes</span>
          <EditableField
            value={item.notes}
            field="notes"
            onUpdate={(value) => onUpdateAimData(item.id, 'notes', value)}
            placeholder="Add notes..."
            className="mobile-textarea"
            aria-label="Edit notes"
          />
        </div>
      </div>
      
      {/* Compact Footer */}
      <div className="card-footer mobile-footer">
        <button
          onClick={() => onGenerateDeepDive(item.ticker)}
          className="card-deep-dive-btn mobile-deep-dive"
          disabled={isDeepDiveLoading && deepDiveTicker === item.ticker}
          aria-label={`Generate deep dive report for ${item.ticker}`}
        >
          {isDeepDiveLoading && deepDiveTicker === item.ticker ? (
            <LoadingSpinner size="sm" />
          ) : (
            'Deep Dive'
          )}
        </button>
      </div>
    </div>
  );
});

MobilePortfolioCard.displayName = 'MobilePortfolioCard';
