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

  constructor(config: LaravelSessionConfig) {
    this.config = config;

    // Initialize decoder
    this.decoder = new SessionDecoder(config.appKey);

    // Initialize store based on driver
    if (config.session.driver === 'database') {
      if (!config.database) {
        throw new Error('Database configuration is required for database session driver');
      }
      this.store = new DatabaseStore(config.database, config.session.table || 'sessions');
    } else {
      throw new Error(`Unsupported session driver: ${config.session.driver}. Only 'database' driver is supported in this build.`);
    }

    // Initialize validator
    this.validator = new SessionValidator(this.decoder, this.store, config);
  }

  /**
   * Validate a Laravel session
   */
  async validateSession(sessionId: string): Promise<SessionValidationResult> {
    console.log('[LaravelSessionClient] 🔐 Original cookie value (first 50 chars):', sessionId.substring(0, 50) + '...');
    console.log('[LaravelSessionClient] 🔐 Cookie value length:', sessionId.length);

    // Decrypt session ID if appKey is configured (for encrypted cookies)
    let decryptedSessionId = sessionId;

    if (this.config.appKey) {
      try {
        console.log('[LaravelSessionClient] 🔑 Attempting to decrypt cookie with APP_KEY');
        const decrypted = this.decoder.decrypt(sessionId);
        if (decrypted) {
          console.log('[LaravelSessionClient] ✅ Successfully decrypted cookie');
          console.log('[LaravelSessionClient] 🔓 Decrypted value:', decrypted);
          console.log('[LaravelSessionClient] 🔓 Decrypted value length:', decrypted.length);

          decryptedSessionId = decrypted;

          // If the decrypted value contains a pipe (|), it's in "hash|sessionId" format
          // Extract the second part which is the actual session ID
          if (decryptedSessionId.includes('|')) {
            const parts = decryptedSessionId.split('|');
            console.log('[LaravelSessionClient] 🔀 Detected pipe separator in decrypted value');
            console.log('[LaravelSessionClient] 🔀 Parts:', parts);
            console.log('[LaravelSessionClient] 🔀 Using second part as session ID:', parts[1]);
            decryptedSessionId = parts[1];
          }
        }
      } catch (error: any) {
        // If decryption fails, try using the sessionId as-is (might not be encrypted)
        console.error('[LaravelSessionClient] ❌ Session ID decryption failed:', error.message);
        console.error('[LaravelSessionClient] ❌ Full error:', error);
        console.log('[LaravelSessionClient] ⚠️  Using original cookie value as session ID');
      }
    } else {
      console.log('[LaravelSessionClient] ⚠️  No APP_KEY configured, using cookie value as-is');
    }

    console.log('[LaravelSessionClient] 🎯 Final session ID to validate:', decryptedSessionId);

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
