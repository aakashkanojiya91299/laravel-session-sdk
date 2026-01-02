import * as phpSerialize from 'php-serialize';

// Define stdClass for PHP unserialization
class stdClass {
  [key: string]: any;
}

// Define Laravel's Collection class for PHP unserialization
// Laravel's Collection is essentially an array wrapper
class Collection extends Array {
  [key: string]: any;
}

// Define common Laravel classes that might be serialized in sessions
// These are simplified JavaScript versions that can hold the deserialized data

// Carbon - Laravel's date/time class (extends DateTime)
class Carbon extends Date {
  [key: string]: any;
}

// Eloquent Model - Base class for Laravel models
class Model {
  [key: string]: any;
  attributes: any = {};
  relations: any = {};
}

// Support for other common Illuminate classes
class MessageBag {
  [key: string]: any;
  messages: any = {};
}

class ViewErrorBag {
  [key: string]: any;
  bags: any = {};
}

// Aliases for namespaced Laravel classes
const IlluminateSupportCollection = Collection;
const IlluminateDatabaseEloquentCollection = Collection;
const CarbonCarbon = Carbon;
const CarbonCarbonImmutable = Carbon;
const IlluminateSupportMessageBag = MessageBag;
const IlluminateSupportViewErrorBag = ViewErrorBag;
const IlluminateDatabaseEloquentModel = Model;

// Common class mappings for PHP deserialization
const classMap: { [key: string]: any } = {
  stdClass,
  'Illuminate\\Support\\Collection': IlluminateSupportCollection,
  'Illuminate\\Database\\Eloquent\\Collection': IlluminateDatabaseEloquentCollection,
  'Carbon\\Carbon': CarbonCarbon,
  'Carbon\\CarbonImmutable': CarbonCarbonImmutable,
  'Illuminate\\Support\\MessageBag': IlluminateSupportMessageBag,
  'Illuminate\\Support\\ViewErrorBag': IlluminateSupportViewErrorBag,
  'Illuminate\\Database\\Eloquent\\Model': IlluminateDatabaseEloquentModel,
};

export class PhpSerializer {
  /**
   * Unserialize PHP data to JavaScript object
   */
  static unserialize(data: string): any {
    try {
      // Provide all common Laravel/PHP classes in the scope for php-serialize
      return phpSerialize.unserialize(data, classMap);
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

  /**
   * Add custom class mapping for deserialization
   * Useful for application-specific Laravel models or classes
   * 
   * @param className - Fully qualified PHP class name (e.g., 'App\\Models\\User')
   * @param jsClass - JavaScript class to use for deserialization
   */
  static addClassMapping(className: string, jsClass: any): void {
    classMap[className] = jsClass;
  }

  /**
   * Get current class mappings
   */
  static getClassMappings(): { [key: string]: any } {
    return { ...classMap };
  }
}
