import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sparkline } from '../Sparkline';

describe('Sparkline', () => {
  it('should render with valid data', () => {
    const data = [1, 2, 3, 4, 5];
    render(<Sparkline data={data} />);
    
    const svg = screen.getByRole('img', { name: 'Price trend chart' });
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '100');
    expect(svg).toHaveAttribute('height', '30');
  });

  it('should render with custom dimensions', () => {
    const data = [1, 2, 3, 4, 5];
    render(<Sparkline data={data} width={200} height={50} />);
    
    const svg = screen.getByRole('img', { name: 'Price trend chart' });
    expect(svg).toHaveAttribute('width', '200');
    expect(svg).toHaveAttribute('height', '50');
  });

  it('should render with custom stroke color', () => {
    const data = [1, 2, 3, 4, 5];
    render(<Sparkline data={data} stroke="#ff0000" />);
    
    const polyline = screen.getByRole('img', { name: 'Price trend chart' }).querySelector('polyline');
    expect(polyline).toHaveAttribute('stroke', '#ff0000');
  });

  it('should render "No Data" message when data is empty', () => {
    render(<Sparkline data={[]} />);
    expect(screen.getByText('No Data')).toBeInTheDocument();
  });

  it('should render "No Data" message when data is undefined', () => {
    render(<Sparkline data={undefined} />);
    expect(screen.getByText('No Data')).toBeInTheDocument();
  });

  it('should render "No Data" message when data has less than 2 points', () => {
    render(<Sparkline data={[1]} />);
    expect(screen.getByText('No Data')).toBeInTheDocument();
  });

  it('should handle negative values', () => {
    const data = [-1, -2, -3, -4, -5];
    render(<Sparkline data={data} />);
    
    const svg = screen.getByRole('img', { name: 'Price trend chart' });
    expect(svg).toBeInTheDocument();
  });

  it('should handle mixed positive and negative values', () => {
    const data = [-1, 2, -3, 4, -5];
    render(<Sparkline data={data} />);
    
    const svg = screen.getByRole('img', { name: 'Price trend chart' });
    expect(svg).toBeInTheDocument();
  });

  it('should handle zero values', () => {
    const data = [0, 0, 0, 0, 0];
    render(<Sparkline data={data} />);
    
    const svg = screen.getByRole('img', { name: 'Price trend chart' });
    expect(svg).toBeInTheDocument();
  });

  it('should handle large numbers', () => {
    const data = [1000000, 2000000, 3000000, 4000000, 5000000];
    render(<Sparkline data={data} />);
    
    const svg = screen.getByRole('img', { name: 'Price trend chart' });
    expect(svg).toBeInTheDocument();
  });

  it('should handle decimal values', () => {
    const data = [1.1, 2.2, 3.3, 4.4, 5.5];
    render(<Sparkline data={data} />);
    
    const svg = screen.getByRole('img', { name: 'Price trend chart' });
    expect(svg).toBeInTheDocument();
  });
});