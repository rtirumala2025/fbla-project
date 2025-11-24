/**
 * ErrorBoundary Component
 * Catches React errors and displays a user-friendly error message
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '../utils/logger';

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message: string | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message ?? 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('[ErrorBoundary] Component error caught', {
      error: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    }, error);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 p-6 shadow">
          <h1 className="text-xl font-semibold text-red-700">Something went wrong</h1>
          <p className="mt-2 text-sm text-red-600">
            {this.state.message ?? 'The UI crashed unexpectedly. Please try refreshing the page.'}
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

