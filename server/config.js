import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const missing = ['DATABASE_URL', 'JWT_SECRET'].filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(', ')}. See server/.env.example.`);
  process.exit(1);
}
if (!/^(postgres(ql)?:\/\/|sqlite:)/.test(process.env.DATABASE_URL)) {
  console.error('DATABASE_URL must start with postgresql:// or sqlite: (e.g. sqlite:./local.db). Check server/.env.');
  process.exit(1);
}
if (process.env.JWT_SECRET === 'change-me' || process.env.JWT_SECRET.startsWith('your-')) {
  console.error('JWT_SECRET is still a placeholder. Set a long random value in server/.env.');
  process.exit(1);
}

export const config = {
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  port: Number(process.env.PORT) || 3001,
  isProduction: process.env.NODE_ENV === 'production',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
