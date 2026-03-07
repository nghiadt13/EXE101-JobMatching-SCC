import { HttpStatus } from '@nestjs/common';
import { ApiErrorDetails } from './api-error-envelope';

export class AppException extends Error {
  constructor(
    public readonly statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly code: string,
    message: string,
    public readonly details?: ApiErrorDetails,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}
