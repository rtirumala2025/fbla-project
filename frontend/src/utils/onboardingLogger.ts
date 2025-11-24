/**
 * Consistent logging utility for onboarding system
 * Provides structured logging with levels and context
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  userId?: string;
  action?: string;
  [key: string]: any;
}

class OnboardingLogger {
  private enabled: boolean;
  private logLevel: LogLevel;

  constructor() {
    this.enabled = process.env.NODE_ENV === 'development' || process.env.REACT_APP_ENABLE_LOGGING === 'true';
    this.logLevel = (process.env.REACT_APP_LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false;
    
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = {
        ...context,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
        } : error,
      };
      console.error(this.formatMessage('error', message, errorContext));
    }
  }

  // Specialized loggers for common scenarios
  authInit(message: string, context?: LogContext): void {
    this.info(`🔵 Auth: ${message}`, { ...context, component: 'AuthContext' });
  }

  authStateChange(event: string, context?: LogContext): void {
    this.info(`🔵 Auth State Change: ${event}`, { ...context, component: 'AuthContext' });
  }

  petCheck(message: string, context?: LogContext): void {
    this.info(`🐾 Pet Check: ${message}`, { ...context, component: 'PetService' });
  }

  petRetry(attempt: number, maxRetries: number, context?: LogContext): void {
    this.warn(`⚠️ Pet Check Retry: Attempt ${attempt}/${maxRetries}`, context);
  }

  routeGuard(route: string, decision: string, context?: LogContext): void {
    this.info(`🛡️ Route Guard: ${route} → ${decision}`, { ...context, component: 'RouteGuard' });
  }

  redirect(from: string, to: string, reason: string, context?: LogContext): void {
    this.info(`↪️ Redirect: ${from} → ${to} (${reason})`, { ...context, component: 'Navigation' });
  }

  realtimeEvent(event: string, context?: LogContext): void {
    this.info(`🔄 Realtime: ${event}`, { ...context, component: 'RealtimeSubscription' });
  }

  onboardingStep(step: string, context?: LogContext): void {
    this.info(`🎯 Onboarding: ${step}`, { ...context, component: 'Onboarding' });
  }
}

// Export singleton instance
export const onboardingLogger = new OnboardingLogger();

// Export class for testing
export { OnboardingLogger };

