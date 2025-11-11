import { IsNotEmpty, IsString, IsOptional, IsUUID, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

class SalesInvoiceLineDto {
  @IsNotEmpty({ message: 'معرف متغير المنتج مطلوب' })
  @IsUUID('4', { message: 'معرف متغير المنتج غير صحيح' })
  productVariantId: string;

  @IsNotEmpty({ message: 'الكمية مطلوبة' })
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @Type(() => Number)
  unitPrice?: number;

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

export class CreateSalesInvoiceDto {
  @IsOptional()
  @IsString({ message: 'رقم الفاتورة يجب أن يكون نص' })
  invoiceNumber?: string;

  @IsNotEmpty({ message: 'معرف الفرع مطلوب' })
  @IsUUID('4', { message: 'معرف الفرع غير صحيح' })
  branchId: string;

  @IsOptional()
  @IsUUID('4', { message: 'معرف العميل غير صحيح' })
  customerId?: string;

  @IsNotEmpty({ message: 'معرف المخزن مطلوب' })
  @IsUUID('4', { message: 'معرف المخزن غير صحيح' })
  warehouseId: string;

  @IsNotEmpty({ message: 'معرف العملة مطلوب' })
  @IsUUID('4', { message: 'معرف العملة غير صحيح' })
  currencyId: string;

  @IsOptional()
  @IsUUID('4', { message: 'معرف الضريبة غير صحيح' })
  taxId?: string;

  @IsNotEmpty({ message: 'سطور الفاتورة مطلوبة' })
  @IsArray({ message: 'سطور الفاتورة يجب أن تكون مصفوفة' })
  @ValidateNested({ each: true })
  @Type(() => SalesInvoiceLineDto)
  lines: SalesInvoiceLineDto[];

  @IsOptional()
  @IsString({ message: 'الحالة يجب أن تكون نص' })
  status?: string;

  @IsOptional()
  @IsString({ message: 'ملاحظات يجب أن تكون نص' })
  notes?: string;

  @IsOptional()
  @IsDateString({}, { message: 'تاريخ الاستحقاق غير صحيح' })
  dueDate?: string;
}
