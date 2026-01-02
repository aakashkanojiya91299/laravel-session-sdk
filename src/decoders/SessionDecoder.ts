import { PhpSerializer } from './PhpSerializer';
import { SessionData } from '../types';
import * as crypto from 'crypto';

export class SessionDecoder {
  private appKey?: Buffer;

  constructor(appKey?: string) {
    if (appKey) {
      // Remove 'base64:' prefix if present
      const key = appKey.replace(/^base64:/, '');
      this.appKey = Buffer.from(key, 'base64');
    }
  }

  /**
   * Decode base64 and unserialize session payload
   */
  decode(payload: string): SessionData | null {
    try {
      // Step 1: Base64 decode
      const decoded = Buffer.from(payload, 'base64').toString('utf-8');

      // Step 2: Unserialize PHP format
      const unserialized = PhpSerializer.unserialize(decoded);

      return unserialized;
    } catch (error: any) {
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
    // Find Laravel's auth key (login_web_{hash})
    const authKey = Object.keys(sessionData).find(key => key.startsWith('login_web_'));

    if (!authKey) {
      return null;
    }

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
   */
  getPermissions(sessionData: SessionData): any {
    return sessionData.permissions || null;
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
