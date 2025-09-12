import React, { memo, useMemo, useCallback } from 'react';
import { Sparkline } from './Sparkline';
import { RangeBar } from './RangeBar';
import { EditableField } from './EditableField';
import { LoadingSpinner } from './LoadingSpinner';
import type { AimDataItem, Holding, FinancialData } from '../types';
import { formatCurrency } from '../utils/formatters';

interface PortfolioCardProps {
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

export const PortfolioCard: React.FC<PortfolioCardProps> = memo(({
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
  const price = useMemo(() => 
    parseFloat(String(whatIfPrices[item.ticker] || financialData.currentPrice || '0')) || 0,
    [whatIfPrices, item.ticker, financialData.currentPrice]
  );
  
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

  // Memoized event handlers
  const handleUpdateAimData = useCallback((field: keyof AimDataItem, value: any) => {
    onUpdateAimData(item.id, field, value);
  }, [onUpdateAimData, item.id]);

  const handleUpdateHolding = useCallback((field: keyof Holding, value: any) => {
    onUpdateHolding(item.ticker, field, value);
  }, [onUpdateHolding, item.ticker]);

  const handleGenerateDeepDive = useCallback(() => {
    onGenerateDeepDive(item.ticker);
  }, [onGenerateDeepDive, item.ticker]);

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div
      className={className || `portfolio-card ${item.completed ? 'is-completed' : ''}`}
      style={style}
      {...dragHandlers}
      role="article"
      aria-label={`Portfolio card for ${item.ticker}`}
    >
      <div className="card-header">
        <div>
          <h2 className="card-ticker">
            <EditableField
              value={item.ticker}
              field="ticker"
              onUpdate={(value) => handleUpdateAimData('ticker', value)}
              className="ticker-input-card"
              aria-label="Edit ticker symbol"
            />
          </h2>
          <p className="card-type">{item.currency}</p>
        </div>
        <div className="card-header-actions">
          {financialData.newsSentiment && (
            <span className={`sentiment-badge ${sentiment}`} role="status" aria-label={`News sentiment: ${financialData.newsSentiment.sentiment}`}>
              {financialData.newsSentiment.sentiment}
            </span>
          )}
          <label className="completed-toggle" aria-label={`Mark ${item.ticker} as completed`}>
            <input
              type="checkbox"
              checked={item.completed}
              onChange={(e) => handleUpdateAimData('completed', e.target.checked)}
              aria-describedby={`completed-${item.ticker}`}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
      
      {item.completed && (
        <div className="completed-badge-overlay" role="status" aria-live="polite">
          COMPLETED
        </div>
      )}
      
      <div className="progress-bar-container" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar" style={{ width: `${Math.min(100, progress)}%` }}></div>
      </div>

      <div className="card-body">
        {financialData.isLoading && !financialData.currentPrice && (
          <div className="card-row">
            <LoadingSpinner 
              size="sm" 
              message="Loading market data..." 
              variant="dots"
              color="primary"
            />
          </div>
        )}
        {financialData.error && (
          <div className="card-row">
            <div className="error-message">
              <span className="text-sm text-red-500">{financialData.error}</span>
              <button 
                onClick={handleRetry} 
                className="retry-button-small"
                aria-label="Retry loading data"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="card-row">
          <span className="card-label">Current Price</span>
          <span className="card-value">
            {financialData.currentPrice ? formatCurrency(financialData.currentPrice, item.currency) : 'N/A'}
          </span>
        </div>

        <div className="card-row">
          <span className="card-label">24h Trend</span>
          <div>
            {financialData.isLoading ? (
              <LoadingSpinner 
                size="sm" 
                variant="skeleton"
                className="w-30 h-8"
              />
            ) : (
              <Sparkline data={financialData.priceHistory24h} width={120} height={30} />
            )}
          </div>
        </div>
        
        <hr className="my-3 border-color" />
        
        <div className="card-row">
          <span className="card-label">Target %</span>
          <span className="card-value">
            <EditableField
              value={item.targetPercent}
              field="targetPercent"
              onUpdate={(value) => handleUpdateAimData('targetPercent', value)}
              aria-label="Edit target percentage"
            />
          </span>
        </div>
        
        <div className="card-row">
          <span className="card-label">Target Amount</span>
          <span className="card-value-small">{formatCurrency(targetAmount, displayCurrency)}</span>
        </div>
        
        <div className="card-row">
          <span className="card-label">Market Value</span>
          <span className="card-value-small">{formatCurrency(currentMarketValue, displayCurrency)}</span>
        </div>
        
        <div className="card-row">
          <span className="card-label font-bold">Invest/Divest</span>
          <span className={`card-value font-bold ${amountToInvest >= 0 ? 'buy-color' : 'sell-color'}`}>
            {formatCurrency(amountToInvest, displayCurrency)}
          </span>
        </div>
        
        <hr className="my-3 border-color" />
        
        <div className="card-row">
          <span className="card-label">Shares Held</span>
          <span className="card-value">
            <EditableField
              value={holding.numberOfShares}
              field="numberOfShares"
              onUpdate={(value) => handleUpdateHolding('numberOfShares', value)}
              aria-label="Edit number of shares"
            />
          </span>
        </div>
        
        <div className="card-row">
          <span className="card-label">Avg Cost/Share</span>
          <span className="card-value">
            <EditableField
              value={holding.costPerShare}
              field="costPerShare"
              onUpdate={(value) => handleUpdateHolding('costPerShare', value)}
              aria-label="Edit average cost per share"
            />
          </span>
        </div>
        
        <hr className="my-3 border-color" />
        
        <div className="card-row-vertical">
          <span className="card-label mb-1">52-Week Range</span>
          <RangeBar
            low={financialData.keyMetrics?.fiftyTwoWeekLow}
            high={financialData.keyMetrics?.fiftyTwoWeekHigh}
            current={financialData.currentPrice}
            average={null}
            width="100%"
          />
        </div>
        
        <div className="card-row-vertical">
          <span className="card-label mb-1">Analyst Target</span>
          <RangeBar
            low={financialData.analystRatings?.targetLow}
            high={financialData.analystRatings?.targetHigh}
            current={financialData.currentPrice}
            average={financialData.analystRatings?.targetAverage ?? null}
            width="100%"
          />
        </div>
        
        <div className="card-row">
          <span className="card-label">Analyst Rating</span>
          <span className="card-value-small">
            {financialData.analystRatings?.recommendation || 'N/A'}
          </span>
        </div>
        
        <hr className="my-3 border-color" />
        
        <div className="card-row">
          <span className="card-label">Volatility (Beta)</span>
          <span className="card-value-small">
            {financialData.keyMetrics?.beta?.toFixed(2) || 'N/A'}
          </span>
        </div>
        
        <div className="card-row">
          <span className="card-label">Next Earnings</span>
          <span className="card-value-small">
            {financialData.upcomingEvents?.nextEarningsDate || 'N/A'}
          </span>
        </div>
        
        <div className="card-row">
          <span className="card-label">Sector</span>
          <span className="card-value-small">
            {financialData.sector || 'N/A'}
          </span>
        </div>
        
        <hr className="my-3 border-color" />
        
        <div className="notes-section">
          <h4 className="card-label mb-1">Notes</h4>
          <EditableField
            value={item.notes}
            field="notes"
            onUpdate={(value) => handleUpdateAimData('notes', value)}
            placeholder="Click to add notes..."
            aria-label="Edit notes"
          />
        </div>
      </div>
      
      <div className="card-footer">
        <button
          onClick={handleGenerateDeepDive}
          className="card-deep-dive-btn"
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

PortfolioCard.displayName = 'PortfolioCard';
