# خدمة المحاسبة - Accounting Service

خدمة شاملة لإدارة النظام المحاسبي مرتبطة بـ Backend APIs في `backend/src/modules/accounting/accounting.controller.ts`.

## الملفات

- `accounting.ts` - خدمة المحاسبة مع جميع دوال API
- `hooks.ts` - React Query hooks للتكامل مع المكونات
- `README.md` - هذا الملف

## APIs المدعومة

### حسابات GL (General Ledger)
- `POST /accounting/gl-accounts` - إنشاء حساب جديد
- `GET /accounting/gl-accounts` - قائمة الحسابات مع الفلترة
- `GET /accounting/gl-accounts/:id` - حساب بالمعرف
- `PATCH /accounting/gl-accounts/:id` - تحديث حساب
- `DELETE /accounting/gl-accounts/:id` - حذف حساب

### القيود اليومية (Journal Entries)
- `POST /accounting/journal-entries` - إنشاء قيد جديد
- `GET /accounting/journal-entries` - قائمة القيود مع الفلترة
- `GET /accounting/journal-entries/:id` - قيد بالمعرف
- `PATCH /accounting/journal-entries/:id/post` - اعتماد قيد
- `PATCH /accounting/journal-entries/:id/unpost` - إلغاء اعتماد قيد

### القيود التلقائية (Auto Journal Entries)
- `POST /accounting/auto/sales/:id` - قيد تلقائي للمبيعات
- `POST /accounting/auto/purchase/:id` - قيد تلقائي للمشتريات

### الإعدادات والإحصائيات
- `POST /accounting/setup/system-accounts` - إنشاء حسابات النظام
- `GET /accounting/stats/overview` - إحصائيات المحاسبة

### التقارير المالية
- `GET /accounting/reports/balance-sheet` - الميزانية العمومية
- `GET /accounting/reports/profit-loss` - قائمة الدخل
- `GET /accounting/reports/account-movement/:id` - حركة الحسابات

### التصدير
- `GET /accounting/export/trial-balance` - تصدير ميزان المراجعة
- `GET /accounting/export/journal-entries` - تصدير القيود اليومية

## استخدام الخدمة

### استخدام مباشر للخدمة

```typescript
import { AccountingService } from '@/services/accounting';

// إنشاء حساب GL
const newAccount = await AccountingService.createGLAccount({
  accountCode: '1001',
  name: 'النقدية',
  accountType: 'asset',
});

// إنشاء قيد يومي
const newEntry = await AccountingService.createJournalEntry({
  entryNumber: 'JE-001',
  description: 'قيد تجريبي',
  lines: [
    {
      debitAccountId: 'debit-account-id',
      creditAccountId: 'credit-account-id',
      amount: 1000,
    }
  ]
});

// الحصول على الميزانية العمومية
const balanceSheet = await AccountingService.getBalanceSheetReport('2024-12-31');
```

### استخدام React Query Hooks

```typescript
import {
  useGLAccounts,
  useCreateGLAccount,
  useBalanceSheetReport,
  useExportTrialBalance,
  downloadBlob,
} from '@/services/accounting';

function AccountingDashboard() {
  // حسابات GL
  const { data: glAccounts, isLoading } = useGLAccounts();

  // إنشاء حساب جديد
  const createAccount = useCreateGLAccount();

  const handleCreateAccount = async (accountData) => {
    try {
      await createAccount.mutateAsync(accountData);
      // تم إنشاء الحساب بنجاح
    } catch (error) {
      // معالجة الخطأ
    }
  };

  // الميزانية العمومية
  const { data: balanceSheet } = useBalanceSheetReport('2024-12-31');

  // تصدير ميزان المراجعة
  const exportTrialBalance = useExportTrialBalance();

  const handleExport = async () => {
    const blob = await exportTrialBalance.mutateAsync('2024-12-31');
    downloadBlob(blob, 'trial-balance.xlsx');
  };

  // ... باقي الكود
}
```

## أنواع البيانات

### GLAccount
```typescript
interface GLAccount {
  id: string;
  accountCode: string;
  name: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  debitBalance: number;
  creditBalance: number;
  netBalance: number;
  isActive: boolean;
  isSystem: boolean;
}
```

### JournalEntry
```typescript
interface JournalEntry {
  id: string;
  entryNumber: string;
  description: string;
  status: 'draft' | 'posted';
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  lines: JournalEntryLine[];
}
```

### BalanceSheetReport
```typescript
interface BalanceSheetReport {
  assets: {
    currentAssets: number;
    fixedAssets: number;
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: number;
    longTermLiabilities: number;
    totalLiabilities: number;
  };
  equity: {
    capital: number;
    retainedEarnings: number;
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
}
```

## معالجة الأخطاء

جميع دوال الخدمة ترجع `AccountingApiResponse<T>` والتي تحتوي على:
- `data`: البيانات المطلوبة
- `success`: حالة النجاح
- `message`: رسالة إضافية (اختيارية)

## التكامل مع الباك إند

- مرتبطة مباشرة بـ `backend/src/modules/accounting/accounting.controller.ts`
- تستخدم نفس أنواع البيانات الموجودة في `accounting.service.ts`
- تدعم جميع endpoints المتاحة في الباك إند
- متوافقة مع نظام الصلاحيات (`accounting.*` permissions)

## ملاحظات مهمة

- **الصلاحيات**: تأكد من أن المستخدم لديه الصلاحيات المطلوبة:
  - `accounting.gl_accounts.*` - لإدارة الحسابات
  - `accounting.journal_entries.*` - لإدارة القيود
  - `accounting.reports` - للتقارير المالية
  - `accounting.setup` - للإعدادات
  - `accounting.export` - للتصدير

- **التوازن المحاسبي**: القيود يجب أن تكون متوازنة (المجموع المدين = المجموع الدائن)

- **الحسابات النظامية**: لا يمكن حذف الحسابات النظامية (`isSystem: true`)

- **التصدير**: يتم إرجاع ملفات Excel كـ Blob للتنزيل

- **التخزين المؤقت**: البيانات تُحفظ مؤقتاً لفترات مختلفة حسب نوع البيانات

## أمثلة الاستخدام

انظر إلى `frontend-customer/src/pages/Accounting/GLAccounts.tsx` لمثال كامل على استخدام الخدمة في مكون React.

## قواعد المحاسبة المدعومة

1. **الحسابات**: أصول، خصوم، حقوق ملكية، إيرادات، مصروفات
2. **القيود المزدوجة**: كل قيد له جانب مدين وجانب دائن
3. **التوازن**: مجموع المدين = مجموع الدائن دائماً
4. **الاعتماد**: القيود المعتمدة لا يمكن تعديلها
5. **القيود التلقائية**: ترتبط بالمبيعات والمشتريات
