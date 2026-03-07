import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response, Request } from 'express';
import {
  ApiErrorDetails,
  ApiErrorEnvelope,
} from '../errors/api-error-envelope';
import { AppException } from '../errors/app-exception';
import { ERROR_CODES } from '../errors/error-codes';
import { RequestContextService } from './request-context.service';
import { AppLogger } from '../logging/app-logger.service';

type NormalizedError = {
  statusCode: number;
  code: string;
  message: string;
  details?: ApiErrorDetails;
  cause?: unknown;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly requestContext: RequestContextService,
    private readonly logger: AppLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();
    const requestId =
      this.requestContext.getRequestId() ??
      String(response.getHeader('x-request-id') ?? 'unknown');
    const normalized = this.normalizeException(exception);
    const envelope: ApiErrorEnvelope = {
      statusCode: normalized.statusCode,
      code: normalized.code,
      message: normalized.message,
      requestId,
      timestamp: new Date().toISOString(),
      path: request.originalUrl ?? request.url,
      ...(normalized.details === undefined
        ? {}
        : { details: normalized.details }),
    };

    if (normalized.statusCode >= 500) {
      this.logger.error(
        'request_failed',
        {
          statusCode: normalized.statusCode,
          code: normalized.code,
          message: normalized.message,
          details: normalized.details,
        },
        normalized.cause,
      );
    } else {
      this.logger.warn('request_rejected', {
        statusCode: normalized.statusCode,
        code: normalized.code,
        message: normalized.message,
        details: normalized.details,
      });
    }

    response.status(normalized.statusCode).json(envelope);
  }

  private normalizeException(exception: unknown): NormalizedError {
    if (exception instanceof AppException) {
      return {
        statusCode: exception.statusCode,
        code: exception.code,
        message: exception.message,
        details: exception.details,
        cause: exception,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.normalizePrismaException(exception);
    }

    if (exception instanceof HttpException) {
      return this.normalizeHttpException(exception);
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.internalServerError,
      message: 'Unexpected server error. Please try again later.',
      cause: exception,
    };
  }

  private normalizeHttpException(exception: HttpException): NormalizedError {
    const statusCode = exception.getStatus();
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return {
        statusCode,
        code: this.defaultCodeForStatus(statusCode),
        message: response,
        cause: exception,
      };
    }

    if (response && typeof response === 'object') {
      const payload = response as Record<string, unknown>;
      const rawMessage = payload['message'];
      const details = this.extractDetails(payload, rawMessage);
      const message = Array.isArray(rawMessage)
        ? String(rawMessage[0] ?? 'Request failed')
        : typeof rawMessage === 'string'
          ? rawMessage
          : 'Request failed';

      return {
        statusCode,
        code:
          typeof payload['code'] === 'string'
            ? payload['code']
            : this.defaultCodeForStatus(statusCode),
        message,
        details,
        cause: exception,
      };
    }

    return {
      statusCode,
      code: this.defaultCodeForStatus(statusCode),
      message: 'Request failed',
      cause: exception,
    };
  }

  private normalizePrismaException(
    exception: Prisma.PrismaClientKnownRequestError,
  ): NormalizedError {
    if (exception.code === 'P2002') {
      return {
        statusCode: HttpStatus.CONFLICT,
        code: ERROR_CODES.conflict,
        message: 'A record with the same unique value already exists.',
        cause: exception,
      };
    }

    if (exception.code === 'P2025') {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        code: ERROR_CODES.databaseRecordNotFound,
        message: 'Requested record was not found.',
        cause: exception,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.databaseQueryFailed,
      message: 'Database operation failed. Please try again later.',
      details: { prismaCode: exception.code },
      cause: exception,
    };
  }

  private defaultCodeForStatus(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return ERROR_CODES.validationFailed;
      case 401:
        return ERROR_CODES.authRequired;
      case 403:
        return ERROR_CODES.forbidden;
      case 404:
        return ERROR_CODES.notFound;
      case 409:
        return ERROR_CODES.conflict;
      case 413:
        return ERROR_CODES.payloadTooLarge;
      case 415:
        return ERROR_CODES.unsupportedMediaType;
      default:
        return ERROR_CODES.internalServerError;
    }
  }

  private extractDetails(
    payload: Record<string, unknown>,
    rawMessage: unknown,
  ): ApiErrorDetails | undefined {
    if (payload['details'] && typeof payload['details'] === 'object') {
      return payload['details'] as ApiErrorDetails;
    }
    if (Array.isArray(rawMessage)) {
      return { validationErrors: rawMessage };
    }
    return undefined;
  }
}
