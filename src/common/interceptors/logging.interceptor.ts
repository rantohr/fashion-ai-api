import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, originalUrl } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.logResult(method, originalUrl, start),
        error: (error: unknown) => this.logResult(method, originalUrl, start, error),
      }),
    );
  }

  private logResult(method: string, url: string, start: number, error?: unknown) {
    const ms = Date.now() - start;
    if (error) {
      this.logger.warn(`${method} ${url} failed +${ms}ms`);
      return;
    }
    this.logger.log(`${method} ${url} +${ms}ms`);
  }
}
