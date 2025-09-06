import React from 'react';
import type { RangeBarProps } from '../types';

export const RangeBar: React.FC<RangeBarProps> = ({
  low,
  high,
  current,
  average = null,
  width = 100,
}) => {
  if (low == null || high == null || current == null) {
    return <div className="text-xs text-subtle">N/A</div>;
  }

  const range = high - low;
  const currentPosition = range > 0 ? ((current - low) / range) * 100 : 50;
  const avgPosition =
    average != null && range > 0 ? ((average - low) / range) * 100 : null;

  return (
    <div className="range-bar-container" style={{ width }}>
      <div className="range-bar-labels">
        <span>{low.toFixed(2)}</span>
        <span>{high.toFixed(2)}</span>
      </div>
      <div className="range-bar-track" role="progressbar" aria-valuenow={current} aria-valuemin={low} aria-valuemax={high}>
        <div
          className="range-bar-marker"
          style={{
            left: `calc(${Math.max(0, Math.min(100, currentPosition))}% - 5px)`,
          }}
        />
        {avgPosition != null && (
          <div
            className="range-bar-avg-marker"
            style={{
              left: `${Math.max(0, Math.min(100, avgPosition))}%`,
            }}
          />
        )}
      </div>
    </div>
  );
};
