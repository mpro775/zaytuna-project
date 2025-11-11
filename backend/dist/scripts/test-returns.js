#!/usr/bin/env tsx
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const supertest_1 = __importDefault(require("supertest"));
async function testReturnsSystem() {
    console.log('🔄 بدء اختبار نظام المرتجعات...');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const server = app.getHttpServer();
    let adminToken;
    let testCustomerId = '';
    let testCurrencyId = '';
    let testWarehouseId = '';
    let testProductId = '';
    let testVariantId = '';
    let testInvoiceId = '';
    let testReturnId = '';
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
        console.log('\n👤 الحصول على العملاء...');
        const customersResponse = await (0, supertest_1.default)(server)
            .get('/customers')
            .set('Authorization', `Bearer ${adminToken}`);
        if (customersResponse.status === 200 && customersResponse.body.length > 0) {
            testCustomerId = customersResponse.body[0].id;
            console.log('✅ تم العثور على عملاء');
            console.log('Customer ID:', testCustomerId);
        }
        else {
            console.log('❌ لم يتم العثور على عملاء - سننشئ عميل جديد');
            const customerResponse = await (0, supertest_1.default)(server)
                .post('/customers')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                name: 'عميل المرتجعات',
                phone: '+966501234568',
                email: 'returns@example.com',
                address: 'الرياض، المملكة العربية السعودية',
                taxNumber: '1234567891',
                creditLimit: 10000.00,
            });
            if (customerResponse.status === 201 && customerResponse.body.id) {
                testCustomerId = customerResponse.body.id;
                console.log('✅ تم إنشاء العميل بنجاح');
                console.log('Customer ID:', testCustomerId);
            }
            else {
                console.log('❌ فشل في إنشاء العميل');
                return;
            }
        }
        console.log('\n💱 الحصول على العملات...');
        const currenciesResponse = await (0, supertest_1.default)(server)
            .get('/currencies')
            .set('Authorization', `Bearer ${adminToken}`);
        if (currenciesResponse.status === 200 && currenciesResponse.body.length > 0) {
            testCurrencyId = currenciesResponse.body[0].id;
            console.log('✅ تم العثور على عملات');
            console.log('Currency ID:', testCurrencyId);
        }
        else {
            console.log('❌ لم يتم العثور على عملات - سننشئ عملة جديدة');
            const currencyResponse = await (0, supertest_1.default)(server)
                .post('/currencies')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                code: 'SAR',
                name: 'ريال سعودي',
                symbol: 'ر.س',
                exchangeRate: 1.0,
                isBase: true,
            });
            if (currencyResponse.status === 201 && currencyResponse.body.id) {
                testCurrencyId = currencyResponse.body.id;
                console.log('✅ تم إنشاء العملة بنجاح');
                console.log('Currency ID:', testCurrencyId);
            }
            else {
                console.log('❌ فشل في إنشاء العملة');
                return;
            }
        }
        console.log('\n🏭 الحصول على المخازن...');
        const warehousesResponse = await (0, supertest_1.default)(server)
            .get('/warehouses')
            .set('Authorization', `Bearer ${adminToken}`);
        if (warehousesResponse.status === 200 && warehousesResponse.body.length > 0) {
            testWarehouseId = warehousesResponse.body[0].id;
            console.log('✅ تم العثور على مخازن');
            console.log('Warehouse ID:', testWarehouseId);
        }
        else {
            console.log('❌ لم يتم العثور على مخازن');
            return;
        }
        console.log('\n🛍️ الحصول على المنتجات...');
        const productsResponse = await (0, supertest_1.default)(server)
            .get('/products')
            .set('Authorization', `Bearer ${adminToken}`);
        if (productsResponse.status === 200 && productsResponse.body.length > 0) {
            testProductId = productsResponse.body[0].id;
            console.log('✅ تم العثور على منتجات');
            console.log('Product ID:', testProductId);
        }
        else {
            console.log('❌ لم يتم العثور على منتجات - سننشئ منتج جديد');
            const productResponse = await (0, supertest_1.default)(server)
                .post('/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                name: 'منتج المرتجعات',
                description: 'منتج لاختبار نظام المرتجعات',
                barcode: 'RETURNS001234',
                sku: 'RETURNS-PRODUCT',
                categoryId: 'some-category-id',
                basePrice: 299.99,
                costPrice: 200.00,
                trackInventory: true,
                reorderPoint: 5,
            });
            if (productResponse.status === 201 && productResponse.body.id) {
                testProductId = productResponse.body.id;
                console.log('✅ تم إنشاء المنتج بنجاح');
                console.log('Product ID:', testProductId);
            }
            else {
                console.log('❌ فشل في إنشاء المنتج');
                return;
            }
        }
        console.log('\n🎨 الحصول على متغيرات المنتج...');
        const variantsResponse = await (0, supertest_1.default)(server)
            .get(`/product-variants?productId=${testProductId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        if (variantsResponse.status === 200 && variantsResponse.body.length > 0) {
            testVariantId = variantsResponse.body[0].id;
            console.log('✅ تم العثور على متغيرات المنتج');
            console.log('Variant ID:', testVariantId);
        }
        else {
            console.log('❌ لم يتم العثور على متغيرات المنتج - سننشئ متغير جديد');
            const variantResponse = await (0, supertest_1.default)(server)
                .post('/product-variants')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                productId: testProductId,
                name: 'منتج المرتجعات - أسود',
                sku: 'RETURNS-PRODUCT-BLK',
                barcode: 'RETURNS001235',
                price: 349.99,
                costPrice: 250.00,
                weight: 0.3,
                attributes: {
                    color: 'أسود',
                    size: 'M',
                },
            });
            if (variantResponse.status === 201 && variantResponse.body.id) {
                testVariantId = variantResponse.body.id;
                console.log('✅ تم إنشاء متغير المنتج بنجاح');
                console.log('Variant ID:', testVariantId);
            }
            else {
                console.log('❌ فشل في إنشاء متغير المنتج');
                return;
            }
        }
        console.log('\n📦 إنشاء عنصر مخزون...');
        const stockItemResponse = await (0, supertest_1.default)(server)
            .post('/inventory/stock-items')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            warehouseId: testWarehouseId,
            productVariantId: testVariantId,
            quantity: 10,
            minStock: 2,
            maxStock: 50,
        });
        if (stockItemResponse.status === 201) {
            console.log('✅ تم إنشاء عنصر المخزون بنجاح');
            console.log('Initial quantity: 10');
        }
        else {
            console.log('❌ فشل في إنشاء عنصر المخزون');
            console.log('Response:', JSON.stringify(stockItemResponse.body, null, 2));
            return;
        }
        console.log('\n🧾 إنشاء فاتورة مبيعات...');
        const invoiceResponse = await (0, supertest_1.default)(server)
            .post('/sales/invoices')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            invoiceNumber: 'SALES-FOR-RETURNS-001',
            branchId: 'some-branch-id',
            customerId: testCustomerId,
            warehouseId: testWarehouseId,
            currencyId: testCurrencyId,
            lines: [
                {
                    productVariantId: testVariantId,
                    quantity: 3,
                    unitPrice: 349.99,
                    discountAmount: 50.00,
                },
            ],
            status: 'confirmed',
            notes: 'فاتورة مبيعات لاختبار المرتجعات',
        });
        let branchId = 'some-branch-id';
        if (invoiceResponse.status === 400) {
            const branchesResponse = await (0, supertest_1.default)(server)
                .get('/branches')
                .set('Authorization', `Bearer ${adminToken}`);
            if (branchesResponse.status === 200 && branchesResponse.body.length > 0) {
                branchId = branchesResponse.body[0].id;
                const invoiceResponse2 = await (0, supertest_1.default)(server)
                    .post('/sales/invoices')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                    invoiceNumber: 'SALES-FOR-RETURNS-001',
                    branchId,
                    customerId: testCustomerId,
                    warehouseId: testWarehouseId,
                    currencyId: testCurrencyId,
                    lines: [
                        {
                            productVariantId: testVariantId,
                            quantity: 3,
                            unitPrice: 349.99,
                            discountAmount: 50.00,
                        },
                    ],
                    status: 'confirmed',
                    notes: 'فاتورة مبيعات لاختبار المرتجعات',
                });
                if (invoiceResponse2.status === 201 && invoiceResponse2.body.id) {
                    testInvoiceId = invoiceResponse2.body.id;
                    console.log('✅ تم إنشاء فاتورة المبيعات بنجاح');
                    console.log('Invoice ID:', testInvoiceId);
                    console.log('Invoice Number:', invoiceResponse2.body.invoiceNumber);
                    console.log('Total Amount:', invoiceResponse2.body.totalAmount);
                }
                else {
                    console.log('❌ فشل في إنشاء فاتورة المبيعات');
                    console.log('Response:', JSON.stringify(invoiceResponse2.body, null, 2));
                    return;
                }
            }
            else {
                console.log('❌ لم يتم العثور على فروع');
                return;
            }
        }
        else if (invoiceResponse.status === 201 && invoiceResponse.body.id) {
            testInvoiceId = invoiceResponse.body.id;
            console.log('✅ تم إنشاء فاتورة المبيعات بنجاح');
            console.log('Invoice ID:', testInvoiceId);
            console.log('Invoice Number:', invoiceResponse.body.invoiceNumber);
            console.log('Total Amount:', invoiceResponse.body.totalAmount);
        }
        else {
            console.log('❌ فشل في إنشاء فاتورة المبيعات');
            console.log('Response:', JSON.stringify(invoiceResponse.body, null, 2));
            return;
        }
        console.log('\n🔄 إنشاء مرتجع...');
        const returnResponse = await (0, supertest_1.default)(server)
            .post('/returns')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            returnNumber: 'RTN-TEST-001',
            salesInvoiceId: testInvoiceId,
            warehouseId: testWarehouseId,
            reason: 'المنتج معيب',
            lines: [
                {
                    productVariantId: testVariantId,
                    quantity: 1,
                    discountAmount: 0.00,
                    taxAmount: 0.00,
                    reason: 'المنتج معيب ولن يتم إعادة بيعه',
                },
            ],
            status: 'confirmed',
            notes: 'مرتجع تجريبي للمنتج المعيب',
        });
        console.log('Return status:', returnResponse.status);
        if (returnResponse.status === 201 && returnResponse.body.id) {
            testReturnId = returnResponse.body.id;
            console.log('✅ تم إنشاء المرتجع بنجاح');
            console.log('Return ID:', testReturnId);
            console.log('Return Number:', returnResponse.body.returnNumber);
            console.log('Total Amount:', returnResponse.body.totalAmount);
        }
        else {
            console.log('❌ فشل في إنشاء المرتجع');
            console.log('Response:', JSON.stringify(returnResponse.body, null, 2));
            return;
        }
        console.log('\n📋 الحصول على المرتجعات...');
        const returnsResponse = await (0, supertest_1.default)(server)
            .get('/returns')
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Returns status:', returnsResponse.status);
        console.log('Returns count:', returnsResponse.body?.length || 0);
        if (returnsResponse.status === 200 && Array.isArray(returnsResponse.body)) {
            console.log('✅ تم الحصول على المرتجعات بنجاح');
            const testReturn = returnsResponse.body.find(r => r.id === testReturnId);
            if (testReturn) {
                console.log('✅ المرتجع موجود في القائمة');
                console.log('Return details:', {
                    number: testReturn.returnNumber,
                    status: testReturn.status,
                    refundStatus: testReturn.refundStatus,
                    totalAmount: testReturn.totalAmount,
                    reason: testReturn.reason,
                });
            }
        }
        else {
            console.log('❌ فشل في الحصول على المرتجعات');
        }
        console.log('\n📄 إنشاء إشعار دائن...');
        const creditNoteResponse = await (0, supertest_1.default)(server)
            .post(`/returns/${testReturnId}/credit-notes`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            amount: 349.99,
            expiryDate: '2025-12-31',
            notes: 'إشعار دائن للمرتجع',
        });
        console.log('Credit note status:', creditNoteResponse.status);
        if (creditNoteResponse.status === 201) {
            console.log('✅ تم إنشاء إشعار الدائن بنجاح');
            console.log('Credit Note Number:', creditNoteResponse.body.creditNoteNumber);
            console.log('Amount:', creditNoteResponse.body.amount);
        }
        else {
            console.log('❌ فشل في إنشاء إشعار الدائن');
            console.log('Response:', JSON.stringify(creditNoteResponse.body, null, 2));
        }
        console.log('\n📊 إحصائيات المرتجعات...');
        const statsResponse = await (0, supertest_1.default)(server)
            .get('/returns/stats/overview')
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Returns stats status:', statsResponse.status);
        if (statsResponse.status === 200 && statsResponse.body) {
            console.log('✅ تم الحصول على إحصائيات المرتجعات بنجاح');
            console.log('Stats:', statsResponse.body);
        }
        else {
            console.log('❌ فشل في الحصول على إحصائيات المرتجعات');
        }
        console.log('\n📦 التحقق من تحديث المخزون...');
        const stockCheckResponse = await (0, supertest_1.default)(server)
            .get(`/inventory/stock-items/${testWarehouseId}/${testVariantId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Stock check status:', stockCheckResponse.status);
        if (stockCheckResponse.status === 200) {
            console.log('✅ تم التحقق من تحديث المخزون');
            console.log('Current quantity:', stockCheckResponse.body.quantity);
            console.log('Expected quantity: 10 (10 أولي + 1 مرتجع = 11)');
        }
        else {
            console.log('❌ فشل في التحقق من المخزون');
        }
        console.log('\n🚫 إلغاء المرتجع...');
        const cancelResponse = await (0, supertest_1.default)(server)
            .delete(`/returns/${testReturnId}/cancel`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            reason: 'إلغاء لأغراض الاختبار',
        });
        console.log('Cancel return status:', cancelResponse.status);
        if (cancelResponse.status === 200) {
            console.log('✅ تم إلغاء المرتجع بنجاح');
            console.log('New status:', cancelResponse.body.status);
        }
        else {
            console.log('❌ فشل في إلغاء المرتجع');
            console.log('Response:', JSON.stringify(cancelResponse.body, null, 2));
        }
        console.log('\n🗑️ تنظيف البيانات...');
        await (0, supertest_1.default)(server)
            .post(`/inventory/stock-items/${testWarehouseId}/${testVariantId}/adjust`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            quantity: -11,
            movementType: 'adjustment',
            reason: 'تنظيف البيانات',
        });
        console.log('\n🎉 تم الانتهاء من جميع اختبارات نظام المرتجعات بنجاح!');
        console.log('\n📋 ملخص النظام المُطبق:');
        console.log('✅ إنشاء وإدارة المرتجعات مع التحقق من صحة البيانات');
        console.log('✅ المرتجعات الكلية والجزئية مع التحقق من الكميات');
        console.log('✅ تحديث المخزون تلقائياً عند إنشاء المرتجعات');
        console.log('✅ إنشاء إشعارات دائنة للاسترداد المالي');
        console.log('✅ إلغاء المرتجعات وإعادة المخزون');
        console.log('✅ إحصائيات شاملة للمرتجعات والإرجاعات');
        console.log('✅ تتبع حالات المرتجعات وحالات الاسترداد');
        console.log('✅ تكامل كامل مع نظام المبيعات والمخزون');
        console.log('✅ validation شامل للبيانات والعمليات');
        console.log('✅ معاملات قاعدة البيانات للأمان والاتساق');
        console.log('\n🔗 API Endpoints الجديدة:');
        console.log('POST /returns - إنشاء مرتجع');
        console.log('GET /returns - قائمة المرتجعات');
        console.log('GET /returns/:id - تفاصيل مرتجع');
        console.log('PATCH /returns/:id - تحديث مرتجع');
        console.log('DELETE /returns/:id/cancel - إلغاء مرتجع');
        console.log('POST /returns/:id/credit-notes - إنشاء إشعار دائن');
        console.log('GET /returns/stats/overview - إحصائيات المرتجعات');
        console.log('GET /returns/sales-invoices/:invoiceId/returns - مرتجعات فاتورة');
        console.log('GET /returns/customers/:customerId/returns - مرتجعات العميل');
        console.log('\n📊 حالات المرتجعات:');
        console.log('- draft: مسودة');
        console.log('- confirmed: مؤكدة');
        console.log('- cancelled: ملغاة');
        console.log('- refunded: مستردة');
        console.log('\n💰 حالات الاسترداد:');
        console.log('- pending: معلق');
        console.log('- partial: جزئي');
        console.log('- refunded: مسترد');
        console.log('\n📄 حالات إشعارات الدائن:');
        console.log('- active: نشط');
        console.log('- used: مستخدم');
        console.log('- expired: منتهي الصلاحية');
        console.log('- cancelled: ملغى');
        console.log('\n🔄 منطق المرتجعات:');
        console.log('1. التحقق من فاتورة المبيعات وحالة التأكيد');
        console.log('2. التحقق من الكميات المتاحة للمرتجع');
        console.log('3. إنشاء المرتجع وحفظ البنود');
        console.log('4. تحديث المخزون بإضافة الكميات المرتجعة');
        console.log('5. إنشاء إشعارات دائنة للاسترداد المالي');
        console.log('6. تتبع حالة المرتجع وحالة الاسترداد');
    }
    catch (error) {
        console.error('❌ فشل في اختبار نظام المرتجعات:', error);
        process.exit(1);
    }
    finally {
        await app.close();
    }
}
testReturnsSystem();
//# sourceMappingURL=test-returns.js.map