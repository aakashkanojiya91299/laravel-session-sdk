import { SessionDecoder } from '../decoders/SessionDecoder';
import { StoreInterface } from '../stores/StoreInterface';
import { SessionValidationResult, LaravelSessionConfig } from '../types';
import { sanitizeSessionId, sanitizeError, shouldSanitize } from '../utils/SecurityUtils';

export class SessionValidator {
  private decoder: SessionDecoder;
  private store: StoreInterface;
  private sessionLifetime: number;
  private debug: boolean;

  constructor(decoder: SessionDecoder, store: StoreInterface, config: LaravelSessionConfig) {
    this.decoder = decoder;
    this.store = store;
    this.sessionLifetime = config.session.lifetime || 1000;
    this.debug = config.debug || false;
  }

  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[LaravelSessionSDK]', ...args);
    }
  }

  async validate(sessionId: string): Promise<SessionValidationResult> {
    // Step 1: Validate session ID
    if (!sessionId) {
      return {
        valid: false,
        error: 'No session ID provided',
      };
    }

    this.log('🔍 Validating session:', sanitizeSessionId(sessionId));

    // Step 2: Get session from store
    const session = await this.store.getSession(sessionId);

    if (!session) {
      this.log('❌ Session not found in store');
      return {
        valid: false,
        error: 'Session not found',
      };
    }

    this.log('✅ Session found in store');
    this.log('   User ID:', session.user_id);
    this.log('   Last activity:', new Date(session.last_activity * 1000).toISOString());

    // Step 3: Check if session is expired
    const lastActivity = session.last_activity;
    const lifetimeSeconds = this.sessionLifetime * 60;
    const currentTime = Math.floor(Date.now() / 1000);

    if (currentTime - lastActivity > lifetimeSeconds) {
      this.log('❌ Session expired');
      return {
        valid: false,
        error: 'Session expired',
      };
    }

    this.log('✅ Session not expired');

    // Step 4: Decode session payload
    let sessionData;
    try {
      sessionData = this.decoder.decode(session.payload);
    } catch (error: any) {
      this.log('❌ Failed to decode session:', error.message);
      return {
        valid: false,
        error: 'Failed to decode session',
      };
    }

    if (!sessionData) {
      return {
        valid: false,
        error: 'Failed to decode session payload',
      };
    }

    this.log('✅ Session payload decoded');
    if (shouldSanitize()) {
      const sanitizedKeys = Object.keys(sessionData).filter(key => !key.toLowerCase().includes('token') && !key.toLowerCase().includes('password'));
      this.log('   Session keys (sanitized):', sanitizedKeys.length, 'keys');
    } else {
      this.log('   Session keys:', Object.keys(sessionData));
      this.log('   Full session data:', JSON.stringify(sessionData, null, 2));
    }

    // Step 5: Get user ID from session
    const userId = this.decoder.getUserId(sessionData);

    if (!userId) {
      this.log('❌ User not authenticated');
      return {
        valid: false,
        error: 'User not authenticated',
      };
    }

    if (shouldSanitize()) {
      this.log('✅ User authenticated');
    } else {
      this.log('✅ User authenticated, ID:', userId);
    }

    // Step 6: Get user from database
    const user = await this.store.getUser(userId);

    if (!user) {
      this.log('❌ User not found or deleted');
      return {
        valid: false,
        error: 'User not found or deleted',
      };
    }

    this.log('✅ User found in database');

    // Step 7: Get user role
    const role = await this.store.getUserRole(userId);

    this.log('✅ User role:', role);

    // Step 8: Check single session enforcement for Shooters
    if (role === 'Shooter' && user.session_id) {
      if (user.session_id !== sessionId) {
        this.log('❌ Shooter single session check failed');
        this.log('   Session mismatch detected');
        return {
          valid: false,
          error: 'Session invalidated. You were logged in elsewhere.',
          reason: 'shooter_single_session',
        };
      }
      this.log('✅ Shooter single session check passed');
    }

    // Step 9: Check 2FA verification (if required)
    if (user.google2fa_enable === 1) {
      const is2FAVerified = this.decoder.is2FAVerified(sessionData);
      if (!is2FAVerified) {
        this.log('❌ 2FA verification required');
        return {
          valid: false,
          error: '2FA verification required',
          reason: '2fa_required',
        };
      }
      this.log('✅ 2FA verified');
    }

    // Step 10: Get permissions from session payload first, then fall back to database
    this.log('🔍 Step 10: Getting permissions...');
    let permissions = this.decoder.getPermissions(sessionData);
    
    // If permissions not in session payload, fetch from database
    if (!permissions) {
      this.log('⚠️  Permissions not found in session payload, fetching from database...');
      try {
        permissions = await this.store.getUserPermissions(userId);
        this.log('✅ Permissions fetched from database successfully');
      } catch (error: any) {
        this.log('❌ Failed to fetch permissions from database:', sanitizeError(error));
        // Continue without permissions - let the app decide if this is critical
        permissions = null;
      }
    } else {
      this.log('✅ Permissions found in session payload');
      if (!shouldSanitize()) {
        this.log('📄 Session permissions:', JSON.stringify(permissions, null, 2));
      }
    }

    this.log('🎉 Session validation successful!');
    if (!shouldSanitize()) {
      this.log('Final permissions object:', permissions);
    }

    // Return validated session data
    return {
      valid: true,
      user: user,
      role: role || undefined,
      permissions: permissions,
      sessionId: sessionId,
      csrfToken: this.decoder.getCsrfToken(sessionData) || undefined,
    };
  }
}
