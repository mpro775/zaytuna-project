import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
export interface SessionData {
    userId: string;
    username: string;
    roleId: string;
    branchId?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
    lastActivity: Date;
    isActive: boolean;
}
export declare class SessionService {
    private readonly cacheService;
    private readonly configService;
    private readonly logger;
    private readonly sessionPrefix;
    private readonly userSessionsPrefix;
    constructor(cacheService: CacheService, configService: ConfigService);
    createSession(sessionId: string, userData: Omit<SessionData, 'createdAt' | 'lastActivity' | 'isActive'>): Promise<void>;
    getSession(sessionId: string): Promise<SessionData | null>;
    updateActivity(sessionId: string): Promise<void>;
    destroySession(sessionId: string): Promise<void>;
    destroyUserSessions(userId: string): Promise<void>;
    validateSession(sessionId: string): Promise<boolean>;
    getUserSessions(userId: string): Promise<string[]>;
    private addUserSession;
    private removeUserSession;
    getSessionStats(): Promise<{
        activeSessions: number;
        totalUsers: number;
    }>;
    cleanupExpiredSessions(): Promise<void>;
}
