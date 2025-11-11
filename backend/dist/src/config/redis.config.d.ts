declare const _default: (() => {
    url: string;
    host: string;
    port: number;
    password: string | undefined;
    db: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    url: string;
    host: string;
    port: number;
    password: string | undefined;
    db: number;
}>;
export default _default;
