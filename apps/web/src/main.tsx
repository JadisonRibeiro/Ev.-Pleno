import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import App from './App';
import { Toaster } from './components/ui/Toaster';
import 'leaflet/dist/leaflet.css';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Não retentar em 401/403 — credencial não vai "melhorar" retentando.
      retry: (failureCount, error) => {
        const status = (error as AxiosError)?.response?.status;
        if (status === 401 || status === 403) return false;
        return failureCount < 1;
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
