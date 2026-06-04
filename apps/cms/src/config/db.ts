import { sqliteAdapter } from '@payloadcms/db-sqlite';
import { postgresAdapter } from '@payloadcms/db-postgres';

/**
 * Database adapter selection — swap with one env var, no code change.
 *   DB_ADAPTER=sqlite   (default, portable: the .db file is the backup unit)
 *   DB_ADAPTER=postgres (set POSTGRES_URL)
 */
export function getDatabaseAdapter() {
  const adapter = (process.env.DB_ADAPTER ?? 'sqlite').toLowerCase();

  if (adapter === 'postgres') {
    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error('DB_ADAPTER=postgres but POSTGRES_URL is not set.');
    }
    return postgresAdapter({ pool: { connectionString } });
  }

  return sqliteAdapter({
    client: { url: process.env.DATABASE_URI ?? 'file:./siteforge.db' },
    // Auto-create/update the schema from collections (dev + seed convenience).
    // For production, generate and run migrations instead.
    push: true,
  });
}
