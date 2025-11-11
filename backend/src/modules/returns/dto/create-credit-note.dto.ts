import { IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCreditNoteDto {
  @IsNotEmpty({ message: 'المبلغ مطلوب' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'المبلغ يجب أن يكون رقم' })
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @IsOptional()
  @IsDateString({}, { message: 'تاريخ انتهاء الصلاحية غير صحيح' })
  expiryDate?: string;

  @IsOptional()
  @IsString({ message: 'ملاحظات يجب أن تكون نص' })
  notes?: string;
}
