import { Pool, createPool, RowDataPacket } from 'mysql2/promise';
import { StoreInterface } from './StoreInterface';
import { SessionRecord, LaravelUser, LaravelSessionConfig } from '../types';

export class DatabaseStore implements StoreInterface {
  private pool: Pool;
  private sessionTable: string;
  private appKey?: string;
  private permissionsKey?: string | string[];

  constructor(
    config: LaravelSessionConfig['database'], 
    sessionTable = 'sessions',
    appKey?: string,
    permissionsKey?: string | string[]
  ) {
    if (!config) {
      throw new Error('Database configuration is required');
    }

    this.sessionTable = sessionTable;
    this.appKey = appKey;
    this.permissionsKey = permissionsKey;
    
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
      console.log('[DatabaseStore] 🔍 Fetching session from database...');
      console.log('[DatabaseStore] 📋 Table:', this.sessionTable);
      console.log('[DatabaseStore] 🆔 Session ID:', sessionId);
      
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${this.sessionTable} WHERE id = ? LIMIT 1`,
        [sessionId]
      );

      if (rows.length === 0) {
        console.log('[DatabaseStore] ❌ Session not found in table:', this.sessionTable);
        console.log('[DatabaseStore] 💡 Checking if table exists and has data...');
        
        // Check table existence and count
        try {
          const [countRows] = await this.pool.execute<RowDataPacket[]>(
            `SELECT COUNT(*) as total FROM ${this.sessionTable}`
          );
          console.log('[DatabaseStore] 📊 Total sessions in table:', (countRows[0] as any).total);
        } catch (tableError: any) {
          console.log('[DatabaseStore] ❌ Table error:', tableError.message);
        }
        
        return null;
      }

      console.log('[DatabaseStore] ✅ Session found');
      console.log('[DatabaseStore] 👤 User ID:', rows[0].user_id);
      console.log('[DatabaseStore] 📦 Payload length:', rows[0].payload?.length || 0);
      
      return rows[0] as SessionRecord;
    } catch (error: any) {
      console.error('[DatabaseStore] ❌ Failed to get session:', error.message);
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
      // Get role from the user's session payload instead of separate tables
      const permissions = await this.getUserPermissions(userId);
      return permissions?.role || null;
    } catch (error: any) {
      throw new Error(`Failed to get user role: ${error.message}`);
    }
  }

  async getUserPermissions(userId: number): Promise<any> {
    try {
      console.log('[DatabaseStore] 🔍 Fetching permissions from session for user:', userId);
      
      // Find the user's active session by looking for login_web_* in payload
      // We need to search for sessions that contain this user's ID
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        `SELECT payload, last_activity 
         FROM ${this.sessionTable}
         WHERE user_id = ?
         ORDER BY last_activity DESC
         LIMIT 1`,
        [userId]
      );

      if (rows.length === 0) {
        console.log('[DatabaseStore] ⚠️  No active session found for user:', userId);
        return null;
      }

      const session = rows[0] as any;
      console.log('[DatabaseStore] ✅ Found session for user, decoding payload...');

      // Import SessionDecoder here to avoid circular dependency
      const { SessionDecoder } = await import('../decoders/SessionDecoder');
      const decoder = new SessionDecoder(this.appKey, this.permissionsKey);

      // Decode the session payload
      const sessionData = decoder.decode(session.payload);
      
      if (!sessionData) {
        console.log('[DatabaseStore] ❌ Failed to decode session payload');
        return null;
      }

      console.log('[DatabaseStore] ✅ Session decoded, extracting permissions...');

      // Extract permissions from decoded session data
      const permissions = decoder.getPermissions(sessionData);

      if (permissions) {
        console.log('[DatabaseStore] ✅ Permissions extracted from session payload');
        console.log('[DatabaseStore] 📋 Role:', permissions.role);
        console.log('[DatabaseStore] 📋 Modules:', permissions.modules?.length || 0);
        console.log('[DatabaseStore] 📋 Links:', permissions.links?.length || 0);
        return permissions;
      }

      // Fallback: If no permissions in session, fetch all permissions from database tables
      console.log('[DatabaseStore] ⚠️  No permissions found in session payload');
      console.log('[DatabaseStore] 🔄 Fetching all permissions from database as fallback...');

      return await this.getAllPermissionsFromDatabase(userId);
    } catch (error: any) {
      console.error('[DatabaseStore] ❌ Failed to get user permissions from session:', error.message);
      console.error('[DatabaseStore] ❌ Full error:', error);
      throw new Error(`Failed to get user permissions: ${error.message}`);
    }
  }

  /**
   * Fetch all permissions from database tables (fallback method)
   */
  private async getAllPermissionsFromDatabase(userId: number): Promise<any> {
    try {
      console.log('[DatabaseStore] 📊 Fetching all permissions from database tables...');
      
      // Get all roles for the user
      const [roleRows] = await this.pool.execute<RowDataPacket[]>(
        `SELECT r.id, r.role_name
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
         WHERE ur.user_id = ?`,
        [userId]
      );

      const roles = roleRows as any[];
      const roleArr = roles.map(r => r.role_name);
      const role = roleArr.length > 0 ? roleArr[0] : null;
      
      console.log('[DatabaseStore] 👤 User roles:', roleArr);

      // Get modules (permissions) for the user
      const [moduleRows] = await this.pool.execute<RowDataPacket[]>(
        `SELECT DISTINCT m.id, m.module_name as name, m.url
         FROM module_permissions mp
         JOIN modules m ON m.id = mp.module_id
         JOIN user_roles ur ON ur.role_id = mp.role_id
         WHERE ur.user_id = ? AND m.deleted_at IS NULL AND mp.deleted_at IS NULL`,
        [userId]
      );

      const modules = moduleRows as any[];
      console.log('[DatabaseStore] 📋 User modules:', modules.length);

      // Get links (sub-permissions) for the user
      const [linkRows] = await this.pool.execute<RowDataPacket[]>(
        `SELECT DISTINCT l.id, l.link_name as name, l.permission_module_id, l.url
         FROM link_permissions lp
         JOIN links l ON l.id = lp.link_id
         JOIN user_roles ur ON ur.role_id = lp.role_id
         WHERE ur.user_id = ? AND l.deleted_at IS NULL AND lp.deleted_at IS NULL`,
        [userId]
      );

      const links = linkRows as any[];
      console.log('[DatabaseStore] 🔗 User links:', links.length);

      const permissions = {
        role,
        role_arr: roleArr,
        modules,
        links,
      };

      console.log('[DatabaseStore] ✅ All permissions fetched from database');
      
      return permissions;
    } catch (error: any) {
      console.error('[DatabaseStore] ❌ Failed to get permissions from database:', error.message);
      throw new Error(`Failed to get permissions from database: ${error.message}`);
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
