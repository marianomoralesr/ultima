import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '../index.css';
import { AuthProvider } from './context/AuthContext';
import { FilterProvider } from './context/FilterContext';
import { QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './components/ErrorBoundary';
import { ConfigProvider } from './context/ConfigContext';
import { UpdateProvider } from './contexts/UpdateContext';
import { conversionTracking } from './services/ConversionTrackingService';
import serviceWorkerRegistration from './utils/serviceWorkerRegistration';
import { queryClient } from './utils/queryClientConfig';
import performanceMonitor from './utils/performanceMonitoring';

// Initialize conversion tracking on app startup
conversionTracking.initialize();

// Register service worker for caching and offline functionality
if (import.meta.env.PROD) {
  serviceWorkerRegistration.register({
    onSuccess: () => console.log('Service Worker registered successfully'),
    onUpdate: () => console.log('New content available, refresh to update'),
    onError: (error) => console.error('Service Worker registration failed:', error),
  });
}

// Setup performance monitoring
if (typeof window !== 'undefined') {
  performanceMonitor.onReport((metrics) => {
    // Log metrics to console in development
    if (import.meta.env.DEV) {
      console.log('Performance Metrics:', performanceMonitor.formatMetrics());
    }
    // In production, you could send these to an analytics service
  });

  // Track app initialization time
  performanceMonitor.mark('app-init-start');
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <UpdateProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <FilterProvider>
              <ConfigProvider>
                <BrowserRouter>
                  <App />
                </BrowserRouter>
              </ConfigProvider>
            </FilterProvider>
          </AuthProvider>
        </QueryClientProvider>
      </UpdateProvider>
    </ErrorBoundary>
  </React.StrictMode>
);