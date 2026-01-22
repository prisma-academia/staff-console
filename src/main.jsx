import { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Loader from './components/loader';
import { useErrorStore } from './store/error-store';

const App = lazy(() => import('./app'));

const root = ReactDOM.createRoot(document.getElementById('root'));

// Configure React Query with global error handler
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      onError: (error) => {
        // Only show modal for unhandled critical errors
        // Errors with status 403 and 500+ are already handled in api.js
        // This catches other unhandled errors
        if (error?.status !== 403 && error?.status !== 401 && (!error?.status || error?.status < 500)) {
          // Let components handle these errors (they might want to show snackbars)
          return;
        }
        
        // For critical unhandled errors, show modal
        if (error?.status >= 500 || !error?.status) {
          const { showError } = useErrorStore.getState();
          showError({
            title: 'Error',
            message: error?.message || 'An unexpected error occurred. Please try again.',
            details: error,
          });
        }
      },
    },
    mutations: {
      onError: (error) => {
        // Only show modal for unhandled critical errors
        // Errors with status 403 and 500+ are already handled in api.js
        if (error?.status === 403 || error?.status >= 500) {
          // Already handled in api.js
          
        }
        
        // For other unhandled errors, let components handle them
        // (they might want to show snackbars or handle differently)
      },
    },
  },
});


root.render(
  <HelmetProvider>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<Loader />}>
          <App />
        </Suspense>
      </QueryClientProvider>
    </BrowserRouter>
  </HelmetProvider>
);
