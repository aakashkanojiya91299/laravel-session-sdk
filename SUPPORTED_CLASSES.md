# Supported PHP/Laravel Classes

## Overview

The Laravel Session SDK now supports deserialization of all common Laravel and PHP classes that may appear in session data.

## Built-in Supported Classes

### 1. stdClass
**PHP Class**: `stdClass`
**Usage**: Generic dynamic objects in PHP

```php
// PHP
$obj = new stdClass();
$obj->name = "John";
$obj->email = "john@example.com";
session()->put('user_data', $obj);
```

```typescript
// JavaScript/TypeScript
const session = await client.validateSession(sessionId);
console.log(session.user_data.name); // "John"
```

---

### 2. Illuminate\Support\Collection
**PHP Class**: `Illuminate\Support\Collection`
**Usage**: Laravel's Collection class for arrays

```php
// PHP
$collection = collect(['apple', 'banana', 'orange']);
session()->put('fruits', $collection);
```

```typescript
// JavaScript/TypeScript
const session = await client.validateSession(sessionId);
console.log(session.fruits); // Array: ['apple', 'banana', 'orange']
console.log(session.fruits.length); // 3
```

---

### 3. Illuminate\Database\Eloquent\Collection
**PHP Class**: `Illuminate\Database\Eloquent\Collection`
**Usage**: Collection of Eloquent models

```php
// PHP
$users = User::where('active', true)->get();
session()->put('active_users', $users);
```

```typescript
// JavaScript/TypeScript
const session = await client.validateSession(sessionId);
console.log(session.active_users); // Array of user objects
```

---

### 4. Carbon\Carbon
**PHP Class**: `Carbon\Carbon`
**Usage**: Laravel's date/time class

```php
// PHP
$now = Carbon::now();
session()->put('login_time', $now);
```

```typescript
// JavaScript/TypeScript
const session = await client.validateSession(sessionId);
console.log(session.login_time); // Date object
```

---

### 5. Carbon\CarbonImmutable
**PHP Class**: `Carbon\CarbonImmutable`
**Usage**: Immutable version of Carbon

```php
// PHP
$date = CarbonImmutable::parse('2024-01-01');
session()->put('event_date', $date);
```

```typescript
// JavaScript/TypeScript
const session = await client.validateSession(sessionId);
console.log(session.event_date); // Date object
```

---

### 6. Illuminate\Support\MessageBag
**PHP Class**: `Illuminate\Support\MessageBag`
**Usage**: Validation error messages

```php
// PHP
$errors = new MessageBag([
    'email' => ['The email field is required.'],
    'password' => ['Password must be at least 8 characters.']
]);
session()->flash('errors', $errors);
```

```typescript
// JavaScript/TypeScript
const session = await client.validateSession(sessionId);
console.log(session.errors.messages);
// { email: [...], password: [...] }
```

---

### 7. Illuminate\Support\ViewErrorBag
**PHP Class**: `Illuminate\Support\ViewErrorBag`
**Usage**: Container for multiple error bags

```php
// PHP
$bag = new ViewErrorBag();
$bag->put('default', $messageBag);
session()->flash('errors', $bag);
```

```typescript
// JavaScript/TypeScript
const session = await client.validateSession(sessionId);
console.log(session.errors.bags);
```

---

### 8. Illuminate\Database\Eloquent\Model
**PHP Class**: `Illuminate\Database\Eloquent\Model`
**Usage**: Base class for Laravel models

```php
// PHP
$user = User::find(1);
session()->put('current_user', $user);
```

```typescript
// JavaScript/TypeScript
const session = await client.validateSession(sessionId);
console.log(session.current_user.attributes);
console.log(session.current_user.relations);
```

---

## Common Session Scenarios

### Flash Messages with Errors
```php
// PHP (Laravel)
return redirect()->back()
    ->withErrors(['email' => 'Invalid email'])
    ->withInput();
```

```typescript
// JavaScript/TypeScript
const session = await client.validateSession(sessionId);
if (session.errors) {
    console.log(session.errors); // MessageBag or ViewErrorBag
}
```

### User Authentication
```php
// PHP (Laravel)
Auth::login($user);
// Laravel stores user model in session
```

```typescript
// JavaScript/TypeScript
const session = await client.validateSession(sessionId);
const userId = session.login_web_xxxx; // Auth user ID
```

### Shopping Cart
```php
// PHP (Laravel)
$cart = collect([
    ['product' => 'iPhone', 'price' => 999],
    ['product' => 'MacBook', 'price' => 1999]
]);
session()->put('cart', $cart);
```

```typescript
// JavaScript/TypeScript
const session = await client.validateSession(sessionId);
const cart = session.cart; // Array of items
console.log(cart.length); // 2
```

### Timestamps and Dates
```php
// PHP (Laravel)
session()->put('last_activity', now());
session()->put('expires_at', now()->addHours(24));
```

```typescript
// JavaScript/TypeScript
const session = await client.validateSession(sessionId);
console.log(session.last_activity); // Date object
console.log(session.expires_at); // Date object
```

---

## Adding Custom Class Support

If your Laravel application uses custom models or classes in sessions, you can add support for them:

### Method 1: Using addClassMapping (Recommended)

```typescript
import { PhpSerializer } from 'laravel-session-sdk';

// Define a JavaScript class for your custom PHP class
class CustomUser {
  [key: string]: any;
  id?: number;
  name?: string;
  email?: string;
}

// Map the PHP class to the JavaScript class
PhpSerializer.addClassMapping('App\\Models\\User', CustomUser);

// Now sessions with App\Models\User will deserialize correctly
const session = await client.validateSession(sessionId);
```

### Method 2: Generic Mapping for Multiple Models

```typescript
import { PhpSerializer } from 'laravel-session-sdk';

// Generic model class that works for any Eloquent model
class EloquentModel {
  [key: string]: any;
  attributes: any = {};
  original: any = {};
  relations: any = {};

  getAttribute(key: string) {
    return this.attributes?.[key];
  }
}

// Map multiple models
PhpSerializer.addClassMapping('App\\Models\\User', EloquentModel);
PhpSerializer.addClassMapping('App\\Models\\Product', EloquentModel);
PhpSerializer.addClassMapping('App\\Models\\Order', EloquentModel);
```

### Method 3: Namespace Wildcarding (For Future Enhancement)

```typescript
// This feature could be added if needed
// PhpSerializer.addNamespaceMapping('App\\Models\\*', EloquentModel);
```

---

## Error Handling

### Before v1.0.2
```
❌ Class stdClass not found in given scope
❌ Class Illuminate\Support\Collection not found in given scope
❌ Class Carbon\Carbon not found in given scope
```

### After v1.0.2
```
✅ All common Laravel classes supported out of the box
✅ Custom classes can be added via addClassMapping()
✅ Graceful error messages for truly unknown classes
```

---

## Class Mapping Reference

| PHP Class | JavaScript Class | Common Use Case |
|-----------|-----------------|-----------------|
| `stdClass` | `stdClass` | Generic objects |
| `Illuminate\Support\Collection` | `Collection (extends Array)` | Lists, arrays |
| `Illuminate\Database\Eloquent\Collection` | `Collection (extends Array)` | Model collections |
| `Carbon\Carbon` | `Carbon (extends Date)` | Timestamps, dates |
| `Carbon\CarbonImmutable` | `Carbon (extends Date)` | Immutable dates |
| `Illuminate\Support\MessageBag` | `MessageBag` | Validation errors |
| `Illuminate\Support\ViewErrorBag` | `ViewErrorBag` | Multiple error bags |
| `Illuminate\Database\Eloquent\Model` | `Model` | Eloquent models |

---

## Advanced Usage

### Inspecting Available Mappings

```typescript
import { PhpSerializer } from 'laravel-session-sdk';

// Get all current class mappings
const mappings = PhpSerializer.getClassMappings();
console.log(Object.keys(mappings));
// Output:
// [
//   'stdClass',
//   'Illuminate\\Support\\Collection',
//   'Carbon\\Carbon',
//   ...
// ]
```

### Working with Collections

```typescript
const session = await client.validateSession(sessionId);

// Collections are JavaScript arrays with extra properties
if (session.items instanceof Array) {
    session.items.forEach(item => {
        console.log(item);
    });

    console.log(session.items.length);
    console.log(session.items[0]);
}
```

### Working with Dates

```typescript
const session = await client.validateSession(sessionId);

// Carbon objects deserialize as JavaScript Date objects
if (session.created_at instanceof Date) {
    console.log(session.created_at.toISOString());
    console.log(session.created_at.getTime());
}
```

### Working with Models

```typescript
const session = await client.validateSession(sessionId);

// Eloquent models have attributes and relations
if (session.user) {
    console.log(session.user.attributes);  // Model data
    console.log(session.user.relations);   // Loaded relationships
}
```

---

## Troubleshooting

### Unknown Class Error

If you encounter an error for a class not in the built-in list:

```
❌ PHP unserialization failed: Class App\Models\CustomClass not found in given scope
```

**Solution**: Add a mapping for it:

```typescript
import { PhpSerializer } from 'laravel-session-sdk';

class CustomClass {
  [key: string]: any;
}

PhpSerializer.addClassMapping('App\\Models\\CustomClass', CustomClass);
```

### Testing Custom Mappings

```typescript
import { PhpSerializer } from 'laravel-session-sdk';

// Add your mapping
PhpSerializer.addClassMapping('App\\Models\\User', CustomUser);

// Test it
const testData = 'O:15:"App\\Models\\User":...'; // Your PHP serialized data
const result = PhpSerializer.unserialize(testData);
console.log(result); // Should be an instance of CustomUser
```

---

## Performance Considerations

- **Built-in classes**: Zero overhead, mapped at import time
- **Custom classes**: Minimal overhead, added to mapping at runtime
- **Deserialization**: Same performance as php-serialize library

---

## Version History

- **v1.0.2**: Added comprehensive Laravel class support
  - stdClass
  - Collections (Support & Eloquent)
  - Carbon (Carbon & CarbonImmutable)
  - MessageBag & ViewErrorBag
  - Eloquent Model
  - Custom class mapping API

---

## See Also

- [STDCLASS_FIX.md](STDCLASS_FIX.md) - Technical details of the fix
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [README.md](README.md) - Main documentation
