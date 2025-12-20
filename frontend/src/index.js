import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/globals.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Ensure root element has the correct background
const rootElement = document.getElementById('root');
if (rootElement) {
  rootElement.className = 'min-h-screen bg-[#E7E7E7]';
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <ToastContainer position="bottom-right" />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
