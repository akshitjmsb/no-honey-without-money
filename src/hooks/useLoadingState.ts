import { useState, useCallback, useRef, useEffect } from 'react';

interface LoadingState {
  isLoading: boolean;
  error: string | null;
  retryCount: number;
}

interface UseLoadingStateOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

export const useLoadingState = (options: UseLoadingStateOptions = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onSuccess
  } = options;

  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    retryCount: 0
  });

  const retryTimeoutRef = useRef<number | null>(null);

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading, error: isLoading ? null : prev.error }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  const setSuccess = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: false, error: null, retryCount: 0 }));
    onSuccess?.();
  }, [onSuccess]);

  const retry = useCallback(() => {
    setState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      error: null,
      isLoading: true
    }));
  }, []);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    retryOnError: boolean = true
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await operation();
      setSuccess();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      if (retryOnError && state.retryCount < maxRetries) {
        setState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
        
        retryTimeoutRef.current = window.setTimeout(() => {
          executeWithRetry(operation, retryOnError);
        }, retryDelay * Math.pow(2, state.retryCount)); // Exponential backoff
        
        return null;
      } else {
        setError(errorMessage);
        onError?.(error instanceof Error ? error : new Error(errorMessage));
        return null;
      }
    }
  }, [state.retryCount, maxRetries, retryDelay, onError, setLoading, setError, setSuccess]);

  const reset = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    setState({
      isLoading: false,
      error: null,
      retryCount: 0
    });
  }, []);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    setLoading,
    setError,
    setSuccess,
    retry,
    executeWithRetry,
    reset,
    canRetry: state.retryCount < maxRetries
  };
};
