import React, { memo, useMemo } from 'react';
import type { AimDataItem } from '../types';
import { formatPercent } from '../utils/formatters';

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

        <div className="holdings-list">
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
