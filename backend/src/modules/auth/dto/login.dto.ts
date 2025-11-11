import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'اسم المستخدم مطلوب' })
  @IsString({ message: 'اسم المستخدم يجب أن يكون نص' })
  username: string;

  @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
  @IsString({ message: 'كلمة المرور يجب أن أن تكون نص' })
  @MinLength(6, { message: 'كلمة المرور يجب أن تكون على الأقل 6 أحرف' })
  password: string;
}

export class LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    branch?: string;
  };
  expiresIn: number;
}
