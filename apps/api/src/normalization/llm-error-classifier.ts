export type LlmFailureCategory =
  | 'timeout'
  | 'rate_limited'
  | 'upstream_5xx'
  | 'network'
  | 'unknown';

export interface LlmFailureDetails {
  category: LlmFailureCategory;
  statusCode: number | null;
  providerCode: string | null;
  reason: string;
  retryable: boolean;
}

export function classifyLlmError(error: unknown): LlmFailureDetails {
  const reason = readErrorMessage(error);
  const statusCode = readStatusCode(error);
  const providerCode = readProviderCode(error);
  const signal = `${providerCode ?? ''} ${reason}`.toLowerCase();

  if (isTimeout(statusCode, signal)) {
    return {
      category: 'timeout',
      statusCode,
      providerCode,
      reason,
      retryable: true,
    };
  }

  if (statusCode === 429 || /(rate|quota|resource_exhausted|too_many_requests)/i.test(signal)) {
    return {
      category: 'rate_limited',
      statusCode,
      providerCode,
      reason,
      retryable: true,
    };
  }

  if ((statusCode !== null && statusCode >= 500) || /(bad gateway|gateway timeout|service unavailable|internal server error)/i.test(signal)) {
    return {
      category: 'upstream_5xx',
      statusCode,
      providerCode,
      reason,
      retryable: true,
    };
  }

  if (/(econnreset|econnrefused|ehostunreach|eai_again|enotfound|socket hang up|network|fetch failed|connection error)/i.test(signal)) {
    return {
      category: 'network',
      statusCode,
      providerCode,
      reason,
      retryable: true,
    };
  }

  return {
    category: 'unknown',
    statusCode,
    providerCode,
    reason,
    retryable: false,
  };
}

function isTimeout(statusCode: number | null, signal: string): boolean {
  return (
    statusCode === 408 ||
    /(timeout|timed out|deadline exceeded|etimedout|econnaborted|aborterror)/i.test(
      signal,
    )
  );
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    if (typeof record['message'] === 'string') {
      return record['message'];
    }
  }
  return 'Unknown error';
}

function readStatusCode(error: unknown): number | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const record = error as Record<string, unknown>;
  const direct = toFiniteNumber(record['status']);
  if (direct !== null) {
    return direct;
  }

  const nestedError = asRecord(record['error']);
  const nestedStatus = toFiniteNumber(nestedError?.['status']);
  if (nestedStatus !== null) {
    return nestedStatus;
  }

  const response = asRecord(record['response']);
  return toFiniteNumber(response?.['status']);
}

function readProviderCode(error: unknown): string | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const record = error as Record<string, unknown>;
  const direct = toNonEmptyString(record['code']) ?? toNonEmptyString(record['type']);
  if (direct) {
    return direct;
  }

  const nestedError = asRecord(record['error']);
  return (
    toNonEmptyString(nestedError?.['code']) ??
    toNonEmptyString(nestedError?.['status'])
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}