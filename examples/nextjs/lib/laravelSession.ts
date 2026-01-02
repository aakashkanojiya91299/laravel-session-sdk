import { LaravelSessionClient } from '../../../dist';

let client: LaravelSessionClient | null = null;

/**
 * Get singleton instance of LaravelSessionClient
 * Use this pattern to avoid creating multiple database connections
 */
export function getLaravelSessionClient(): LaravelSessionClient {
  if (!client) {
    client = new LaravelSessionClient({
      database: {
        type: 'mysql',
        host: process.env.DB_HOST!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_DATABASE!,
        connectionLimit: 10,
      },
      session: {
        driver: 'database',
        table: 'sessions',
        lifetime: parseInt(process.env.SESSION_LIFETIME || '1000'),
        cookieName: process.env.SESSION_COOKIE_NAME || 'laravel_session',
      },
      debug: process.env.NODE_ENV === 'development',
    });
  }

  return client;
}

/**
 * Close client connection (for cleanup)
 */
export async function closeLaravelSessionClient(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
}
