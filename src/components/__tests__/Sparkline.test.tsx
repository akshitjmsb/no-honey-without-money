import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sparkline } from '../Sparkline';

describe('Sparkline', () => {
  it('should render sparkline with valid data', () => {
    const data = [100, 105, 102, 108, 110, 107, 112];
    render(<Sparkline data={data} />);
    
    const svg = screen.getByRole('img', { name: /price trend chart/i });
    expect(svg).toBeInTheDocument();
    expect(svg.tagName).toBe('svg');
  });

  it('should render "No Data" message when data is empty', () => {
    render(<Sparkline data={[]} />);
    
    expect(screen.getByText('No Data')).toBeInTheDocument();
  });

  it('should render "No Data" message when data is undefined', () => {
    render(<Sparkline data={undefined} />);
    
    expect(screen.getByText('No Data')).toBeInTheDocument();
  });

  it('should render "No Data" message when data has only one point', () => {
    render(<Sparkline data={[100]} />);
    
    expect(screen.getByText('No Data')).toBeInTheDocument();
  });

  it('should apply custom width and height', () => {
    const data = [100, 105, 102, 108, 110, 107, 112];
    render(<Sparkline data={data} width={200} height={60} />);
    
    const svg = screen.getByRole('img', { name: /price trend chart/i });
    expect(svg).toHaveAttribute('width', '200');
    expect(svg).toHaveAttribute('height', '60');
  });

  it('should apply custom stroke color', () => {
    const data = [100, 105, 102, 108, 110, 107, 112];
    render(<Sparkline data={data} stroke="#ff0000" />);
    
    const polyline = document.querySelector('polyline');
    expect(polyline).toHaveAttribute('stroke', '#ff0000');
  });
});
