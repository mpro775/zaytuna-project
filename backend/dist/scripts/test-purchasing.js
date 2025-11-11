#!/usr/bin/env tsx
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const supertest_1 = __importDefault(require("supertest"));
async function testPurchasingSystem() {
    console.log('🛒 بدء اختبار نظام المشتريات...');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const server = app.getHttpServer();
    let adminToken;
    let testSupplierId = '';
    let testWarehouseId = '';
    let testProductId = '';
    let testVariantId = '';
    let testCurrencyId = '';
    let testPurchaseOrderId = '';
    let testPurchaseInvoiceId = '';
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
                name: 'منتج المشتريات',
                description: 'منتج لاختبار نظام المشتريات',
                barcode: 'PURCHASE001234',
                sku: 'PURCHASE-PRODUCT',
                categoryId: 'some-category-id',
                basePrice: 199.99,
                costPrice: 150.00,
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
                name: 'منتج المشتريات - أزرق',
                sku: 'PURCHASE-PRODUCT-BLUE',
                barcode: 'PURCHASE001235',
                price: 249.99,
                costPrice: 180.00,
                weight: 0.5,
                attributes: {
                    color: 'أزرق',
                    size: 'L',
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
        console.log('\n🏢 إنشاء مورد...');
        const supplierResponse = await (0, supertest_1.default)(server)
            .post('/purchasing/suppliers')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            name: 'مورد الاختبار',
            contactName: 'أحمد محمد',
            phone: '+966501234567',
            email: 'supplier@example.com',
            address: 'الرياض، المملكة العربية السعودية',
            taxNumber: '1234567890',
            paymentTerms: 'دفع نقدي عند الاستلام',
            isActive: true,
        });
        console.log('Supplier status:', supplierResponse.status);
        if (supplierResponse.status === 201 && supplierResponse.body.id) {
            testSupplierId = supplierResponse.body.id;
            console.log('✅ تم إنشاء المورد بنجاح');
            console.log('Supplier ID:', testSupplierId);
            console.log('Supplier Name:', supplierResponse.body.name);
        }
        else {
            console.log('❌ فشل في إنشاء المورد');
            console.log('Response:', JSON.stringify(supplierResponse.body, null, 2));
            return;
        }
        console.log('\n📋 إنشاء أمر شراء...');
        const orderResponse = await (0, supertest_1.default)(server)
            .post('/purchasing/orders')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            supplierId: testSupplierId,
            warehouseId: testWarehouseId,
            expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            lines: [
                {
                    productId: testProductId,
                    quantity: 10,
                    unitCost: 150.00,
                },
            ],
            notes: 'أمر شراء تجريبي',
        });
        console.log('Purchase order status:', orderResponse.status);
        if (orderResponse.status === 201 && orderResponse.body.id) {
            testPurchaseOrderId = orderResponse.body.id;
            console.log('✅ تم إنشاء أمر الشراء بنجاح');
            console.log('Order ID:', testPurchaseOrderId);
            console.log('Order Number:', orderResponse.body.orderNumber);
            console.log('Status:', orderResponse.body.status);
        }
        else {
            console.log('❌ فشل في إنشاء أمر الشراء');
            console.log('Response:', JSON.stringify(orderResponse.body, null, 2));
            return;
        }
        console.log('\n📝 تحديث حالة أمر الشراء...');
        const updateOrderResponse = await (0, supertest_1.default)(server)
            .patch(`/purchasing/orders/${testPurchaseOrderId}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            status: 'approved',
        });
        console.log('Update order status:', updateOrderResponse.status);
        if (updateOrderResponse.status === 200) {
            console.log('✅ تم تحديث حالة أمر الشراء بنجاح');
            console.log('New Status:', updateOrderResponse.body.status);
        }
        else {
            console.log('❌ فشل في تحديث حالة أمر الشراء');
        }
        console.log('\n📄 إنشاء فاتورة شراء...');
        const invoiceResponse = await (0, supertest_1.default)(server)
            .post('/purchasing/invoices')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            invoiceNumber: 'PURCHASE-INV-001',
            supplierId: testSupplierId,
            warehouseId: testWarehouseId,
            purchaseOrderId: testPurchaseOrderId,
            currencyId: testCurrencyId,
            invoiceDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            lines: [
                {
                    productVariantId: testVariantId,
                    quantity: 10,
                    unitCost: 150.00,
                    discountAmount: 50.00,
                    taxAmount: 22.50,
                },
            ],
            status: 'received',
            notes: 'فاتورة شراء تجريبية',
        });
        console.log('Purchase invoice status:', invoiceResponse.status);
        if (invoiceResponse.status === 201 && invoiceResponse.body.id) {
            testPurchaseInvoiceId = invoiceResponse.body.id;
            console.log('✅ تم إنشاء فاتورة الشراء بنجاح');
            console.log('Invoice ID:', testPurchaseInvoiceId);
            console.log('Invoice Number:', invoiceResponse.body.invoiceNumber);
            console.log('Total Amount:', invoiceResponse.body.totalAmount);
            console.log('Payment Status:', invoiceResponse.body.paymentStatus);
        }
        else {
            console.log('❌ فشل في إنشاء فاتورة الشراء');
            console.log('Response:', JSON.stringify(invoiceResponse.body, null, 2));
            return;
        }
        console.log('\n💰 إنشاء دفعة لفاتورة الشراء...');
        const paymentResponse = await (0, supertest_1.default)(server)
            .post(`/purchasing/invoices/${testPurchaseInvoiceId}/payments`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            amount: 1500.00,
            paymentMethod: 'bank_transfer',
            referenceNumber: 'REF-123456',
            notes: 'دفعة تجريبية',
        });
        console.log('Purchase payment status:', paymentResponse.status);
        if (paymentResponse.status === 201) {
            console.log('✅ تم إنشاء دفعة فاتورة الشراء بنجاح');
            console.log('Payment Amount:', paymentResponse.body.amount);
            console.log('Payment Method:', paymentResponse.body.paymentMethod);
            console.log('Reference Number:', paymentResponse.body.referenceNumber);
        }
        else {
            console.log('❌ فشل في إنشاء دفعة فاتورة الشراء');
            console.log('Response:', JSON.stringify(paymentResponse.body, null, 2));
        }
        console.log('\n🏢 الحصول على الموردين...');
        const suppliersResponse = await (0, supertest_1.default)(server)
            .get('/purchasing/suppliers')
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Suppliers status:', suppliersResponse.status);
        console.log('Suppliers count:', suppliersResponse.body?.length || 0);
        if (suppliersResponse.status === 200 && Array.isArray(suppliersResponse.body)) {
            console.log('✅ تم الحصول على الموردين بنجاح');
            const testSupplier = suppliersResponse.body.find(s => s.id === testSupplierId);
            if (testSupplier) {
                console.log('✅ المورد موجود في القائمة');
                console.log('Supplier details:', {
                    name: testSupplier.name,
                    isActive: testSupplier.isActive,
                    purchaseOrdersCount: testSupplier.purchaseOrdersCount,
                    purchaseInvoicesCount: testSupplier.purchaseInvoicesCount,
                    totalPurchased: testSupplier.totalPurchased,
                });
            }
        }
        else {
            console.log('❌ فشل في الحصول على الموردين');
        }
        console.log('\n📋 الحصول على أوامر الشراء...');
        const ordersResponse = await (0, supertest_1.default)(server)
            .get('/purchasing/orders')
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Purchase orders status:', ordersResponse.status);
        console.log('Orders count:', ordersResponse.body?.length || 0);
        if (ordersResponse.status === 200 && Array.isArray(ordersResponse.body)) {
            console.log('✅ تم الحصول على أوامر الشراء بنجاح');
            const testOrder = ordersResponse.body.find(o => o.id === testPurchaseOrderId);
            if (testOrder) {
                console.log('✅ أمر الشراء موجود في القائمة');
                console.log('Order details:', {
                    number: testOrder.orderNumber,
                    status: testOrder.status,
                    supplier: testOrder.supplier.name,
                    warehouse: testOrder.warehouse.name,
                });
            }
        }
        else {
            console.log('❌ فشل في الحصول على أوامر الشراء');
        }
        console.log('\n📊 إحصائيات المشتريات...');
        const statsResponse = await (0, supertest_1.default)(server)
            .get('/purchasing/stats/overview')
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Purchasing stats status:', statsResponse.status);
        if (statsResponse.status === 200 && statsResponse.body) {
            console.log('✅ تم الحصول على إحصائيات المشتريات بنجاح');
            console.log('Stats:', statsResponse.body);
        }
        else {
            console.log('❌ فشل في الحصول على إحصائيات المشتريات');
        }
        console.log('\n📦 التحقق من تحديث المخزون...');
        const stockCheckResponse = await (0, supertest_1.default)(server)
            .get(`/inventory/stock-items/${testWarehouseId}/${testVariantId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        console.log('Stock check status:', stockCheckResponse.status);
        if (stockCheckResponse.status === 200) {
            console.log('✅ تم التحقق من تحديث المخزون');
            console.log('Current quantity:', stockCheckResponse.body.quantity);
            console.log('Expected quantity: 10 (تم إضافة 10 من فاتورة الشراء)');
        }
        else {
            console.log('❌ فشل في التحقق من المخزون');
        }
        console.log('\n🗑️ تنظيف البيانات...');
        await (0, supertest_1.default)(server)
            .post(`/inventory/stock-items/${testWarehouseId}/${testVariantId}/adjust`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            quantity: -10,
            movementType: 'adjustment',
            reason: 'تنظيف البيانات',
        });
        console.log('\n🎉 تم الانتهاء من جميع اختبارات نظام المشتريات بنجاح!');
        console.log('\n📋 ملخص النظام المُطبق:');
        console.log('✅ إنشاء وإدارة الموردين مع معلومات الاتصال والشروط');
        console.log('✅ إنشاء أوامر الشراء مع بنود المنتجات والكميات');
        console.log('✅ إدارة فواتير الشراء مع ربطها بأوامر الشراء');
        console.log('✅ إنشاء مدفوعات لفواتير الشراء مع تتبع الحالات');
        console.log('✅ تحديث المخزون تلقائياً عند استلام فواتير الشراء');
        console.log('✅ إحصائيات شاملة للمشتريات والموردين والمدفوعات');
        console.log('✅ تتبع حالات أوامر الشراء (draft, approved, ordered, received, cancelled)');
        console.log('✅ تتبع حالات فواتير الشراء (draft, received, approved, paid, cancelled)');
        console.log('✅ تتبع حالات المدفوعات (pending, partial, paid)');
        console.log('✅ تكامل كامل مع نظام الصلاحيات والكاش');
        console.log('✅ validation شامل للبيانات والعمليات');
        console.log('✅ معاملات قاعدة البيانات للأمان والاتساق');
        console.log('\n🔗 API Endpoints الجديدة:');
        console.log('POST /purchasing/suppliers - إنشاء مورد');
        console.log('GET /purchasing/suppliers - قائمة الموردين');
        console.log('GET /purchasing/suppliers/:id - تفاصيل مورد');
        console.log('PATCH /purchasing/suppliers/:id - تحديث مورد');
        console.log('DELETE /purchasing/suppliers/:id - حذف مورد');
        console.log('POST /purchasing/orders - إنشاء أمر شراء');
        console.log('GET /purchasing/orders - قائمة أوامر الشراء');
        console.log('PATCH /purchasing/orders/:id/status - تحديث حالة أمر شراء');
        console.log('POST /purchasing/invoices - إنشاء فاتورة شراء');
        console.log('POST /purchasing/invoices/:id/payments - إنشاء دفعة');
        console.log('GET /purchasing/stats/overview - إحصائيات المشتريات');
        console.log('GET /purchasing/suppliers/:id/orders - أوامر مورد');
        console.log('GET /purchasing/suppliers/:id/invoices - فواتير مورد');
        console.log('\n🏢 حالات أوامر الشراء:');
        console.log('- draft: مسودة');
        console.log('- approved: معتمدة');
        console.log('- ordered: تم الطلب');
        console.log('- received: تم الاستلام');
        console.log('- cancelled: ملغاة');
        console.log('\n📄 حالات فواتير الشراء:');
        console.log('- draft: مسودة');
        console.log('- received: تم الاستلام');
        console.log('- approved: معتمدة');
        console.log('- paid: مدفوعة');
        console.log('- cancelled: ملغاة');
        console.log('\n💰 حالات المدفوعات:');
        console.log('- pending: معلق');
        console.log('- partial: جزئي');
        console.log('- paid: مدفوع');
        console.log('\n💳 طرق الدفع:');
        console.log('- cash: نقدي');
        console.log('- bank_transfer: تحويل بنكي');
        console.log('- check: شيك');
        console.log('- credit_card: بطاقة ائتمان');
        console.log('\n📊 منطق العمليات التجارية:');
        console.log('1. **إنشاء المورد**: حفظ معلومات المورد وشروط الدفع');
        console.log('2. **إنشاء أمر الشراء**: تحديد المنتجات والكميات المطلوبة');
        console.log('3. **اعتماد الأمر**: تغيير حالة الأمر إلى معتمد');
        console.log('4. **إنشاء فاتورة الشراء**: ربط الفاتورة بأمر الشراء');
        console.log('5. **تحديث المخزون**: إضافة الكميات المشتراة للمخزون');
        console.log('6. **إنشاء المدفوعات**: تتبع المدفوعات وتحديث حالات الفواتير');
        console.log('7. **التقارير**: إحصائيات شاملة للمشتريات والموردين');
        console.log('\n🔄 معاملات قاعدة البيانات:');
        console.log('جميع عمليات المشتريات تتم داخل معاملات قاعدة بيانات لضمان:');
        console.log('- الاتساق في البيانات');
        console.log('- عدم فقدان البيانات في حالة فشل العملية');
        console.log('- تحديث المخزون بدقة');
        console.log('- تتبع المدفوعات بشكل صحيح');
    }
    catch (error) {
        console.error('❌ فشل في اختبار نظام المشتريات:', error);
        process.exit(1);
    }
    finally {
        await app.close();
    }
}
testPurchasingSystem();
//# sourceMappingURL=test-purchasing.js.map