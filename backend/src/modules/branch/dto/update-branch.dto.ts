import { IsOptional, IsString, IsEmail, IsUUID, IsBoolean } from 'class-validator';

export class UpdateBranchDto {
  @IsOptional()
  @IsString({ message: 'اسم الفرع يجب أن يكون نص' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'كود الفرع يجب أن يكون نص' })
  code?: string;

  @IsOptional()
  @IsString({ message: 'العنوان يجب أن يكون نص' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'رقم الهاتف يجب أن يكون نص' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  email?: string;

  @IsOptional()
  @IsUUID('4', { message: 'معرف المدير غير صحيح' })
  managerId?: string;

  @IsOptional()
  @IsBoolean({ message: 'حالة النشاط يجب أن تكون قيمة منطقية' })
  isActive?: boolean;
}
