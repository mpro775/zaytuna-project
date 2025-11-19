# خدمة المبيعات - Sales Service

خدمة شاملة لإدارة المبيعات مرتبطة بـ Backend APIs في `backend/src/modules/sales/`.

## الملفات

- `types.ts` - أنواع TypeScript للبيانات والـ DTOs
- `sales.ts` - الخدمة الأساسية مع جميع دوال API
- `hooks.ts` - React Query hooks للتكامل مع المكونات
- `README.md` - هذا الملف

## APIs المدعومة

### الفواتير (Invoices)
- `POST /sales/invoices` - إنشاء فاتورة جديدة
- `GET /sales/invoices` - قائمة الفواتير مع الفلترة
- `GET /sales/invoices/:id` - تفاصيل فاتورة
- `PATCH /sales/invoices/:id` - تحديث فاتورة
- `DELETE /sales/invoices/:id/cancel` - إلغاء فاتورة

### المدفوعات (Payments)
- `POST /sales/invoices/:id/payments` - إضافة دفعة لفاتورة

### الإحصائيات والطباعة
- `GET /sales/stats` - إحصائيات المبيعات
- `GET /sales/invoices/:id/print` - طباعة فاتورة

## استخدام الخدمة

### استخدام مباشر للخدمة

```typescript
import { SalesService } from '@/services/sales';

// إنشاء فاتورة
const newInvoice = await SalesService.createInvoice({
  branchId: 'branch-uuid',
  warehouseId: 'warehouse-uuid',
  currencyId: 'currency-uuid',
  lines: [
    {
      productVariantId: 'variant-uuid',
      quantity: 5,
      unitPrice: 10.00,
    }
  ]
});

// الحصول على الفواتير
const invoices = await SalesService.getInvoices({
  status: 'confirmed',
  paymentStatus: 'paid',
  limit: 50
});
```

### استخدام React Query Hooks

```typescript
import { useSalesInvoices, useCreateSalesInvoice } from '@/services/sales';

function SalesInvoicesComponent() {
  // الحصول على الفواتير
  const { data: invoices, isLoading } = useSalesInvoices({
    status: 'confirmed',
    limit: 20
  });

  // إنشاء فاتورة جديدة
  const createInvoice = useCreateSalesInvoice();

  const handleCreateInvoice = async (invoiceData) => {
    try {
      await createInvoice.mutateAsync(invoiceData);
      // تم إنشاء الفاتورة بنجاح
    } catch (error) {
      // معالجة الخطأ
    }
  };

  // ... باقي الكود
}
```

## أنواع البيانات

### SalesInvoice
```typescript
interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  status: 'draft' | 'confirmed' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  totalAmount: number;
  // ... باقي الحقول
  lines: SalesInvoiceLine[];
  payments: Payment[];
}
```

### CreateSalesInvoiceDto
```typescript
interface CreateSalesInvoiceDto {
  branchId: string;
  warehouseId: string;
  currencyId: string;
  lines: CreateSalesInvoiceLineDto[];
  // ... باقي الحقول الاختيارية
}
```

## معالجة الأخطاء

جميع دوال الخدمة ترجع `SalesApiResponse<T>` والتي تحتوي على:
- `data`: البيانات المطلوبة
- `success`: حالة النجاح
- `message`: رسالة إضافية (اختيارية)

## التكامل مع الباك إند

- مرتبطة مباشرة بـ `backend/src/modules/sales/sales.controller.ts`
- تستخدم نفس DTOs الموجودة في `backend/src/modules/sales/dto/`
- تدعم جميع endpoints المتاحة في الباك إند
- متوافقة مع schema البيانات في Prisma (`SalesInvoice`, `SalesInvoiceLine`, `Payment`)

## أمثلة الاستخدام

انظر إلى `frontend-customer/src/pages/Sales/SalesInvoicesList.tsx` لمثال كامل على استخدام الخدمة في مكون React.
