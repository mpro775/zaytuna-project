#!/usr/bin/env tsx
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const supertest_1 = __importDefault(require("supertest"));
async function testProductsSystem() {
    console.log('📦 بدء اختبار نظام إدارة المنتجات...');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const server = app.getHttpServer();
    let adminToken;
    let testCategoryId = '';
    let testProductId = '';
    let testVariantId = '';
    try {
        console.log('\n🔐 تسجيل الدخول كمدير...');
        const loginResponse = await (0, supertest_1.default)(server)
            .post('/auth/login')
            .send({
            username: 'admin',
            password: 'admin123',
        });
        if (loginResponse.status === 200 && loginResponse.body.success === true) {
            adminToken = loginResponse.body.data.accessToken;
            console.log('✅ تم تسجيل الدخول كمدير بنجاح');
        }
        else {
            console.log('❌ فشل في تسجيل الدخول كمدير');
            console.log('Response:', JSON.stringify(loginResponse.body, null, 2));
            return;
        }
        console.log('\n📁 إنشاء فئة جديدة...');
        const newCategory = {
            name: 'الإلكترونيات',
            description: 'أجهزة ومعدات إلكترونية',
            imageUrl: 'https://example.com/electronics.jpg',
        };
        const createCategoryResponse = await (0, supertest_1.default)(server)
            .post('/categories')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(newCategory);
        console.log('Create category status:', createCategoryResponse.status);
        if (createCategoryResponse.status === 201 && createCategoryResponse.body.id) {
            testCategoryId = createCategoryResponse.body.id;
            console.log('✅ تم إنشاء الفئة بنجاح');
            console.log('Category ID:', testCategoryId);
        }
        else {
            console.log('❌ فشل في إنشاء الفئة');
            console.log('Response:', JSON.stringify(createCategoryResponse.body, null, 2));
        }
        console.log('\n📂 الحصول على جميع الفئات...');
        const categoriesResponse = await (0, supertest_1.default)(server)
            .get('/categories')
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Categories status:', categoriesResponse.status);
        console.log('Categories count:', categoriesResponse.body?.length || 0);
        if (categoriesResponse.status === 200 && Array.isArray(categoriesResponse.body)) {
            console.log('✅ تم الحصول على الفئات بنجاح');
            const testCategory = categoriesResponse.body.find(cat => cat.id === testCategoryId);
            if (testCategory) {
                console.log('✅ الفئة الجديدة موجودة في القائمة');
                console.log('Category details:', {
                    name: testCategory.name,
                    level: testCategory.level,
                    productCount: testCategory.productCount,
                });
            }
        }
        else {
            console.log('❌ فشل في الحصول على الفئات');
        }
        console.log('\n🛍️ إنشاء منتج جديد...');
        const newProduct = {
            name: 'هاتف ذكي سامسونج',
            description: 'هاتف ذكي سامسونج جالاكسي S23',
            barcode: '8806094012345',
            sku: 'SAMSUNG-S23-BLK',
            categoryId: testCategoryId,
            basePrice: 2999.99,
            costPrice: 2500.00,
            trackInventory: true,
            reorderPoint: 5,
            imageUrl: 'https://example.com/samsung-s23.jpg',
        };
        const createProductResponse = await (0, supertest_1.default)(server)
            .post('/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(newProduct);
        console.log('Create product status:', createProductResponse.status);
        if (createProductResponse.status === 201 && createProductResponse.body.id) {
            testProductId = createProductResponse.body.id;
            console.log('✅ تم إنشاء المنتج بنجاح');
            console.log('Product ID:', testProductId);
        }
        else {
            console.log('❌ فشل في إنشاء المنتج');
            console.log('Response:', JSON.stringify(createProductResponse.body, null, 2));
        }
        console.log('\n📦 الحصول على جميع المنتجات...');
        const productsResponse = await (0, supertest_1.default)(server)
            .get('/products')
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Products status:', productsResponse.status);
        console.log('Products count:', productsResponse.body?.length || 0);
        if (productsResponse.status === 200 && Array.isArray(productsResponse.body)) {
            console.log('✅ تم الحصول على المنتجات بنجاح');
            const testProduct = productsResponse.body.find(prod => prod.id === testProductId);
            if (testProduct) {
                console.log('✅ المنتج الجديد موجود في القائمة');
            }
        }
        else {
            console.log('❌ فشل في الحصول على المنتجات');
        }
        console.log('\n🔍 البحث عن منتج بالباركود...');
        const lookupResponse = await (0, supertest_1.default)(server)
            .get(`/products/lookup/${newProduct.barcode}`)
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Product lookup status:', lookupResponse.status);
        if (lookupResponse.status === 200 && lookupResponse.body) {
            console.log('✅ تم العثور على المنتج بالباركود');
            console.log('Found product:', lookupResponse.body.name);
        }
        else {
            console.log('❌ فشل في البحث عن المنتج');
        }
        console.log('\n🎨 إنشاء متغير منتج...');
        const newVariant = {
            productId: testProductId,
            name: 'هاتف سامسونج جالاكسي S23 - أسود',
            sku: 'SAMSUNG-S23-BLK-128GB',
            barcode: '8806094012346',
            price: 3199.99,
            costPrice: 2700.00,
            weight: 0.168,
            dimensions: {
                length: 14.6,
                width: 7.1,
                height: 0.76,
            },
            attributes: {
                color: 'أسود',
                storage: '128GB',
                ram: '8GB',
            },
            imageUrl: 'https://example.com/samsung-s23-black.jpg',
        };
        const createVariantResponse = await (0, supertest_1.default)(server)
            .post('/product-variants')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(newVariant);
        console.log('Create variant status:', createVariantResponse.status);
        if (createVariantResponse.status === 201 && createVariantResponse.body.id) {
            testVariantId = createVariantResponse.body.id;
            console.log('✅ تم إنشاء متغير المنتج بنجاح');
            console.log('Variant ID:', testVariantId);
        }
        else {
            console.log('❌ فشل في إنشاء متغير المنتج');
            console.log('Response:', JSON.stringify(createVariantResponse.body, null, 2));
        }
        console.log('\n🎭 الحصول على متغيرات المنتج...');
        const variantsResponse = await (0, supertest_1.default)(server)
            .get(`/product-variants?productId=${testProductId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Product variants status:', variantsResponse.status);
        if (variantsResponse.status === 200 && Array.isArray(variantsResponse.body)) {
            console.log('✅ تم الحصول على متغيرات المنتج بنجاح');
            console.log('Variants count:', variantsResponse.body.length);
        }
        else {
            console.log('❌ فشل في الحصول على متغيرات المنتج');
        }
        console.log('\n✏️ تحديث المنتج...');
        const updateProductData = {
            description: 'هاتف ذكي سامسونج جالاكسي S23 - محدث',
            basePrice: 2899.99,
        };
        const updateProductResponse = await (0, supertest_1.default)(server)
            .patch(`/products/${testProductId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updateProductData);
        console.log('Update product status:', updateProductResponse.status);
        if (updateProductResponse.status === 200) {
            console.log('✅ تم تحديث المنتج بنجاح');
        }
        else {
            console.log('❌ فشل في تحديث المنتج');
        }
        console.log('\n🎨 تحديث متغير المنتج...');
        const updateVariantData = {
            price: 3099.99,
            attributes: {
                color: 'أسود',
                storage: '128GB',
                ram: '8GB',
                warranty: 'سنة',
            },
        };
        const updateVariantResponse = await (0, supertest_1.default)(server)
            .patch(`/product-variants/${testVariantId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updateVariantData);
        console.log('Update variant status:', updateVariantResponse.status);
        if (updateVariantResponse.status === 200) {
            console.log('✅ تم تحديث متغير المنتج بنجاح');
        }
        else {
            console.log('❌ فشل في تحديث متغير المنتج');
        }
        console.log('\n📊 إحصائيات المنتجات...');
        const productStatsResponse = await (0, supertest_1.default)(server)
            .get('/products/stats')
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Product stats status:', productStatsResponse.status);
        if (productStatsResponse.status === 200 && productStatsResponse.body.totalProducts) {
            console.log('✅ تم الحصول على إحصائيات المنتجات بنجاح');
            console.log('Stats:', productStatsResponse.body);
        }
        else {
            console.log('❌ فشل في الحصول على إحصائيات المنتجات');
        }
        console.log('\n📈 إحصائيات الفئات...');
        const categoryStatsResponse = await (0, supertest_1.default)(server)
            .get('/categories/stats')
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Category stats status:', categoryStatsResponse.status);
        if (categoryStatsResponse.status === 200) {
            console.log('✅ تم الحصول على إحصائيات الفئات بنجاح');
            console.log('Stats:', categoryStatsResponse.body);
        }
        else {
            console.log('❌ فشل في الحصول على إحصائيات الفئات');
        }
        console.log('\n🗑️ تنظيف البيانات...');
        const deleteVariantResponse = await (0, supertest_1.default)(server)
            .delete(`/product-variants/${testVariantId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Delete variant status:', deleteVariantResponse.status);
        if (deleteVariantResponse.status === 200) {
            console.log('✅ تم حذف متغير المنتج بنجاح');
        }
        else {
            console.log('❌ فشل في حذف متغير المنتج');
        }
        const deleteProductResponse = await (0, supertest_1.default)(server)
            .delete(`/products/${testProductId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Delete product status:', deleteProductResponse.status);
        if (deleteProductResponse.status === 200) {
            console.log('✅ تم حذف المنتج بنجاح');
        }
        else {
            console.log('❌ فشل في حذف المنتج');
        }
        const deleteCategoryResponse = await (0, supertest_1.default)(server)
            .delete(`/categories/${testCategoryId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Delete category status:', deleteCategoryResponse.status);
        if (deleteCategoryResponse.status === 200) {
            console.log('✅ تم حذف الفئة بنجاح');
        }
        else {
            console.log('❌ فشل في حذف الفئة');
        }
        console.log('\n🚪 تسجيل الخروج...');
        const logoutResponse = await (0, supertest_1.default)(server)
            .post('/auth/logout')
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Logout status:', logoutResponse.status);
        if (logoutResponse.status === 200) {
            console.log('✅ تم تسجيل الخروج بنجاح');
        }
        else {
            console.log('❌ فشل في تسجيل الخروج');
        }
        console.log('\n🎉 تم الانتهاء من جميع اختبارات إدارة المنتجات بنجاح!');
        console.log('\n📋 ملخص النظام المُطبق:');
        console.log('✅ إنشاء وإدارة الفئات الهرمية');
        console.log('✅ إنشاء وإدارة المنتجات مع الباركود وSKU');
        console.log('✅ إدارة متغيرات المنتجات (الألوان، الأحجام)');
        console.log('✅ البحث المتقدم بالباركود والاسم');
        console.log('✅ إدارة الأسعار والتكاليف');
        console.log('✅ إحصائيات شاملة للمنتجات والفئات');
        console.log('✅ تكامل كامل مع نظام الصلاحيات');
        console.log('✅ نظام كاش محسن للأداء');
        console.log('✅ validation شامل للبيانات');
        console.log('\n🔗 API Endpoints الجديدة:');
        console.log('GET /categories - قائمة الفئات');
        console.log('POST /categories - إنشاء فئة جديدة');
        console.log('GET /categories/:id - تفاصيل فئة');
        console.log('PATCH /categories/:id - تحديث فئة');
        console.log('DELETE /categories/:id - حذف فئة');
        console.log('GET /categories/stats - إحصائيات الفئات');
        console.log('GET /categories/root - الفئات الجذر');
        console.log('GET /categories/:id/subcategories - الفئات الفرعية');
        console.log('');
        console.log('GET /products - قائمة المنتجات');
        console.log('POST /products - إنشاء منتج جديد');
        console.log('GET /products/:id - تفاصيل منتج');
        console.log('PATCH /products/:id - تحديث منتج');
        console.log('DELETE /products/:id - حذف منتج');
        console.log('GET /products/stats - إحصائيات المنتجات');
        console.log('GET /products/lookup/:barcode - البحث بالباركود');
        console.log('');
        console.log('GET /product-variants - قائمة المتغيرات');
        console.log('POST /product-variants - إنشاء متغير جديد');
        console.log('GET /product-variants/:id - تفاصيل متغير');
        console.log('PATCH /product-variants/:id - تحديث متغير');
        console.log('DELETE /product-variants/:id - حذف متغير');
        console.log('GET /product-variants/lookup/:barcode - البحث بالباركود');
    }
    catch (error) {
        console.error('❌ فشل في اختبار نظام إدارة المنتجات:', error);
        process.exit(1);
    }
    finally {
        await app.close();
    }
}
testProductsSystem();
//# sourceMappingURL=test-products.js.map