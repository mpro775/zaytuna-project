import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto, ResetPasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto, RefreshTokenResponseDto } from './dto/refresh-token.dto';
import { Public, Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LocalAuthGuard } from '../../common/guards/local-auth.guard';
import { AuthenticatedUser } from '../../common/strategies/jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * تسجيل دخول المستخدم
   */
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req, @Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(req.user);
  }

  /**
   * تسجيل مستخدم جديد
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<LoginResponseDto> {
    return this.authService.register(registerDto);
  }

  /**
   * تحديث الرمز المميز
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    const tokens = await this.authService.refreshToken(refreshTokenDto);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  /**
   * تسجيل الخروج
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req): Promise<{ message: string }> {
    const user: AuthenticatedUser = req.user;
    await this.authService.logout(user.id);
    return { message: 'تم تسجيل الخروج بنجاح' };
  }

  /**
   * الحصول على معلومات المستخدم الحالي
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@Request() req): Promise<AuthenticatedUser> {
    return req.user;
  }

  /**
   * تغيير كلمة المرور
   */
  @UseGuards(JwtAuthGuard)
  @Patch('password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user: AuthenticatedUser = req.user;
    await this.authService.changePassword(user.id, changePasswordDto);
    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }

  /**
   * إعادة تعيين كلمة المرور (للمشرفين)
   */
  @UseGuards(JwtAuthGuard)
  @Permissions('admin')
  @Patch('users/:userId/password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Param('userId') userId: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.resetPassword(userId, resetPasswordDto.newPassword);
    return { message: 'تم إعادة تعيين كلمة المرور بنجاح' };
  }

  /**
   * التحقق من صحة الرمز المميز
   */
  @UseGuards(JwtAuthGuard)
  @Get('verify')
  async verifyToken(@Request() req): Promise<{ valid: boolean; user: AuthenticatedUser }> {
    return {
      valid: true,
      user: req.user,
    };
  }
}
