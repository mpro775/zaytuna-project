import { IsNotEmpty, IsString, IsOptional, IsUUID, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

class PurchaseOrderLineDto {
  @IsNotEmpty({ message: 'معرف المنتج مطلوب' })
  @IsUUID('4', { message: 'معرف المنتج غير صحيح' })
  productId: string;

  @IsNotEmpty({ message: 'الكمية مطلوبة' })
  @Type(() => Number)
  quantity: number;

  @IsNotEmpty({ message: 'التكلفة الوحدية مطلوبة' })
  @Type(() => Number)
  unitCost: number;
}

export class CreatePurchaseOrderDto {
  @IsNotEmpty({ message: 'معرف المورد مطلوب' })
  @IsUUID('4', { message: 'معرف المورد غير صحيح' })
  supplierId: string;

  @IsNotEmpty({ message: 'معرف المخزن مطلوب' })
  @IsUUID('4', { message: 'معرف المخزن غير صحيح' })
  warehouseId: string;

  @IsNotEmpty({ message: 'بنود أمر الشراء مطلوبة' })
  @IsArray({ message: 'بنود أمر الشراء يجب أن تكون مصفوفة' })
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderLineDto)
  lines: PurchaseOrderLineDto[];

  @IsOptional()
  @IsDateString({}, { message: 'تاريخ المتوقع غير صحيح' })
  expectedDate?: string;

  @IsOptional()
  @IsString({ message: 'ملاحظات يجب أن تكون نص' })
  notes?: string;
}
