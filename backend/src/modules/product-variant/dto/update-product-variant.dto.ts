import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateProductVariantDto {
  @IsOptional()
  @IsString({ message: 'اسم المتغير يجب أن يكون نص' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'رمز SKU يجب أن يكون نص' })
  sku?: string;

  @IsOptional()
  @IsString({ message: 'الباركود يجب أن يكون نص' })
  barcode?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'السعر يجب أن يكون رقم' })
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  price?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'سعر التكلفة يجب أن يكون رقم' })
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  costPrice?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'الوزن يجب أن يكون رقم' })
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