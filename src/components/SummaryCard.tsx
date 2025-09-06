import React from 'react';
import type { AimDataItem } from '../types';
import { formatPercent } from '../utils/formatters';

interface SummaryCardProps {
  aimData: AimDataItem[];
  isCurrent: boolean;
  dragHandlers: {
    onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
    onMouseMove?: (e: React.MouseEvent<HTMLDivElement>) => void;
    onMouseUp?: (e: React.MouseEvent<HTMLDivElement>) => void;
    onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;
    onTouchStart?: (e: React.TouchEvent<HTMLDivElement>) => void;
    onTouchMove?: (e: React.TouchEvent<HTMLDivElement>) => void;
    onTouchEnd?: (e: React.TouchEvent<HTMLDivElement>) => void;
  };
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  aimData,
  isCurrent,
  dragHandlers,
}) => {
  const totalAllocation = aimData.reduce((sum, item) => sum + item.targetPercent, 0);

  return (
    <div
      className={`portfolio-card ${isCurrent ? 'is-front' : ''}`}
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
};
