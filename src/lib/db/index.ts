import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Check if database is configured
const isDatabaseConfigured = !!process.env.DATABASE_URL;

// Create database connection (lazy initialization)
let sql: NeonQueryFunction<false, false> | null = null;
let database: NeonHttpDatabase<typeof schema> | null = null;

function getDatabase(): NeonHttpDatabase<typeof schema> | null {
  if (!isDatabaseConfigured) {
    console.warn('DATABASE_URL not configured. Database operations will fail.');
    return null;
  }
  
  if (!database) {
    sql = neon(process.env.DATABASE_URL!);
    database = drizzle(sql, { schema });
  }
  
  return database;
}

// Export db getter (throws if not configured)
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_, prop) {
    const database = getDatabase();
    if (!database) {
      throw new Error('Database not configured. Please set DATABASE_URL environment variable.');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (database as any)[prop];
  },
});

// Check if database is ready
export function isDatabaseReady(): boolean {
  return isDatabaseConfigured;
}

// Re-export schema
export * from './schema';
