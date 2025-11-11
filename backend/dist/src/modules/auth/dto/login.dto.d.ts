export declare class LoginDto {
    username: string;
    password: string;
}
export declare class LoginResponseDto {
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
