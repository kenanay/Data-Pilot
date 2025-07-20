/*
Data Pipeline Dashboard - Performance Monitor Utility

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited

Performance monitoring utilities for tracking component render times,
memory usage, and optimization metrics with Turkish character support.
*/

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  // Start timing a performance metric
  startTiming(label) {
    if (!this.isEnabled) return;
    
    const startTime = performance.now();
    this.metrics.set(label, {
      startTime,
      type: 'timing'
    });
  }

  // End timing and record the duration
  endTiming(label) {
    if (!this.isEnabled) return;
    
    const metric = this.metrics.get(label);
    if (!metric || metric.type !== 'timing') {
      console.warn(`Performance timing '${label}' not found or invalid`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    this.metrics.set(label, {
      ...metric,
      endTime,
      duration,
      completed: true
    });

    // Log slow operations (> 100ms)
    if (duration > 100) {
      console.warn(`Slow operation detected: ${label} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  // Measure component render time
  measureRender(componentName, renderFn) {
    if (!this.isEnabled) return renderFn();

    const label = `render_${componentName}`;
    this.startTiming(label);
    
    try {
      const result = renderFn();
      this.endTiming(label);
      return result;
    } catch (error) {
      this.endTiming(label);
      throw error;
    }
  }

  // Measure async operations
  async measureAsync(label, asyncFn) {
    if (!this.isEnabled) return await asyncFn();

    this.startTiming(label);
    
    try {
      const result = await asyncFn();
      this.endTiming(label);
      return result;
    } catch (error) {
      this.endTiming(label);
      throw error;
    }
  }

  // Monitor memory usage
  recordMemoryUsage(label) {
    if (!this.isEnabled || !performance.memory) return;

    const memory = {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit,
      timestamp: Date.now()
    };

    this.metrics.set(`memory_${label}`, {
      type: 'memory',
      ...memory
    });

    // Warn if memory usage is high (> 80% of limit)
    if (memory.used / memory.limit > 0.8) {
      console.warn(`High memory usage detected: ${(memory.used / 1024 / 1024).toFixed(2)}MB`);
    }

    return memory;
  }

  // Monitor Turkish text processing performance
  measureTurkishTextProcessing(text, processingFn) {
    if (!this.isEnabled) return processingFn(text);

    const hasTurkishChars = /[çğıöşüÇĞIİÖŞÜ]/.test(text);
    const label = `turkish_text_${hasTurkishChars ? 'with' : 'without'}_chars`;
    
    this.startTiming(label);
    
    try {
      const result = processingFn(text);
      const duration = this.endTiming(label);
      
      // Track Turkish character processing performance
      if (hasTurkishChars && duration > 50) {
        console.warn(`Slow Turkish text processing: ${duration.toFixed(2)}ms for ${text.length} characters`);
      }
      
      return result;
    } catch (error) {
      this.endTiming(label);
      throw error;
    }
  }

  // Monitor large dataset operations
  measureDatasetOperation(datasetSize, operation, operationFn) {
    if (!this.isEnabled) return operationFn();

    const label = `dataset_${operation}_${datasetSize}`;
    this.startTiming(label);
    
    try {
      const result = operationFn();
      const duration = this.endTiming(label);
      
      // Calculate performance per item
      const perItemTime = duration / datasetSize;
      
      if (perItemTime > 1) { // More than 1ms per item
        console.warn(`Slow dataset operation: ${operation} took ${perItemTime.toFixed(2)}ms per item`);
      }
      
      return result;
    } catch (error) {
      this.endTiming(label);
      throw error;
    }
  }

  // Create a performance observer for specific metrics
  observeMetric(metricType, callback) {
    if (!this.isEnabled) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          callback(entry);
        });
      });

      observer.observe({ entryTypes: [metricType] });
      this.observers.set(metricType, observer);
    } catch (error) {
      console.warn(`Failed to observe metric type: ${metricType}`, error);
    }
  }

  // Get performance summary
  getSummary() {
    if (!this.isEnabled) return {};

    const summary = {
      timings: {},
      memory: {},
      totalMetrics: this.metrics.size
    };

    for (const [label, metric] of this.metrics.entries()) {
      if (metric.type === 'timing' && metric.completed) {
        summary.timings[label] = {
          duration: metric.duration,
          startTime: metric.startTime,
          endTime: metric.endTime
        };
      } else if (metric.type === 'memory') {
        summary.memory[label] = {
          used: metric.used,
          total: metric.total,
          limit: metric.limit,
          timestamp: metric.timestamp
        };
      }
    }

    return summary;
  }

  // Clear all metrics
  clear() {
    this.metrics.clear();
  }

  // Disable monitoring
  disable() {
    this.isEnabled = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  // Enable monitoring
  enable() {
    this.isEnabled = true;
  }

  // Export metrics for analysis
  exportMetrics() {
    const summary = this.getSummary();
    const blob = new Blob([JSON.stringify(summary, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const monitor = React.useMemo(() => new PerformanceMonitor(), []);
  
  React.useEffect(() => {
    return () => {
      monitor.disable();
    };
  }, [monitor]);

  return monitor;
};

// Higher-order component for performance monitoring
export const withPerformanceMonitor = (WrappedComponent, componentName) => {
  const MonitoredComponent = React.memo((props) => {
    const monitor = usePerformanceMonitor();
    
    return monitor.measureRender(componentName || WrappedComponent.name, () => (
      <WrappedComponent {...props} />
    ));
  });

  MonitoredComponent.displayName = `withPerformanceMonitor(${componentName || WrappedComponent.name})`;
  
  return MonitoredComponent;
};

// Utility functions
export const measureComponentRender = (componentName, renderFn) => {
  return performanceMonitor.measureRender(componentName, renderFn);
};

export const measureTurkishTextProcessing = (text, processingFn) => {
  return performanceMonitor.measureTurkishTextProcessing(text, processingFn);
};

export const measureDatasetOperation = (datasetSize, operation, operationFn) => {
  return performanceMonitor.measureDatasetOperation(datasetSize, operation, operationFn);
};

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Performance monitoring decorator
export const performanceDecorator = (target, propertyKey, descriptor) => {
  const originalMethod = descriptor.value;
  
  descriptor.value = function(...args) {
    const label = `${target.constructor.name}.${propertyKey}`;
    performanceMonitor.startTiming(label);
    
    try {
      const result = originalMethod.apply(this, args);
      
      if (result instanceof Promise) {
        return result.finally(() => {
          performanceMonitor.endTiming(label);
        });
      } else {
        performanceMonitor.endTiming(label);
        return result;
      }
    } catch (error) {
      performanceMonitor.endTiming(label);
      throw error;
    }
  };
  
  return descriptor;
};

export default PerformanceMonitor;