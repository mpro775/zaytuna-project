import { IsNotEmpty, IsString, IsOptional, IsUUID, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

class ReturnLineDto {
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

  @IsOptional()
  @IsString({ message: 'السبب يجب أن يكون نص' })
  reason?: string;
}

export class CreateReturnDto {
  @IsOptional()
  @IsString({ message: 'رقم المرتجع يجب أن يكون نص' })
  returnNumber?: string;

  @IsNotEmpty({ message: 'معرف فاتورة المبيعات مطلوب' })
  @IsUUID('4', { message: 'معرف فاتورة المبيعات غير صحيح' })
  salesInvoiceId: string;

  @IsNotEmpty({ message: 'معرف المخزن مطلوب' })
  @IsUUID('4', { message: 'معرف المخزن غير صحيح' })
  warehouseId: string;

  @IsNotEmpty({ message: 'السبب مطلوب' })
  @IsString({ message: 'السبب يجب أن يكون نص' })
  reason: string;

  @IsNotEmpty({ message: 'بنود المرتجع مطلوبة' })
  @IsArray({ message: 'بنود المرتجع يجب أن تكون مصفوفة' })
  @ValidateNested({ each: true })
  @Type(() => ReturnLineDto)
  lines: ReturnLineDto[];

  @IsOptional()
  @IsString({ message: 'الحالة يجب أن تكون نص' })
  status?: string;

  @IsOptional()
  @IsString({ message: 'ملاحظات يجب أن تكون نص' })
  notes?: string;
}
