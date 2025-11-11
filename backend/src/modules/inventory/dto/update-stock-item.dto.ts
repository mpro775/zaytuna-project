import { IsOptional, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateStockItemDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'الحد الأدنى يجب أن يكون رقم' })
  @Min(0, { message: 'الحد الأدنى يجب أن يكون أكبر من أو يساوي صفر' })
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  minStock?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'الحد الأقصى يجب أن يكون رقم' })
  @Min(0, { message: 'الحد الأقصى يجب أن يكون أكبر من أو يساوي صفر' })
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  maxStock?: number;
}