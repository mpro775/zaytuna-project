import { ExceptionFilter, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class ValidationExceptionFilter implements ExceptionFilter {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    catch(exception: BadRequestException, host: ArgumentsHost): void;
    private extractValidationErrors;
    private parseValidationError;
    private generateTraceId;
    private isProduction;
}
