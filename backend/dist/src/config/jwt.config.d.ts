declare const _default: (() => {
    secret: string;
    accessTokenTtl: number;
    refreshTokenTtl: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    secret: string;
    accessTokenTtl: number;
    refreshTokenTtl: number;
}>;
export default _default;
