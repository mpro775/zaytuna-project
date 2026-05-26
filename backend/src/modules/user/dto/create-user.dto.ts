import { IsEntityId } from '../../../common/decorators/entity-id.decorator';
import { IsNotEmpty, IsString, IsEmail, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class CreateUserDto {
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
  @IsEntityId()
  roleId: string;

  @IsOptional()
  @IsEntityId()
  branchId?: string;

  @IsOptional()
  @IsBoolean({ message: 'حالة التفعيل يجب أن تكون قيمة منطقية' })
  isActive?: boolean;
}
