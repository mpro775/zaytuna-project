import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto, ResetPasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto, RefreshTokenResponseDto } from './dto/refresh-token.dto';
import { AuthenticatedUser } from '../../common/strategies/jwt.strategy';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(req: any, loginDto: LoginDto): Promise<LoginResponseDto>;
    register(registerDto: RegisterDto): Promise<LoginResponseDto>;
    refreshToken(refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto>;
    logout(req: any): Promise<{
        message: string;
    }>;
    getCurrentUser(req: any): Promise<AuthenticatedUser>;
    changePassword(req: any, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(userId: string, resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    verifyToken(req: any): Promise<{
        valid: boolean;
        user: AuthenticatedUser;
    }>;
}
