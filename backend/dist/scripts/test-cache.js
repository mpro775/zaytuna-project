#!/usr/bin/env tsx
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const cache_service_1 = require("../src/shared/cache/cache.service");
const session_service_1 = require("../src/shared/cache/session.service");
async function testCacheSystem() {
    console.log('🧪 بدء اختبار نظام الكاش والجلسات...');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const cacheService = app.get(cache_service_1.CacheService);
    const sessionService = app.get(session_service_1.SessionService);
    try {
        console.log('\n📡 اختبار اتصال Redis...');
        const isConnected = await cacheService.ping();
        if (isConnected) {
            console.log('✅ Redis متصل ويعمل بشكل صحيح');
        }
        else {
            console.log('❌ فشل في الاتصال بـ Redis');
            return;
        }
        console.log('\n💾 اختبار العمليات الأساسية للكاش...');
        await cacheService.set('test:key', { message: 'Hello Cache!', timestamp: Date.now() }, { ttl: 60 });
        console.log('✅ تم حفظ البيانات في الكاش');
        const cachedData = await cacheService.get('test:key');
        if (cachedData && cachedData.message === 'Hello Cache!') {
            console.log('✅ تم استرجاع البيانات من الكاش بنجاح');
        }
        else {
            console.log('❌ فشل في استرجاع البيانات من الكاش');
        }
        const exists = await cacheService.exists('test:key');
        console.log(`✅ التحقق من وجود المفتاح: ${exists ? 'موجود' : 'غير موجود'}`);
        const ttl = await cacheService.ttl('test:key');
        console.log(`✅ وقت انتهاء الصلاحية: ${ttl} ثانية`);
        const deleted = await cacheService.delete('test:key');
        console.log(`✅ تم حذف المفتاح: ${deleted ? 'نعم' : 'لا'}`);
        console.log('\n🔐 اختبار نظام الجلسات...');
        const sessionId = 'test-session-' + Date.now();
        const userData = {
            userId: 'user-test-123',
            username: 'testuser',
            roleId: 'role-admin',
            branchId: 'branch-main',
            ipAddress: '127.0.0.1',
            userAgent: 'Test Agent',
        };
        await sessionService.createSession(sessionId, userData);
        console.log('✅ تم إنشاء الجلسة بنجاح');
        const sessionData = await sessionService.getSession(sessionId);
        if (sessionData && sessionData.userId === userData.userId) {
            console.log('✅ تم استرجاع بيانات الجلسة بنجاح');
        }
        else {
            console.log('❌ فشل في استرجاع بيانات الجلسة');
        }
        const isValid = await sessionService.validateSession(sessionId);
        console.log(`✅ صحة الجلسة: ${isValid ? 'صالحة' : 'غير صالحة'}`);
        await sessionService.updateActivity(sessionId);
        console.log('✅ تم تحديث نشاط الجلسة');
        const userSessions = await sessionService.getUserSessions(userData.userId);
        console.log(`✅ عدد جلسات المستخدم: ${userSessions.length}`);
        await sessionService.destroySession(sessionId);
        console.log('✅ تم إنهاء الجلسة');
        const sessionAfterDestroy = await sessionService.getSession(sessionId);
        if (!sessionAfterDestroy) {
            console.log('✅ تم حذف الجلسة بنجاح');
        }
        else {
            console.log('❌ فشل في حذف الجلسة');
        }
        console.log('\n📊 اختبار الإحصائيات...');
        const cacheStats = cacheService.getStats();
        console.log('إحصائيات الكاش:', cacheStats);
        const sessionStats = await sessionService.getSessionStats();
        console.log('إحصائيات الجلسات:', sessionStats);
        const redisInfo = await cacheService.getInfo();
        if (redisInfo) {
            console.log('معلومات Redis:', {
                version: redisInfo.redis_version,
                uptime: redisInfo.uptime_in_seconds,
                connected_clients: redisInfo.connected_clients,
                used_memory: redisInfo.used_memory_human,
            });
        }
        console.log('\n🔧 اختبار العمليات المتقدمة...');
        await cacheService.set('counter', 0);
        const newValue = await cacheService.increment('counter', 5);
        console.log(`✅ العداد بعد الزيادة: ${newValue}`);
        await cacheService.set('temp:key', 'temporary data', { ttl: 30 });
        const extended = await cacheService.expire('temp:key', 300);
        console.log(`✅ تم تمديد وقت الصلاحية: ${extended ? 'نعم' : 'لا'}`);
        await cacheService.set('pattern:test1', 'data1');
        await cacheService.set('pattern:test2', 'data2');
        await cacheService.set('other:key', 'other data');
        const deletedCount = await cacheService.deleteMany('pattern:*');
        console.log(`✅ تم حذف ${deletedCount} مفتاح بالنمط`);
        console.log('\n🧹 تنظيف البيانات التجريبية...');
        await cacheService.delete('counter');
        await cacheService.delete('temp:key');
        await cacheService.delete('other:key');
        console.log('🎉 تم الانتهاء من جميع اختبارات الكاش بنجاح!');
    }
    catch (error) {
        console.error('❌ فشل في اختبار نظام الكاش:', error);
        process.exit(1);
    }
    finally {
        await app.close();
    }
}
testCacheSystem();
//# sourceMappingURL=test-cache.js.map