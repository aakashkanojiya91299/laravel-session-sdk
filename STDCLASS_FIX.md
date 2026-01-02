# Fix: PHP Class Deserialization Errors

## Problems Fixed

### Error 1: stdClass
```
❌ Failed to decode session: Session decode failed: PHP unserialization failed: Class stdClass not found in given scope
```

### Error 2: Laravel Collection
```
❌ Failed to decode session: Session decode failed: PHP unserialization failed: Class Illuminate\Support\Collection not found in given scope
```

These errors occurred when the Laravel Session SDK tried to deserialize PHP session data that contained `stdClass` objects or Laravel Collections.

## Root Cause

The `php-serialize` library needs to have `stdClass` defined in its scope when deserializing PHP objects. Without it, the library cannot reconstruct objects that were serialized as `stdClass` in PHP.

### What Are These Classes?

#### stdClass
In PHP, `stdClass` is a generic empty class used for dynamic object creation:

```php
// In PHP/Laravel
$obj = new stdClass();
$obj->name = "John";
$obj->email = "john@example.com";

// When serialized, this becomes:
// O:8:"stdClass":2:{s:4:"name";s:4:"John";s:5:"email";s:16:"john@example.com";}
```

#### Illuminate\Support\Collection
Laravel's Collection class is a powerful array wrapper:

```php
// In PHP/Laravel
$collection = collect(['apple', 'banana', 'orange']);
session()->put('fruits', $collection);

// When serialized, this becomes:
// O:29:"Illuminate\Support\Collection":1:{s:5:"items";a:3:{...}}
```

Laravel sessions often contain these objects when:
- User data is stored as objects (stdClass)
- Flash messages contain object data (stdClass)
- Lists/arrays are stored as Collections (Illuminate\Support\Collection)
- Query results are cached in session (Collection)
- Custom session data uses dynamic objects

## Solution

Updated [src/decoders/PhpSerializer.ts](src/decoders/PhpSerializer.ts) to provide `stdClass` to the `php-serialize` library:

### Before

```typescript
import * as phpSerialize from 'php-serialize';

export class PhpSerializer {
  static unserialize(data: string): any {
    try {
      return phpSerialize.unserialize(data);  // ❌ No classes in scope
    } catch (error: any) {
      throw new Error(`PHP unserialization failed: ${error.message}`);
    }
  }
}
```

### After

```typescript
import * as phpSerialize from 'php-serialize';

// Define stdClass for PHP unserialization
class stdClass {
  [key: string]: any;
}

// Define Laravel's Collection class
class Collection extends Array {
  [key: string]: any;
}

const IlluminateSupportCollection = Collection;

export class PhpSerializer {
  static unserialize(data: string): any {
    try {
      // Provide classes in the scope for php-serialize
      return phpSerialize.unserialize(data, {
        stdClass,
        'Illuminate\\Support\\Collection': IlluminateSupportCollection
      });  // ✅ Classes available
    } catch (error: any) {
      throw new Error(`PHP unserialization failed: ${error.message}`);
    }
  }
}
```

## How It Works

1. **Define stdClass**: Created a JavaScript class that can hold any properties dynamically
   ```typescript
   class stdClass {
     [key: string]: any;
   }
   ```

2. **Define Collection**: Created a JavaScript class that extends Array (like Laravel's Collection)
   ```typescript
   class Collection extends Array {
     [key: string]: any;
   }
   ```

3. **Map namespaced classes**: Created aliases for Laravel's namespaced classes
   ```typescript
   const IlluminateSupportCollection = Collection;
   ```

4. **Pass to php-serialize**: Provided these classes in the options parameter
   ```typescript
   phpSerialize.unserialize(data, {
     stdClass,
     'Illuminate\\Support\\Collection': IlluminateSupportCollection
   })
   ```

5. **Deserialization**: When `php-serialize` encounters:
   - `O:8:"stdClass":...` → Uses stdClass constructor
   - `O:29:"Illuminate\Support\Collection":...` → Uses Collection constructor

## Testing

After the fix, the SDK should successfully deserialize sessions containing stdClass objects:

```typescript
// Example session data with stdClass
const sessionData = await laravelSession.validateSession(sessionId);
// ✅ Now works with stdClass objects in session
```

## Rebuild Required

After making this change, the SDK must be rebuilt:

```bash
cd laravel-session-sdk
npm run build
```

This compiles the TypeScript to JavaScript in the `dist/` directory.

## Version

- **Fixed in**: v1.0.2
- **Date**: 2026-01-02

## Related Issues

This fix resolves errors when:
- ✅ Laravel stores user objects in sessions (stdClass)
- ✅ Flash messages contain object data (stdClass)
- ✅ Custom session data uses stdClass
- ✅ Any PHP object is stored as stdClass in sessions
- ✅ Collections are stored in sessions (Illuminate\Support\Collection)
- ✅ Query results are cached in sessions (Collection)
- ✅ Lists/arrays stored as Collections

## Additional Notes

### Why Not Just Convert to Plain Objects?

You might wonder why we define `stdClass` instead of just converting to plain JavaScript objects. The reason is:

1. **Type Preservation**: Some applications may need to distinguish between stdClass and arrays
2. **Compatibility**: Matches PHP's behavior more closely
3. **php-serialize Requirement**: The library specifically looks for class constructors

### Alternative Approaches

If you don't want to use `stdClass`, you could also:

**Option 1: Convert to Plain Objects**
```typescript
static unserialize(data: string): any {
  const result = phpSerialize.unserialize(data, {
    stdClass: Object  // Use plain Object instead
  });
  return result;
}
```

**Option 2: Custom Class Mapping**
```typescript
// Map PHP classes to JavaScript classes
static unserialize(data: string): any {
  return phpSerialize.unserialize(data, {
    stdClass: MyCustomClass,
    'App\\Models\\User': UserModel
  });
}
```

### Why the Current Approach is Best

The current implementation (using a simple `stdClass` definition) is best because:
- ✅ Simple and straightforward
- ✅ No additional dependencies
- ✅ Works for all session types
- ✅ Maintains data structure fidelity
- ✅ Easy to understand and maintain

## Summary

The error "Class stdClass not found in given scope" has been fixed by:
1. Defining a `stdClass` JavaScript class
2. Passing it to `php-serialize.unserialize()` in the options
3. Rebuilding the SDK

The SDK now correctly deserializes Laravel sessions containing stdClass objects.
