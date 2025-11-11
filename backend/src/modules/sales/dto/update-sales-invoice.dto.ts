import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateSalesInvoiceDto {
  @IsOptional()
  @IsString({ message: 'الحالة يجب أن تكون نص' })
  status?: string;

  @IsOptional()
  @IsString({ message: 'حالة الدفع يجب أن تكون نص' })
  paymentStatus?: string;

  @IsOptional()
  @IsString({ message: 'ملاحظات يجب أن تكون نص' })
  notes?: string;

  @IsOptional()
  @IsDateString({}, { message: 'تاريخ الاستحقاق غير صحيح' })
  dueDate?: string;
}