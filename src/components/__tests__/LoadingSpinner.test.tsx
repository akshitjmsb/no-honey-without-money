import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default props', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with custom message', () => {
    render(<LoadingSpinner message="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(screen.getByRole('status')).toHaveClass('w-4', 'h-4');

    rerender(<LoadingSpinner size="lg" />);
    expect(screen.getByRole('status')).toHaveClass('w-8', 'h-8');
  });

  it('should render with different variants', () => {
    const { rerender } = render(<LoadingSpinner variant="dots" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<LoadingSpinner variant="pulse" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<LoadingSpinner variant="skeleton" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render with different colors', () => {
    const { rerender } = render(<LoadingSpinner color="success" />);
    expect(screen.getByRole('status')).toHaveClass('border-t-green-600');

    rerender(<LoadingSpinner color="error" />);
    expect(screen.getByRole('status')).toHaveClass('border-t-red-600');
  });

  it('should render full screen when fullScreen is true', () => {
    render(<LoadingSpinner fullScreen message="Loading..." />);
    const container = screen.getByRole('status').closest('.fixed');
    expect(container).toHaveClass('fixed', 'inset-0');
  });

  it('should render overlay when overlay is true', () => {
    render(<LoadingSpinner overlay message="Loading..." />);
    const container = screen.getByRole('status').closest('.absolute');
    expect(container).toHaveClass('absolute', 'inset-0');
  });

  it('should apply custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    const container = screen.getByRole('status').closest('div');
    expect(container).toHaveClass('custom-class');
  });
});