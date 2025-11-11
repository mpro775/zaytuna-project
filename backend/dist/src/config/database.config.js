"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('database', () => ({
    url: process.env.DATABASE_URL ||
        'postgresql://zaytuna_user:password@localhost:5432/zaytuna_pos',
}));
//# sourceMappingURL=database.config.js.map