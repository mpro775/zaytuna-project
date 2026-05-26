import { IsEntityId } from '../../../common/decorators/entity-id.decorator';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

class PurchaseOrderLineDto {
  @IsNotEmpty({ message: 'معرف المنتج مطلوب' })
  @IsEntityId()
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
  @IsEntityId()
  supplierId: string;

  @IsNotEmpty({ message: 'معرف المخزن مطلوب' })
  @IsEntityId()
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
