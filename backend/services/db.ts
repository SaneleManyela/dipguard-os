import { Pool } from 'pg';

// Using PgBouncer/Supabase connection string config
const connectionString = process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/dipguard';

// Step One: Connection Pooling (Layer 3)
// This re-uses connections (e.g. 50 requests sharing the pool) to prevent database lockups.
export const dbPool = new Pool({
    connectionString,
    max: 20, // Max number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Helper wrapper for queries
export const query = (text: string, params?: any[]) => dbPool.query(text, params);
