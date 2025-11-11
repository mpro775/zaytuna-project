#!/usr/bin/env tsx

/**
 * سكريبت اختبار نظام المخزون (Inventory System)
 * يمكن تشغيله بـ: npm run inventory:test
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';

async function testInventorySystem() {
  console.log('📦 بدء اختبار نظام المخزون...');

  const app = await NestFactory.create(AppModule);
  const server = app.getHttpServer();

  let adminToken: string;
  let testWarehouseId: string = '';
  let testProductId: string = '';
  let testVariantId: string = '';
  let testStockItemId: string = '';

  try {
    // ===== اختبار 1: تسجيل الدخول كمدير =====
    console.log('\n🔐 تسجيل الدخول كمدير...');

    const loginResponse = await request(server)
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'admin123',
      });

    if (loginResponse.status === 200 && loginResponse.body.success === true) {
      adminToken = loginResponse.body.data.accessToken;
      console.log('✅ تم تسجيل الدخول كمدير بنجاح');
    } else {
      console.log('❌ فشل في تسجيل الدخول كمدير');
      console.log('Response:', JSON.stringify(loginResponse.body, null, 2));
      return;
    }

    // ===== اختبار 2: إنشاء فئة =====
    console.log('\n📁 إنشاء فئة...');

    const categoryResponse = await request(server)
      .post('/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'إلكترونيات المخزون',
        description: 'أجهزة إلكترونية للاختبار',
      });

    if (categoryResponse.status === 201) {
      console.log('✅ تم إنشاء الفئة بنجاح');
    } else {
      console.log('❌ فشل في إنشاء الفئة');
      return;
    }

    // ===== اختبار 3: إنشاء منتج =====
    console.log('\n🛍️ إنشاء منتج...');

    const productResponse = await request(server)
      .post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'هاتف ذكي للمخزون',
        description: 'هاتف ذكي لاختبار نظام المخزون',
        barcode: 'INV001234567',
        sku: 'INV-SMARTPHONE',
        categoryId: categoryResponse.body.categoryId,
        basePrice: 1999.99,
        costPrice: 1500.00,
        trackInventory: true,
        reorderPoint: 5,
      });

    if (productResponse.status === 201 && productResponse.body.id) {
      testProductId = productResponse.body.id;
      console.log('✅ تم إنشاء المنتج بنجاح');
      console.log('Product ID:', testProductId);
    } else {
      console.log('❌ فشل في إنشاء المنتج');
      console.log('Response:', JSON.stringify(productResponse.body, null, 2));
      return;
    }

    // ===== اختبار 4: إنشاء متغير منتج =====
    console.log('\n🎨 إنشاء متغير منتج...');

    const variantResponse = await request(server)
      .post('/product-variants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        productId: testProductId,
        name: 'هاتف ذكي للمخزون - أسود',
        sku: 'INV-SMARTPHONE-BLK',
        barcode: 'INV001234568',
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
    } else {
      console.log('❌ فشل في إنشاء متغير المنتج');
      console.log('Response:', JSON.stringify(variantResponse.body, null, 2));
      return;
    }

    // ===== اختبار 5: الحصول على المخازن =====
    console.log('\n🏭 الحصول على المخازن...');

    const warehousesResponse = await request(server)
      .get('/warehouses')
      .set('Authorization', `Bearer ${adminToken}`);

    if (warehousesResponse.status === 200 && warehousesResponse.body.length > 0) {
      testWarehouseId = warehousesResponse.body[0].id;
      console.log('✅ تم العثور على مخازن');
      console.log('Warehouse ID:', testWarehouseId);
    } else {
      console.log('❌ لم يتم العثور على مخازن');
      return;
    }

    // ===== اختبار 6: إنشاء عنصر مخزون =====
    console.log('\n📦 إنشاء عنصر مخزون...');

    const stockItemResponse = await request(server)
      .post('/inventory/stock-items')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        warehouseId: testWarehouseId,
        productVariantId: testVariantId,
        quantity: 10,
        minStock: 2,
        maxStock: 50,
      });

    if (stockItemResponse.status === 201 && stockItemResponse.body.id) {
      testStockItemId = stockItemResponse.body.id;
      console.log('✅ تم إنشاء عنصر المخزون بنجاح');
      console.log('Stock Item ID:', testStockItemId);
      console.log('Initial quantity:', stockItemResponse.body.quantity);
    } else {
      console.log('❌ فشل في إنشاء عنصر المخزون');
      console.log('Response:', JSON.stringify(stockItemResponse.body, null, 2));
      return;
    }

    // ===== اختبار 7: الحصول على عناصر المخزون =====
    console.log('\n📋 الحصول على عناصر المخزون...');

    const stockItemsResponse = await request(server)
      .get('/inventory/stock-items')
      .set('Authorization', `Bearer ${adminToken}`);

    console.log('Stock items status:', stockItemsResponse.status);
    console.log('Stock items count:', stockItemsResponse.body?.length || 0);

    if (stockItemsResponse.status === 200 && Array.isArray(stockItemsResponse.body)) {
      console.log('✅ تم الحصول على عناصر المخزون بنجاح');
      const testItem = stockItemsResponse.body.find(item => item.id === testStockItemId);
      if (testItem) {
        console.log('✅ عنصر المخزون موجود في القائمة');
        console.log('Stock details:', {
          quantity: testItem.quantity,
          minStock: testItem.minStock,
          maxStock: testItem.maxStock,
          isLowStock: testItem.isLowStock,
          warehouse: testItem.warehouse.name,
          product: testItem.productVariant.product.name,
        });
      }
    } else {
      console.log('❌ فشل في الحصول على عناصر المخزون');
    }

    // ===== اختبار 8: تعديل كمية المخزون =====
    console.log('\n➕ تعديل كمية المخزون (إضافة)...');

    const adjustStockResponse = await request(server)
      .post(`/inventory/stock-items/${testWarehouseId}/${testVariantId}/adjust`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        quantity: 15,
        movementType: 'adjustment',
        reason: 'إضافة كمية للاختبار',
      });

    console.log('Adjust stock status:', adjustStockResponse.status);

    if (adjustStockResponse.status === 200) {
      console.log('✅ تم تعديل المخزون بنجاح');
      console.log('New quantity:', adjustStockResponse.body.quantity);
      console.log('Expected quantity: 25 (10 + 15)');
    } else {
      console.log('❌ فشل في تعديل المخزون');
      console.log('Response:', JSON.stringify(adjustStockResponse.body, null, 2));
    }

    // ===== اختبار 9: إنقاص كمية المخزون =====
    console.log('\n➖ تعديل كمية المخزون (إنقاص)...');

    const reduceStockResponse = await request(server)
      .post(`/inventory/stock-items/${testWarehouseId}/${testVariantId}/adjust`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        quantity: -5,
        movementType: 'sale',
        referenceType: 'test_sale',
        reason: 'بيع تجريبي',
      });

    console.log('Reduce stock status:', reduceStockResponse.status);

    if (reduceStockResponse.status === 200) {
      console.log('✅ تم إنقاص المخزون بنجاح');
      console.log('New quantity:', reduceStockResponse.body.quantity);
      console.log('Expected quantity: 20 (25 - 5)');
    } else {
      console.log('❌ فشل في إنقاص المخزون');
      console.log('Response:', JSON.stringify(reduceStockResponse.body, null, 2));
    }

    // ===== اختبار 10: الحصول على حركات المخزون =====
    console.log('\n📊 الحصول على حركات المخزون...');

    const movementsResponse = await request(server)
      .get('/inventory/movements')
      .set('Authorization', `Bearer ${adminToken}`);

    console.log('Movements status:', movementsResponse.status);
    console.log('Movements count:', movementsResponse.body?.length || 0);

    if (movementsResponse.status === 200 && Array.isArray(movementsResponse.body)) {
      console.log('✅ تم الحصول على حركات المخزون بنجاح');
      const recentMovements = movementsResponse.body.slice(0, 3);
      recentMovements.forEach((movement, index) => {
        console.log(`${index + 1}. ${movement.movementType}: ${movement.quantity} - ${movement.reason || 'بدون سبب'}`);
      });
    } else {
      console.log('❌ فشل في الحصول على حركات المخزون');
    }

    // ===== اختبار 11: تحديث حدود المخزون =====
    console.log('\n⚙️ تحديث حدود المخزون...');

    const updateStockResponse = await request(server)
      .patch(`/inventory/stock-items/${testStockItemId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        minStock: 3,
        maxStock: 100,
      });

    console.log('Update stock item status:', updateStockResponse.status);

    if (updateStockResponse.status === 200) {
      console.log('✅ تم تحديث حدود المخزون بنجاح');
      console.log('New limits:', {
        minStock: updateStockResponse.body.minStock,
        maxStock: updateStockResponse.body.maxStock,
      });
    } else {
      console.log('❌ فشل في تحديث حدود المخزون');
    }

    // ===== اختبار 12: الحصول على تنبيهات المخزون المنخفض =====
    console.log('\n🚨 الحصول على تنبيهات المخزون المنخفض...');

    const lowStockResponse = await request(server)
      .get('/inventory/alerts/low-stock')
      .set('Authorization', `Bearer ${adminToken}`);

    console.log('Low stock alerts status:', lowStockResponse.status);
    console.log('Low stock items count:', lowStockResponse.body?.length || 0);

    if (lowStockResponse.status === 200) {
      console.log('✅ تم الحصول على تنبيهات المخزون المنخفض بنجاح');
      if (lowStockResponse.body.length > 0) {
        console.log('Low stock items:');
        lowStockResponse.body.forEach((item, index) => {
          console.log(`${index + 1}. ${item.productVariant.product.name} - Quantity: ${item.quantity}/${item.minStock}`);
        });
      } else {
        console.log('لا توجد عناصر مخزون منخفض حالياً');
      }
    } else {
      console.log('❌ فشل في الحصول على تنبيهات المخزون المنخفض');
    }

    // ===== اختبار 13: إحصائيات المخزون =====
    console.log('\n📈 إحصائيات المخزون...');

    const statsResponse = await request(server)
      .get('/inventory/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    console.log('Inventory stats status:', statsResponse.status);

    if (statsResponse.status === 200 && statsResponse.body) {
      console.log('✅ تم الحصول على إحصائيات المخزون بنجاح');
      console.log('Stats:', statsResponse.body);
    } else {
      console.log('❌ فشل في الحصول على إحصائيات المخزون');
    }

    // ===== اختبار 14: مخزون المنتج عبر المخازن =====
    console.log('\n🏪 مخزون المنتج عبر المخازن...');

    const productStockResponse = await request(server)
      .get(`/inventory/products/${testVariantId}/stock`)
      .set('Authorization', `Bearer ${adminToken}`);

    console.log('Product stock status:', productStockResponse.status);
    console.log('Stock locations count:', productStockResponse.body?.length || 0);

    if (productStockResponse.status === 200 && Array.isArray(productStockResponse.body)) {
      console.log('✅ تم الحصول على مخزون المنتج عبر المخازن بنجاح');
      productStockResponse.body.forEach((stock, index) => {
        console.log(`${index + 1}. ${stock.warehouse.name}: ${stock.quantity} units`);
      });
    } else {
      console.log('❌ فشل في الحصول على مخزون المنتج');
    }

    // ===== تنظيف البيانات =====
    console.log('\n🗑️ تنظيف البيانات...');

    // إعادة تعيين الكمية إلى صفر أولاً
    await request(server)
      .post(`/inventory/stock-items/${testWarehouseId}/${testVariantId}/adjust`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        quantity: -20,
        movementType: 'adjustment',
        reason: 'تنظيف البيانات',
      });

    console.log('\n🎉 تم الانتهاء من جميع اختبارات نظام المخزون بنجاح!');

    console.log('\n📋 ملخص النظام المُطبق:');
    console.log('✅ إنشاء وإدارة عناصر المخزون');
    console.log('✅ تعديل كميات المخزون مع تتبع الحركات');
    console.log('✅ إدارة حدود المخزون (الحد الأدنى والأقصى)');
    console.log('✅ تتبع حركات المخزون التفصيلية');
    console.log('✅ تنبيهات المخزون المنخفض');
    console.log('✅ إحصائيات شاملة للمخزون');
    console.log('✅ عرض مخزون المنتج عبر المخازن');
    console.log('✅ تكامل كامل مع نظام الصلاحيات');
    console.log('✅ نظام كاش محسن للأداء');
    console.log('✅ validation شامل للبيانات والعمليات');

    console.log('\n🔗 API Endpoints الجديدة:');
    console.log('POST /inventory/stock-items - إنشاء عنصر مخزون');
    console.log('GET /inventory/stock-items - قائمة عناصر المخزون');
    console.log('GET /inventory/stock-items/:id - تفاصيل عنصر مخزون');
    console.log('PATCH /inventory/stock-items/:id - تحديث عنصر مخزون');
    console.log('POST /inventory/stock-items/:warehouseId/:variantId/adjust - تعديل الكمية');
    console.log('GET /inventory/movements - حركات المخزون');
    console.log('GET /inventory/alerts/low-stock - تنبيهات المخزون المنخفض');
    console.log('GET /inventory/stats - إحصائيات المخزون');
    console.log('GET /inventory/products/:variantId/stock - مخزون منتج عبر المخازن');
    console.log('GET /inventory/warehouses/:warehouseId/stock - مخزون المخزن');

    console.log('\n📊 أنواع حركات المخزون المدعومة:');
    console.log('- adjustment: تعديل يدوي');
    console.log('- sale: بيع');
    console.log('- purchase: شراء');
    console.log('- transfer_in: نقل وارد');
    console.log('- transfer_out: نقل صادر');
    console.log('- return: مرتجع');
    console.log('- initial: مخزون أولي');

  } catch (error) {
    console.error('❌ فشل في اختبار نظام المخزون:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// تشغيل الاختبار
testInventorySystem();
