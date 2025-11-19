import { IsOptional, IsString, IsEmail, IsUUID, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'اسم المستخدم يجب أن يكون نص' })
  username?: string;

  @IsOptional()
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'رقم الهاتف يجب أن يكون نص' })
  phone?: string;

  @IsOptional()
  @IsUUID('4', { message: 'معرف الدور غير صحيح' })
  roleId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'معرف الفرع غير صحيح' })
  branchId?: string;

  @IsOptional()
  @IsBoolean({ message: 'حالة التفعيل يجب أن تكون قيمة منطقية' })
  isActive?: boolean;
}
