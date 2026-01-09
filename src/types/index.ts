export interface LaravelSessionConfig {
  /**
   * Database configuration
   */
  database?: {
    type: 'mysql' | 'postgres';
    host: string;
    port?: number;
    user: string;
    password: string;
    database: string;
    connectionLimit?: number;
  };

  /**
   * Redis configuration
   */
  redis?: {
    host: string;
    port?: number;
    password?: string;
    db?: number;
  };

  /**
   * Session configuration
   */
  session: {
    driver: 'database' | 'redis' | 'file';
    table?: string; // For database driver
    lifetime?: number; // In minutes
    cookieName?: string;
    prefix?: string; // For Redis driver
  };

  /**
   * Laravel APP_KEY (for encrypted sessions)
   */
  appKey?: string;

  /**
   * Enable debug logging
   */
  debug?: boolean;

  /**
   * Log verbosity level
   * - 'secure' (default): Sanitized logs, no sensitive data exposed (recommended for production)
   * - 'verbose': Full logs with sensitive data (use only in secure development environments)
   * 
   * @default 'secure'
   */
  logLevel?: 'secure' | 'verbose';

  /**
   * Custom permissions key(s) in session
   * Can be a single string or array of strings for multiple keys
   * If not specified, will check common keys: 'permissions', 'user_permissions', etc.
   * Examples: 'permissions', ['permissions', 'competitionIds', 'competitionsData']
   * Supports dot notation: 'user.permissions', 'auth.permissions'
   */
  permissionsKey?: string | string[];
}

export interface SessionData {
  [key: string]: any;
}

export interface LaravelUser {
  id: number;
  email: string;
  name?: string;
  session_id?: string | null;
  google2fa_enable?: number;
  [key: string]: any;
}

export interface SessionValidationResult {
  valid: boolean;
  user?: LaravelUser;
  role?: string;
  permissions?: any;
  sessionId?: string;
  csrfToken?: string;
  error?: string;
  reason?: string;
}

export interface StoreInterface {
  getSession(sessionId: string): Promise<SessionRecord | null>;
  getUser(userId: number): Promise<LaravelUser | null>;
  getUserRole(userId: number): Promise<string | null>;
  close(): Promise<void>;
}

export interface SessionRecord {
  id: string;
  user_id: number | null;
  ip_address: string | null;
  user_agent: string | null;
  payload: string;
  last_activity: number;
}

export interface DecryptionOptions {
  cipher?: string;
}
