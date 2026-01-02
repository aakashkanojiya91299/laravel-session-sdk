import * as phpSerialize from 'php-serialize';

export class PhpSerializer {
  /**
   * Unserialize PHP data to JavaScript object
   */
  static unserialize(data: string): any {
    try {
      return phpSerialize.unserialize(data);
    } catch (error: any) {
      throw new Error(`PHP unserialization failed: ${error.message}`);
    }
  }

  /**
   * Serialize JavaScript object to PHP format
   */
  static serialize(data: any): string {
    try {
      return phpSerialize.serialize(data);
    } catch (error: any) {
      throw new Error(`PHP serialization failed: ${error.message}`);
    }
  }
}
