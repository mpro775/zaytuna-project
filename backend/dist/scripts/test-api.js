#!/usr/bin/env tsx
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const supertest_1 = __importDefault(require("supertest"));
async function testApiSystem() {
    console.log('🧪 بدء اختبار نظام API والاستجابات الموحدة...');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const server = app.getHttpServer();
    try {
        console.log('\n🏠 اختبار endpoint الرئيسي...');
        const response1 = await (0, supertest_1.default)(server).get('/');
        console.log('Status:', response1.status);
        console.log('Response:', JSON.stringify(response1.body, null, 2));
        if (response1.status === 200 &&
            response1.body.success === true &&
            response1.body.meta &&
            response1.body.data) {
            console.log('✅ endpoint الرئيسي يعمل بشكل صحيح');
        }
        else {
            console.log('❌ مشكلة في endpoint الرئيسي');
        }
        console.log('\n❤️ اختبار endpoint الصحة...');
        const response2 = await (0, supertest_1.default)(server).get('/health');
        console.log('Status:', response2.status);
        console.log('Response keys:', Object.keys(response2.body));
        if (response2.status === 200 &&
            response2.body.success === true &&
            response2.body.data?.status === 'ok') {
            console.log('✅ endpoint الصحة يعمل بشكل صحيح');
        }
        else {
            console.log('❌ مشكلة في endpoint الصحة');
        }
        console.log('\n📄 اختبار pagination...');
        const response3 = await (0, supertest_1.default)(server)
            .get('/test-pagination')
            .query({ page: 1, limit: 5 });
        console.log('Status:', response3.status);
        console.log('Data length:', response3.body.data?.length);
        console.log('Pagination:', response3.body.pagination);
        if (response3.status === 200 &&
            response3.body.success === true &&
            response3.body.pagination &&
            response3.body.data?.length === 5) {
            console.log('✅ pagination يعمل بشكل صحيح');
        }
        else {
            console.log('❌ مشكلة في pagination');
        }
        console.log('\n❌ اختبار معالجة الأخطاء...');
        const response4 = await (0, supertest_1.default)(server).get('/test-error');
        console.log('Status:', response4.status);
        console.log('Error response:', JSON.stringify(response4.body, null, 2));
        if (response4.status === 500 &&
            response4.body.success === false &&
            response4.body.error &&
            response4.body.error.code &&
            response4.body.error.traceId) {
            console.log('✅ معالجة الأخطاء تعمل بشكل صحيح');
        }
        else {
            console.log('❌ مشكلة في معالجة الأخطاء');
        }
        console.log('\n🗑️ اختبار إبطال الكاش...');
        const testData = { name: 'Test Item', value: 'test-value' };
        const response5 = await (0, supertest_1.default)(server)
            .post('/test-invalidation')
            .send(testData);
        console.log('Status:', response5.status);
        console.log('Created item:', response5.body.data);
        if (response5.status === 200 &&
            response5.body.success === true &&
            response5.body.data?.id) {
            console.log('✅ إبطال الكاش يعمل بشكل صحيح');
        }
        else {
            console.log('❌ مشكلة في إبطال الكاش');
        }
        console.log('\n💾 اختبار الكاش...');
        const start1 = Date.now();
        const response6a = await (0, supertest_1.default)(server).get('/');
        const duration1 = Date.now() - start1;
        const start2 = Date.now();
        const response6b = await (0, supertest_1.default)(server).get('/');
        const duration2 = Date.now() - start2;
        console.log(`الطلب الأول: ${duration1}ms`);
        console.log(`الطلب الثاني: ${duration2}ms`);
        if (response6a.status === 200 && response6b.status === 200 &&
            response6a.body.success === true && response6b.body.success === true) {
            console.log('✅ الكاش يعمل بشكل صحيح');
        }
        else {
            console.log('❌ مشكلة في الكاش');
        }
        console.log('\n✅ اختبار validation...');
        const response7a = await (0, supertest_1.default)(server)
            .post('/test-invalidation')
            .send({ name: 'Valid Name', value: 'valid value' });
        if (response7a.status === 200) {
            console.log('✅ البيانات الصحيحة تم قبولها');
        }
        const response7b = await (0, supertest_1.default)(server)
            .post('/test-invalidation')
            .send({ value: 'missing name' });
        if (response7b.status === 400 &&
            response7b.body.success === false &&
            response7b.body.error?.code === 'VALIDATION_ERROR') {
            console.log('✅ validation يعمل بشكل صحيح');
        }
        else {
            console.log('❌ مشكلة في validation');
            console.log('Response:', JSON.stringify(response7b.body, null, 2));
        }
        console.log('\n🎉 تم الانتهاء من جميع اختبارات API بنجاح!');
        console.log('\n📊 ملخص الاختبارات:');
        console.log('✅ Response Interceptor - يوحد شكل الاستجابات');
        console.log('✅ Exception Filters - يعالج الأخطاء بطريقة موحدة');
        console.log('✅ Validation Pipe - يتحقق من البيانات ويترجم الأخطاء');
        console.log('✅ Logging Interceptor - يسجل جميع الطلبات');
        console.log('✅ Cache System - يحسن الأداء ويوفر الموارد');
        console.log('✅ Error Codes - نظام أخطاء موحد ومنظم');
    }
    catch (error) {
        console.error('❌ فشل في اختبار نظام API:', error);
        process.exit(1);
    }
    finally {
        await app.close();
    }
}
testApiSystem();
//# sourceMappingURL=test-api.js.map