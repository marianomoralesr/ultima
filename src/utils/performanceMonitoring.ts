// Performance Monitoring Utility
// Tracks Core Web Vitals and custom performance metrics

interface PerformanceMetrics {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
  INP?: number; // Interaction to Next Paint
  customMetrics: Record<string, number>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    customMetrics: {}
  };
  private observers: PerformanceObserver[] = [];
  private reportCallback?: (metrics: PerformanceMetrics) => void;

  constructor() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      this.initializeObservers();
    }
  }

  private initializeObservers(): void {
    // Observe Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.metrics.LCP = lastEntry.renderTime || lastEntry.loadTime;
        this.report();
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(lcpObserver);
    } catch (e) {
      console.debug('LCP observer not supported');
    }

    // Observe First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstInput = entries[0] as any;
        this.metrics.FID = firstInput.processingStart - firstInput.startTime;
        this.report();
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      this.observers.push(fidObserver);
    } catch (e) {
      console.debug('FID observer not supported');
    }

    // Observe Cumulative Layout Shift
    try {
      // Check if layout-shift is supported before observing
      if (PerformanceObserver.supportedEntryTypes?.includes('layout-shift')) {
        let clsValue = 0;
        let clsEntries: any[] = [];

        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              clsEntries.push(entry);
            }
          }
          this.metrics.CLS = clsValue;
          this.report();
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        this.observers.push(clsObserver);
      }
    } catch (e) {
      // Silently ignore if not supported
    }

    // Observe First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          this.metrics.FCP = fcpEntry.startTime;
          this.report();
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
      this.observers.push(fcpObserver);
    } catch (e) {
      console.debug('FCP observer not supported');
    }

    // Calculate Time to First Byte
    if (performance.timing) {
      this.metrics.TTFB = performance.timing.responseStart - performance.timing.requestStart;
    }

    // Observe Interaction to Next Paint (INP)
    try {
      let inpValue = 0;
      const inpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any) {
          if (entry.interactionId) {
            const duration = entry.duration;
            if (duration > inpValue) {
              inpValue = duration;
              this.metrics.INP = inpValue;
              this.report();
            }
          }
        }
      });
      inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 40 });
      this.observers.push(inpObserver);
    } catch (e) {
      console.debug('INP observer not supported');
    }

    // Monitor page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.reportFinal();
      }
    });

    // Report on page unload
    window.addEventListener('beforeunload', () => {
      this.reportFinal();
    });
  }

  // Track custom performance marks
  public mark(name: string): void {
    if (performance && performance.mark) {
      performance.mark(name);
    }
  }

  // Measure time between two marks
  public measure(name: string, startMark: string, endMark?: string): number {
    if (!performance || !performance.measure) return 0;

    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }

      const measures = performance.getEntriesByName(name, 'measure');
      const measure = measures[measures.length - 1];

      if (measure) {
        this.metrics.customMetrics[name] = measure.duration;
        return measure.duration;
      }
    } catch (error) {
      console.debug(`Failed to measure ${name}:`, error);
    }

    return 0;
  }

  // Track resource loading performance
  public getResourceTimings(): PerformanceResourceTiming[] {
    if (!performance || !performance.getEntriesByType) return [];

    return performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  }

  // Get slow resources (> 1 second)
  public getSlowResources(threshold: number = 1000): PerformanceResourceTiming[] {
    return this.getResourceTimings().filter(resource => resource.duration > threshold);
  }

  // Track long tasks
  public observeLongTasks(callback: (entries: PerformanceEntry[]) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ type: 'longtask', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      console.debug('Long task observer not supported');
    }
  }

  // Set callback for reporting metrics
  public onReport(callback: (metrics: PerformanceMetrics) => void): void {
    this.reportCallback = callback;
  }

  // Report current metrics
  private report(): void {
    if (this.reportCallback) {
      this.reportCallback(this.metrics);
    }
  }

  // Final report before page unload
  private reportFinal(): void {
    this.report();

    // Send metrics to analytics or monitoring service
    if (navigator.sendBeacon) {
      const data = JSON.stringify({
        ...this.metrics,
        url: window.location.href,
        timestamp: Date.now(),
      });

      // You can send to your analytics endpoint
      // navigator.sendBeacon('/api/metrics', data);
    }
  }

  // Get current metrics
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Clean up observers
  public disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  // Check if metrics are good, average, or poor
  public getMetricRating(metricName: keyof PerformanceMetrics, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, [number, number]> = {
      LCP: [2500, 4000], // Good < 2.5s, Poor > 4s
      FID: [100, 300],   // Good < 100ms, Poor > 300ms
      CLS: [0.1, 0.25],  // Good < 0.1, Poor > 0.25
      FCP: [1800, 3000], // Good < 1.8s, Poor > 3s
      TTFB: [800, 1800], // Good < 0.8s, Poor > 1.8s
      INP: [200, 500],   // Good < 200ms, Poor > 500ms
    };

    const threshold = thresholds[metricName as string];
    if (!threshold) return 'needs-improvement';

    if (value <= threshold[0]) return 'good';
    if (value >= threshold[1]) return 'poor';
    return 'needs-improvement';
  }

  // Format metrics for display
  public formatMetrics(): Record<string, string> {
    const formatted: Record<string, string> = {};

    if (this.metrics.LCP !== undefined) {
      formatted.LCP = `${this.metrics.LCP.toFixed(0)}ms`;
    }
    if (this.metrics.FID !== undefined) {
      formatted.FID = `${this.metrics.FID.toFixed(0)}ms`;
    }
    if (this.metrics.CLS !== undefined) {
      formatted.CLS = this.metrics.CLS.toFixed(3);
    }
    if (this.metrics.FCP !== undefined) {
      formatted.FCP = `${this.metrics.FCP.toFixed(0)}ms`;
    }
    if (this.metrics.TTFB !== undefined) {
      formatted.TTFB = `${this.metrics.TTFB.toFixed(0)}ms`;
    }
    if (this.metrics.INP !== undefined) {
      formatted.INP = `${this.metrics.INP.toFixed(0)}ms`;
    }

    Object.entries(this.metrics.customMetrics).forEach(([key, value]) => {
      formatted[key] = `${value.toFixed(0)}ms`;
    });

    return formatted;
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export for use in components
export default performanceMonitor;

// Export types
export type { PerformanceMetrics };