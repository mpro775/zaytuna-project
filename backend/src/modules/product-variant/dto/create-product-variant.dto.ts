import { IsNotEmpty, IsString, IsOptional, IsNumber, IsUUID, IsBoolean, MaxLength, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateProductVariantDto {
  @IsNotEmpty({ message: 'معرف المنتج مطلوب' })
  @IsUUID('4', { message: 'معرف المنتج غير صحيح' })
  productId: string;

  @IsNotEmpty({ message: 'اسم المتغير مطلوب' })
  @IsString({ message: 'اسم المتغير يجب أن يكون نص' })
  @MaxLength(255, { message: 'اسم المتغير يجب ألا يزيد عن 255 حرف' })
  name: string;

  @IsOptional()
  @IsString({ message: 'رمز SKU يجب أن يكون نص' })
  @MaxLength(100, { message: 'رمز SKU يجب ألا يزيد عن 100 حرف' })
  sku?: string;

  @IsOptional()
  @IsString({ message: 'الباركود يجب أن يكون نص' })
  @MaxLength(100, { message: 'الباركود يجب ألا يزيد عن 100 حرف' })
  barcode?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'السعر يجب أن يكون رقم' })
  @Min(0, { message: 'السعر يجب أن يكون أكبر من أو يساوي صفر' })
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  price?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'سعر التكلفة يجب أن يكون رقم' })
  @Min(0, { message: 'سعر التكلفة يجب أن يكون أكبر من أو يساوي صفر' })
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  costPrice?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'الوزن يجب أن يكون رقم' })
  @Min(0, { message: 'الوزن يجب أن يكون أكبر من أو يساوي صفر' })
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  weight?: number;

  @IsOptional()
  @Type(() => Object)
  dimensions?: Record<string, any>;

  @IsOptional()
  @Type(() => Object)
  attributes?: Record<string, any>;

  @IsOptional()
  @IsString({ message: 'رابط الصورة يجب أن يكون نص' })
  imageUrl?: string;

  @IsOptional()
  @IsBoolean({ message: 'حالة النشاط يجب أن تكون قيمة منطقية' })
  isActive?: boolean;
}
