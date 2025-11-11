import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    private readonly cacheService;
    private readonly logger;
    private readonly saltRounds;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, cacheService: CacheService);
    login(loginDto: LoginDto): Promise<LoginResponseDto>;
    register(registerDto: RegisterDto): Promise<LoginResponseDto>;
    refreshToken(refreshTokenDto: RefreshTokenDto): Promise<TokenPair>;
    logout(userId: string): Promise<void>;
    changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void>;
    resetPassword(userId: string, newPassword: string): Promise<void>;
    private generateTokens;
    private verifyRefreshToken;
    private createSession;
    private updateSession;
    private destroySession;
    private destroyAllUserSessions;
    private hashPassword;
}
