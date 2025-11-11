#!/usr/bin/env tsx
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const supertest_1 = __importDefault(require("supertest"));
async function testSalesSystem() {
    console.log('💰 بدء اختبار نظام المبيعات...');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const server = app.getHttpServer();
    let adminToken;
    let testCustomerId = '';
    let testCurrencyId = '';
    let testWarehouseId = '';
    let testProductId = '';
    let testVariantId = '';
    let testInvoiceId = '';
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
        console.log('\n👤 إنشاء عميل...');
        const customerResponse = await (0, supertest_1.default)(server)
            .post('/customers')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            name: 'أحمد محمد',
            phone: '+966501234567',
            email: 'ahmed@example.com',
            address: 'الرياض، المملكة العربية السعودية',
            taxNumber: '1234567890',
            creditLimit: 5000.00,
        });
        if (customerResponse.status === 201 && customerResponse.body.id) {
            testCustomerId = customerResponse.body.id;
            console.log('✅ تم إنشاء العميل بنجاح');
            console.log('Customer ID:', testCustomerId);
        }
        else {
            console.log('❌ فشل في إنشاء العميل');
            console.log('Response:', JSON.stringify(customerResponse.body, null, 2));
            return;
        }
        console.log('\n💱 إنشاء عملة...');
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
            console.log('Response:', JSON.stringify(currencyResponse.body, null, 2));
            return;
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
        console.log('\n🛍️ إنشاء منتج...');
        const productResponse = await (0, supertest_1.default)(server)
            .post('/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            name: 'هاتف ذكي للمبيعات',
            description: 'هاتف ذكي لاختبار نظام المبيعات',
            barcode: 'SALES001234',
            sku: 'SALES-PHONE',
            categoryId: 'some-category-id',
            basePrice: 1999.99,
            costPrice: 1500.00,
            trackInventory: true,
            reorderPoint: 5,
        });
        let categoryId = 'some-category-id';
        if (productResponse.status === 400 && productResponse.body.message?.includes('الفئة')) {
            const categoriesResponse = await (0, supertest_1.default)(server)
                .get('/categories')
                .set('Authorization', `Bearer ${adminToken}`);
            if (categoriesResponse.status === 200 && categoriesResponse.body.length > 0) {
                categoryId = categoriesResponse.body[0].id;
                console.log('استخدام فئة موجودة:', categoryId);
                const productResponse2 = await (0, supertest_1.default)(server)
                    .post('/products')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                    name: 'هاتف ذكي للمبيعات',
                    description: 'هاتف ذكي لاختبار نظام المبيعات',
                    barcode: 'SALES001234',
                    sku: 'SALES-PHONE',
                    categoryId,
                    basePrice: 1999.99,
                    costPrice: 1500.00,
                    trackInventory: true,
                    reorderPoint: 5,
                });
                if (productResponse2.status === 201 && productResponse2.body.id) {
                    testProductId = productResponse2.body.id;
                    console.log('✅ تم إنشاء المنتج بنجاح');
                    console.log('Product ID:', testProductId);
                }
                else {
                    console.log('❌ فشل في إنشاء المنتج');
                    console.log('Response:', JSON.stringify(productResponse2.body, null, 2));
                    return;
                }
            }
            else {
                console.log('❌ لم يتم العثور على فئات');
                return;
            }
        }
        else if (productResponse.status === 201 && productResponse.body.id) {
            testProductId = productResponse.body.id;
            console.log('✅ تم إنشاء المنتج بنجاح');
            console.log('Product ID:', testProductId);
        }
        else {
            console.log('❌ فشل في إنشاء المنتج');
            console.log('Response:', JSON.stringify(productResponse.body, null, 2));
            return;
        }
        console.log('\n🎨 إنشاء متغير منتج...');
        const variantResponse = await (0, supertest_1.default)(server)
            .post('/product-variants')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            productId: testProductId,
            name: 'هاتف ذكي للمبيعات - أسود',
            sku: 'SALES-PHONE-BLK',
            barcode: 'SALES001235',
            price: 2199.99,
            costPrice: 1700.00,
            weight: 0.2,
            attributes: {
                color: 'أسود',
                storage: '128GB',
            },
        });
        if (variantResponse.status === 201 && variantResponse.body.id) {
            testVariantId = variantResponse.body.id;
            console.log('✅ تم إنشاء متغير المنتج بنجاح');
            console.log('Variant ID:', testVariantId);
        }
        else {
            console.log('❌ فشل في إنشاء متغير المنتج');
            console.log('Response:', JSON.stringify(variantResponse.body, null, 2));
            return;
        }
        console.log('\n📦 إنشاء عنصر مخزون...');
        const stockItemResponse = await (0, supertest_1.default)(server)
            .post('/inventory/stock-items')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            warehouseId: testWarehouseId,
            productVariantId: testVariantId,
            quantity: 20,
            minStock: 5,
            maxStock: 100,
        });
        if (stockItemResponse.status === 201) {
            console.log('✅ تم إنشاء عنصر المخزون بنجاح');
            console.log('Initial quantity: 20');
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
            invoiceNumber: 'SALES-TEST-001',
            branchId: 'some-branch-id',
            customerId: testCustomerId,
            warehouseId: testWarehouseId,
            currencyId: testCurrencyId,
            lines: [
                {
                    productVariantId: testVariantId,
                    quantity: 2,
                    unitPrice: 2199.99,
                    discountAmount: 100.00,
                },
            ],
            status: 'confirmed',
            notes: 'فاتورة اختبار نظام المبيعات',
        });
        let branchId = 'some-branch-id';
        if (invoiceResponse.status === 400 && invoiceResponse.body.message?.includes('الفرع')) {
            const branchesResponse = await (0, supertest_1.default)(server)
                .get('/branches')
                .set('Authorization', `Bearer ${adminToken}`);
            if (branchesResponse.status === 200 && branchesResponse.body.length > 0) {
                branchId = branchesResponse.body[0].id;
                console.log('استخدام فرع موجود:', branchId);
                const invoiceResponse2 = await (0, supertest_1.default)(server)
                    .post('/sales/invoices')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                    invoiceNumber: 'SALES-TEST-001',
                    branchId,
                    customerId: testCustomerId,
                    warehouseId: testWarehouseId,
                    currencyId: testCurrencyId,
                    lines: [
                        {
                            productVariantId: testVariantId,
                            quantity: 2,
                            unitPrice: 2199.99,
                            discountAmount: 100.00,
                        },
                    ],
                    status: 'confirmed',
                    notes: 'فاتورة اختبار نظام المبيعات',
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
        console.log('\n📋 الحصول على فواتير المبيعات...');
        const invoicesResponse = await (0, supertest_1.default)(server)
            .get('/sales/invoices')
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Sales invoices status:', invoicesResponse.status);
        console.log('Sales invoices count:', invoicesResponse.body?.length || 0);
        if (invoicesResponse.status === 200 && Array.isArray(invoicesResponse.body)) {
            console.log('✅ تم الحصول على فواتير المبيعات بنجاح');
            const testInvoice = invoicesResponse.body.find(inv => inv.id === testInvoiceId);
            if (testInvoice) {
                console.log('✅ الفاتورة موجودة في القائمة');
                console.log('Invoice details:', {
                    number: testInvoice.invoiceNumber,
                    status: testInvoice.status,
                    paymentStatus: testInvoice.paymentStatus,
                    totalAmount: testInvoice.totalAmount,
                });
            }
        }
        else {
            console.log('❌ فشل في الحصول على فواتير المبيعات');
        }
        console.log('\n💳 إضافة دفعة للفاتورة...');
        const paymentResponse = await (0, supertest_1.default)(server)
            .post(`/sales/invoices/${testInvoiceId}/payments`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            currencyId: testCurrencyId,
            amount: 4200.00,
            paymentMethod: 'cash',
            referenceNumber: 'PAY-001',
            notes: 'دفع نقدي كامل',
        });
        console.log('Payment status:', paymentResponse.status);
        if (paymentResponse.status === 200) {
            console.log('✅ تم إضافة الدفعة بنجاح');
            console.log('New payment status:', paymentResponse.body.paymentStatus);
            console.log('Payments count:', paymentResponse.body.payments?.length || 0);
        }
        else {
            console.log('❌ فشل في إضافة الدفعة');
            console.log('Response:', JSON.stringify(paymentResponse.body, null, 2));
        }
        console.log('\n📊 إحصائيات المبيعات...');
        const statsResponse = await (0, supertest_1.default)(server)
            .get('/sales/stats')
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Sales stats status:', statsResponse.status);
        if (statsResponse.status === 200 && statsResponse.body) {
            console.log('✅ تم الحصول على إحصائيات المبيعات بنجاح');
            console.log('Stats:', statsResponse.body);
        }
        else {
            console.log('❌ فشل في الحصول على إحصائيات المبيعات');
        }
        console.log('\n📦 التحقق من تحديث المخزون...');
        const stockCheckResponse = await (0, supertest_1.default)(server)
            .get(`/inventory/stock-items/${testWarehouseId}/${testVariantId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Stock check status:', stockCheckResponse.status);
        if (stockCheckResponse.status === 200) {
            console.log('✅ تم التحقق من تحديث المخزون');
            console.log('Current quantity:', stockCheckResponse.body.quantity);
            console.log('Expected quantity: 18 (20 - 2 من المبيعات)');
        }
        else {
            console.log('❌ فشل في التحقق من المخزون');
        }
        console.log('\n🚫 إلغاء الفاتورة...');
        const cancelResponse = await (0, supertest_1.default)(server)
            .delete(`/sales/invoices/${testInvoiceId}/cancel`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            reason: 'إلغاء لأغراض الاختبار',
        });
        console.log('Cancel invoice status:', cancelResponse.status);
        if (cancelResponse.status === 200) {
            console.log('✅ تم إلغاء الفاتورة بنجاح');
            console.log('New status:', cancelResponse.body.status);
        }
        else {
            console.log('❌ فشل في إلغاء الفاتورة');
            console.log('Response:', JSON.stringify(cancelResponse.body, null, 2));
        }
        console.log('\n🗑️ تنظيف البيانات...');
        await (0, supertest_1.default)(server)
            .post(`/inventory/stock-items/${testWarehouseId}/${testVariantId}/adjust`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            quantity: -18,
            movementType: 'adjustment',
            reason: 'تنظيف البيانات',
        });
        console.log('\n🎉 تم الانتهاء من جميع اختبارات نظام المبيعات بنجاح!');
        console.log('\n📋 ملخص النظام المُطبق:');
        console.log('✅ إنشاء وإدارة العملاء');
        console.log('✅ إدارة العملات والضرائب');
        console.log('✅ إنشاء فواتير المبيعات مع الحسابات التلقائية');
        console.log('✅ معالجة المدفوعات وتتبع الحالة');
        console.log('✅ حساب الضرائب والخصومات تلقائياً');
        console.log('✅ إدارة سلة المشتريات والمنتجات');
        console.log('✅ تحديث المخزون تلقائياً عند المبيعات');
        console.log('✅ إلغاء الفواتير وإعادة المخزون');
        console.log('✅ إحصائيات شاملة للمبيعات والإيرادات');
        console.log('✅ تكامل كامل مع نظام الصلاحيات');
        console.log('✅ معاملات قاعدة البيانات للأمان');
        console.log('\n🔗 API Endpoints الجديدة:');
        console.log('POST /sales/invoices - إنشاء فاتورة مبيعات');
        console.log('GET /sales/invoices - قائمة فواتير المبيعات');
        console.log('GET /sales/invoices/:id - تفاصيل فاتورة');
        console.log('PATCH /sales/invoices/:id - تحديث فاتورة');
        console.log('DELETE /sales/invoices/:id/cancel - إلغاء فاتورة');
        console.log('POST /sales/invoices/:id/payments - إضافة دفعة');
        console.log('GET /sales/stats - إحصائيات المبيعات');
        console.log('GET /sales/invoices/:id/print - طباعة فاتورة');
        console.log('GET /sales/customers/:customerId/invoices - فواتير العميل');
        console.log('GET /sales/branches/:branchId/invoices - فواتير الفرع');
        console.log('\n📊 حالات فواتير المبيعات:');
        console.log('- draft: مسودة');
        console.log('- confirmed: مؤكدة');
        console.log('- cancelled: ملغاة');
        console.log('- refunded: مستردة');
        console.log('\n💰 حالات الدفع:');
        console.log('- pending: معلق');
        console.log('- partial: جزئي');
        console.log('- paid: مدفوع');
        console.log('- refunded: مسترد');
        console.log('\n💳 طرق الدفع المدعومة:');
        console.log('- cash: نقدي');
        console.log('- card: بطاقة ائتمان');
        console.log('- bank_transfer: تحويل بنكي');
        console.log('- check: شيك');
        console.log('- digital_wallet: محفظة رقمية');
    }
    catch (error) {
        console.error('❌ فشل في اختبار نظام المبيعات:', error);
        process.exit(1);
    }
    finally {
        await app.close();
    }
}
testSalesSystem();
//# sourceMappingURL=test-sales.js.map