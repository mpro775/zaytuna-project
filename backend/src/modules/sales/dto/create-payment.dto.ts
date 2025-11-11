import { IsNotEmpty, IsNumber, IsString, IsUUID, IsOptional, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePaymentDto {
  @IsNotEmpty({ message: 'معرف العملة مطلوب' })
  @IsUUID('4', { message: 'معرف العملة غير صحيح' })
  currencyId: string;

  @IsNotEmpty({ message: 'المبلغ مطلوب' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'المبلغ يجب أن يكون رقم' })
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @IsNotEmpty({ message: 'طريقة الدفع مطلوبة' })
  @IsString({ message: 'طريقة الدفع يجب أن تكون نص' })
  paymentMethod: string;

  @IsOptional()
  @IsString({ message: 'رقم المرجع يجب أن يكون نص' })
  @MaxLength(100, { message: 'رقم المرجع يجب ألا يزيد عن 100 حرف' })
  referenceNumber?: string;

  @IsOptional()
  @IsString({ message: 'ملاحظات يجب أن تكون نص' })
  notes?: string;
}
