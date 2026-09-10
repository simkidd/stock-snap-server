import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((result) => {
        const isMessageResponse =
          result &&
          typeof result === 'object' &&
          'message' in result &&
          'data' in result &&
          !('meta' in result);

        return {
          success: true,
          statusCode: response.statusCode,
          message: isMessageResponse ? result.message : 'Success',
          data: isMessageResponse ? result.data : result,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
