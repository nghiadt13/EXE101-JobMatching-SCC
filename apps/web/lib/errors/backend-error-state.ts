import { ApiError } from '../api-client';

export type RouteErrorQuery = {
  error?: string;
  message?: string;
  requestId?: string;
};

export function buildErrorRedirectPath(
  basePath: string,
  error: ApiError,
  fallbackCode: string,
): string {
  const params = new URLSearchParams();
  params.set('error', error.code ?? fallbackCode);
  params.set('message', error.message);
  if (error.requestId) {
    params.set('requestId', error.requestId);
  }

  return `${basePath}?${params.toString()}`;
}

export function resolveRouteError(
  query: RouteErrorQuery,
  fallbackMessages: Record<string, string>,
): { message: string; requestId?: string } | null {
  const message = query.message?.trim();
  const fallback = query.error ? fallbackMessages[query.error] : undefined;
  const finalMessage = message || fallback;

  if (!finalMessage) {
    return null;
  }

  return {
    message: finalMessage,
    requestId: query.requestId?.trim() || undefined,
  };
}