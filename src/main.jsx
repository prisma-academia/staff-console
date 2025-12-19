import Lottie from "lottie-react";
import { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import animationData from './assets/animation.json';

const App = lazy(() => import('./app'));

const root = ReactDOM.createRoot(document.getElementById('root'));
const queryClient = new QueryClient({});

const Loader = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
    }}
  >
    <Lottie animationData={animationData} style={{ width: 200, height: 200 }} />
  </div>
);

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
