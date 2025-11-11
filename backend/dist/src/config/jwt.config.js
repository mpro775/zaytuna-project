"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('jwt', () => ({
    secret: process.env.JWT_SECRET ||
        'dev_jwt_secret_key_change_in_production_min_32_chars',
    accessTokenTtl: parseInt(process.env.JWT_ACCESS_TTL || '900', 10),
    refreshTokenTtl: parseInt(process.env.JWT_REFRESH_TTL || '604800', 10),
}));
//# sourceMappingURL=jwt.config.js.map