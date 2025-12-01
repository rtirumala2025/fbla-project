/**
 * Main Entry Point
 * Application entry point with error boundary
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { logger } from './utils/logger';
import './styles/globals.css';
import './styles/print.css';

// Global error handlers
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  logger.error('Unhandled promise rejection', {
    reason: event.reason?.message || String(event.reason),
    stack: event.reason?.stack,
  }, event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
  // Prevent default browser behavior
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  logger.error('Global error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
  }, event.error);
});

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

