import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLoadingState } from '../useLoadingState';

describe('useLoadingState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useLoadingState());
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.retryCount).toBe(0);
    expect(result.current.canRetry).toBe(true);
  });

  it('should set loading state', () => {
    const { result } = renderHook(() => useLoadingState());
    
    act(() => {
      result.current.setLoading(true);
    });
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('should set error state', () => {
    const { result } = renderHook(() => useLoadingState());
    
    act(() => {
      result.current.setError('Test error');
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Test error');
  });

  it('should set success state', () => {
    const { result } = renderHook(() => useLoadingState());
    const onSuccess = vi.fn();
    
    const { rerender } = renderHook(() => useLoadingState({ onSuccess }));
    
    act(() => {
      result.current.setSuccess();
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.retryCount).toBe(0);
  });

  it('should retry operation', () => {
    const { result } = renderHook(() => useLoadingState());
    
    act(() => {
      result.current.retry();
    });
    
    expect(result.current.retryCount).toBe(1);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('should execute operation with retry on success', async () => {
    const { result } = renderHook(() => useLoadingState());
    const mockOperation = vi.fn().mockResolvedValue('success');
    
    let operationResult;
    await act(async () => {
      operationResult = await result.current.executeWithRetry(mockOperation);
    });
    
    expect(operationResult).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should retry operation on failure', async () => {
    const { result } = renderHook(() => useLoadingState({ maxRetries: 2, retryDelay: 10 }));
    const mockOperation = vi.fn().mockRejectedValue(new Error('Test error'));
    
    await act(async () => {
      await result.current.executeWithRetry(mockOperation);
    });
    
    expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    expect(result.current.error).toBe('Test error');
    expect(result.current.isLoading).toBe(false);
  });

  it('should not retry when retryOnError is false', async () => {
    const { result } = renderHook(() => useLoadingState());
    const mockOperation = vi.fn().mockRejectedValue(new Error('Test error'));
    
    await act(async () => {
      await result.current.executeWithRetry(mockOperation, false);
    });
    
    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBe('Test error');
  });

  it('should reset state', () => {
    const { result } = renderHook(() => useLoadingState());
    
    act(() => {
      result.current.setLoading(true);
      result.current.setError('Test error');
    });
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.retryCount).toBe(0);
  });

  it('should call onError callback', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useLoadingState({ onError }));
    const mockOperation = vi.fn().mockRejectedValue(new Error('Test error'));
    
    await act(async () => {
      await result.current.executeWithRetry(mockOperation, false);
    });
    
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should call onSuccess callback', () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useLoadingState({ onSuccess }));
    
    act(() => {
      result.current.setSuccess();
    });
    
    expect(onSuccess).toHaveBeenCalled();
  });
});
