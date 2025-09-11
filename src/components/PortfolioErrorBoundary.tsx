import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface PortfolioErrorBoundaryProps {
  children: React.ReactNode;
  ticker?: string;
}

const PortfolioErrorFallback: React.FC<{ ticker?: string; onRetry: () => void }> = ({ 
  ticker, 
  onRetry 
}) => (
  <div className="portfolio-error-fallback">
    <div className="error-content">
      <div className="error-icon">📊</div>
      <h3>Portfolio Data Error</h3>
      <p>
        {ticker 
          ? `Failed to load data for ${ticker}. This might be due to network issues or invalid ticker.`
          : 'Failed to load portfolio data. Please check your connection and try again.'
        }
      </p>
      <div className="error-actions">
        <button onClick={onRetry} className="retry-button">
          Retry
        </button>
      </div>
    </div>
  </div>
);

export const PortfolioErrorBoundary: React.FC<PortfolioErrorBoundaryProps> = ({ 
  children, 
  ticker 
}) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Portfolio Error:', {
      ticker,
      error: error.message,
      componentStack: errorInfo.componentStack
    });
  };

  return (
    <ErrorBoundary
      onError={handleError}
      resetKeys={[ticker]}
      fallback={
        <PortfolioErrorFallback 
          ticker={ticker} 
          onRetry={() => window.location.reload()} 
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
};
