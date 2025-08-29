import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';

// Pick the right .env file based on NODE_ENV
let envFile = '.env'; // default: development

if (process.env.NODE_ENV === 'production') {
  envFile = '.env.production';
} else if (process.env.NODE_ENV === 'test') {
  envFile = '.env.test';
}

// Load the selected env file
dotenv.config({ path: envFile });

export default defineConfig({
  schema: './prisma/schema.prisma',
});
