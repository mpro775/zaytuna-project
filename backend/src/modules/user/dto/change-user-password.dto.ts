import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangeUserPasswordDto {
  @IsNotEmpty({ message: 'كلمة المرور الجديدة مطلوبة' })
  @IsString({ message: 'كلمة المرور الجديدة يجب أن تكون نص' })
  @MinLength(6, { message: 'كلمة المرور الجديدة يجب أن تكون على الأقل 6 أحرف' })
  newPassword: string;
}
