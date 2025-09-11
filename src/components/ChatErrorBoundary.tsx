import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface ChatErrorBoundaryProps {
  children: React.ReactNode;
}

const ChatErrorFallback: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="chat-error-fallback">
    <div className="error-content">
      <div className="error-icon">💬</div>
      <h3>Chat Service Error</h3>
      <p>
        The AI chat service is temporarily unavailable. This might be due to high demand or service maintenance.
      </p>
      <div className="error-actions">
        <button onClick={onRetry} className="retry-button">
          Try Again
        </button>
      </div>
    </div>
  </div>
);

export const ChatErrorBoundary: React.FC<ChatErrorBoundaryProps> = ({ children }) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Chat Error:', {
      error: error.message,
      componentStack: errorInfo.componentStack
    });
  };

  return (
    <ErrorBoundary
      onError={handleError}
      fallback={
        <ChatErrorFallback 
          onRetry={() => window.location.reload()} 
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
};
