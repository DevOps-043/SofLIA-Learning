import {
  redactSensitivePatterns,
  sanitizeData,
  sanitizeStackTrace,
} from './secure-logger.sanitizers';
import { LogLevel, type LoggerOptions, type LogMetadata } from './secure-logger.types';

const LOG_LEVEL_PRIORITY: Readonly<Record<LogLevel, number>> = {
  [LogLevel.DEBUG]: 10,
  [LogLevel.HTTP]: 20,
  [LogLevel.INFO]: 30,
  [LogLevel.WARN]: 40,
  [LogLevel.ERROR]: 50,
};

type ConsoleMethod = 'error' | 'warn' | 'log';

export class SecureLogger {
  private context: string;
  private defaultOptions: LoggerOptions;
  private defaultMetadata: LogMetadata;

  constructor(context: string = 'App', options: LoggerOptions = {}) {
    this.context = context;
    this.defaultMetadata = options.defaultMetadata ?? {};
    this.defaultOptions = {
      sanitize: true,
      includeStackTrace: process.env.NODE_ENV !== 'production',
      ...options,
    };
  }

  private formatLog(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata,
    options?: LoggerOptions
  ): string {
    const opts = { ...this.defaultOptions, ...options };
    const mergedMetadata = {
      ...this.defaultMetadata,
      ...metadata,
    };
    const sanitizedMetadata = opts.sanitize
      ? sanitizeData(mergedMetadata)
      : mergedMetadata;
    const serializedMetadata = Object.keys(sanitizedMetadata).length > 0
      ? sanitizedMetadata
      : undefined;

    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        level,
        context: opts.context ?? this.context,
        message: opts.sanitize ? redactSensitivePatterns(message) : message,
        ...serializedMetadata,
      },
      null,
      process.env.NODE_ENV === 'development' ? 2 : 0
    );
  }

  private shouldLog(level: LogLevel): boolean {
    const minimumLevel = process.env.NODE_ENV === 'development'
      ? LogLevel.DEBUG
      : LogLevel.INFO;

    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minimumLevel];
  }

  private write(level: LogLevel, formattedLog: string): void {
    if (!this.shouldLog(level)) return;

    const method = this.getConsoleMethod(level);
    const sink = globalThis.console?.[method];
    if (typeof sink === 'function') {
      sink.call(globalThis.console, formattedLog);
    }
  }

  private getConsoleMethod(level: LogLevel): ConsoleMethod {
    if (level === LogLevel.ERROR) return 'error';
    if (level === LogLevel.WARN) return 'warn';
    return 'log';
  }

  private buildErrorMetadata(
    errorOrMetadata?: Error | unknown,
    metadata?: LogMetadata,
    options?: LoggerOptions
  ): LogMetadata {
    const opts = { ...this.defaultOptions, ...options };
    const errorMetadata: LogMetadata = { ...metadata };

    if (errorOrMetadata instanceof Error) {
      errorMetadata.error = {
        name: errorOrMetadata.name,
        message: opts.sanitize
          ? redactSensitivePatterns(errorOrMetadata.message)
          : errorOrMetadata.message,
        stack: opts.includeStackTrace
          ? sanitizeStackTrace(errorOrMetadata.stack)
          : undefined,
      };
      return errorMetadata;
    }

    if (
      errorOrMetadata &&
      typeof errorOrMetadata === 'object' &&
      !Array.isArray(errorOrMetadata) &&
      metadata === undefined
    ) {
      return errorOrMetadata as LogMetadata;
    }

    if (errorOrMetadata !== undefined) {
      errorMetadata.error = opts.sanitize
        ? sanitizeData({ error: errorOrMetadata }).error
        : errorOrMetadata;
    }

    return errorMetadata;
  }

  private emit(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata,
    options?: LoggerOptions
  ): void {
    this.write(level, this.formatLog(level, message, metadata, options));
  }

  private toConsoleMetadata(args: readonly unknown[]): LogMetadata {
    if (args.length === 0) return {};

    return {
      args: args.map((arg) => {
        if (arg instanceof Error) {
          return {
            name: arg.name,
            message: redactSensitivePatterns(arg.message),
            stack: sanitizeStackTrace(arg.stack),
          };
        }

        return arg;
      }),
    };
  }

  private isLogMetadata(value: unknown): value is LogMetadata {
    return Boolean(value) &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Error);
  }

  private emitConsole(
    level: LogLevel,
    fallbackMessage: string,
    args: readonly unknown[],
  ): void {
    const firstArg = args[0];
    const message = typeof firstArg === 'string'
      ? redactSensitivePatterns(firstArg)
      : fallbackMessage;
    const metadataArgs = typeof firstArg === 'string' ? args.slice(1) : args;

    this.emit(level, message, this.toConsoleMetadata(metadataArgs));
  }

  error(
    message: unknown,
    ...args: unknown[]
  ): void {
    const [errorOrMetadata, metadata, options] = args as [
      Error | unknown,
      LogMetadata | undefined,
      LoggerOptions | undefined,
    ];

    if (typeof message !== 'string') {
      this.emitConsole(LogLevel.ERROR, 'Console error', [message, ...args]);
      return;
    }

    if (args.length > 3) {
      this.emitConsole(LogLevel.ERROR, 'Console error', [message, ...args]);
      return;
    }

    this.emit(
      LogLevel.ERROR,
      message,
      this.buildErrorMetadata(errorOrMetadata, metadata, options),
      options
    );
  }

  warn(message: unknown, ...args: unknown[]): void {
    const [metadata, options] = args as [unknown, LoggerOptions | undefined];

    if (typeof message !== 'string') {
      this.emitConsole(LogLevel.WARN, 'Console warning', [message, ...args]);
      return;
    }

    if (args.length > 2 || (metadata !== undefined && !this.isLogMetadata(metadata))) {
      this.emitConsole(LogLevel.WARN, 'Console warning', [message, ...args]);
      return;
    }

    this.emit(LogLevel.WARN, message, metadata, options);
  }

  info(message: unknown, ...args: unknown[]): void {
    const [metadata, options] = args as [unknown, LoggerOptions | undefined];

    if (typeof message !== 'string') {
      this.emitConsole(LogLevel.INFO, 'Console info', [message, ...args]);
      return;
    }

    if (args.length > 2 || (metadata !== undefined && !this.isLogMetadata(metadata))) {
      this.emitConsole(LogLevel.INFO, 'Console info', [message, ...args]);
      return;
    }

    this.emit(LogLevel.INFO, message, metadata, options);
  }

  http(message: string, metadata?: LogMetadata, options?: LoggerOptions): void {
    this.emit(LogLevel.HTTP, message, metadata, options);
  }

  debug(message: unknown, ...args: unknown[]): void {
    const [metadata, options] = args as [unknown, LoggerOptions | undefined];

    if (typeof message !== 'string') {
      this.emitConsole(LogLevel.DEBUG, 'Console debug', [message, ...args]);
      return;
    }

    if (args.length > 2 || (metadata !== undefined && !this.isLogMetadata(metadata))) {
      this.emitConsole(LogLevel.DEBUG, 'Console debug', [message, ...args]);
      return;
    }

    this.emit(LogLevel.DEBUG, message, metadata, options);
  }

  log(...args: unknown[]): void {
    this.emitConsole(LogLevel.DEBUG, 'Console log', args);
  }

  trace(...args: unknown[]): void {
    this.emitConsole(LogLevel.DEBUG, 'Console trace', args);
  }

  table(data?: unknown, properties?: readonly string[]): void {
    this.emit(LogLevel.DEBUG, 'Console table', { data, properties });
  }

  group(...args: unknown[]): void {
    this.emitConsole(LogLevel.DEBUG, 'Console group', args);
  }

  groupCollapsed(...args: unknown[]): void {
    this.emitConsole(LogLevel.DEBUG, 'Console group', args);
  }

  groupEnd(): void {
    this.emit(LogLevel.DEBUG, 'Console group end');
  }

  auth(action: string, metadata?: LogMetadata, options?: LoggerOptions): void {
    this.info(`Auth: ${action}`, metadata, options);
  }

  api(
    method: string,
    path: string,
    statusCode?: number,
    metadata?: LogMetadata,
    options?: LoggerOptions
  ): void {
    this.info(
      `API ${method} ${path}${statusCode ? ` - ${statusCode}` : ''}`,
      metadata,
      options
    );
  }

  db(
    operation: string,
    table: string,
    metadata?: LogMetadata,
    options?: LoggerOptions
  ): void {
    this.info(`DB ${operation} on ${table}`, metadata, options);
  }

  child(contextOrMetadata: string | LogMetadata, options?: LoggerOptions): SecureLogger {
    if (typeof contextOrMetadata === 'string') {
      return new SecureLogger(`${this.context}:${contextOrMetadata}`, {
        ...this.defaultOptions,
        ...options,
        defaultMetadata: this.defaultMetadata,
      });
    }

    return new SecureLogger(this.context, {
      ...this.defaultOptions,
      ...options,
      defaultMetadata: {
        ...this.defaultMetadata,
        ...contextOrMetadata,
        ...options?.defaultMetadata,
      },
    });
  }
}
