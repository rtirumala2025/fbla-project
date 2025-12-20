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

// #region agent log
fetch('http://127.0.0.1:7242/ingest/fcf8e63e-6bca-4626-ad62-00d2de1ac651',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:12',message:'main.tsx module loading',data:{entryPoint:'main.tsx'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion

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

