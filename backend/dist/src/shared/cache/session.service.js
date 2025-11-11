"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SessionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cache_service_1 = require("./cache.service");
let SessionService = SessionService_1 = class SessionService {
    cacheService;
    configService;
    logger = new common_1.Logger(SessionService_1.name);
    sessionPrefix = 'session:';
    userSessionsPrefix = 'user_sessions:';
    constructor(cacheService, configService) {
        this.cacheService = cacheService;
        this.configService = configService;
    }
    async createSession(sessionId, userData) {
        const sessionData = {
            ...userData,
            createdAt: new Date(),
            lastActivity: new Date(),
            isActive: true,
        };
        const ttl = this.configService.get('jwt.refreshTokenTtl', 604800);
        await this.cacheService.setObject(`${this.sessionPrefix}${sessionId}`, sessionData, ttl);
        await this.addUserSession(userData.userId, sessionId);
        this.logger.log(`تم إنشاء جلسة جديدة للمستخدم: ${userData.username}`);
    }
    async getSession(sessionId) {
        return await this.cacheService.getObject(`${this.sessionPrefix}${sessionId}`);
    }
    async updateActivity(sessionId) {
        const sessionData = await this.getSession(sessionId);
        if (sessionData) {
            sessionData.lastActivity = new Date();
            const ttl = await this.cacheService.ttl(`${this.sessionPrefix}${sessionId}`);
            await this.cacheService.setObject(`${this.sessionPrefix}${sessionId}`, sessionData, ttl > 0 ? ttl : 3600);
        }
    }
    async destroySession(sessionId) {
        const sessionData = await this.getSession(sessionId);
        if (sessionData) {
            await this.removeUserSession(sessionData.userId, sessionId);
            await this.cacheService.delete(`${this.sessionPrefix}${sessionId}`);
            this.logger.log(`تم إنهاء الجلسة: ${sessionId}`);
        }
    }
    async destroyUserSessions(userId) {
        const userSessions = await this.getUserSessions(userId);
        for (const sessionId of userSessions) {
            await this.cacheService.delete(`${this.sessionPrefix}${sessionId}`);
        }
        await this.cacheService.delete(`${this.userSessionsPrefix}${userId}`);
        this.logger.log(`تم إنهاء جميع جلسات المستخدم: ${userId}`);
    }
    async validateSession(sessionId) {
        const sessionData = await this.getSession(sessionId);
        return sessionData?.isActive ?? false;
    }
    async getUserSessions(userId) {
        const sessions = await this.cacheService.getObject(`${this.userSessionsPrefix}${userId}`);
        return sessions || [];
    }
    async addUserSession(userId, sessionId) {
        const userSessions = await this.getUserSessions(userId);
        if (!userSessions.includes(sessionId)) {
            userSessions.push(sessionId);
            await this.cacheService.setObject(`${this.userSessionsPrefix}${userId}`, userSessions);
        }
    }
    async removeUserSession(userId, sessionId) {
        const userSessions = await this.getUserSessions(userId);
        const filteredSessions = userSessions.filter((id) => id !== sessionId);
        if (filteredSessions.length > 0) {
            await this.cacheService.setObject(`${this.userSessionsPrefix}${userId}`, filteredSessions);
        }
        else {
            await this.cacheService.delete(`${this.userSessionsPrefix}${userId}`);
        }
    }
    async getSessionStats() {
        try {
            const keys = await this.cacheService['client'].keys(`${this.userSessionsPrefix}*`);
            const totalUsers = keys.length;
            let activeSessions = 0;
            for (const key of keys) {
                const sessions = await this.cacheService.getObject(key);
                if (sessions) {
                    activeSessions += sessions.length;
                }
            }
            return { activeSessions, totalUsers };
        }
        catch (error) {
            this.logger.error('فشل في الحصول على إحصائيات الجلسات:', error);
            return { activeSessions: 0, totalUsers: 0 };
        }
    }
    async cleanupExpiredSessions() {
        try {
            const keys = await this.cacheService['client'].keys(`${this.sessionPrefix}*`);
            let cleanedCount = 0;
            for (const key of keys) {
                const ttl = await this.cacheService.ttl(key);
                if (ttl === -2) {
                    await this.cacheService.delete(key);
                    cleanedCount++;
                }
            }
            if (cleanedCount > 0) {
                this.logger.log(`تم تنظيف ${cleanedCount} جلسة منتهية الصلاحية`);
            }
        }
        catch (error) {
            this.logger.error('فشل في تنظيف الجلسات المنتهية الصلاحية:', error);
        }
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = SessionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cache_service_1.CacheService,
        config_1.ConfigService])
], SessionService);
//# sourceMappingURL=session.service.js.map