import React, { memo, useMemo } from 'react';
import { useMobileDetection } from '../hooks/useMobileDetection';
import type { AimDataItem } from '../types';
import { formatPercent } from '../utils/formatters';
import { portfolioData } from '../data/portfolioData';

interface UnifiedSummaryCardProps {
  aimData: AimDataItem[];
  isCurrent: boolean;
  dragHandlers: {
    onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
    onTouchStart?: (e: React.TouchEvent<HTMLDivElement>) => void;
  };
  style?: React.CSSProperties;
  className?: string;
}

export const UnifiedSummaryCard: React.FC<UnifiedSummaryCardProps> = memo(({
  aimData,
  isCurrent,
  dragHandlers,
  style,
  className,
}) => {
  const { isMobile } = useMobileDetection();
  
  const totalAllocation = useMemo(() => 
    aimData.reduce((sum, item) => sum + item.targetPercent, 0), 
    [aimData]
  );

  const isBalanced = Math.abs(totalAllocation - 1) < 0.0001;

  // Calculate sector breakdown
  const sectorBreakdown = useMemo(() => {
    const sectors: { [key: string]: { count: number; percentage: number } } = {};
    
    aimData.forEach(item => {
      const portfolioItem = portfolioData.find(p => p.ticker === item.ticker);
      const sector = portfolioItem?.sector || 'Unknown';
      
      if (!sectors[sector]) {
        sectors[sector] = { count: 0, percentage: 0 };
      }
      sectors[sector].count++;
      sectors[sector].percentage += item.targetPercent;
    });
    
    return Object.entries(sectors)
      .map(([sector, data]) => ({ sector, ...data }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [aimData]);

  // Responsive class names
  const cardClasses = `portfolio-card is-summary ${isMobile ? 'mobile-optimized' : 'desktop-optimized'}`;
  const headerClasses = `card-header ${isMobile ? 'mobile-header' : 'desktop-header'}`;
  const bodyClasses = `card-body summary-card-body ${isMobile ? 'mobile-body' : 'desktop-body'}`;

  return (
    <div
      className={className || cardClasses}
      style={style}
      {...dragHandlers}
      role="article"
      aria-label="Portfolio summary"
    >
      <div className={headerClasses}>
        <h2 className={`card-ticker ${isMobile ? 'mobile-ticker' : 'desktop-ticker'}`}>
          Portfolio Summary
        </h2>
        <div className={`summary-status ${isBalanced ? 'balanced' : 'unbalanced'}`}>
          {isBalanced ? '✓ Balanced' : '⚠ Unbalanced'}
        </div>
      </div>
      
      <div className={bodyClasses}>
        {/* Allocation Overview */}
        <div className="allocation-overview">
          <div className="allocation-header">
            <h3 className="allocation-title">Target Allocation</h3>
            <span className={`allocation-total ${isBalanced ? 'balanced' : 'unbalanced'}`}>
              {formatPercent(totalAllocation)}
            </span>
          </div>
          
          {!isBalanced && (
            <div className="allocation-warning">
              <span className="warning-text">
                {totalAllocation > 1 ? 'Over-allocated' : 'Under-allocated'} by {formatPercent(Math.abs(totalAllocation - 1))}
              </span>
            </div>
          )}
        </div>

        {/* Holdings Table */}
        <div className="summary-table">
          <div className="summary-table-header">
            <span>Ticker</span>
            <span>Target %</span>
            {!isMobile && <span>Currency</span>}
            {!isMobile && <span>Status</span>}
          </div>
          
          <div className="summary-table-content">
            {aimData.map((item) => (
              <div key={item.id} className="summary-table-row">
                <span className="ticker-cell">{item.ticker}</span>
                <span className="percentage-cell">{formatPercent(item.targetPercent)}</span>
                {!isMobile && <span className="currency-cell">{item.currency}</span>}
                {!isMobile && (
                  <span className={`status-cell ${item.completed ? 'completed' : 'pending'}`}>
                    {item.completed ? '✓' : '○'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sector Breakdown - Show on mobile and desktop */}
        <div className="sector-breakdown">
          <h3 className="sector-title">Sector Distribution</h3>
          <div className="sector-list">
            {sectorBreakdown.map(({ sector, count, percentage }) => (
              <div key={sector} className="sector-item">
                <div className="sector-info">
                  <span className="sector-name">{sector}</span>
                  <span className="sector-count">{count} holding{count !== 1 ? 's' : ''}</span>
                </div>
                <div className="sector-bar">
                  <div 
                    className="sector-bar-fill" 
                    style={{ width: `${percentage * 100}%` }}
                  ></div>
                  <span className="sector-percentage">{formatPercent(percentage)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats - Desktop only */}
        {!isMobile && (
          <div className="quick-stats">
            <div className="stat-item">
              <span className="stat-label">Total Holdings</span>
              <span className="stat-value">{aimData.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Completed</span>
              <span className="stat-value">{aimData.filter(item => item.completed).length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Pending</span>
              <span className="stat-value">{aimData.filter(item => !item.completed).length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Sectors</span>
              <span className="stat-value">{sectorBreakdown.length}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

UnifiedSummaryCard.displayName = 'UnifiedSummaryCard';
