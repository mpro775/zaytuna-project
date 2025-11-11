import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'كلمة المرور الحالية مطلوبة' })
  @IsString({ message: 'كلمة المرور الحالية يجب أن تكون نص' })
  currentPassword: string;

  @IsNotEmpty({ message: 'كلمة المرور الجديدة مطلوبة' })
  @IsString({ message: 'كلمة المرور الجديدة يجب أن تكون نص' })
  @MinLength(6, { message: 'كلمة المرور الجديدة يجب أن تكون على الأقل 6 أحرف' })
  newPassword: string;
}

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'كلمة المرور الجديدة مطلوبة' })
  @IsString({ message: 'كلمة المرور الجديدة يجب أن تكون نص' })
  @MinLength(6, { message: 'كلمة المرور الجديدة يجب أن تكون على الأقل 6 أحرف' })
  newPassword: string;
}
