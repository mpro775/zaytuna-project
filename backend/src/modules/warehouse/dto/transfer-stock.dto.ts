import { IsNotEmpty, IsUUID, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class TransferStockDto {
  @IsNotEmpty({ message: 'معرف المخزن المصدر مطلوب' })
  @IsUUID('4', { message: 'معرف المخزن المصدر غير صحيح' })
  fromWarehouseId: string;

  @IsNotEmpty({ message: 'معرف المخزن الوجهة مطلوب' })
  @IsUUID('4', { message: 'معرف المخزن الوجهة غير صحيح' })
  toWarehouseId: string;

  @IsNotEmpty({ message: 'معرف متغير المنتج مطلوب' })
  @IsUUID('4', { message: 'معرف متغير المنتج غير صحيح' })
  productVariantId: string;

  @IsNotEmpty({ message: 'الكمية مطلوبة' })
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'الكمية يجب أن تكون رقم' })
  @Min(0.001, { message: 'الكمية يجب أن تكون أكبر من صفر' })
  quantity: number;

  @IsOptional()
  @IsString({ message: 'ملاحظات النقل يجب أن تكون نص' })
  notes?: string;
}
