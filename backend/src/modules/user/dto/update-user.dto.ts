import { IsEntityId } from '../../../common/decorators/entity-id.decorator';
import { IsOptional, IsString, IsEmail, IsBoolean } from 'class-validator';

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
  @IsEntityId()
  roleId?: string;

  @IsOptional()
  @IsEntityId()
  branchId?: string;

  @IsOptional()
  @IsBoolean({ message: 'حالة التفعيل يجب أن تكون قيمة منطقية' })
  isActive?: boolean;
}
