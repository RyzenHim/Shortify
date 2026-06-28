import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

interface ApiPayload<T> {
  message?: string;
  data?: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T | ApiPayload<T>,
  ApiPayload<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T | ApiPayload<T>>,
  ): Observable<ApiPayload<T>> {
    return next.handle().pipe(
      map((response) => {
        if (
          response &&
          typeof response === 'object' &&
          'data' in response &&
          'message' in response
        ) {
          return {
            success: true,
            message: response.message,
            data: response.data,
          };
        }

        return {
          success: true,
          message: 'Request completed successfully',
          data: response as T,
        };
      }),
    );
  }
}
