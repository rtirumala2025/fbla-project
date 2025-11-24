/**
 * Global Logger System
 * Provides structured logging with levels, context, and error tracking
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  error?: Error;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isDevelopment = process.env.NODE_ENV === 'development';

  log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      error,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    const consoleMethod = {
      debug: console.debug,
      info: console.log,
      warn: console.warn,
      error: console.error,
    }[level];

    if (this.isDevelopment || level === 'error') {
      consoleMethod(`[${level.toUpperCase()}] ${message}`, context || '', error || '');
    }

    // TODO: Send to external logging service in production
    if (level === 'error' && !this.isDevelopment) {
      // Send to error tracking service (e.g., Sentry)
      // Example: Sentry.captureException(error || new Error(message), { extra: context });
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>, error?: Error): void {
    this.log('error', message, context, error);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const logger = new Logger();
export default logger;

