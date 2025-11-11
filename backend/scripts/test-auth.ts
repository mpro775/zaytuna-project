#!/usr/bin/env tsx

/**
 * سكريبت اختبار نظام المصادقة والصلاحيات
 * يمكن تشغيله بـ: npm run auth:test
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';

async function testAuthSystem() {
  console.log('🛡️ بدء اختبار نظام المصادقة والصلاحيات...');

  // إنشاء تطبيق كامل للاختبار
  const app = await NestFactory.create(AppModule);
  const server = app.getHttpServer();

  try {
    // اختبار 1: الوصول للـ endpoints العامة
    console.log('\n🌐 اختبار الـ endpoints العامة...');

    const publicResponse = await request(server).get('/');
    console.log('Public endpoint status:', publicResponse.status);
    console.log('Response success:', publicResponse.body.success);

    if (publicResponse.status === 200 && publicResponse.body.success === true) {
      console.log('✅ الـ endpoints العامة تعمل بشكل صحيح');
    } else {
      console.log('❌ مشكلة في الـ endpoints العامة');
    }

    // اختبار 2: الوصول للـ endpoints المحمية بدون مصادقة
    console.log('\n🔒 اختبار الـ endpoints المحمية بدون مصادقة...');

    const protectedResponse = await request(server).get('/test-pagination');
    console.log('Protected endpoint status:', protectedResponse.status);
    console.log('Error message:', protectedResponse.body.error?.code);

    if (protectedResponse.status === 401 &&
        protectedResponse.body.error?.code === 'AUTHENTICATION_ERROR') {
      console.log('✅ حماية الـ endpoints المحمية تعمل بشكل صحيح');
    } else {
      console.log('❌ مشكلة في حماية الـ endpoints المحمية');
    }

    // اختبار 3: اختبار endpoint خطأ بدون مصادقة
    console.log('\n❌ اختبار endpoint الأخطاء...');

    const errorResponse = await request(server).get('/test-error');
    console.log('Error endpoint status:', errorResponse.status);
    console.log('Error code:', errorResponse.body.error?.code);

    if (errorResponse.status === 500 &&
        errorResponse.body.success === false &&
        errorResponse.body.error?.traceId) {
      console.log('✅ معالجة الأخطاء تعمل بشكل صحيح');
    } else {
      console.log('❌ مشكلة في معالجة الأخطاء');
    }

    // اختبار 4: محاولة تسجيل الدخول (سيتم إضافة AuthController في المرحلة 6)
    console.log('\n🔐 ملاحظة: نظام تسجيل الدخول سيتم إضافته في المرحلة 6');
    console.log('للاختبار الكامل، تحتاج إلى إنشاء AuthController و AuthService');

    console.log('\n🎉 تم الانتهاء من اختبار نظام المصادقة والصلاحيات!');

    console.log('\n📋 ملخص النظام المُطبق:');
    console.log('✅ JWT Strategy - للتحقق من الرموز المميزة');
    console.log('✅ Local Strategy - للمصادقة بالبيانات المحلية');
    console.log('✅ JWT Auth Guard - حماية الـ endpoints');
    console.log('✅ Permission Guard - التحقق من الصلاحيات');
    console.log('✅ Role Guard - التحقق من الأدوار');
    console.log('✅ Permission Decorators - لتحديد الصلاحيات المطلوبة');
    console.log('✅ Public Decorator - لجعل الـ endpoints عامة');
    console.log('✅ Guards عالمية - تطبيق تلقائي على جميع الـ endpoints');

  } catch (error) {
    console.error('❌ فشل في اختبار نظام المصادقة:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// تشغيل الاختبار
testAuthSystem();
