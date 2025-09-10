import React, { memo, useMemo } from 'react';
import type { AimDataItem } from '../types';
import { formatPercent } from '../utils/formatters';

interface SummaryCardProps {
  aimData: AimDataItem[];
  isCurrent: boolean;
  dragHandlers: {
    onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
    onTouchStart?: (e: React.TouchEvent<HTMLDivElement>) => void;
  };
  style?: React.CSSProperties;
  className?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = memo(({
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

  return (
    <div
      className={className || `portfolio-card is-summary`}
      style={style}
      {...dragHandlers}
      role="article"
      aria-label="Portfolio summary"
    >
      <div className="card-header">
        <h2 className="card-ticker">Portfolio Summary</h2>
      </div>
      
      <div className="card-body summary-card-body">
        <div className="summary-table-header">
          <span>Ticker</span>
          <span>Target %</span>
        </div>
        
        <div className="summary-table-content">
          {aimData.map((item) => (
            <div key={item.id} className="summary-table-row">
              <span>{item.ticker}</span>
              <span>{formatPercent(item.targetPercent)}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="summary-card-footer">
        <div className="summary-table-row is-total">
          <span>Total Allocation</span>
          <span className={Math.abs(totalAllocation - 1) < 0.0001 ? 'buy-color' : 'sell-color'}>
            {formatPercent(totalAllocation)}
          </span>
        </div>
      </div>
    </div>
  );
});

SummaryCard.displayName = 'SummaryCard';
