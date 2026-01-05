import { PhpSerializer } from './PhpSerializer';
import { SessionData } from '../types';
import * as crypto from 'crypto';

export class SessionDecoder {
  private appKey?: Buffer;
  private permissionsKey?: string | string[];

  constructor(appKey?: string, permissionsKey?: string | string[]) {
    if (appKey) {
      // Remove 'base64:' prefix if present
      const key = appKey.replace(/^base64:/, '');
      this.appKey = Buffer.from(key, 'base64');
    }
    this.permissionsKey = permissionsKey;
  }

  /**
   * Decode base64 and unserialize session payload
   */
  decode(payload: string): SessionData | null {
    try {
      console.log('[SessionDecoder] 🔓 Decoding session payload...');
      console.log('[SessionDecoder] 📦 Payload length:', payload.length);
      console.log('[SessionDecoder] 📦 Payload (first 100 chars):', payload.substring(0, 100) + '...');
      
      // Step 1: Base64 decode
      const decoded = Buffer.from(payload, 'base64').toString('utf-8');
      console.log('[SessionDecoder] ✅ Base64 decoded, length:', decoded.length);
      console.log('[SessionDecoder] 📄 Decoded (first 200 chars):', decoded.substring(0, 200) + '...');

      // Step 2: Unserialize PHP format (stdClass support is built-in)
      const unserialized = PhpSerializer.unserialize(decoded);
      console.log('[SessionDecoder] ✅ PHP unserialized successfully');
      console.log('[SessionDecoder] 🔑 Session keys:', Object.keys(unserialized));

      return unserialized;
    } catch (error: any) {
      console.error('[SessionDecoder] ❌ Session decode failed:', error.message);
      console.error('[SessionDecoder] ❌ Full error:', error);
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
      console.log('[SessionDecoder] 📦 Parsing encrypted payload...');
      const payload = JSON.parse(Buffer.from(encryptedPayload, 'base64').toString());
      console.log('[SessionDecoder] 📦 Payload keys:', Object.keys(payload));

      const iv = Buffer.from(payload.iv, 'base64');
      const value = Buffer.from(payload.value, 'base64');
      const mac = payload.mac;

      // Verify MAC - Laravel concatenates IV and value strings (base64), not binary
      console.log('[SessionDecoder] 🔐 Verifying MAC...');
      const calculatedMac = crypto
        .createHmac('sha256', this.appKey)
        .update(payload.iv + payload.value)  // Concatenate base64 strings, not decoded buffers
        .digest('hex');

      console.log('[SessionDecoder] 🔐 Expected MAC:', mac);
      console.log('[SessionDecoder] 🔐 Calculated MAC:', calculatedMac);

      if (calculatedMac !== mac) {
        throw new Error('MAC verification failed - calculated MAC does not match');
      }

      console.log('[SessionDecoder] ✅ MAC verified successfully');

      // Decrypt
      console.log('[SessionDecoder] 🔓 Decrypting value...');
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.appKey, iv);
      let decrypted = decipher.update(value);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      // The decrypted value might be PHP serialized, try to return as string
      const result = decrypted.toString();
      console.log('[SessionDecoder] 🔓 Decrypted result:', result);

      // Check if result is PHP serialized (starts with s: for string serialization)
      // If it's PHP serialized, we need to unserialize it
      if (result.startsWith('s:')) {
        console.log('[SessionDecoder] 🔍 Detected PHP serialized string');
        // Extract the actual string value from PHP serialization
        // Format: s:length:"value";
        const match = result.match(/s:\d+:"(.*)";/);
        if (match && match[1]) {
          console.log('[SessionDecoder] ✅ Extracted:', match[1]);
          return match[1];
        }
      }

      return result;
    } catch (error: any) {
      console.error('[SessionDecoder] ❌ Decryption error:', error.message);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Get authenticated user ID from session data
   */
  getUserId(sessionData: SessionData): number | null {
    console.log('[SessionDecoder] 🔍 Looking for user ID in session...');
    
    // Find Laravel's auth key (login_web_{hash})
    const authKey = Object.keys(sessionData).find(key => key.startsWith('login_web_'));

    if (!authKey) {
      console.log('[SessionDecoder] ❌ No auth key found (login_web_*)');
      console.log('[SessionDecoder] 📋 Available keys:', Object.keys(sessionData));
      return null;
    }

    console.log('[SessionDecoder] ✅ Found auth key:', authKey);
    console.log('[SessionDecoder] 👤 User ID:', sessionData[authKey]);
    
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
    console.log('[SessionDecoder] 🔍 Looking for permissions in session payload...');
    console.log('[SessionDecoder] 📋 Session keys:', Object.keys(sessionData));
    
    // If user specified custom permissions key(s), use them
    if (this.permissionsKey) {
      const keys = Array.isArray(this.permissionsKey) ? this.permissionsKey : [this.permissionsKey];
      console.log(`[SessionDecoder] 🔧 Using custom permissions key(s): ${JSON.stringify(keys)}`);
      
      const result: any = {};
      let foundAny = false;
      
      for (const key of keys) {
        const value = this.getNestedValue(sessionData, key);
        if (value !== undefined && value !== null) {
          console.log(`[SessionDecoder] ✅ Found data for key: "${key}"`);
          result[key] = value;
          foundAny = true;
        } else {
          console.log(`[SessionDecoder] ⚠️  Key "${key}" not found in session`);
        }
      }
      
      if (foundAny) {
        // If single key, return the value directly (backward compatible)
        // If multiple keys, return object with all keys
        if (keys.length === 1 && result[keys[0]] !== undefined) {
          console.log('[SessionDecoder] 📄 Permissions data:', JSON.stringify(result[keys[0]], null, 2));
          return result[keys[0]];
        } else {
          console.log('[SessionDecoder] 📄 Multiple permissions data:', JSON.stringify(result, null, 2));
          return result;
        }
      }
    }
    
    // Otherwise, check common Laravel permission storage keys
    console.log('[SessionDecoder] 🔍 Checking common permission keys...');
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
        console.log(`[SessionDecoder] ✅ Found permissions in session key: ${key}`);
        console.log('[SessionDecoder] 📄 Permissions data:', JSON.stringify(sessionData[key], null, 2));
        return sessionData[key];
      }
    }
    
    // Check if permissions are stored in user object
    if (sessionData.user && typeof sessionData.user === 'object') {
      if (sessionData.user.permissions) {
        console.log('[SessionDecoder] ✅ Found permissions in user.permissions');
        console.log('[SessionDecoder] 📄 Permissions data:', JSON.stringify(sessionData.user.permissions, null, 2));
        return sessionData.user.permissions;
      }
    }
    
    // Check if there's an auth object with permissions
    if (sessionData.auth && typeof sessionData.auth === 'object') {
      if (sessionData.auth.permissions) {
        console.log('[SessionDecoder] ✅ Found permissions in auth.permissions');
        console.log('[SessionDecoder] 📄 Permissions data:', JSON.stringify(sessionData.auth.permissions, null, 2));
        return sessionData.auth.permissions;
      }
    }
    
    console.log('[SessionDecoder] ⚠️  No permissions found in session payload');
    console.log('[SessionDecoder] 📋 Full session data for debugging:', JSON.stringify(sessionData, null, 2));
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
