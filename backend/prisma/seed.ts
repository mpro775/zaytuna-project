import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.upsert({
    where: { id: 'company_main' },
    update: {
      name: 'Zaytun Soft',
      email: 'info@zaytunsoft.local',
      phone: '+967000000000',
      address: 'Yemen',
    },
    create: {
      id: 'company_main',
      name: 'Zaytun Soft',
      email: 'info@zaytunsoft.local',
      phone: '+967000000000',
      address: 'Yemen',
      taxNumber: 'TAX-DEV',
    },
  });

  const branch = await prisma.branch.upsert({
    where: { code: 'MAIN' },
    update: { companyId: company.id },
    create: {
      id: 'branch_main',
      name: 'Main Branch',
      code: 'MAIN',
      address: 'Yemen',
      companyId: company.id,
    },
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'WH_MAIN' },
    update: { branchId: branch.id },
    create: {
      id: 'warehouse_main',
      name: 'Main Warehouse',
      code: 'WH_MAIN',
      branchId: branch.id,
    },
  });

  const adminPermissions = [
    'auth.*',
    'users.*',
    'roles.*',
    'permissions.*',
    'settings.*',
    'currencies.*',
    'exchange-rates.*',
    'branches.*',
    'warehouses.*',
    'categories.*',
    'products.*',
    'product-variants.*',
    'inventory.*',
    'customers.*',
    'sales.*',
    'returns.*',
    'credit-notes.*',
    'suppliers.*',
    'purchasing.*',
    'accounting.*',
    'notifications.*',
    'sync.*',
    'backup.*',
    'reporting.*',
    'storage.*',
    'audit.*',
  ];

  const roleAdmin = await prisma.role.upsert({
    where: { name: 'admin' },
    update: { permissions: adminPermissions, isSystemRole: true, isActive: true },
    create: {
      id: 'role_admin',
      name: 'admin',
      description: 'System administrator',
      permissions: adminPermissions,
      isSystemRole: true,
    },
  });

  await prisma.role.upsert({
    where: { name: 'manager' },
    update: { permissions: ['products.*', 'inventory.*', 'sales.*', 'reporting.read'] },
    create: {
      id: 'role_manager',
      name: 'manager',
      description: 'Branch manager',
      permissions: ['products.*', 'inventory.*', 'sales.*', 'reporting.read'],
    },
  });

  await prisma.role.upsert({
    where: { name: 'cashier' },
    update: { permissions: ['products.read', 'sales.create', 'sales.read', 'customers.read'] },
    create: {
      id: 'role_cashier',
      name: 'cashier',
      description: 'Cashier',
      permissions: ['products.read', 'sales.create', 'sales.read', 'customers.read'],
    },
  });

  const passwordHash = await bcrypt.hash('Admin@123456', 12);
  await prisma.user.upsert({
    where: { email: 'admin@zaytunsoft.local' },
    update: { passwordHash, roleId: roleAdmin.id, branchId: branch.id, isActive: true },
    create: {
      id: 'user_admin',
      username: 'admin',
      email: 'admin@zaytunsoft.local',
      passwordHash,
      roleId: roleAdmin.id,
      branchId: branch.id,
    },
  });

  const yer = await prisma.currency.upsert({
    where: { code: 'YER' },
    update: { isBase: true, isDefault: true, isActive: true, exchangeRate: '1' },
    create: {
      id: 'currency_yer',
      code: 'YER',
      name: 'Yemeni Rial',
      symbol: 'YER',
      decimalPlaces: 2,
      exchangeRate: '1',
      isBase: true,
      isDefault: true,
    },
  });
  const usd = await prisma.currency.upsert({
    where: { code: 'USD' },
    update: { isActive: true, exchangeRate: '530' },
    create: {
      id: 'currency_usd',
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      decimalPlaces: 2,
      exchangeRate: '530',
    },
  });
  const sar = await prisma.currency.upsert({
    where: { code: 'SAR' },
    update: { isActive: true, exchangeRate: '141.33' },
    create: {
      id: 'currency_sar',
      code: 'SAR',
      name: 'Saudi Riyal',
      symbol: 'SAR',
      decimalPlaces: 2,
      exchangeRate: '141.33',
    },
  });

  const sampleRates = [
    [usd.id, yer.id, '530.00000000'],
    [sar.id, yer.id, '141.33000000'],
    [yer.id, usd.id, '0.00188679'],
    [yer.id, sar.id, '0.00707564'],
  ] as const;
  for (const [fromCurrencyId, toCurrencyId, rate] of sampleRates) {
    await prisma.exchangeRate.create({
      data: {
        fromCurrencyId,
        toCurrencyId,
        rate,
        effectiveAt: new Date('2026-01-01T00:00:00.000Z'),
        source: 'manual-seed-sample',
      },
    });
  }

  const category = await prisma.category.upsert({
    where: { id: 'category_phones' },
    update: {},
    create: { id: 'category_phones', name: 'Phones' },
  });

  const product = await prisma.product.upsert({
    where: { id: 'product_sample_phone' },
    update: {},
    create: {
      id: 'product_sample_phone',
      name: 'Sample Phone',
      sku: 'PHONE-SAMPLE',
      categoryId: category.id,
      basePrice: '100000',
      costPrice: '85000',
    },
  });

  const variant = await prisma.productVariant.upsert({
    where: { id: 'variant_sample_phone_black_128' },
    update: {},
    create: {
      id: 'variant_sample_phone_black_128',
      productId: product.id,
      name: 'Black / 128GB',
      sku: 'PHONE-SAMPLE-BLK-128',
      price: '100000',
      costPrice: '85000',
      attributes: { color: 'black', storage: '128GB' },
    },
  });

  await prisma.stockItem.upsert({
    where: {
      warehouseId_productVariantId: {
        warehouseId: warehouse.id,
        productVariantId: variant.id,
      },
    },
    update: { quantity: '10' },
    create: {
      warehouseId: warehouse.id,
      productVariantId: variant.id,
      quantity: '10',
    },
  });

  const accounts = [
    ['1000', 'Assets', 'asset'],
    ['1010', 'Cash', 'asset'],
    ['1020', 'Inventory', 'asset'],
    ['1030', 'Accounts Receivable', 'asset'],
    ['2000', 'Liabilities', 'liability'],
    ['2010', 'Accounts Payable', 'liability'],
    ['3000', 'Equity', 'equity'],
    ['4000', 'Revenue', 'revenue'],
    ['4010', 'Sales Revenue', 'revenue'],
    ['5000', 'Expenses', 'expense'],
    ['5010', 'Cost of Goods Sold', 'expense'],
  ] as const;
  for (const [accountCode, name, accountType] of accounts) {
    await prisma.gLAccount.upsert({
      where: { accountCode },
      update: { name, accountType, isSystem: true },
      create: { accountCode, name, accountType, isSystem: true },
    });
  }

  await prisma.appSetting.upsert({
    where: { scope_scopeId_key: { scope: 'global', scopeId: '', key: 'company.defaultCurrencyId' } },
    update: { value: yer.id },
    create: { scope: 'global', scopeId: '', key: 'company.defaultCurrencyId', value: yer.id },
  });

  console.log('Seed completed. Admin: admin / admin@zaytunsoft.local / Admin@123456');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
