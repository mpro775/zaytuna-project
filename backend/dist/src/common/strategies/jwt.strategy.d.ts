import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
export interface JwtPayload {
    sub: string;
    username: string;
    email: string;
    roleId: string;
    branchId?: string;
    iat: number;
    exp: number;
    type: 'access' | 'refresh';
}
export interface AuthenticatedUser {
    id: string;
    username: string;
    email: string;
    roleId: string;
    branchId?: string;
    permissions: string[];
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly configService;
    private readonly prisma;
    private readonly cacheService;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService, cacheService: CacheService);
    validate(payload: JwtPayload): Promise<AuthenticatedUser>;
    private updateLastLogin;
}
export {};
