import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body: ErrorEnvelope = {
      error: {
        code: mapStatusToCode(status),
        message: extractMessage(exception),
        details: extractDetails(exception),
      },
    };

    // eslint-disable-next-line no-console
    if (status >= 500) console.error(`[${request.method} ${request.url}]`, exception);

    response.status(status).json(body);
  }
}

function mapStatusToCode(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'VALIDATION_ERROR';
    case HttpStatus.UNAUTHORIZED:
      return 'UNAUTHORIZED';
    case HttpStatus.FORBIDDEN:
      return 'FORBIDDEN';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    case HttpStatus.CONFLICT:
      return 'CONFLICT';
    default:
      return status >= 500 ? 'INTERNAL_ERROR' : 'ERROR';
  }
}

function extractMessage(exception: unknown): string {
  if (exception instanceof HttpException) {
    const response = exception.getResponse();
    if (typeof response === 'string') return response;
    if (typeof response === 'object' && response !== null && 'message' in response) {
      const message = (response as { message: unknown }).message;
      return Array.isArray(message) ? message.join(', ') : String(message);
    }
    return exception.message;
  }
  return 'Internal server error';
}

function extractDetails(exception: unknown): unknown {
  if (exception instanceof HttpException) {
    const response = exception.getResponse();
    if (typeof response === 'object' && response !== null) {
      const rest = { ...(response as Record<string, unknown>) };
      delete rest.message;
      return Object.keys(rest).length > 0 ? rest : undefined;
    }
  }
  return undefined;
}
