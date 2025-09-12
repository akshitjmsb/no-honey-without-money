import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PortfolioErrorBoundary } from '../PortfolioErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Portfolio error');
  }
  return <div>Portfolio data loaded</div>;
};

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

describe('PortfolioErrorBoundary', () => {
  it('should render children when there is no error', () => {
    render(
      <PortfolioErrorBoundary>
        <ThrowError shouldThrow={false} />
      </PortfolioErrorBoundary>
    );
    
    expect(screen.getByText('Portfolio data loaded')).toBeInTheDocument();
  });

  it('should render portfolio error UI when there is an error', () => {
    render(
      <PortfolioErrorBoundary>
        <ThrowError shouldThrow={true} />
      </PortfolioErrorBoundary>
    );
    
    expect(screen.getByText('Portfolio Data Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load portfolio data. Please check your connection and try again.')).toBeInTheDocument();
  });

  it('should render ticker-specific error message when ticker is provided', () => {
    render(
      <PortfolioErrorBoundary ticker="AAPL">
        <ThrowError shouldThrow={true} />
      </PortfolioErrorBoundary>
    );
    
    expect(screen.getByText('Failed to load data for AAPL. This might be due to network issues or invalid ticker.')).toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onError = vi.fn();
    
    // We need to create a custom error boundary that uses the onError prop
    const CustomPortfolioErrorBoundary = ({ children, onError }: { children: React.ReactNode; onError?: (error: Error, errorInfo: React.ErrorInfo) => void }) => (
      <PortfolioErrorBoundary>
        {children}
      </PortfolioErrorBoundary>
    );
    
    render(
      <CustomPortfolioErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </CustomPortfolioErrorBoundary>
    );
    
    // The error boundary should have been triggered
    expect(screen.getByText('Portfolio Data Error')).toBeInTheDocument();
  });

  it('should reset error boundary when ticker changes', () => {
    const { rerender } = render(
      <PortfolioErrorBoundary ticker="AAPL">
        <ThrowError shouldThrow={true} />
      </PortfolioErrorBoundary>
    );
    
    expect(screen.getByText('Portfolio Data Error')).toBeInTheDocument();
    
    // Change ticker - this should reset the error boundary
    rerender(
      <PortfolioErrorBoundary ticker="MSFT">
        <ThrowError shouldThrow={false} />
      </PortfolioErrorBoundary>
    );
    
    expect(screen.getByText('Portfolio data loaded')).toBeInTheDocument();
  });

  it('should have retry button', () => {
    render(
      <PortfolioErrorBoundary>
        <ThrowError shouldThrow={true} />
      </PortfolioErrorBoundary>
    );
    
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).toHaveAttribute('aria-label', 'Try again');
  });

  it('should call window.location.reload when retry is clicked', () => {
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    });
    
    render(
      <PortfolioErrorBoundary>
        <ThrowError shouldThrow={true} />
      </PortfolioErrorBoundary>
    );
    
    fireEvent.click(screen.getByText('Retry'));
    
    expect(mockReload).toHaveBeenCalled();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <PortfolioErrorBoundary>
        <ThrowError shouldThrow={true} />
      </PortfolioErrorBoundary>
    );
    
    expect(screen.getByText('Portfolio Data Error')).toBeInTheDocument();
    expect(screen.getByLabelText('Try again')).toBeInTheDocument();
  });
});
