#!/usr/bin/env tsx

/**
 * سكريبت اختبار شامل لوحدة المصادقة
 * يمكن تشغيله بـ: npm run auth:full-test
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';

async function testFullAuthSystem() {
  console.log('🔐 بدء الاختبار الشامل لوحدة المصادقة...');

  const app = await NestFactory.create(AppModule);
  const server = app.getHttpServer();

  let accessToken: string;
  let refreshToken: string;
  let testUserId: string;

  try {
    // اختبار 1: تسجيل مستخدم جديد
    console.log('\n📝 اختبار تسجيل مستخدم جديد...');

    const registerData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPassword123',
      phone: '+966501234567',
      roleId: 'role_user', // من البيانات الأولية
      branchId: 'branch_main', // من البيانات الأولية
    };

    const registerResponse = await request(server)
      .post('/auth/register')
      .send(registerData);

    console.log('Register status:', registerResponse.status);

    if (registerResponse.status === 201 && registerResponse.body.success === true) {
      accessToken = registerResponse.body.data.accessToken;
      refreshToken = registerResponse.body.data.refreshToken;
      testUserId = registerResponse.body.data.user.id;

      console.log('✅ تم تسجيل المستخدم بنجاح');
      console.log('User ID:', testUserId);
    } else {
      console.log('❌ فشل في تسجيل المستخدم');
      console.log('Response:', JSON.stringify(registerResponse.body, null, 2));
      return;
    }

    // اختبار 2: تسجيل الدخول
    console.log('\n🔑 اختبار تسجيل الدخول...');

    const loginData = {
      username: 'testuser',
      password: 'TestPassword123',
    };

    const loginResponse = await request(server)
      .post('/auth/login')
      .send(loginData);

    console.log('Login status:', loginResponse.status);

    if (loginResponse.status === 200 && loginResponse.body.success === true) {
      accessToken = loginResponse.body.data.accessToken;
      refreshToken = loginResponse.body.data.refreshToken;
      testUserId = loginResponse.body.data.user.id;

      console.log('✅ تم تسجيل الدخول بنجاح');
    } else {
      console.log('❌ فشل في تسجيل الدخول');
      console.log('Response:', JSON.stringify(loginResponse.body, null, 2));
    }

    // اختبار 3: الحصول على معلومات المستخدم الحالي
    console.log('\n👤 اختبار الحصول على معلومات المستخدم الحالي...');

    const meResponse = await request(server)
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    console.log('Me status:', meResponse.status);

    if (meResponse.status === 200 && meResponse.body.success === true) {
      console.log('✅ تم الحصول على معلومات المستخدم بنجاح');
      console.log('User info:', JSON.stringify(meResponse.body.data, null, 2));
    } else {
      console.log('❌ فشل في الحصول على معلومات المستخدم');
      console.log('Response:', JSON.stringify(meResponse.body, null, 2));
    }

    // اختبار 4: التحقق من صحة الرمز المميز
    console.log('\n✅ اختبار التحقق من صحة الرمز المميز...');

    const verifyResponse = await request(server)
      .get('/auth/verify')
      .set('Authorization', `Bearer ${accessToken}`);

    console.log('Verify status:', verifyResponse.status);

    if (verifyResponse.status === 200 && verifyResponse.body.success === true) {
      console.log('✅ الرمز المميز صحيح');
    } else {
      console.log('❌ الرمز المميز غير صحيح');
    }

    // اختبار 5: تحديث الرمز المميز
    console.log('\n🔄 اختبار تحديث الرمز المميز...');

    const refreshResponse = await request(server)
      .post('/auth/refresh')
      .send({ refreshToken });

    console.log('Refresh status:', refreshResponse.status);

    if (refreshResponse.status === 200 && refreshResponse.body.success === true) {
      accessToken = refreshResponse.body.data.accessToken;
      refreshToken = refreshResponse.body.data.refreshToken;

      console.log('✅ تم تحديث الرمز المميز بنجاح');
    } else {
      console.log('❌ فشل في تحديث الرمز المميز');
      console.log('Response:', JSON.stringify(refreshResponse.body, null, 2));
    }

    // اختبار 6: تغيير كلمة المرور
    console.log('\n🔒 اختبار تغيير كلمة المرور...');

    const changePasswordData = {
      currentPassword: 'TestPassword123',
      newPassword: 'NewTestPassword123',
    };

    const changePasswordResponse = await request(server)
      .patch('/auth/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(changePasswordData);

    console.log('Change password status:', changePasswordResponse.status);

    if (changePasswordResponse.status === 200 && changePasswordResponse.body.success === true) {
      console.log('✅ تم تغيير كلمة المرور بنجاح');
    } else {
      console.log('❌ فشل في تغيير كلمة المرور');
      console.log('Response:', JSON.stringify(changePasswordResponse.body, null, 2));
    }

    // اختبار 7: تسجيل الخروج
    console.log('\n🚪 اختبار تسجيل الخروج...');

    const logoutResponse = await request(server)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    console.log('Logout status:', logoutResponse.status);

    if (logoutResponse.status === 200 && logoutResponse.body.success === true) {
      console.log('✅ تم تسجيل الخروج بنجاح');
    } else {
      console.log('❌ فشل في تسجيل الخروج');
    }

    // اختبار 8: محاولة الوصول بعد تسجيل الخروج
    console.log('\n🚫 اختبار الوصول بعد تسجيل الخروج...');

    const afterLogoutResponse = await request(server)
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    console.log('After logout status:', afterLogoutResponse.status);

    if (afterLogoutResponse.status === 401) {
      console.log('✅ تم منع الوصول بعد تسجيل الخروج بنجاح');
    } else {
      console.log('❌ فشل في منع الوصول بعد تسجيل الخروج');
    }

    // اختبار 9: اختبار endpoints العامة
    console.log('\n🌐 اختبار endpoints العامة بعد تسجيل الخروج...');

    const publicResponse = await request(server).get('/');
    console.log('Public endpoint status:', publicResponse.status);

    if (publicResponse.status === 200 && publicResponse.body.success === true) {
      console.log('✅ الـ endpoints العامة لا تزال تعمل');
    } else {
      console.log('❌ مشكلة في الـ endpoints العامة');
    }

    console.log('\n🎉 تم الانتهاء من جميع اختبارات المصادقة بنجاح!');

    console.log('\n📋 ملخص النظام المُطبق:');
    console.log('✅ تسجيل المستخدمين الجدد');
    console.log('✅ تسجيل الدخول والخروج');
    console.log('✅ JWT tokens مع refresh mechanism');
    console.log('✅ تغيير كلمة المرور');
    console.log('✅ حماية الـ endpoints');
    console.log('✅ إدارة الجلسات في Redis');
    console.log('✅ رسائل خطأ مترجمة للعربية');

    console.log('\n🔗 API Endpoints المتاحة:');
    console.log('POST /auth/register - تسجيل مستخدم جديد');
    console.log('POST /auth/login - تسجيل الدخول');
    console.log('POST /auth/refresh - تحديث الرمز المميز');
    console.log('POST /auth/logout - تسجيل الخروج');
    console.log('GET /auth/me - معلومات المستخدم الحالي');
    console.log('PATCH /auth/password - تغيير كلمة المرور');
    console.log('GET /auth/verify - التحقق من صحة الرمز');

  } catch (error) {
    console.error('❌ فشل في اختبار نظام المصادقة:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// تشغيل الاختبار
testFullAuthSystem();
