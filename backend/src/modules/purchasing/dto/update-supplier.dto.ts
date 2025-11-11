import { IsOptional, IsString, IsBoolean, IsEmail } from 'class-validator';

export class UpdateSupplierDto {
  @IsOptional()
  @IsString({ message: 'اسم المورد يجب أن يكون نص' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'اسم جهة الاتصال يجب أن يكون نص' })
  contactName?: string;

  @IsOptional()
  @IsString({ message: 'رقم الهاتف يجب أن يكون نص' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'العنوان يجب أن يكون نص' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'الرقم الضريبي يجب أن يكون نص' })
  taxNumber?: string;

  @IsOptional()
  @IsString({ message: 'شروط الدفع يجب أن تكون نص' })
  paymentTerms?: string;

  @IsOptional()
  @IsBoolean({ message: 'حالة النشاط يجب أن تكون منطقية' })
  isActive?: boolean;
}
