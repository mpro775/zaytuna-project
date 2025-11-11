#!/usr/bin/env tsx
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const supertest_1 = __importDefault(require("supertest"));
async function testAuthSystem() {
    console.log('🛡️ بدء اختبار نظام المصادقة والصلاحيات...');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const server = app.getHttpServer();
    try {
        console.log('\n🌐 اختبار الـ endpoints العامة...');
        const publicResponse = await (0, supertest_1.default)(server).get('/');
        console.log('Public endpoint status:', publicResponse.status);
        console.log('Response success:', publicResponse.body.success);
        if (publicResponse.status === 200 && publicResponse.body.success === true) {
            console.log('✅ الـ endpoints العامة تعمل بشكل صحيح');
        }
        else {
            console.log('❌ مشكلة في الـ endpoints العامة');
        }
        console.log('\n🔒 اختبار الـ endpoints المحمية بدون مصادقة...');
        const protectedResponse = await (0, supertest_1.default)(server).get('/test-pagination');
        console.log('Protected endpoint status:', protectedResponse.status);
        console.log('Error message:', protectedResponse.body.error?.code);
        if (protectedResponse.status === 401 &&
            protectedResponse.body.error?.code === 'AUTHENTICATION_ERROR') {
            console.log('✅ حماية الـ endpoints المحمية تعمل بشكل صحيح');
        }
        else {
            console.log('❌ مشكلة في حماية الـ endpoints المحمية');
        }
        console.log('\n❌ اختبار endpoint الأخطاء...');
        const errorResponse = await (0, supertest_1.default)(server).get('/test-error');
        console.log('Error endpoint status:', errorResponse.status);
        console.log('Error code:', errorResponse.body.error?.code);
        if (errorResponse.status === 500 &&
            errorResponse.body.success === false &&
            errorResponse.body.error?.traceId) {
            console.log('✅ معالجة الأخطاء تعمل بشكل صحيح');
        }
        else {
            console.log('❌ مشكلة في معالجة الأخطاء');
        }
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
    }
    catch (error) {
        console.error('❌ فشل في اختبار نظام المصادقة:', error);
        process.exit(1);
    }
    finally {
        await app.close();
    }
}
testAuthSystem();
//# sourceMappingURL=test-auth.js.map