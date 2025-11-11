import { IsNotEmpty, IsUUID, IsOptional, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateStockItemDto {
  @IsNotEmpty({ message: 'معرف المخزن مطلوب' })
  @IsUUID('4', { message: 'معرف المخزن غير صحيح' })
  warehouseId: string;

  @IsNotEmpty({ message: 'معرف متغير المنتج مطلوب' })
  @IsUUID('4', { message: 'معرف متغير المنتج غير صحيح' })
  productVariantId: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'الكمية يجب أن تكون رقم' })
  @Min(0, { message: 'الكمية يجب أن تكون أكبر من أو تساوي صفر' })
  @Transform(({ value }) => value ? parseFloat(value) : 0)
  quantity?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'الحد الأدنى يجب أن يكون رقم' })
  @Min(0, { message: 'الحد الأدنى يجب أن يكون أكبر من أو يساوي صفر' })
  @Transform(({ value }) => value ? parseFloat(value) : 0)
  minStock?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'الحد الأقصى يجب أن يكون رقم' })
  @Min(0, { message: 'الحد الأقصى يجب أن يكون أكبر من أو يساوي صفر' })
  @Transform(({ value }) => value ? parseFloat(value) : 1000)
  maxStock?: number;
}
