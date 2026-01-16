import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { defineConfig } from 'drizzle-kit';

loadEnv({ path: resolve(__dirname, '.env') });

export default defineConfig({
  schema: './src/drizzle/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
});
