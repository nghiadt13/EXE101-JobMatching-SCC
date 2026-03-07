import { Injectable, Logger } from '@nestjs/common';
import { RequestContextService } from '../http/request-context.service';

type LogContext = Record<string, unknown>;

@Injectable()
export class AppLogger {
  private readonly logger = new Logger('App');

  constructor(private readonly requestContext: RequestContextService) {}

  info(event: string, context: LogContext = {}) {
    this.logger.log(this.formatEntry('info', event, context));
  }

  warn(event: string, context: LogContext = {}) {
    this.logger.warn(this.formatEntry('warn', event, context));
  }

  error(event: string, context: LogContext = {}, error?: unknown) {
    const entry = this.formatEntry('error', event, {
      ...context,
      ...(error instanceof Error
        ? {
            errorName: error.name,
            errorMessage: error.message,
          }
        : {}),
    });
    this.logger.error(entry, error instanceof Error ? error.stack : undefined);
  }

  private formatEntry(
    level: 'info' | 'warn' | 'error',
    event: string,
    context: LogContext,
  ) {
    const request = this.requestContext.get();
    return JSON.stringify({
      level,
      event,
      requestId: request?.requestId,
      method: request?.method,
      path: request?.path,
      actorId: request?.actorId,
      ...this.sanitize(context),
      timestamp: new Date().toISOString(),
    });
  }

  private sanitize(context: LogContext): LogContext {
    return Object.fromEntries(
      Object.entries(context)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, this.serialize(value)]),
    );
  }

  private serialize(value: unknown): unknown {
    if (value instanceof Error) {
      return { name: value.name, message: value.message };
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.serialize(item));
    }
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, item]) => [
          key,
          this.serialize(item),
        ]),
      );
    }
    return value;
  }
}
