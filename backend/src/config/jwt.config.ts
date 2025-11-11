import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret:
    process.env.JWT_SECRET ||
    'dev_jwt_secret_key_change_in_production_min_32_chars',
  accessTokenTtl: parseInt(process.env.JWT_ACCESS_TTL || '900', 10), // 15 minutes
  refreshTokenTtl: parseInt(process.env.JWT_REFRESH_TTL || '604800', 10), // 7 days
}));
