import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  className?: string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  fullScreen?: boolean;
  overlay?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message, 
  className = '',
  variant = 'spinner',
  color = 'primary',
  fullScreen = false,
  overlay = false
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'border-gray-300 border-t-blue-600',
    secondary: 'border-gray-300 border-t-gray-600',
    success: 'border-gray-300 border-t-green-600',
    warning: 'border-gray-300 border-t-yellow-600',
    error: 'border-gray-300 border-t-red-600'
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`${sizeClasses[size]} rounded-full bg-blue-600 animate-pulse`}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        );
      
      case 'pulse':
        return (
          <div className={`${sizeClasses[size]} rounded-full bg-blue-600 animate-pulse`} />
        );
      
      case 'skeleton':
        return (
          <div className="space-y-2 w-full">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        );
      
      default:
        return (
          <div 
            className={`animate-spin rounded-full border-2 ${colorClasses[color]} ${sizeClasses[size]}`}
            role="status"
            aria-label="Loading"
          />
        );
    }
  };

  const content = (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      {renderSpinner()}
      {message && (
        <p className="text-sm text-gray-600 animate-pulse" role="status" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
        {content}
      </div>
    );
  }

  return content;
};
