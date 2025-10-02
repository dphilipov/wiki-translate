type LogLevel = 'info' | 'warn' | 'error';

interface Logger {
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}

class SimpleLogger implements Logger {
  private enabled: boolean = true;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  info(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.warn(message, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.error(message, ...args);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

export const logger = new SimpleLogger();
