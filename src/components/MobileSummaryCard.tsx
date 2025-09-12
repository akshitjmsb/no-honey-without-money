import React, { memo, useMemo } from 'react';
import type { AimDataItem } from '../types';
import { formatPercent } from '../utils/formatters';
import { portfolioData } from '../data/portfolioData';

interface MobileSummaryCardProps {
  aimData: AimDataItem[];
  isCurrent: boolean;
  dragHandlers: {
    onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
    onTouchStart?: (e: React.TouchEvent<HTMLDivElement>) => void;
  };
  style?: React.CSSProperties;
  className?: string;
}

export const MobileSummaryCard: React.FC<MobileSummaryCardProps> = memo(({
  aimData,
  isCurrent,
  dragHandlers,
  style,
  className,
}) => {
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

  return (
    <div
      className={className || `portfolio-card mobile-optimized is-summary`}
      style={style}
      {...dragHandlers}
      role="article"
      aria-label="Portfolio summary"
    >
      <div className="card-header mobile-header">
        <h2 className="card-ticker mobile-ticker">Portfolio Summary</h2>
        <div className="header-right">
          <span className={`allocation-status ${isBalanced ? 'balanced' : 'unbalanced'}`}>
            {isBalanced ? '✓' : '⚠'}
          </span>
        </div>
      </div>
      
      <div className="card-body mobile-body">
        <div className="summary-overview">
          <div className="overview-item">
            <span className="overview-label">Total Allocation</span>
            <span className={`overview-value ${isBalanced ? 'balanced' : 'unbalanced'}`}>
              {formatPercent(totalAllocation)}
            </span>
          </div>
          <div className="overview-item">
            <span className="overview-label">Holdings</span>
            <span className="overview-value">{aimData.length}</span>
          </div>
        </div>

        <div className="sector-breakdown">
          <div className="breakdown-header">
            <span className="breakdown-title">Sector Analysis</span>
          </div>
          <div className="sector-list">
            {sectorBreakdown.map(({ sector, count, percentage }) => (
              <div key={sector} className="sector-item">
                <div className="sector-main">
                  <span className="sector-name">{sector}</span>
                  <span className="sector-count">{count} holdings</span>
                </div>
                <div className="sector-percentage">
                  {formatPercent(percentage)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="holdings-list">
          <div className="holdings-header">
            <span className="holdings-title">Holdings</span>
          </div>
          {aimData.map((item, index) => (
            <div key={item.id} className="holding-item">
              <div className="holding-main">
                <span className="holding-ticker">{item.ticker}</span>
                <span className="holding-currency">{item.currency}</span>
              </div>
              <div className="holding-details">
                <span className="holding-percent">{formatPercent(item.targetPercent)}</span>
                <span className={`holding-status ${item.completed ? 'completed' : 'pending'}`}>
                  {item.completed ? '✓' : '○'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {!isBalanced && (
          <div className="balance-warning">
            <span className="warning-text">
              Portfolio allocation is {totalAllocation > 1 ? 'over' : 'under'} allocated by {formatPercent(Math.abs(totalAllocation - 1))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

MobileSummaryCard.displayName = 'MobileSummaryCard';
