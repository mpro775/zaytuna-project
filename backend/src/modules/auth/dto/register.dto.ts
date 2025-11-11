import { IsNotEmpty, IsString, IsEmail, IsOptional, IsUUID, MinLength, IsPhoneNumber } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'اسم المستخدم مطلوب' })
  @IsString({ message: 'اسم المستخدم يجب أن يكون نص' })
  username: string;

  @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  email: string;

  @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
  @IsString({ message: 'كلمة المرور يجب أن تكون نص' })
  @MinLength(6, { message: 'كلمة المرور يجب أن تكون على الأقل 6 أحرف' })
  password: string;

  @IsOptional()
  @IsString({ message: 'رقم الهاتف يجب أن يكون نص' })
  phone?: string;

  @IsNotEmpty({ message: 'معرف الدور مطلوب' })
  @IsUUID('4', { message: 'معرف الدور غير صحيح' })
  roleId: string;

  @IsOptional()
  @IsUUID('4', { message: 'معرف الفرع غير صحيح' })
  branchId?: string;
}
