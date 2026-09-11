import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';

interface ErrorBody {
  status: number;
  message: string | string[];
  error?: string;
}

// Maps Prisma's known request errors to sane HTTP responses instead of
// letting them fall through as opaque 500s.
function fromPrismaError(exception: Prisma.PrismaClientKnownRequestError): ErrorBody {
  switch (exception.code) {
    case 'P2002': {
      const target = (exception.meta?.target as string[] | undefined)?.join(', ');
      return {
        status: HttpStatus.CONFLICT,
        message: target ? `A record with this ${target} already exists.` : 'Unique constraint violation.',
        error: 'Conflict',
      };
    }
    case 'P2025':
      return { status: HttpStatus.NOT_FOUND, message: 'Record not found.', error: 'Not Found' };
    case 'P2003':
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Related record does not exist.',
        error: 'Bad Request',
      };
    default:
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Database error.' };
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const body = this.resolveBody(exception);

    if (body.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${body.status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(body.status).json({
      statusCode: body.status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: body.message,
      ...(body.error ? { error: body.error } : {}),
    });
  }

  private resolveBody(exception: unknown): ErrorBody {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return fromPrismaError(exception);
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      if (typeof payload === 'string') {
        return { status, message: payload };
      }
      const { message, error } = payload as { message?: string | string[]; error?: string };
      return { status, message: message ?? exception.message, error };
    }

    return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error.' };
  }
}
