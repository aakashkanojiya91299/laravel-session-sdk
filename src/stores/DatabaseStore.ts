import { Pool, createPool, RowDataPacket } from 'mysql2/promise';
import { StoreInterface } from './StoreInterface';
import { SessionRecord, LaravelUser, LaravelSessionConfig } from '../types';

export class DatabaseStore implements StoreInterface {
  private pool: Pool;
  private sessionTable: string;
  private appKey?: string;
  private permissionsKey?: string | string[];
  private debug: boolean;

  constructor(
    config: LaravelSessionConfig['database'], 
    sessionTable = 'sessions',
    appKey?: string,
    permissionsKey?: string | string[],
    debug: boolean = false
  ) {
    if (!config) {
      throw new Error('Database configuration is required');
    }

    this.sessionTable = sessionTable;
    this.appKey = appKey;
    this.permissionsKey = permissionsKey;
    this.debug = debug;
    
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

  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[DatabaseStore]', ...args);
    }
  }

  private logError(...args: any[]): void {
    if (this.debug) {
      console.error('[DatabaseStore]', ...args);
    }
  }

  async getSession(sessionId: string): Promise<SessionRecord | null> {
    try {
      this.log('🔍 Fetching session from database...');
      this.log('📋 Table:', this.sessionTable);
      this.log('🆔 Session ID:', sessionId);
      
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${this.sessionTable} WHERE id = ? LIMIT 1`,
        [sessionId]
      );

      if (rows.length === 0) {
        this.log('❌ Session not found in table:', this.sessionTable);
        this.log('💡 Checking if table exists and has data...');
        
        // Check table existence and count
        try {
          const [countRows] = await this.pool.execute<RowDataPacket[]>(
            `SELECT COUNT(*) as total FROM ${this.sessionTable}`
          );
          this.log('📊 Total sessions in table:', (countRows[0] as any).total);
        } catch (tableError: any) {
          this.log('❌ Table error:', tableError.message);
        }
        
        return null;
      }

      this.log('✅ Session found');
      this.log('👤 User ID:', rows[0].user_id);
      this.log('📦 Payload length:', rows[0].payload?.length || 0);
      
      return rows[0] as SessionRecord;
    } catch (error: any) {
      this.logError('❌ Failed to get session:', error.message);
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
      this.log('🔍 Fetching permissions from session for user:', userId);
      
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
        this.log('⚠️  No active session found for user:', userId);
        return null;
      }

      const session = rows[0] as any;
      this.log('✅ Found session for user, decoding payload...');

      // Import SessionDecoder here to avoid circular dependency
      const { SessionDecoder } = await import('../decoders/SessionDecoder');
      const decoder = new SessionDecoder(this.appKey, this.permissionsKey, this.debug);

      // Decode the session payload
      const sessionData = decoder.decode(session.payload);
      
      if (!sessionData) {
        this.log('❌ Failed to decode session payload');
        return null;
      }

      this.log('✅ Session decoded, extracting permissions...');

      // Extract permissions from decoded session data
      const permissions = decoder.getPermissions(sessionData);

      if (permissions) {
        this.log('✅ Permissions extracted from session payload');
        this.log('📋 Role:', permissions.role);
        this.log('📋 Modules:', permissions.modules?.length || 0);
        this.log('📋 Links:', permissions.links?.length || 0);
        return permissions;
      }

      // Fallback: If no permissions in session, fetch all permissions from database tables
      this.log('⚠️  No permissions found in session payload');
      this.log('🔄 Fetching all permissions from database as fallback...');

      return await this.getAllPermissionsFromDatabase(userId);
    } catch (error: any) {
      this.logError('❌ Failed to get user permissions from session:', error.message);
      this.logError('❌ Full error:', error);
      throw new Error(`Failed to get user permissions: ${error.message}`);
    }
  }

  /**
   * Fetch all permissions from database tables (fallback method)
   */
  private async getAllPermissionsFromDatabase(userId: number): Promise<any> {
    try {
      this.log('📊 Fetching all permissions from database tables...');
      
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
      
      this.log('👤 User roles:', roleArr);

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
      this.log('📋 User modules:', modules.length);

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
      this.log('🔗 User links:', links.length);

      const permissions = {
        role,
        role_arr: roleArr,
        modules,
        links,
      };

      this.log('✅ All permissions fetched from database');
      
      return permissions;
    } catch (error: any) {
      this.logError('❌ Failed to get permissions from database:', error.message);
      throw new Error(`Failed to get permissions from database: ${error.message}`);
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
