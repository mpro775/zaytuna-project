import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsNotEmpty({ message: 'الرمز المميز مطلوب' })
  @IsString({ message: 'الرمز المميز يجب أن يكون نص' })
  refreshToken: string;
}

export class RefreshTokenResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
