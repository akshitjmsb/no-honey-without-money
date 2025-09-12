import { describe, it, expect } from 'vitest';
import { render, screen } from 'vitest';
import { RangeBar } from '../RangeBar';

describe('RangeBar', () => {
  it('should render with valid data', () => {
    render(<RangeBar low={10} high={100} current={50} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveAttribute('aria-valuemin', '10');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('should render with custom width', () => {
    render(<RangeBar low={10} high={100} current={50} width="200px" />);
    
    const container = screen.getByRole('progressbar').closest('div');
    expect(container).toHaveStyle('width: 200px');
  });

  it('should render with average value', () => {
    render(<RangeBar low={10} high={100} current={50} average={60} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('should render "N/A" when low is null', () => {
    render(<RangeBar low={null} high={100} current={50} />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('should render "N/A" when high is null', () => {
    render(<RangeBar low={10} high={null} current={50} />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('should render "N/A" when current is null', () => {
    render(<RangeBar low={10} high={100} current={null} />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('should render "N/A" when low is undefined', () => {
    render(<RangeBar low={undefined} high={100} current={50} />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('should render "N/A" when high is undefined', () => {
    render(<RangeBar low={10} high={undefined} current={50} />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('should render "N/A" when current is undefined', () => {
    render(<RangeBar low={10} high={100} current={undefined} />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('should handle current value at low end', () => {
    render(<RangeBar low={10} high={100} current={10} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('should handle current value at high end', () => {
    render(<RangeBar low={10} high={100} current={100} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('should handle current value below low', () => {
    render(<RangeBar low={10} high={100} current={5} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('should handle current value above high', () => {
    render(<RangeBar low={10} high={100} current={150} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('should handle zero values', () => {
    render(<RangeBar low={0} high={0} current={0} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('should handle negative values', () => {
    render(<RangeBar low={-10} high={10} current={0} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('should display correct labels', () => {
    render(<RangeBar low={10.5} high={100.75} current={50.25} />);
    
    expect(screen.getByText('10.50')).toBeInTheDocument();
    expect(screen.getByText('100.75')).toBeInTheDocument();
  });
});
