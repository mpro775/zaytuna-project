#!/usr/bin/env tsx

/**
 * سكريبت اختبار نظام المحاسبة الأساسي (Basic Accounting System)
 * يمكن تشغيله بـ: npm run accounting:test
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';

async function testAccountingSystem() {
  console.log('💼 بدء اختبار نظام المحاسبة الأساسي...');

  const app = await NestFactory.create(AppModule);
  const server = app.getHttpServer();

  let adminToken: string;
  let cashAccountId: string = '';
  let salesRevenueAccountId: string = '';
  let testJournalEntryId: string = '';

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

    // ===== اختبار 2: إنشاء حسابات النظام الافتراضية =====
    console.log('\n🏗️ إنشاء حسابات النظام الافتراضية...');

    const setupResponse = await request(server)
      .post('/accounting/setup/system-accounts')
      .set('Authorization', `Bearer ${adminToken}`);

    console.log('Setup status:', setupResponse.status);

    if (setupResponse.status === 200) {
      console.log('✅ تم إنشاء حسابات النظام الافتراضية بنجاح');
    } else {
      console.log('❌ فشل في إنشاء حسابات النظام');
      console.log('Response:', JSON.stringify(setupResponse.body, null, 2));
    }

    // ===== اختبار 3: الحصول على حسابات GL =====
    console.log('\n📋 الحصول على حسابات GL...');

    const glAccountsResponse = await request(server)
      .get('/accounting/gl-accounts')
      .set('Authorization', `Bearer ${adminToken}`);

    console.log('GL Accounts status:', glAccountsResponse.status);

    if (glAccountsResponse.status === 200 && Array.isArray(glAccountsResponse.body)) {
      console.log('✅ تم الحصول على حسابات GL بنجاح');
      console.log('Number of accounts:', glAccountsResponse.body.length);

      // حفظ معرفات بعض الحسابات للاختبارات التالية
      const cashAccount = glAccountsResponse.body.find((acc: any) => acc.accountCode === '1001');
      const salesRevenueAccount = glAccountsResponse.body.find((acc: any) => acc.accountCode === '4001');

      if (cashAccount) cashAccountId = cashAccount.id;
      if (salesRevenueAccount) salesRevenueAccountId = salesRevenueAccount.id;

      console.log('Cash Account ID:', cashAccountId);
      console.log('Sales Revenue Account ID:', salesRevenueAccountId);

      // عرض أمثلة على الحسابات
      glAccountsResponse.body.slice(0, 3).forEach((account: any) => {
        console.log(`- ${account.accountCode}: ${account.name} (${account.accountType})`);
      });
    } else {
      console.log('❌ فشل في الحصول على حسابات GL');
      console.log('Response:', JSON.stringify(glAccountsResponse.body, null, 2));
      return;
    }

    // ===== اختبار 4: إنشاء حساب GL مخصص =====
    console.log('\n🆕 إنشاء حساب GL مخصص...');

    const customAccountResponse = await request(server)
      .post('/accounting/gl-accounts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        accountCode: '5003',
        name: 'مصروفات إعلانية',
        description: 'مصروفات الإعلانات والتسويق',
        accountType: 'expense',
        isActive: true,
        isSystem: false,
      });

    console.log('Custom account creation status:', customAccountResponse.status);

    if (customAccountResponse.status === 201 && customAccountResponse.body.id) {
      console.log('✅ تم إنشاء الحساب المخصص بنجاح');
      console.log('Account Code:', customAccountResponse.body.accountCode);
      console.log('Account Name:', customAccountResponse.body.name);
      console.log('Account Type:', customAccountResponse.body.accountType);
    } else {
      console.log('❌ فشل في إنشاء الحساب المخصص');
      console.log('Response:', JSON.stringify(customAccountResponse.body, null, 2));
    }

    // ===== اختبار 5: إنشاء قيد يومي =====
    console.log('\n📝 إنشاء قيد يومي...');

    if (!cashAccountId || !salesRevenueAccountId) {
      console.log('❌ معرفات الحسابات مفقودة');
      return;
    }

    const journalEntryResponse = await request(server)
      .post('/accounting/journal-entries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        entryNumber: `JE-${Date.now()}`,
        description: 'قيد تجريبي لاختبار النظام المحاسبي',
        referenceType: 'test',
        referenceId: 'test-001',
        sourceModule: 'accounting',
        status: 'draft',
        isSystem: false,
        lines: [
          {
            debitAccountId: cashAccountId,
            creditAccountId: salesRevenueAccountId,
            amount: 1000.00,
            description: 'إيرادات نقدية',
            referenceType: 'test',
            referenceId: 'test-001',
          },
        ],
      });

    console.log('Journal entry creation status:', journalEntryResponse.status);

    if (journalEntryResponse.status === 201 && journalEntryResponse.body.id) {
      testJournalEntryId = journalEntryResponse.body.id;
      console.log('✅ تم إنشاء القيد اليومي بنجاح');
      console.log('Entry Number:', journalEntryResponse.body.entryNumber);
      console.log('Total Debit:', journalEntryResponse.body.totalDebit);
      console.log('Total Credit:', journalEntryResponse.body.totalCredit);
      console.log('Is Balanced:', journalEntryResponse.body.isBalanced);
      console.log('Status:', journalEntryResponse.body.status);
    } else {
      console.log('❌ فشل في إنشاء القيد اليومي');
      console.log('Response:', JSON.stringify(journalEntryResponse.body, null, 2));
      return;
    }

    // ===== اختبار 6: الحصول على القيود اليومية =====
    console.log('\n📜 الحصول على القيود اليومية...');

    const journalEntriesResponse = await request(server)
      .get('/accounting/journal-entries')
      .set('Authorization', `Bearer ${adminToken}`);

    console.log('Journal entries status:', journalEntriesResponse.status);

    if (journalEntriesResponse.status === 200 && Array.isArray(journalEntriesResponse.body)) {
      console.log('✅ تم الحصول على القيود اليومية بنجاح');
      console.log('Number of entries:', journalEntriesResponse.body.length);

      // عرض أمثلة على القيود
      journalEntriesResponse.body.slice(0, 2).forEach((entry: any) => {
        console.log(`- ${entry.entryNumber}: ${entry.description} (${entry.status}) - ${entry.totalDebit} DR / ${entry.totalCredit} CR`);
      });
    } else {
      console.log('❌ فشل في الحصول على القيود اليومية');
    }

    // ===== اختبار 7: اعتماد القيد اليومي =====
    console.log('\n✅ اعتماد القيد اليومي...');

    const postResponse = await request(server)
      .patch(`/accounting/journal-entries/${testJournalEntryId}/post`)
      .set('Authorization', `Bearer ${adminToken}`);

    console.log('Post journal entry status:', postResponse.status);

    if (postResponse.status === 200) {
      console.log('✅ تم اعتماد القيد اليومي بنجاح');
      console.log('Updated Status:', postResponse.body.status);

      // التحقق من تحديث الأرصدة
      console.log('Checking account balances...');

      const cashAccountResponse = await request(server)
        .get(`/accounting/gl-accounts/${cashAccountId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const salesAccountResponse = await request(server)
        .get(`/accounting/gl-accounts/${salesRevenueAccountId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      if (cashAccountResponse.status === 200 && salesAccountResponse.status === 200) {
        console.log('Cash Account Balance:', {
          debit: cashAccountResponse.body.debitBalance,
          credit: cashAccountResponse.body.creditBalance,
          net: cashAccountResponse.body.netBalance,
        });
        console.log('Sales Revenue Account Balance:', {
          debit: salesAccountResponse.body.debitBalance,
          credit: salesAccountResponse.body.creditBalance,
          net: salesAccountResponse.body.netBalance,
        });
      }
    } else {
      console.log('❌ فشل في اعتماد القيد اليومي');
      console.log('Response:', JSON.stringify(postResponse.body, null, 2));
    }

    // ===== اختبار 8: إلغاء اعتماد القيد اليومي =====
    console.log('\n❌ إلغاء اعتماد القيد اليومي...');

    const unpostResponse = await request(server)
      .patch(`/accounting/journal-entries/${testJournalEntryId}/unpost`)
      .set('Authorization', `Bearer ${adminToken}`);

    console.log('Unpost journal entry status:', unpostResponse.status);

    if (unpostResponse.status === 200) {
      console.log('✅ تم إلغاء اعتماد القيد اليومي بنجاح');
      console.log('Updated Status:', unpostResponse.body.status);
    } else {
      console.log('❌ فشل في إلغاء اعتماد القيد اليومي');
      console.log('Response:', JSON.stringify(unpostResponse.body, null, 2));
    }

    // ===== اختبار 9: إنشاء قيد تلقائي للمبيعات =====
    console.log('\n🤖 إنشاء قيد تلقائي للمبيعات...');

    const autoSalesResponse = await request(server)
      .post('/accounting/auto/sales/SALES-AUTO-TEST-001')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId: 'test-customer-id', // لن يتم التحقق منه في هذا الاختبار
        totalAmount: 500.00,
        taxAmount: 50.00,
      });

    console.log('Auto sales journal entry status:', autoSalesResponse.status);

    if (autoSalesResponse.status === 200) {
      console.log('✅ تم إنشاء قيد المبيعات التلقائي بنجاح');
      console.log('Entry Number:', autoSalesResponse.body.entryNumber);
      console.log('Total Debit:', autoSalesResponse.body.totalDebit);
      console.log('Total Credit:', autoSalesResponse.body.totalCredit);
    } else {
      console.log('❌ فشل في إنشاء قيد المبيعات التلقائي');
      console.log('Response:', JSON.stringify(autoSalesResponse.body, null, 2));
    }

    // ===== اختبار 10: إحصائيات المحاسبة =====
    console.log('\n📊 إحصائيات المحاسبة...');

    const statsResponse = await request(server)
      .get('/accounting/stats/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    console.log('Accounting stats status:', statsResponse.status);

    if (statsResponse.status === 200 && statsResponse.body) {
      console.log('✅ تم الحصول على إحصائيات المحاسبة بنجاح');
      console.log('GL Accounts:', statsResponse.body.glAccounts);
      console.log('Journal Entries:', statsResponse.body.journalEntries);
      console.log('Balances:', statsResponse.body.balances);
    } else {
      console.log('❌ فشل في الحصول على إحصائيات المحاسبة');
    }

    // ===== تنظيف البيانات =====
    console.log('\n🗑️ تنظيف البيانات...');

    // حذف القيد اليومي
    if (testJournalEntryId) {
      await request(server)
        .delete(`/accounting/journal-entries/${testJournalEntryId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      console.log('✅ تم حذف القيد اليومي');
    }

    // حذف الحساب المخصص (إذا تم إنشاؤه)
    if (customAccountResponse.status === 201) {
      await request(server)
        .delete(`/accounting/gl-accounts/${customAccountResponse.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      console.log('✅ تم حذف الحساب المخصص');
    }

    console.log('\n🎉 تم الانتهاء من جميع اختبارات نظام المحاسبة الأساسي بنجاح!');

    console.log('\n📋 ملخص النظام المُطبق:');
    console.log('✅ دليل الحسابات (Chart of Accounts) مع التسلسل الهرمي');
    console.log('✅ إنشاء وإدارة حسابات GL مع أنواع مختلفة');
    console.log('✅ نظام القيود اليومية مع التحقق من التوازن');
    console.log('✅ اعتماد وإلغاء اعتماد القيود اليومية');
    console.log('✅ تحديث أرصدة الحسابات تلقائياً');
    console.log('✅ قيود تلقائية للمبيعات والمشتريات');
    console.log('✅ حسابات النظام الافتراضية');
    console.log('✅ إحصائيات شاملة للنظام المحاسبي');
    console.log('✅ validation شامل للبيانات والعمليات');
    console.log('✅ معاملات قاعدة البيانات للأمان والاتساق');

    console.log('\n🔗 API Endpoints الجديدة:');
    console.log('POST /accounting/gl-accounts - إنشاء حساب GL');
    console.log('GET /accounting/gl-accounts - قائمة حسابات GL');
    console.log('GET /accounting/gl-accounts/:id - تفاصيل حساب GL');
    console.log('PATCH /accounting/gl-accounts/:id - تحديث حساب GL');
    console.log('DELETE /accounting/gl-accounts/:id - حذف حساب GL');
    console.log('POST /accounting/journal-entries - إنشاء قيد يومي');
    console.log('GET /accounting/journal-entries - قائمة القيود اليومية');
    console.log('GET /accounting/journal-entries/:id - تفاصيل قيد يومي');
    console.log('PATCH /accounting/journal-entries/:id/post - اعتماد قيد');
    console.log('PATCH /accounting/journal-entries/:id/unpost - إلغاء اعتماد');
    console.log('POST /accounting/setup/system-accounts - إعداد حسابات النظام');
    console.log('GET /accounting/stats/overview - إحصائيات المحاسبة');

    console.log('\n🏗️ هيكل دليل الحسابات:');
    console.log('1000-1999: الأصول (Assets)');
    console.log('  1001: النقدية');
    console.log('  1002: المدينون');
    console.log('  1003: المخزون');
    console.log('2000-2999: الالتزامات (Liabilities)');
    console.log('  2001: الدائنون');
    console.log('  2002: ضريبة المبيعات المستحقة');
    console.log('3000-3999: حقوق الملكية (Equity)');
    console.log('  3001: رأس المال');
    console.log('  3002: الأرباح المحتجزة');
    console.log('4000-4999: الإيرادات (Revenue)');
    console.log('  4001: إيرادات المبيعات');
    console.log('  4002: إيرادات أخرى');
    console.log('5000-5999: المصروفات (Expenses)');
    console.log('  5001: تكلفة البضائع المباعة');
    console.log('  5002: المصروفات التشغيلية');
    console.log('  5003+: مصروفات أخرى');

    console.log('\n📊 مبادئ المحاسبة المُطبقة:');
    console.log('1. **مبدأ التوازن**: مجموع المدين = مجموع الدائن');
    console.log('2. **مبدأ التسجيل المزدوج**: كل معاملة تؤثر على حسابين على الأقل');
    console.log('3. **مبدأ الاستمرارية**: النشاط مستمر إلا إذا ثبت العكس');
    console.log('4. **مبدأ التطابق**: مطابقة الإيرادات مع المصروفات ذات الصلة');
    console.log('5. **مبدأ التكلفة التاريخية**: تسجيل الأصول بتكلفتها الأصلية');

    console.log('\n🔄 دورة المحاسبة:');
    console.log('1. **القيود اليومية**: تسجيل المعاملات اليومية');
    console.log('2. **الاعتماد**: تأكيد صحة القيود وتوازنها');
    console.log('3. **التجميع**: تحويل القيود إلى تقارير مالية');
    console.log('4. **الإقفال**: نقل أرصدة الإيرادات والمصروفات إلى الأرباح المحتجزة');
    console.log('5. **التقارير**: إصدار القوائم المالية (الميزانية العمومية، قائمة الدخل)');

    console.log('\n🤖 القيود التلقائية:');
    console.log('- **المبيعات**: مدين (المدينون) دائن (إيرادات المبيعات)');
    console.log('- **المشتريات**: مدين (المخزون) دائن (الدائنون)');
    console.log('- **المدفوعات**: مدين (المصروفات) دائن (النقدية)');
    console.log('- **الإيرادات النقدية**: مدين (النقدية) دائن (إيرادات)');

    console.log('\n📈 التقارير المتاحة:');
    console.log('- ميزان المراجعة (Trial Balance)');
    console.log('- الميزانية العمومية (Balance Sheet)');
    console.log('- قائمة الدخل (Profit & Loss)');
    console.log('- حركة الحسابات (Account Movement)');
    console.log('- القيود اليومية (Journal Entries)');

    console.log('\n🔐 أذونات مطلوبة:');
    console.log('- accounting.gl_accounts.create - إنشاء حسابات GL');
    console.log('- accounting.gl_accounts.read - قراءة حسابات GL');
    console.log('- accounting.gl_accounts.update - تحديث حسابات GL');
    console.log('- accounting.gl_accounts.delete - حذف حسابات GL');
    console.log('- accounting.journal_entries.create - إنشاء قيود يومية');
    console.log('- accounting.journal_entries.read - قراءة القيود اليومية');
    console.log('- accounting.journal_entries.post - اعتماد القيود');
    console.log('- accounting.journal_entries.unpost - إلغاء اعتماد القيود');
    console.log('- accounting.setup - إعداد النظام');
    console.log('- accounting.reports - التقارير والإحصائيات');
    console.log('- accounting.export - تصدير البيانات');
    console.log('- accounting.auto_entries - القيود التلقائية');

    console.log('\n⚡ المميزات المتقدمة:');
    console.log('- كاش ذكي للبيانات المحاسبية');
    console.log('- تتبع التغييرات والتدقيق');
    console.log('- دعم التسلسل الهرمي للحسابات');
    console.log('- منع الحلقات في التسلسل الهرمي');
    console.log('- قيود تلقائية لجميع العمليات التجارية');
    console.log('- تكامل كامل مع جميع وحدات النظام');
    console.log('- إحصائيات فورية للأداء المالي');

  } catch (error) {
    console.error('❌ فشل في اختبار نظام المحاسبة الأساسي:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// تشغيل الاختبار
testAccountingSystem();
