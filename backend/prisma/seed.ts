import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 بدء زراعة قاعدة البيانات...');

  // إنشاء الشركة الأساسية
  const company = await prisma.company.upsert({
    where: { id: 'company_main' },
    update: {},
    create: {
      id: 'company_main',
      name: 'شركة زيتونة للأنظمة',
      description: 'نظام إدارة نقاط البيع المتكامل',
      address: 'الرياض، المملكة العربية السعودية',
      phone: '+966501234567',
      email: 'info@zaytuna.com',
      taxNumber: '1234567890',
      isActive: true,
    },
  });

  console.log('✅ تم إنشاء الشركة:', company.name);

  // إنشاء الفروع الأساسية
  const branches = await Promise.all([
    prisma.branch.upsert({
      where: { code: 'MAIN' },
      update: {},
      create: {
        id: 'branch_main',
        name: 'الفرع الرئيسي',
        code: 'MAIN',
        address: 'الرياض، المملكة العربية السعودية',
        phone: '+966501234567',
        email: 'main@zaytuna.com',
        companyId: company.id,
        isActive: true,
      },
    }),
    prisma.branch.upsert({
      where: { code: 'BRANCH1' },
      update: {},
      create: {
        id: 'branch_1',
        name: 'فرع الشمالية',
        code: 'BRANCH1',
        address: 'الشمالية، المملكة العربية السعودية',
        phone: '+966507654321',
        email: 'north@zaytuna.com',
        companyId: company.id,
        isActive: true,
      },
    }),
  ]);

  console.log('✅ تم إنشاء الفروع:', branches.map(b => b.name));

  // إنشاء المخازن
  const warehouses = await Promise.all([
    prisma.warehouse.upsert({
      where: { code: 'WH_MAIN' },
      update: {},
      create: {
        id: 'warehouse_main',
        name: 'المخزن الرئيسي',
        code: 'WH_MAIN',
        address: 'الرياض، المملكة العربية السعودية',
        branchId: branches[0].id,
        isActive: true,
      },
    }),
    prisma.warehouse.upsert({
      where: { code: 'WH_NORTH' },
      update: {},
      create: {
        id: 'warehouse_north',
        name: 'مخزن الشمالية',
        code: 'WH_NORTH',
        address: 'الشمالية، المملكة العربية السعودية',
        branchId: branches[1].id,
        isActive: true,
      },
    }),
  ]);

  console.log('✅ تم إنشاء المخازن:', warehouses.map(w => w.name));

  // إنشاء الأدوار الأساسية
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'super_admin' },
      update: {},
      create: {
        id: 'role_super_admin',
        name: 'super_admin',
        description: 'مدير النظام الأعلى',
        permissions: [
          'system.*',
          'users.*',
          'roles.*',
          'branches.*',
          'warehouses.*',
          'products.*',
          'inventory.*',
          'sales.*',
          'purchases.*',
          'accounting.*',
          'reports.*',
        ],
        isActive: true,
      },
    }),
    prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        id: 'role_admin',
        name: 'admin',
        description: 'مدير الفرع',
        permissions: [
          'users.read',
          'users.create',
          'users.update',
          'branches.read',
          'warehouses.read',
          'products.*',
          'inventory.*',
          'sales.*',
          'purchases.*',
          'reports.read',
        ],
        isActive: true,
      },
    }),
    prisma.role.upsert({
      where: { name: 'cashier' },
      update: {},
      create: {
        id: 'role_cashier',
        name: 'cashier',
        description: 'صراف',
        permissions: [
          'sales.create',
          'sales.read',
          'products.read',
          'inventory.read',
        ],
        isActive: true,
      },
    }),
  ]);

  console.log('✅ تم إنشاء الأدوار:', roles.map(r => r.name));

  // إنشاء المستخدمين الأساسيين
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'superadmin@zaytuna.com' },
      update: {},
      create: {
        id: 'user_super_admin',
        username: 'superadmin',
        email: 'superadmin@zaytuna.com',
        phone: '+966501234567',
        passwordHash: hashedPassword,
        branchId: branches[0].id,
        roleId: roles[0].id,
        isActive: true,
        twoFactorEnabled: false,
        biometricEnabled: false,
      },
    }),
    prisma.user.upsert({
      where: { email: 'admin@zaytuna.com' },
      update: {},
      create: {
        id: 'user_admin',
        username: 'admin',
        email: 'admin@zaytuna.com',
        phone: '+966502468135',
        passwordHash: hashedPassword,
        branchId: branches[0].id,
        roleId: roles[1].id,
        isActive: true,
        twoFactorEnabled: false,
        biometricEnabled: false,
      },
    }),
    prisma.user.upsert({
      where: { email: 'cashier@zaytuna.com' },
      update: {},
      create: {
        id: 'user_cashier',
        username: 'cashier',
        email: 'cashier@zaytuna.com',
        phone: '+966508642357',
        passwordHash: hashedPassword,
        branchId: branches[0].id,
        roleId: roles[2].id,
        isActive: true,
        twoFactorEnabled: false,
        biometricEnabled: false,
      },
    }),
  ]);

  console.log('✅ تم إنشاء المستخدمين:', users.map(u => u.username));

  console.log('🎉 تمت زراعة قاعدة البيانات بنجاح!');
  console.log('\n📋 بيانات تسجيل الدخول:');
  console.log('Super Admin: superadmin@zaytuna.com / Admin@123');
  console.log('Admin: admin@zaytuna.com / Admin@123');
  console.log('Cashier: cashier@zaytuna.com / Admin@123');
}

main()
  .catch((e) => {
    console.error('❌ خطأ في زراعة قاعدة البيانات:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
