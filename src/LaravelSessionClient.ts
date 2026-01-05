import { SessionDecoder } from './decoders/SessionDecoder';
import { DatabaseStore } from './stores/DatabaseStore';
// import { RedisStore } from './stores/RedisStore'; // Disabled - not needed for database driver
import { SessionValidator } from './validators/SessionValidator';
import { StoreInterface } from './stores/StoreInterface';
import { LaravelSessionConfig, SessionValidationResult } from './types';

export class LaravelSessionClient {
  private decoder: SessionDecoder;
  private store: StoreInterface;
  private validator: SessionValidator;
  private config: LaravelSessionConfig;
  private debug: boolean;

  constructor(config: LaravelSessionConfig) {
    this.config = config;
    this.debug = config.debug || false;

    // Initialize decoder with optional custom permissions key and debug flag
    this.decoder = new SessionDecoder(config.appKey, config.permissionsKey, this.debug);

    // Initialize store based on driver
    if (config.session.driver === 'database') {
      if (!config.database) {
        throw new Error('Database configuration is required for database session driver');
      }
      this.store = new DatabaseStore(
        config.database, 
        config.session.table || 'sessions',
        config.appKey,
        config.permissionsKey,
        this.debug
      );
    } else {
      throw new Error(`Unsupported session driver: ${config.session.driver}. Only 'database' driver is supported in this build.`);
    }

    // Initialize validator
    this.validator = new SessionValidator(this.decoder, this.store, config);
  }

  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[LaravelSessionClient]', ...args);
    }
  }

  private logError(...args: any[]): void {
    if (this.debug) {
      console.error('[LaravelSessionClient]', ...args);
    }
  }

  /**
   * Validate a Laravel session
   */
  async validateSession(sessionId: string): Promise<SessionValidationResult> {
    this.log('🔐 Original cookie value (first 50 chars):', sessionId.substring(0, 50) + '...');
    this.log('🔐 Cookie value length:', sessionId.length);

    // Decrypt session ID if appKey is configured (for encrypted cookies)
    let decryptedSessionId = sessionId;

    if (this.config.appKey) {
      try {
        this.log('🔑 Attempting to decrypt cookie with APP_KEY');
        const decrypted = this.decoder.decrypt(sessionId);
        if (decrypted) {
          this.log('✅ Successfully decrypted cookie');
          this.log('🔓 Decrypted value:', decrypted);
          this.log('🔓 Decrypted value length:', decrypted.length);

          decryptedSessionId = decrypted;

          // If the decrypted value contains a pipe (|), it's in "hash|sessionId" format
          // Extract the second part which is the actual session ID
          if (decryptedSessionId.includes('|')) {
            const parts = decryptedSessionId.split('|');
            this.log('🔀 Detected pipe separator in decrypted value');
            this.log('🔀 Parts:', parts);
            this.log('🔀 Using second part as session ID:', parts[1]);
            decryptedSessionId = parts[1];
          }
        }
      } catch (error: any) {
        // If decryption fails, try using the sessionId as-is (might not be encrypted)
        this.logError('❌ Session ID decryption failed:', error.message);
        this.logError('❌ Full error:', error);
        this.log('⚠️  Using original cookie value as session ID');
      }
    } else {
      this.log('⚠️  No APP_KEY configured, using cookie value as-is');
    }

    this.log('🎯 Final session ID to validate:', decryptedSessionId);

    return this.validator.validate(decryptedSessionId);
  }

  /**
   * Get session cookie name
   */
  getSessionCookieName(): string {
    return this.config.session.cookieName || 'laravel_session';
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    await this.store.close();
  }
}
