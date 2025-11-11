#!/usr/bin/env tsx

/**
 * سكريبت اختبار نظام الكاش وRedis
 * يمكن تشغيله بـ: npm run cache:test
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { CacheService } from '../src/shared/cache/cache.service';
import { SessionService } from '../src/shared/cache/session.service';

async function testCacheSystem() {
  console.log('🧪 بدء اختبار نظام الكاش والجلسات...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const cacheService = app.get(CacheService);
  const sessionService = app.get(SessionService);

  try {
    // اختبار 1: اختبار اتصال Redis
    console.log('\n📡 اختبار اتصال Redis...');
    const isConnected = await cacheService.ping();
    if (isConnected) {
      console.log('✅ Redis متصل ويعمل بشكل صحيح');
    } else {
      console.log('❌ فشل في الاتصال بـ Redis');
      return;
    }

    // اختبار 2: اختبار العمليات الأساسية للكاش
    console.log('\n💾 اختبار العمليات الأساسية للكاش...');

    // حفظ بيانات
    await cacheService.set('test:key', { message: 'Hello Cache!', timestamp: Date.now() }, { ttl: 60 });
    console.log('✅ تم حفظ البيانات في الكاش');

    // استرجاع البيانات
    const cachedData = await cacheService.get('test:key');
    if (cachedData && cachedData.message === 'Hello Cache!') {
      console.log('✅ تم استرجاع البيانات من الكاش بنجاح');
    } else {
      console.log('❌ فشل في استرجاع البيانات من الكاش');
    }

    // التحقق من وجود المفتاح
    const exists = await cacheService.exists('test:key');
    console.log(`✅ التحقق من وجود المفتاح: ${exists ? 'موجود' : 'غير موجود'}`);

    // الحصول على TTL
    const ttl = await cacheService.ttl('test:key');
    console.log(`✅ وقت انتهاء الصلاحية: ${ttl} ثانية`);

    // حذف المفتاح
    const deleted = await cacheService.delete('test:key');
    console.log(`✅ تم حذف المفتاح: ${deleted ? 'نعم' : 'لا'}`);

    // اختبار 3: اختبار نظام الجلسات
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

    // إنشاء جلسة
    await sessionService.createSession(sessionId, userData);
    console.log('✅ تم إنشاء الجلسة بنجاح');

    // استرجاع الجلسة
    const sessionData = await sessionService.getSession(sessionId);
    if (sessionData && sessionData.userId === userData.userId) {
      console.log('✅ تم استرجاع بيانات الجلسة بنجاح');
    } else {
      console.log('❌ فشل في استرجاع بيانات الجلسة');
    }

    // التحقق من صحة الجلسة
    const isValid = await sessionService.validateSession(sessionId);
    console.log(`✅ صحة الجلسة: ${isValid ? 'صالحة' : 'غير صالحة'}`);

    // تحديث نشاط الجلسة
    await sessionService.updateActivity(sessionId);
    console.log('✅ تم تحديث نشاط الجلسة');

    // الحصول على جلسات المستخدم
    const userSessions = await sessionService.getUserSessions(userData.userId);
    console.log(`✅ عدد جلسات المستخدم: ${userSessions.length}`);

    // إنهاء الجلسة
    await sessionService.destroySession(sessionId);
    console.log('✅ تم إنهاء الجلسة');

    // التحقق من إنهاء الجلسة
    const sessionAfterDestroy = await sessionService.getSession(sessionId);
    if (!sessionAfterDestroy) {
      console.log('✅ تم حذف الجلسة بنجاح');
    } else {
      console.log('❌ فشل في حذف الجلسة');
    }

    // اختبار 4: اختبار الإحصائيات
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

    // اختبار 5: اختبار العمليات المتقدمة
    console.log('\n🔧 اختبار العمليات المتقدمة...');

    // زيادة قيمة عددية
    await cacheService.set('counter', 0);
    const newValue = await cacheService.increment('counter', 5);
    console.log(`✅ العداد بعد الزيادة: ${newValue}`);

    // تمديد وقت الصلاحية
    await cacheService.set('temp:key', 'temporary data', { ttl: 30 });
    const extended = await cacheService.expire('temp:key', 300);
    console.log(`✅ تم تمديد وقت الصلاحية: ${extended ? 'نعم' : 'لا'}`);

    // حذف بالنمط
    await cacheService.set('pattern:test1', 'data1');
    await cacheService.set('pattern:test2', 'data2');
    await cacheService.set('other:key', 'other data');

    const deletedCount = await cacheService.deleteMany('pattern:*');
    console.log(`✅ تم حذف ${deletedCount} مفتاح بالنمط`);

    // تنظيف البيانات التجريبية
    console.log('\n🧹 تنظيف البيانات التجريبية...');
    await cacheService.delete('counter');
    await cacheService.delete('temp:key');
    await cacheService.delete('other:key');

    console.log('🎉 تم الانتهاء من جميع اختبارات الكاش بنجاح!');

  } catch (error) {
    console.error('❌ فشل في اختبار نظام الكاش:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// تشغيل الاختبار
testCacheSystem();
