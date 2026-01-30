import { Pool } from 'pg';

// This creates a single pool instance that can be reused across your app
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // This SSL block is REQUIRED for Supabase connections
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = {
  /**
   * Main query function
   * @param text SQL Query string
   * @param params Array of variables for the query ($1, $2, etc)
   */
  query: (text: string, params?: any[]) => pool.query(text, params),
  
  /**
   * Use this if you need a direct client (e.g. for transactions)
   */
  getClient: () => pool.connect(),
};