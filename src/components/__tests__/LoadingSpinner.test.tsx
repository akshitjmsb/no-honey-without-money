import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('w-6', 'h-6');
  });

  it('should render with custom size', () => {
    render(<LoadingSpinner size="lg" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  it('should render with message', () => {
    render(<LoadingSpinner message="Loading data..." />);
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    expect(screen.getByText('Loading data...')).toHaveAttribute('role', 'status');
  });

  it('should render dots variant', () => {
    render(<LoadingSpinner variant="dots" />);
    
    const dots = document.querySelectorAll('.rounded-full');
    expect(dots).toHaveLength(3);
  });

  it('should render pulse variant', () => {
    render(<LoadingSpinner variant="pulse" />);
    
    const pulse = document.querySelector('.animate-pulse');
    expect(pulse).toBeInTheDocument();
  });

  it('should render skeleton variant', () => {
    render(<LoadingSpinner variant="skeleton" />);
    
    const skeletonLines = document.querySelectorAll('.animate-pulse');
    expect(skeletonLines).toHaveLength(3);
  });

  it('should render with different colors', () => {
    const { rerender } = render(<LoadingSpinner color="success" />);
    
    let spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('border-t-green-600');
    
    rerender(<LoadingSpinner color="error" />);
    spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('border-t-red-600');
  });

  it('should render full screen variant', () => {
    render(<LoadingSpinner fullScreen={true} />);
    
    const fullScreenContainer = document.querySelector('.fixed.inset-0');
    expect(fullScreenContainer).toBeInTheDocument();
  });

  it('should render overlay variant', () => {
    render(<LoadingSpinner overlay={true} />);
    
    const overlayContainer = document.querySelector('.absolute.inset-0');
    expect(overlayContainer).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    
    const container = document.querySelector('.custom-class');
    expect(container).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<LoadingSpinner message="Loading..." />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
    
    const message = screen.getByText('Loading...');
    expect(message).toHaveAttribute('role', 'status');
    expect(message).toHaveAttribute('aria-live', 'polite');
  });

  it('should render all size variants correctly', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    
    sizes.forEach(size => {
      const { unmount } = render(<LoadingSpinner size={size} />);
      const spinner = screen.getByRole('status');
      
      if (size === 'xs') {
        expect(spinner).toHaveClass('w-3', 'h-3');
      } else if (size === 'sm') {
        expect(spinner).toHaveClass('w-4', 'h-4');
      } else if (size === 'md') {
        expect(spinner).toHaveClass('w-6', 'h-6');
      } else if (size === 'lg') {
        expect(spinner).toHaveClass('w-8', 'h-8');
      } else if (size === 'xl') {
        expect(spinner).toHaveClass('w-12', 'h-12');
      }
      
      unmount();
    });
  });
});
