import { randomUUID } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { RequestContextService } from './request-context.service';

export const REQUEST_ID_HEADER = 'x-request-id';

export function createRequestContextMiddleware(
  requestContext: RequestContextService,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    const forwarded = request.header(REQUEST_ID_HEADER);
    const requestId =
      typeof forwarded === 'string' && forwarded.trim().length > 0
        ? forwarded.trim()
        : randomUUID();

    requestContext.run(
      {
        requestId,
        method: request.method,
        path: request.originalUrl ?? request.url,
      },
      () => {
        response.setHeader(REQUEST_ID_HEADER, requestId);
        next();
      },
    );
  };
}
