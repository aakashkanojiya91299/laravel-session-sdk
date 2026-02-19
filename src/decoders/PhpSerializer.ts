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

/**
 * Creates a dynamic class for unknown PHP classes encountered during unserialization.
 * The class acts as a plain object that can hold any deserialized properties,
 * and preserves the original PHP class name via __php_classname.
 */
function createDynamicClass(className: string): any {
  const DynamicClass = function(this: any) {
    this.__php_classname = className;
  } as any;
  DynamicClass.prototype = Object.create(null);
  DynamicClass.prototype.constructor = DynamicClass;
  return DynamicClass;
}

/**
 * Proxy-based scope that intercepts lookups for unknown PHP classes.
 * When php-serialize encounters a class not in our classMap, the Proxy
 * returns a dynamically created generic class instead of throwing.
 * This allows ~200KB+ sessions with custom models (App\Models\*, Spatie\*, etc.)
 * to deserialize without needing to pre-register every single PHP class.
 */
const classMapProxy = new Proxy(classMap, {
  get(target, prop: string) {
    if (prop in target) {
      return target[prop];
    }
    // Dynamically create and cache a class for unknown PHP classes
    const dynamicClass = createDynamicClass(prop);
    target[prop] = dynamicClass;
    return dynamicClass;
  },
  has(_target, _prop: string) {
    // Always report that the class exists so php-serialize doesn't throw
    return true;
  },
});

export class PhpSerializer {
  /**
   * Unserialize PHP data to JavaScript object
   */
  static unserialize(data: string | Buffer): any {
    try {
      // Use Proxy-based classMap so unknown PHP classes (e.g. App\Models\Competition,
      // Spatie\Permission\Models\Role) deserialize as plain objects instead of throwing.
      // Accepts Buffer to avoid encoding corruption — php-serialize internally does
      // Buffer.from(item), which copies a Buffer's exact bytes but re-encodes strings as UTF-8.
      return phpSerialize.unserialize(data as string, classMapProxy);
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
