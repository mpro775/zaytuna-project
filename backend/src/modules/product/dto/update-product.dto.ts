import { IsOptional, IsString, IsNumber, IsBoolean, IsUUID, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProductDto {
  @IsOptional()
  @IsString({ message: 'اسم المنتج يجب أن يكون نص' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'وصف المنتج يجب أن يكون نص' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'الباركود يجب أن يكون نص' })
  barcode?: string;

  @IsOptional()
  @IsString({ message: 'رمز SKU يجب أن يكون نص' })
  sku?: string;

  @IsOptional()
  @IsUUID('4', { message: 'معرف الفئة غير صحيح' })
  categoryId?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'السعر الأساسي يجب أن يكون رقم' })
  @Min(0, { message: 'السعر الأساسي يجب أن يكون أكبر من أو يساوي صفر' })
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  basePrice?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'سعر التكلفة يجب أن يكون رقم' })
  @Min(0, { message: 'سعر التكلفة يجب أن يكون أكبر من أو يساوي صفر' })
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  costPrice?: number;

  @IsOptional()
  @IsUUID('4', { message: 'معرف الضريبة غير صحيح' })
  taxId?: string;

  @IsOptional()
  @IsBoolean({ message: 'حالة التتبع يجب أن تكون قيمة منطقية' })
  trackInventory?: boolean;

  @IsOptional()
  @IsNumber({}, { message: 'نقطة إعادة الطلب يجب أن تكون رقم' })
  @Min(0, { message: 'نقطة إعادة الطلب يجب أن تكون أكبر من أو تساوي صفر' })
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  reorderPoint?: number;

  @IsOptional()
  @IsString({ message: 'رابط الصورة يجب أن يكون نص' })
  imageUrl?: string;

  @IsOptional()
  @IsBoolean({ message: 'حالة النشاط يجب أن تكون قيمة منطقية' })
  isActive?: boolean;
}