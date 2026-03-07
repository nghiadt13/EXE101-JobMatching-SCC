import { ErrorCode } from './error-codes';

export type ApiErrorDetails = Record<string, unknown> | Array<unknown>;

export type ApiErrorEnvelope = {
  statusCode: number;
  code: string;
  message: string;
  requestId: string;
  timestamp: string;
  path: string;
  details?: ApiErrorDetails;
};

export type ApiErrorPayload = {
  code: string;
  message: string;
  details?: ApiErrorDetails;
};

export function buildErrorPayload(
  code: ErrorCode,
  message: string,
  details?: ApiErrorDetails,
): ApiErrorPayload {
  return details === undefined ? { code, message } : { code, message, details };
}
