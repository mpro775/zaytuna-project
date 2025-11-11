import { Strategy } from 'passport-local';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuthenticatedUser } from './jwt.strategy';
declare const LocalStrategy_base: new (...args: [] | [options: import("passport-local").IStrategyOptionsWithRequest] | [options: import("passport-local").IStrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class LocalStrategy extends LocalStrategy_base {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    validate(username: string, password: string): Promise<AuthenticatedUser>;
}
export {};
