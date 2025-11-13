/**
 * Main Entry Point
 * Application entry point with error boundary
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/globals.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element #root not found.');
}

createRoot(container).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

