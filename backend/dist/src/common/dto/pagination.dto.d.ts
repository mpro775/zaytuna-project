export declare class PaginationQueryDto {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
}
export declare class PaginationMetaDto {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export declare class PaginatedResponseDto<T> {
    data: T[];
    pagination: PaginationMetaDto;
    message?: string;
}
