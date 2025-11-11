import { IsOptional, IsString, IsBoolean, IsObject } from 'class-validator';

export class SuccessResponseDto<T = any> {
  success: true = true;

  @IsOptional()
  data?: T;

  @IsOptional()
  @IsObject()
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
    path: string;
    method: string;
    duration: number;
  };

  @IsOptional()
  @IsObject()
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  @IsOptional()
  @IsString()
  message?: string;
}

export class ErrorResponseDto {
  success: false = false;

  error: {
    code: string;
    message: string;
    details?: any;
    traceId: string;
    timestamp: string;
    path: string;
    method: string;
  };
}

export class BaseResponseDto {
  @IsBoolean()
  success: boolean;

  @IsOptional()
  @IsString()
  message?: string;
}

export class HealthCheckResponseDto extends BaseResponseDto {
  success: true = true;

  data: {
    status: 'ok';
    timestamp: string;
    uptime: number;
    version: string;
    services: {
      database: boolean;
      redis: boolean;
    };
  };
}
