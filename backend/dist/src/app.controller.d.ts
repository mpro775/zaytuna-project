import { AppService } from './app.service';
import { PaginationQueryDto } from './common/dto/pagination.dto';
import { HealthCheckResponseDto } from './common/dto/response.dto';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): {
        message: string;
    };
    getHealth(): HealthCheckResponseDto;
    getTestPagination(query: PaginationQueryDto): {
        data: {
            id: number;
            name: string;
            description: string;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
    createTestItem(body: {
        name: string;
        value: any;
    }): {
        createdAt: Date;
        name: string;
        value: any;
        id: number;
    };
    testError(): void;
}
