import { IsEntityId } from '../../../common/decorators/entity-id.decorator';
import { IsNotEmpty, IsString, IsOptional, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

class PurchaseInvoiceLineDto {
  @IsNotEmpty({ message: 'معرف متغير المنتج مطلوب' })
  @IsEntityId()
  productVariantId: string;

  @IsNotEmpty({ message: 'الكمية مطلوبة' })
  @Type(() => Number)
  quantity: number;

  @IsNotEmpty({ message: 'التكلفة الوحدية مطلوبة' })
  @Type(() => Number)
  unitCost: number;

  @IsOptional()
  @Type(() => Number)
  discountAmount?: number;

  @IsOptional()
  @Type(() => Number)
  taxAmount?: number;

  @IsOptional()
  @Type(() => Number)
  lineTotal?: number;
}

export class CreatePurchaseInvoiceDto {
  @IsOptional()
  @IsString({ message: 'رقم الفاتورة يجب أن يكون نص' })
  invoiceNumber?: string;

  @IsNotEmpty({ message: 'معرف المورد مطلوب' })
  @IsEntityId()
  supplierId: string;

  @IsNotEmpty({ message: 'معرف المخزن مطلوب' })
  @IsEntityId()
  warehouseId: string;

  @IsOptional()
  @IsEntityId()
  purchaseOrderId?: string;

  @IsNotEmpty({ message: 'معرف العملة مطلوب' })
  @IsEntityId()
  currencyId: string;

  @IsNotEmpty({ message: 'تاريخ الفاتورة مطلوب' })
  @IsDateString({}, { message: 'تاريخ الفاتورة غير صحيح' })
  invoiceDate: string;

  @IsNotEmpty({ message: 'بنود فاتورة الشراء مطلوبة' })
  @IsArray({ message: 'بنود فاتورة الشراء يجب أن تكون مصفوفة' })
  @ValidateNested({ each: true })
  @Type(() => PurchaseInvoiceLineDto)
  lines: PurchaseInvoiceLineDto[];

  @IsOptional()
  @IsDateString({}, { message: 'تاريخ الاستحقاق غير صحيح' })
  dueDate?: string;

  @IsOptional()
  @IsString({ message: 'الحالة يجب أن تكون نص' })
  status?: string;

  @IsOptional()
  @IsString({ message: 'ملاحظات يجب أن تكون نص' })
  notes?: string;
}
