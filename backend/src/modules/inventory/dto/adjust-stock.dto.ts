import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class AdjustStockDto {
  @IsNotEmpty({ message: 'الكمية مطلوبة' })
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'الكمية يجب أن تكون رقم' })
  @Transform(({ value }) => parseFloat(value))
  quantity: number;

  @IsOptional()
  @IsString({ message: 'نوع الحركة يجب أن يكون نص' })
  movementType?: string;

  @IsOptional()
  @IsString({ message: 'نوع المرجع يجب أن يكون نص' })
  referenceType?: string;

  @IsOptional()
  @IsUUID('4', { message: 'معرف المرجع غير صحيح' })
  referenceId?: string;

  @IsOptional()
  @IsString({ message: 'السبب يجب أن يكون نص' })
  @MaxLength(500, { message: 'السبب يجب ألا يزيد عن 500 حرف' })
  reason?: string;
}
