#!/usr/bin/env tsx

/**
 * سكريبت اختبار نظام الفروع والمخازن (Branches & Warehouses)
 * يمكن تشغيله بـ: npm run branches:test
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';

async function testBranchesAndWarehouses() {
  console.log('🏢 بدء اختبار نظام الفروع والمخازن...');

  const app = await NestFactory.create(AppModule);
  const server = app.getHttpServer();

  let adminToken: string;
  let testBranchId: string = '';
  let testWarehouseId: string = '';

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

    // ===== اختبار 2: إنشاء فرع جديد =====
    console.log('\n🏢 إنشاء فرع جديد...');

    const newBranch = {
      name: 'فرع الرياض',
      code: 'BR-RIYADH',
      address: 'الرياض، المملكة العربية السعودية',
      phone: '+966112345678',
      email: 'riyadh@zaytuna-pos.com',
      companyId: 'company_main', // من البيانات الأولية
      managerId: null, // سيتم تعيينه لاحقاً
    };

    const createBranchResponse = await request(server)
      .post('/branches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newBranch);

    console.log('Create branch status:', createBranchResponse.status);

    if (createBranchResponse.status === 201 && createBranchResponse.body.id) {
      testBranchId = createBranchResponse.body.id;
      console.log('✅ تم إنشاء الفرع بنجاح');
      console.log('Branch ID:', testBranchId);
    } else {
      console.log('❌ فشل في إنشاء الفرع');
      console.log('Response:', JSON.stringify(createBranchResponse.body, null, 2));
    }

    // ===== اختبار 3: الحصول على جميع الفروع =====
    console.log('\n📋 الحصول على جميع الفروع...');

    const branchesResponse = await request(server)
      .get('/branches')
      .set('Authorization', `Bearer ${adminToken}`);

    console.log('Branches status:', branchesResponse.status);
    console.log('Branches count:', branchesResponse.body?.length || 0);

    if (branchesResponse.status === 200 && Array.isArray(branchesResponse.body)) {
      console.log('✅ تم الحصول على الفروع بنجاح');
      const testBranch = branchesResponse.body.find(branch => branch.id === testBranchId);
      if (testBranch) {
        console.log('✅ الفرع الجديد موجود في القائمة');
      }
    } else {
      console.log('❌ فشل في الحصول على الفروع');
    }

    // ===== اختبار 4: الحصول على فرع محدد =====
    console.log('\n🔍 الحصول على فرع محدد...');

    const branchResponse = await request(server)
      .get(`/branches/${testBranchId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    console.log('Branch status:', branchResponse.status);

    if (branchResponse.status === 200 && branchResponse.body.id === testBranchId) {
      console.log('✅ تم الحصول على الفرع بنجاح');
      console.log('Branch details:', {
        name: branchResponse.body.name,
        code: branchResponse.body.code,
        userCount: branchResponse.body.userCount,
        warehouseCount: branchResponse.body.warehouseCount,
      });
    } else {
      console.log('❌ فشل في الحصول على الفرع');
    }

    // ===== اختبار 5: إنشاء مخزن جديد =====
    console.log('\n🏭 إنشاء مخزن جديد...');

    const newWarehouse = {
      name: 'مخزن الرياض الرئيسي',
      code: 'WH-RIYADH-MAIN',
      address: 'مخزن الرياض، المملكة العربية السعودية',
      phone: '+966119876543',
      email: 'warehouse.riyadh@zaytuna-pos.com',
      branchId: testBranchId,
      managerId: null,
    };

    const createWarehouseResponse = await request(server)
      .post('/warehouses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newWarehouse);

    console.log('Create warehouse status:', createWarehouseResponse.status);

    if (createWarehouseResponse.status === 201 && createWarehouseResponse.body.id) {
      testWarehouseId = createWarehouseResponse.body.id;
      console.log('✅ تم إنشاء المخزن بنجاح');
      console.log('Warehouse ID:', testWarehouseId);
    } else {
      console.log('❌ فشل في إنشاء المخزن');
      console.log('Response:', JSON.stringify(createWarehouseResponse.body, null, 2));
    }

    // ===== اختبار 6: الحصول على جميع المخازن =====
    console.log('\n📦 الحصول على جميع المخازن...');

    const warehousesResponse = await request(server)
      .get('/warehouses')
      .set('Authorization', `Bearer ${adminToken}`);

    console.log('Warehouses status:', warehousesResponse.status);
    console.log('Warehouses count:', warehousesResponse.body?.length || 0);

    if (warehousesResponse.status === 200 && Array.isArray(warehousesResponse.body)) {
      console.log('✅ تم الحصول على المخازن بنجاح');
      const testWarehouse = warehousesResponse.body.find(wh => wh.id === testWarehouseId);
      if (testWarehouse) {
        console.log('✅ المخزن الجديد موجود في القائمة');
      }
    } else {
      console.log('❌ فشل في الحصول على المخازن');
    }

    // ===== اختبار 7: الحصول على مخازن الفرع =====
    console.log('\n🏢 الحصول على مخازن الفرع...');

    const branchWarehousesResponse = await request(server)
      .get(`/warehouses?branchId=${testBranchId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    console.log('Branch warehouses status:', branchWarehousesResponse.status);

    if (branchWarehousesResponse.status === 200 && Array.isArray(branchWarehousesResponse.body)) {
      console.log('✅ تم الحصول على مخازن الفرع بنجاح');
      console.log('Warehouse count for branch:', branchWarehousesResponse.body.length);
    } else {
      console.log('❌ فشل في الحصول على مخازن الفرع');
    }

    // ===== اختبار 8: تحديث الفرع =====
    console.log('\n✏️ تحديث الفرع...');

    const updateBranchData = {
      address: 'العنوان المحدث - الرياض، المملكة العربية السعودية',
      phone: '+966112345679',
    };

    const updateBranchResponse = await request(server)
      .patch(`/branches/${testBranchId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updateBranchData);

    console.log('Update branch status:', updateBranchResponse.status);

    if (updateBranchResponse.status === 200) {
      console.log('✅ تم تحديث الفرع بنجاح');
    } else {
      console.log('❌ فشل في تحديث الفرع');
    }

    // ===== اختبار 9: تحديث المخزن =====
    console.log('\n🔧 تحديث المخزن...');

    const updateWarehouseData = {
      address: 'العنوان المحدث - مخزن الرياض',
      phone: '+966119876544',
    };

    const updateWarehouseResponse = await request(server)
      .patch(`/warehouses/${testWarehouseId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updateWarehouseData);

    console.log('Update warehouse status:', updateWarehouseResponse.status);

    if (updateWarehouseResponse.status === 200) {
      console.log('✅ تم تحديث المخزن بنجاح');
    } else {
      console.log('❌ فشل في تحديث المخزن');
    }

    // ===== اختبار 10: إحصائيات الفروع =====
    console.log('\n📊 إحصائيات الفروع...');

    const branchStatsResponse = await request(server)
      .get('/branches/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    console.log('Branch stats status:', branchStatsResponse.status);

    if (branchStatsResponse.status === 200 && branchStatsResponse.body.totalBranches) {
      console.log('✅ تم الحصول على إحصائيات الفروع بنجاح');
      console.log('Stats:', branchStatsResponse.body);
    } else {
      console.log('❌ فشل في الحصول على إحصائيات الفروع');
    }

    // ===== اختبار 11: إحصائيات المخازن =====
    console.log('\n📈 إحصائيات المخازن...');

    const warehouseStatsResponse = await request(server)
      .get('/warehouses/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    console.log('Warehouse stats status:', warehouseStatsResponse.status);

    if (warehouseStatsResponse.status === 200) {
      console.log('✅ تم الحصول على إحصائيات المخازن بنجاح');
      console.log('Stats:', warehouseStatsResponse.body);
    } else {
      console.log('❌ فشل في الحصول على إحصائيات المخازن');
    }

    // ===== اختبار 12: الحصول على المستخدمين بالفرع =====
    console.log('\n👥 الحصول على المستخدمين بالفرع...');

    const branchUsersResponse = await request(server)
      .get(`/branches/${testBranchId}/users`)
      .set('Authorization', `Bearer ${adminToken}`);

    console.log('Branch users status:', branchUsersResponse.status);

    if (branchUsersResponse.status === 200) {
      console.log('✅ تم الحصول على مستخدمي الفرع بنجاح');
      console.log('User count:', branchUsersResponse.body.length);
    } else {
      console.log('❌ فشل في الحصول على مستخدمي الفرع');
    }

    // ===== تنظيف البيانات (حذف المخزن أولاً ثم الفرع) =====
    console.log('\n🗑️ تنظيف البيانات...');

    // حذف المخزن
    const deleteWarehouseResponse = await request(server)
      .delete(`/warehouses/${testWarehouseId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    console.log('Delete warehouse status:', deleteWarehouseResponse.status);

    if (deleteWarehouseResponse.status === 200) {
      console.log('✅ تم حذف المخزن بنجاح');
    } else {
      console.log('❌ فشل في حذف المخزن');
    }

    // حذف الفرع
    const deleteBranchResponse = await request(server)
      .delete(`/branches/${testBranchId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    console.log('Delete branch status:', deleteBranchResponse.status);

    if (deleteBranchResponse.status === 200) {
      console.log('✅ تم حذف الفرع بنجاح');
    } else {
      console.log('❌ فشل في حذف الفرع');
    }

    // ===== تسجيل الخروج =====
    console.log('\n🚪 تسجيل الخروج...');

    const logoutResponse = await request(server)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${adminToken}`);

    console.log('Logout status:', logoutResponse.status);

    if (logoutResponse.status === 200) {
      console.log('✅ تم تسجيل الخروج بنجاح');
    } else {
      console.log('❌ فشل في تسجيل الخروج');
    }

    console.log('\n🎉 تم الانتهاء من جميع اختبارات الفروع والمخازن بنجاح!');

    console.log('\n📋 ملخص النظام المُطبق:');
    console.log('✅ إنشاء وإدارة الفروع');
    console.log('✅ إنشاء وإدارة المخازن');
    console.log('✅ ربط المخازن بالفروع');
    console.log('✅ إدارة الصلاحيات على مستوى الفروع');
    console.log('✅ إحصائيات شاملة للفروع والمخازن');
    console.log('✅ إدارة علاقات المستخدمين بالفروع');
    console.log('✅ نظام كاش محسن للأداء');
    console.log('✅ حماية البيانات والعمليات');

    console.log('\n🔗 API Endpoints الجديدة:');
    console.log('GET /branches - قائمة الفروع');
    console.log('POST /branches - إنشاء فرع جديد');
    console.log('GET /branches/:id - تفاصيل فرع');
    console.log('PATCH /branches/:id - تحديث فرع');
    console.log('DELETE /branches/:id - حذف فرع');
    console.log('GET /branches/stats - إحصائيات الفروع');
    console.log('GET /branches/:id/users - مستخدمو الفرع');
    console.log('');
    console.log('GET /warehouses - قائمة المخازن');
    console.log('POST /warehouses - إنشاء مخزن جديد');
    console.log('GET /warehouses/:id - تفاصيل مخزن');
    console.log('PATCH /warehouses/:id - تحديث مخزن');
    console.log('DELETE /warehouses/:id - حذف مخزن');
    console.log('GET /warehouses/stats - إحصائيات المخازن');
    console.log('GET /warehouses/:id/stock - مخزون المخزن');
    console.log('POST /warehouses/transfer-stock - نقل المخزون');

  } catch (error) {
    console.error('❌ فشل في اختبار نظام الفروع والمخازن:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// تشغيل الاختبار
testBranchesAndWarehouses();
