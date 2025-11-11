#!/usr/bin/env tsx
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
async function testDatabaseConnection() {
    console.log('🔍 اختبار الاتصال بقاعدة البيانات...');
    const prisma = new client_1.PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
    });
    try {
        console.log('📡 الاتصال بقاعدة البيانات...');
        await prisma.$connect();
        console.log('✅ تم الاتصال بنجاح!');
        console.log('🔍 اختبار استعلام بسيط...');
        const result = await prisma.$queryRaw `SELECT 1 as test`;
        console.log('✅ الاستعلام نجح:', result);
        console.log('📊 التحقق من الجداول...');
        const tables = await prisma.$queryRaw `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
        if (tables.length > 0) {
            console.log(`✅ تم العثور على ${tables.length} جدول:`);
            tables.forEach((table) => {
                console.log(`   - ${table.table_name}`);
            });
        }
        else {
            console.log('⚠️  لم يتم العثور على جداول. قم بتشغيل: npm run db:push');
        }
        console.log('👤 التحقق من البيانات الأولية...');
        const userCount = await prisma.user.count();
        const companyCount = await prisma.company.count();
        const branchCount = await prisma.branch.count();
        console.log(`📈 إحصائيات قاعدة البيانات:`);
        console.log(`   - المستخدمون: ${userCount}`);
        console.log(`   - الشركات: ${companyCount}`);
        console.log(`   - الفروع: ${branchCount}`);
        if (userCount === 0) {
            console.log('⚠️  لا توجد بيانات مستخدمين. قم بتشغيل: npm run db:seed');
        }
        console.log('🎉 اختبار قاعدة البيانات مكتمل بنجاح!');
    }
    catch (error) {
        console.error('❌ فشل في اختبار قاعدة البيانات:');
        console.error(error);
        console.log('\n🔧 نصائح لحل المشكلة:');
        console.log('1. تأكد من تشغيل PostgreSQL');
        console.log('2. تحقق من صحة DATABASE_URL في ملف .env');
        console.log('3. تأكد من وجود قاعدة البيانات والمستخدم');
        console.log('4. قم بتشغيل: npm run db:push لإنشاء الجداول');
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
testDatabaseConnection();
//# sourceMappingURL=test-db-connection.js.map