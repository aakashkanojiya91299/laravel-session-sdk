import { Pool, createPool, RowDataPacket } from 'mysql2/promise';
import { StoreInterface } from './StoreInterface';
import { SessionRecord, LaravelUser, LaravelSessionConfig } from '../types';

export class DatabaseStore implements StoreInterface {
  private pool: Pool;
  private sessionTable: string;

  constructor(config: LaravelSessionConfig['database'], sessionTable = 'sessions') {
    if (!config) {
      throw new Error('Database configuration is required');
    }

    this.sessionTable = sessionTable;
    this.pool = createPool({
      host: config.host,
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: config.connectionLimit || 10,
      queueLimit: 0,
    });
  }

  async getSession(sessionId: string): Promise<SessionRecord | null> {
    try {
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${this.sessionTable} WHERE id = ? LIMIT 1`,
        [sessionId]
      );

      return rows.length > 0 ? (rows[0] as SessionRecord) : null;
    } catch (error: any) {
      throw new Error(`Failed to get session: ${error.message}`);
    }
  }

  async getUser(userId: number): Promise<LaravelUser | null> {
    try {
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        `SELECT
          id,
          email,
          CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', COALESCE(last_name, '')) as name,
          first_name,
          middle_name,
          last_name,
          google2fa_enable,
          created_at,
          updated_at
        FROM users
        WHERE id = ? AND deleted_at IS NULL
        LIMIT 1`,
        [userId]
      );

      return rows.length > 0 ? (rows[0] as LaravelUser) : null;
    } catch (error: any) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  async getUserRole(userId: number): Promise<string | null> {
    try {
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        `SELECT r.role_name
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
         WHERE ur.user_id = ?
         LIMIT 1`,
        [userId]
      );

      return rows.length > 0 ? (rows[0] as any).role_name : null;
    } catch (error: any) {
      throw new Error(`Failed to get user role: ${error.message}`);
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
