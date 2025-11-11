import { IsOptional, IsString } from 'class-validator';

export class UpdateReturnDto {
  @IsOptional()
  @IsString({ message: 'الحالة يجب أن تكون نص' })
  status?: string;

  @IsOptional()
  @IsString({ message: 'حالة الاسترداد يجب أن تكون نص' })
  refundStatus?: string;

  @IsOptional()
  @IsString({ message: 'ملاحظات يجب أن تكون نص' })
  notes?: string;
}
