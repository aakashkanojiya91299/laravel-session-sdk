import { PhpSerializer } from './PhpSerializer';
import { SessionData } from '../types';
import * as crypto from 'crypto';

export class SessionDecoder {
  private appKey?: Buffer;
  private permissionsKey?: string | string[];
  private debug: boolean;

  constructor(appKey?: string, permissionsKey?: string | string[], debug: boolean = false) {
    if (appKey) {
      // Remove 'base64:' prefix if present
      const key = appKey.replace(/^base64:/, '');
      this.appKey = Buffer.from(key, 'base64');
    }
    this.permissionsKey = permissionsKey;
    this.debug = debug;
  }

  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[SessionDecoder]', ...args);
    }
  }

  private logError(...args: any[]): void {
    if (this.debug) {
      console.error('[SessionDecoder]', ...args);
    }
  }

  /**
   * Decode base64 and unserialize session payload
   */
  decode(payload: string): SessionData | null {
    try {
      this.log('🔓 Decoding session payload...');
      this.log('📦 Payload length:', payload.length);
      this.log('📦 Payload (first 100 chars):', payload.substring(0, 100) + '...');
      
      // Step 1: Base64 decode
      const decoded = Buffer.from(payload, 'base64').toString('utf-8');
      this.log('✅ Base64 decoded, length:', decoded.length);
      this.log('📄 Decoded (first 200 chars):', decoded.substring(0, 200) + '...');

      // Step 2: Unserialize PHP format (stdClass support is built-in)
      const unserialized = PhpSerializer.unserialize(decoded);
      this.log('✅ PHP unserialized successfully');
      this.log('🔑 Session keys:', Object.keys(unserialized));

      return unserialized;
    } catch (error: any) {
      this.logError('❌ Session decode failed:', error.message);
      this.logError('❌ Full error:', error);
      throw new Error(`Session decode failed: ${error.message}`);
    }
  }

  /**
   * Decrypt encrypted session payload (for encrypted sessions)
   */
  decrypt(encryptedPayload: string): string | null {
    if (!this.appKey) {
      throw new Error('APP_KEY is required for encrypted sessions');
    }

    try {
      this.log('📦 Parsing encrypted payload...');
      const payload = JSON.parse(Buffer.from(encryptedPayload, 'base64').toString());
      this.log('📦 Payload keys:', Object.keys(payload));

      const iv = Buffer.from(payload.iv, 'base64');
      const value = Buffer.from(payload.value, 'base64');
      const mac = payload.mac;

      // Verify MAC - Laravel concatenates IV and value strings (base64), not binary
      this.log('🔐 Verifying MAC...');
      const calculatedMac = crypto
        .createHmac('sha256', this.appKey)
        .update(payload.iv + payload.value)  // Concatenate base64 strings, not decoded buffers
        .digest('hex');

      this.log('🔐 Expected MAC:', mac);
      this.log('🔐 Calculated MAC:', calculatedMac);

      if (calculatedMac !== mac) {
        throw new Error('MAC verification failed - calculated MAC does not match');
      }

      this.log('✅ MAC verified successfully');

      // Decrypt
      this.log('🔓 Decrypting value...');
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.appKey, iv);
      let decrypted = decipher.update(value);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      // The decrypted value might be PHP serialized, try to return as string
      const result = decrypted.toString();
      this.log('🔓 Decrypted result:', result);

      // Check if result is PHP serialized (starts with s: for string serialization)
      // If it's PHP serialized, we need to unserialize it
      if (result.startsWith('s:')) {
        this.log('🔍 Detected PHP serialized string');
        // Extract the actual string value from PHP serialization
        // Format: s:length:"value";
        const match = result.match(/s:\d+:"(.*)";/);
        if (match && match[1]) {
          this.log('✅ Extracted:', match[1]);
          return match[1];
        }
      }

      return result;
    } catch (error: any) {
      this.logError('❌ Decryption error:', error.message);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Get authenticated user ID from session data
   */
  getUserId(sessionData: SessionData): number | null {
    this.log('🔍 Looking for user ID in session...');
    
    // Find Laravel's auth key (login_web_{hash})
    const authKey = Object.keys(sessionData).find(key => key.startsWith('login_web_'));

    if (!authKey) {
      this.log('❌ No auth key found (login_web_*)');
      this.log('📋 Available keys:', Object.keys(sessionData));
      return null;
    }

    this.log('✅ Found auth key:', authKey);
    this.log('👤 User ID:', sessionData[authKey]);
    
    return sessionData[authKey];
  }

  /**
   * Get CSRF token from session data
   */
  getCsrfToken(sessionData: SessionData): string | null {
    return sessionData._token || null;
  }

  /**
   * Get permissions from session data
   * Supports single key or multiple keys (array)
   */
  getPermissions(sessionData: SessionData): any {
    this.log('🔍 Looking for permissions in session payload...');
    this.log('📋 Session keys:', Object.keys(sessionData));
    
    // If user specified custom permissions key(s), use them
    if (this.permissionsKey) {
      const keys = Array.isArray(this.permissionsKey) ? this.permissionsKey : [this.permissionsKey];
      this.log(`🔧 Using custom permissions key(s): ${JSON.stringify(keys)}`);
      
      const result: any = {};
      let foundAny = false;
      
      for (const key of keys) {
        const value = this.getNestedValue(sessionData, key);
        if (value !== undefined && value !== null) {
          this.log(`✅ Found data for key: "${key}"`);
          result[key] = value;
          foundAny = true;
        } else {
          this.log(`⚠️  Key "${key}" not found in session`);
        }
      }
      
      if (foundAny) {
        // If single key, return the value directly (backward compatible)
        // If multiple keys, return object with all keys
        if (keys.length === 1 && result[keys[0]] !== undefined) {
          this.log('📄 Permissions data:', JSON.stringify(result[keys[0]], null, 2));
          return result[keys[0]];
        } else {
          this.log('📄 Multiple permissions data:', JSON.stringify(result, null, 2));
          return result;
        }
      }
    }
    
    // Otherwise, check common Laravel permission storage keys
    this.log('🔍 Checking common permission keys...');
    const permissionKeys = [
      'permissions',           // Standard key
      'user_permissions',      // Alternative
      'auth_permissions',      // Another common pattern
      'laravel_permissions',   // Laravel-specific
      'role_permissions',      // Role-based
      'access_permissions',    // Access control
    ];
    
    // First, try direct permission keys
    for (const key of permissionKeys) {
      if (sessionData[key]) {
        this.log(`✅ Found permissions in session key: ${key}`);
        this.log('📄 Permissions data:', JSON.stringify(sessionData[key], null, 2));
        return sessionData[key];
      }
    }
    
    // Check if permissions are stored in user object
    if (sessionData.user && typeof sessionData.user === 'object') {
      if (sessionData.user.permissions) {
        this.log('✅ Found permissions in user.permissions');
        this.log('📄 Permissions data:', JSON.stringify(sessionData.user.permissions, null, 2));
        return sessionData.user.permissions;
      }
    }
    
    // Check if there's an auth object with permissions
    if (sessionData.auth && typeof sessionData.auth === 'object') {
      if (sessionData.auth.permissions) {
        this.log('✅ Found permissions in auth.permissions');
        this.log('📄 Permissions data:', JSON.stringify(sessionData.auth.permissions, null, 2));
        return sessionData.auth.permissions;
      }
    }
    
    this.log('⚠️  No permissions found in session payload');
    this.log('📋 Full session data for debugging:', JSON.stringify(sessionData, null, 2));
    return null;
  }

  /**
   * Helper method to get nested values using dot notation
   * Supports keys like 'user.permissions' or 'auth.permissions'
   */
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let value: any = obj;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return null;
      }
    }
    
    return value;
  }

  /**
   * Check if 2FA is verified
   */
  is2FAVerified(sessionData: SessionData): boolean {
    return sessionData['2faVerify'] === 'true';
  }

  /**
   * Get any custom session data
   */
  getSessionValue(sessionData: SessionData, key: string): any {
    return sessionData[key] || null;
  }
}
