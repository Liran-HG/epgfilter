import "dotenv/config";
export enum LogLevel {
  SILLY, // 0
  DEBUG, // 1
  INFO, // 2
  WARN, // 3
  ERROR, // 4
}

class ConsoleLogger {
  private logLevel: LogLevel;

  constructor(logLevel: LogLevel) {
    this.logLevel = logLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private logMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.SILLY:
        return console.log.bind(console);
      case LogLevel.DEBUG:
        return console.debug.bind(console);
      case LogLevel.INFO:
        return console.info.bind(console);
      case LogLevel.WARN:
        return console.warn.bind(console);
      case LogLevel.ERROR:
        return console.error.bind(console);
      default:
        return console.log.bind(console); // Fallback to console.log
    }
  }

  log(level: LogLevel, ...args: any[]): void {
    if (this.shouldLog(level)) {
      this.logMethod(level)(...args);
    }
  }
}

function stringToLogLevel(level: string): LogLevel {
  switch (level.toUpperCase()) {
    case "SILLY":
      return LogLevel.SILLY;
    case "DEBUG":
      return LogLevel.DEBUG;
    case "INFO":
      return LogLevel.INFO;
    case "WARN":
      return LogLevel.WARN;
    case "ERROR":
      return LogLevel.ERROR;
    default:
      throw new Error("Invalid log level string");
  }
}
const envLogLevel = process.env.LOG_LEVEL || "INFO";
const logLevel = stringToLogLevel(envLogLevel);
const logger = new ConsoleLogger(logLevel);

logger.log(LogLevel.INFO,"Logger loaded with log level:", envLogLevel);

export {
  logger
}

