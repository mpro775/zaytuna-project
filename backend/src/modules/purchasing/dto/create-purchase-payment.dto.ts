import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePurchasePaymentDto {
  @IsNotEmpty({ message: 'المبلغ مطلوب' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'المبلغ يجب أن يكون رقم' })
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @IsNotEmpty({ message: 'طريقة الدفع مطلوبة' })
  @IsString({ message: 'طريقة الدفع يجب أن تكون نص' })
  paymentMethod: string; // cash, bank_transfer, check, credit_card

  @IsOptional()
  @IsString({ message: 'الرقم المرجعي يجب أن يكون نص' })
  referenceNumber?: string;

  @IsOptional()
  @IsString({ message: 'ملاحظات يجب أن تكون نص' })
  notes?: string;
}
