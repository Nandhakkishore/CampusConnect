export const jwtConfig = {
  accessSecret: process.env.JWT_ACCESS_SECRET || 'super_secret_campus_access_key_2026',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'super_secret_campus_refresh_key_2026',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};
