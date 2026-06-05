import {
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common/interfaces';
import { GlobalExceptionFilter } from './global-exception.filter';
import { RequestContextService } from './request-context.service';
import { AppLogger } from '../logging/app-logger.service';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let response: { status: jest.Mock; json: jest.Mock; getHeader: jest.Mock };
  let logger: { warn: jest.Mock; error: jest.Mock };

  beforeEach(() => {
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      getHeader: jest.fn().mockReturnValue('req-123'),
    };
    logger = {
      warn: jest.fn(),
      error: jest.fn(),
    };
    filter = new GlobalExceptionFilter(
      {
        getRequestId: jest.fn().mockReturnValue('req-123'),
      } as unknown as RequestContextService,
      logger as unknown as AppLogger,
    );
  });

  it('normalizes handled 422 exceptions into the shared envelope', () => {
    filter.catch(
      new HttpException(
        {
          code: 'CV_PARSE_FAILED',
          message:
            'AI parsing failed for this CV. Upload a readable PDF or DOCX and try again.',
          details: { stage: 'normalization' },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      ),
      createHost(response),
    );

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        code: 'CV_PARSE_FAILED',
        message:
          'AI parsing failed for this CV. Upload a readable PDF or DOCX and try again.',
        requestId: 'req-123',
        path: '/api/cvs/upload',
        details: { stage: 'normalization' },
      }),
    );
  });

  it('normalizes handled 503 exceptions into the shared envelope', () => {
    filter.catch(
      new ServiceUnavailableException({
        code: 'AI_SERVICE_UNAVAILABLE',
        message: 'AI service is unavailable right now. Please try again later.',
      }),
      createHost(response),
    );

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.SERVICE_UNAVAILABLE,
    );
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        code: 'AI_SERVICE_UNAVAILABLE',
        message: 'AI service is unavailable right now. Please try again later.',
        requestId: 'req-123',
      }),
    );
  });

  it('normalizes unknown exceptions into a stable 500 envelope', () => {
    const exception = new Error('boom');
    const ctx = {
      getRequest: () => ({ url: '/test' }),
      getResponse: () => ({
        status: () => ({ json: mockJson }),
      }),
    };
    const mockJson = jest.fn();

    const mockHost = {
      switchToHttp: () => ctx,
    } as any;

    filter.catch(exception, mockHost);

    expect(mockJson).toHaveBeenCalledWith({
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      path: '/test',
      timestamp: expect.any(String),
      requestId: 'test-req-id',
    });
    expect(logger.error).toHaveBeenCalled();
  });
});

function createHost(response: {
  status: jest.Mock;
  json: jest.Mock;
  getHeader: jest.Mock;
}): any {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        originalUrl: '/api/cvs/upload',
        url: '/api/cvs/upload',
      }),
      getResponse: () => response,
      getNext: () => undefined,
    }),
    getArgByIndex: () => undefined,
    getArgs: () => [],
    getType: () => 'http',
    switchToRpc: () => ({
      getContext: () => undefined,
      getData: () => undefined,
    }),
    switchToWs: () => ({
      getClient: () => undefined,
      getData: () => undefined,
      getPattern: () => undefined,
    }),
  };
}
