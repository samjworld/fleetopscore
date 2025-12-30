
/**
 * Enterprise Logger Utility
 * Centralizes logging to allow for future integration with APM tools.
 * In production, debug logs are suppressed.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const getIsProduction = () => {
  try {
    const env = (import.meta as any)?.env || {};
    return env.PROD === true;
  } catch {
    return false;
  }
};

const IS_PRODUCTION = getIsProduction();

class Logger {
  private formatMeta(meta?: any): string {
    if (meta === undefined || meta === null) return '';
    if (typeof meta === 'string') return ` | ${meta}`;
    try {
      // Use JSON.stringify for cleaner logging in environments that don't support object inspection
      return ` | DATA: ${JSON.stringify(meta, null, 2)}`;
    } catch {
      return ' | [Circular or Unserializable Data]';
    }
  }

  private log(level: LogLevel, message: string, meta?: any) {
    const timestamp = new Date().toISOString();

    if (IS_PRODUCTION && level === 'debug') return;

    const metaString = this.formatMeta(meta);
    const fullMessage = `[${level.toUpperCase()}] ${timestamp}: ${message}${metaString}`;

    switch (level) {
      case 'info':
        console.info(fullMessage);
        break;
      case 'warn':
        console.warn(fullMessage);
        break;
      case 'error':
        console.error(fullMessage);
        break;
      case 'debug':
        console.debug(fullMessage);
        break;
    }
  }

  public info(message: string, meta?: any) {
    this.log('info', message, meta);
  }

  public warn(message: string, meta?: any) {
    this.log('warn', message, meta);
  }

  public error(message: string, error?: any) {
    // If it's a real Error object, extract useful fields before logging
    if (error instanceof Error) {
      this.log('error', message, {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } else {
      this.log('error', message, error);
    }
  }

  public debug(message: string, meta?: any) {
    this.log('debug', message, meta);
  }
}

export const logger = new Logger();
