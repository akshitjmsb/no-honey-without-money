import React, { memo, useMemo, useCallback } from 'react';
import { Sparkline } from './Sparkline';
import { RangeBar } from './RangeBar';
import { EditableField } from './EditableField';
import { LoadingSpinner } from './LoadingSpinner';
import { useMobileDetection } from '../hooks/useMobileDetection';
import type { AimDataItem, Holding, FinancialData } from '../types';
import { formatCurrency } from '../utils/formatters';

interface UnifiedPortfolioCardProps {
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

export const UnifiedPortfolioCard: React.FC<UnifiedPortfolioCardProps> = memo(({
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
  const { isMobile } = useMobileDetection();
  
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

  // Responsive class names
  const cardClasses = `portfolio-card ${isMobile ? 'mobile-optimized' : 'desktop-optimized'} ${item.completed ? 'is-completed' : ''} ${isCurrent ? 'is-current' : ''}`;
  const headerClasses = `card-header ${isMobile ? 'mobile-header' : 'desktop-header'}`;
  const bodyClasses = `card-body ${isMobile ? 'mobile-body' : 'desktop-body'}`;
  const footerClasses = `card-footer ${isMobile ? 'mobile-footer' : 'desktop-footer'}`;

  return (
    <div
      className={className || cardClasses}
      style={style}
      {...dragHandlers}
      role="article"
      aria-label={`Portfolio card for ${item.ticker}`}
    >
      {/* Responsive Header */}
      <div className={headerClasses}>
        <div className="header-left">
          <h2 className={`card-ticker ${isMobile ? 'mobile-ticker' : 'desktop-ticker'}`}>
            <EditableField
              value={item.ticker}
              field="ticker"
              onUpdate={(value) => handleUpdateAimData('ticker', value)}
              className={`ticker-input-card ${isMobile ? 'mobile-ticker-input' : 'desktop-ticker-input'}`}
              aria-label="Edit ticker symbol"
            />
          </h2>
          <div className="header-meta">
            <span className={`card-type ${isMobile ? 'mobile-type' : 'desktop-type'}`}>{item.currency}</span>
            {financialData.newsSentiment && (
              <span className={`sentiment-badge ${isMobile ? 'mobile-sentiment' : 'desktop-sentiment'} ${sentiment}`} role="status">
                {financialData.newsSentiment.sentiment}
              </span>
            )}
          </div>
        </div>
        <div className="header-right">
          <label className={`completed-toggle ${isMobile ? 'mobile-toggle' : 'desktop-toggle'}`} aria-label={`Mark ${item.ticker} as completed`}>
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
      
      {/* Completed Badge */}
      {item.completed && (
        <div className={`completed-badge-overlay ${isMobile ? 'mobile-completed' : 'desktop-completed'}`} role="status" aria-live="polite">
          ✓
        </div>
      )}
      
      {/* Progress Bar */}
      <div className={`progress-bar-container ${isMobile ? 'mobile-progress' : 'desktop-progress'}`} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar" style={{ width: `${Math.min(100, progress)}%` }}></div>
      </div>

      {/* Responsive Content Area */}
      <div className={bodyClasses}>
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
              onClick={handleRetry} 
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
                <Sparkline data={financialData.priceHistory24h} width={isMobile ? 60 : 80} height={isMobile ? 20 : 24} />
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
              onUpdate={(value) => handleUpdateAimData('targetPercent', value)}
              className={isMobile ? 'mobile-input' : 'desktop-input'}
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
              onUpdate={(value) => handleUpdateHolding('numberOfShares', value)}
              className={isMobile ? 'mobile-input' : 'desktop-input'}
              aria-label="Edit number of shares"
            />
          </div>
          
          <div className="holding-row">
            <span className="holding-label">Avg Cost</span>
            <EditableField
              value={holding.costPerShare}
              field="costPerShare"
              onUpdate={(value) => handleUpdateHolding('costPerShare', value)}
              className={isMobile ? 'mobile-input' : 'desktop-input'}
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
          
          <div className="analysis-row">
            <span className="analysis-label">Sector</span>
            <span className="analysis-value">
              {financialData.sector || 'N/A'}
            </span>
          </div>
        </div>
        
        {/* Notes Section */}
        <div className={`notes-section ${isMobile ? 'mobile-notes' : 'desktop-notes'}`}>
          <span className="notes-label">Notes</span>
          <EditableField
            value={item.notes}
            field="notes"
            onUpdate={(value) => handleUpdateAimData('notes', value)}
            placeholder="Add notes..."
            className={isMobile ? 'mobile-textarea' : 'desktop-textarea'}
            aria-label="Edit notes"
          />
        </div>
      </div>
      
      {/* Responsive Footer */}
      <div className={footerClasses}>
        <button
          onClick={handleGenerateDeepDive}
          className={`card-deep-dive-btn ${isMobile ? 'mobile-deep-dive' : 'desktop-deep-dive'}`}
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

UnifiedPortfolioCard.displayName = 'UnifiedPortfolioCard';
