import { ValidationPipe, ValidationError } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class CustomValidationPipe extends ValidationPipe {
    private readonly configService;
    constructor(configService: ConfigService);
    protected mapChildrenToValidationErrors(error: ValidationError, parentPath?: string): ValidationError[];
    private translateValidationMessage;
    protected flattenValidationErrors(errors: ValidationError[]): string[];
}
