import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not defined in environment variables');
}

const client = postgres(connectionString!, {
  ssl: connectionString?.includes('localhost') ? false : 'require',
  prepare: false, // Often needed for connection poolers like Supabase/Transaction mode
});

export const db = drizzle(client, { schema });
