/**
 * Interaction Logger Hook
 * Captures user interactions for debugging and analytics
 * FBLA Competition-Level Feature
 */

import { useCallback, useRef } from 'react';

export interface InteractionLog {
  timestamp: number;
  component: string;
  action: string;
  details?: Record<string, any>;
  error?: string;
}

class InteractionLogger {
  private logs: InteractionLog[] = [];
  private maxLogs = 100;

  log(component: string, action: string, details?: Record<string, any>, error?: string): void {
    const logEntry: InteractionLog = {
      timestamp: Date.now(),
      component,
      action,
      details,
      error,
    };

    this.logs.push(logEntry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const logMethod = error ? console.error : console.log;
      logMethod(`[${component}] ${action}`, details || '', error || '');
    }

    // Store in localStorage for persistence
    try {
      const stored = localStorage.getItem('interaction_logs');
      const existing = stored ? JSON.parse(stored) : [];
      existing.push(logEntry);
      
      // Keep only last 50 in localStorage
      const trimmed = existing.slice(-50);
      localStorage.setItem('interaction_logs', JSON.stringify(trimmed));
    } catch (e) {
      // Silently fail if localStorage is unavailable
    }
  }

  getLogs(component?: string): InteractionLog[] {
    if (component) {
      return this.logs.filter(log => log.component === component);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
    try {
      localStorage.removeItem('interaction_logs');
    } catch (e) {
      // Silently fail
    }
  }
}

const logger = new InteractionLogger();

export function useInteractionLogger(componentName: string) {
  const logInteraction = useCallback(
    (action: string, details?: Record<string, any>, error?: string) => {
      logger.log(componentName, action, details, error);
    },
    [componentName]
  );

  const logFormSubmit = useCallback(
    (formData: Record<string, any>, success: boolean, error?: string) => {
      logInteraction('form_submit', { formData, success }, error);
    },
    [logInteraction]
  );

  const logFormValidation = useCallback(
    (field: string, isValid: boolean, error?: string) => {
      logInteraction('form_validation', { field, isValid }, error);
    },
    [logInteraction]
  );

  const logFormError = useCallback(
    (field: string, error: string, details?: Record<string, any>) => {
      logInteraction('form_error', { field, ...details }, error);
    },
    [logInteraction]
  );

  const logUserAction = useCallback(
    (action: string, details?: Record<string, any>) => {
      logInteraction('user_action', { action, ...details });
    },
    [logInteraction]
  );

  return {
    logInteraction,
    logFormSubmit,
    logFormValidation,
    logFormError,
    logUserAction,
  };
}

export default logger;

