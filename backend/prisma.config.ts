import { defineConfig } from 'prisma/config';
import { config } from 'dotenv';

// تحميل متغيرات البيئة
config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  engine: 'classic',
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
