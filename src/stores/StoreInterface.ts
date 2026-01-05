import { SessionRecord, LaravelUser } from '../types';

export interface StoreInterface {
  /**
   * Get session from store
   */
  getSession(sessionId: string): Promise<SessionRecord | null>;

  /**
   * Get user from database
   */
  getUser(userId: number): Promise<LaravelUser | null>;

  /**
   * Get user role
   */
  getUserRole(userId: number): Promise<string | null>;

  /**
   * Get user permissions (modules and links)
   */
  getUserPermissions(userId: number): Promise<any>;

  /**
   * Close store connection
   */
  close(): Promise<void>;
}
