import React from 'react';
import type { SparklineProps } from '../types';

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 100,
  height = 30,
  stroke = '#263238',
}) => {
  if (!data || data.length < 2) {
    return (
      <div
        className="sparkline-container-empty"
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span className="text-xs text-subtle">No Data</span>
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d - min) / (range || 1)) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="sparkline-svg"
      role="img"
      aria-label="Price trend chart"
    >
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
      />
    </svg>
  );
};
