import { createClient, RedisClientType } from 'redis';
import { StoreInterface } from './StoreInterface';
import { SessionRecord, LaravelUser, LaravelSessionConfig } from '../types';
import { DatabaseStore } from './DatabaseStore';
import { sanitizeSessionId, sanitizeError } from '../utils/SecurityUtils';

export class RedisStore implements StoreInterface {
  private client: RedisClientType;
  private prefix: string;
  private dbStore: DatabaseStore;
  private connected: boolean = false;
  private debug: boolean;

  constructor(
    redisConfig: LaravelSessionConfig['redis'],
    dbConfig: LaravelSessionConfig['database'],
    prefix = 'laravel_session:',
    sessionTable = 'sessions',
    appKey?: string,
    permissionsKey?: string | string[],
    debug: boolean = false
  ) {
    if (!redisConfig) {
      throw new Error('Redis configuration is required');
    }

    this.prefix = prefix;
    this.debug = debug;
    this.client = createClient({
      socket: {
        host: redisConfig.host,
        port: redisConfig.port || 6379,
      },
      password: redisConfig.password,
      database: redisConfig.db || 0,
    });

    // Database store for user/role queries and permissions
    this.dbStore = new DatabaseStore(dbConfig, sessionTable, appKey, permissionsKey, debug);
  }

  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[RedisStore]', ...args);
    }
  }

  private logError(...args: any[]): void {
    if (this.debug) {
      console.error('[RedisStore]', ...args);
    }
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connected) {
      await this.client.connect();
      this.connected = true;
    }
  }

  async getSession(sessionId: string): Promise<SessionRecord | null> {
    try {
      await this.ensureConnected();

      const key = `${this.prefix}${sessionId}`;
      this.log('🔍 Fetching session from Redis...');
      this.log('📋 Key prefix:', this.prefix);
      this.log('🆔 Session ID:', sanitizeSessionId(sessionId));
      
      const payload = await this.client.get(key);

      if (!payload) {
        this.log('❌ Session not found in Redis');
        return null;
      }

      this.log('✅ Session found in Redis');
      this.log('📦 Payload length:', payload.length);

      return {
        id: sessionId,
        user_id: null, // Redis doesn't store this separately - extracted from payload
        ip_address: null,
        user_agent: null,
        payload: payload,
        last_activity: Math.floor(Date.now() / 1000),
      };
    } catch (error: any) {
      this.logError('❌ Failed to get session from Redis:', sanitizeError(error));
      throw new Error(`Failed to get session from Redis: ${sanitizeError(error)}`);
    }
  }

  async getUser(userId: number): Promise<LaravelUser | null> {
    return this.dbStore.getUser(userId);
  }

  async getUserRole(userId: number): Promise<string | null> {
    return this.dbStore.getUserRole(userId);
  }

  async getUserPermissions(userId: number): Promise<any> {
    return this.dbStore.getUserPermissions(userId);
  }

  async close(): Promise<void> {
    if (this.connected) {
      await this.client.quit();
      this.connected = false;
    }
    await this.dbStore.close();
  }
}
