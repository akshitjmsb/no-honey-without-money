/**
 * Performance monitoring utility for tracking component render times and API calls
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  type: 'component' | 'api' | 'calculation';
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isEnabled: boolean = process.env.NODE_ENV === 'development';

  /**
   * Start timing a performance metric
   */
  startTiming(name: string): () => void {
    if (!this.isEnabled) return () => {};

    const startTime = performance.now();
    
    return (type: PerformanceMetric['type'] = 'component', metadata?: Record<string, any>) => {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        type,
        metadata
      });
    };
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    if (!this.isEnabled) return;

    this.metrics.push(metric);
    
    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Log slow operations
    if (metric.duration > 100) {
      console.warn(`Slow operation detected: ${metric.name} took ${metric.duration.toFixed(2)}ms`, metric.metadata);
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by type
   */
  getMetricsByType(type: PerformanceMetric['type']): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.type === type);
  }

  /**
   * Get average duration for a specific operation
   */
  getAverageDuration(name: string): number {
    const operationMetrics = this.metrics.filter(metric => metric.name === name);
    if (operationMetrics.length === 0) return 0;
    
    const totalDuration = operationMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    return totalDuration / operationMetrics.length;
  }

  /**
   * Get slowest operations
   */
  getSlowestOperations(limit: number = 10): PerformanceMetric[] {
    return [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalMetrics: number;
    averageDuration: number;
    slowestOperation: PerformanceMetric | null;
    componentMetrics: number;
    apiMetrics: number;
    calculationMetrics: number;
  } {
    if (this.metrics.length === 0) {
      return {
        totalMetrics: 0,
        averageDuration: 0,
        slowestOperation: null,
        componentMetrics: 0,
        apiMetrics: 0,
        calculationMetrics: 0
      };
    }

    const totalDuration = this.metrics.reduce((sum, metric) => sum + metric.duration, 0);
    const slowestOperation = this.getSlowestOperations(1)[0] || null;

    return {
      totalMetrics: this.metrics.length,
      averageDuration: totalDuration / this.metrics.length,
      slowestOperation,
      componentMetrics: this.metrics.filter(m => m.type === 'component').length,
      apiMetrics: this.metrics.filter(m => m.type === 'api').length,
      calculationMetrics: this.metrics.filter(m => m.type === 'calculation').length
    };
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  const startTiming = performanceMonitor.startTiming(componentName);
  
  return {
    startTiming,
    recordMetric: (type: PerformanceMetric['type'], metadata?: Record<string, any>) => {
      performanceMonitor.recordMetric({
        name: componentName,
        duration: 0,
        timestamp: Date.now(),
        type,
        metadata
      });
    }
  };
};

// HOC for automatic performance monitoring
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.memo((props: P) => {
    const { startTiming } = usePerformanceMonitor(componentName);
    
    React.useEffect(() => {
      const endTiming = startTiming();
      return () => endTiming('component');
    });

    return <Component {...props} />;
  });
};

export type { PerformanceMetric };
