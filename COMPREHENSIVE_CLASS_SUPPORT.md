# Comprehensive Laravel Class Support - v1.0.2

## 🎉 Complete PHP/Laravel Session Deserialization

Version 1.0.2 now includes **comprehensive support** for all common Laravel and PHP classes that appear in session data.

## ✅ What's Now Supported

### All Common Laravel Classes

| Class | Status | Use Case |
|-------|--------|----------|
| `stdClass` | ✅ Built-in | Generic objects |
| `Illuminate\Support\Collection` | ✅ Built-in | Arrays/lists |
| `Illuminate\Database\Eloquent\Collection` | ✅ Built-in | Model collections |
| `Carbon\Carbon` | ✅ Built-in | Date/time |
| `Carbon\CarbonImmutable` | ✅ Built-in | Immutable dates |
| `Illuminate\Support\MessageBag` | ✅ Built-in | Validation errors |
| `Illuminate\Support\ViewErrorBag` | ✅ Built-in | Error bags |
| `Illuminate\Database\Eloquent\Model` | ✅ Built-in | Eloquent models |
| Custom App Models | ✅ Via API | Your custom classes |

## 🚫 Errors Fixed

### Before v1.0.2
```
❌ Class stdClass not found in given scope
❌ Class Illuminate\Support\Collection not found in given scope
❌ Class Carbon\Carbon not found in given scope
❌ Class Illuminate\Support\MessageBag not found in given scope
❌ Class Illuminate\Database\Eloquent\Collection not found in given scope
```

### After v1.0.2
```
✅ All classes deserialize successfully
✅ No more "Class not found" errors for common Laravel classes
✅ Clean error messages for truly custom/unknown classes
```

## 🔧 New Features

### 1. Built-in Class Support

No configuration needed - works out of the box:

```typescript
import { LaravelSessionClient } from 'laravel-session-sdk';

const client = new LaravelSessionClient({...});
const session = await client.validateSession(sessionId);

// All these now work automatically:
console.log(session.user);           // stdClass
console.log(session.items);          // Collection
console.log(session.created_at);     // Carbon
console.log(session.errors);         // MessageBag
```

### 2. Custom Class Mapping API

For your application-specific models:

```typescript
import { PhpSerializer } from 'laravel-session-sdk';

// Define your custom class
class User {
  id?: number;
  name?: string;
  email?: string;
}

// Map it
PhpSerializer.addClassMapping('App\\Models\\User', User);

// Now sessions with App\Models\User work!
const session = await client.validateSession(sessionId);
console.log(session.current_user); // Instance of User class
```

### 3. Inspect Mappings

```typescript
import { PhpSerializer } from 'laravel-session-sdk';

const mappings = PhpSerializer.getClassMappings();
console.log(Object.keys(mappings));
// [
//   'stdClass',
//   'Illuminate\\Support\\Collection',
//   'Carbon\\Carbon',
//   ...
// ]
```

## 📊 Real-World Session Examples

### Example 1: Authentication with Flash Messages

```php
// PHP (Laravel Controller)
if ($validator->fails()) {
    return redirect()->back()
        ->withErrors($validator)
        ->withInput();
}
```

```typescript
// JavaScript/TypeScript
const session = await client.validateSession(sessionId);

if (session.errors) {
    // ViewErrorBag or MessageBag
    console.log(session.errors.messages);
}

if (session._old_input) {
    // stdClass with form data
    console.log(session._old_input);
}
```

### Example 2: Shopping Cart

```php
// PHP (Laravel)
$cart = collect([
    ['id' => 1, 'name' => 'iPhone', 'price' => 999],
    ['id' => 2, 'name' => 'MacBook', 'price' => 1999]
]);
session()->put('cart', $cart);
```

```typescript
// JavaScript/TypeScript
const session = await client.validateSession(sessionId);

// Collection (extends Array)
session.cart.forEach(item => {
    console.log(`${item.name}: $${item.price}`);
});

console.log(`Total items: ${session.cart.length}`);
```

### Example 3: User Profile with Timestamps

```php
// PHP (Laravel)
$user = User::find(Auth::id());
session()->put('profile', $user);
session()->put('last_activity', now());
```

```typescript
// JavaScript/TypeScript
const session = await client.validateSession(sessionId);

// Eloquent Model
console.log(session.profile.attributes.name);
console.log(session.profile.attributes.email);

// Carbon (Date object)
const lastActivity = session.last_activity;
console.log(lastActivity.toISOString());
console.log(`Active ${Date.now() - lastActivity.getTime()}ms ago`);
```

### Example 4: Query Results

```php
// PHP (Laravel)
$recentOrders = Order::where('user_id', $userId)
    ->latest()
    ->take(5)
    ->get();
session()->put('recent_orders', $recentOrders);
```

```typescript
// JavaScript/TypeScript
const session = await client.validateSession(sessionId);

// Eloquent Collection (extends Array)
session.recent_orders.forEach(order => {
    console.log(order.attributes);
});
```

## 🎯 Migration Guide

### From v1.0.1 to v1.0.2

**No code changes required!** Simply update:

```bash
npm update laravel-session-sdk
# or
yarn upgrade laravel-session-sdk
```

All sessions that previously failed with "Class not found" errors will now work automatically.

## 🔍 Under the Hood

### How It Works

The SDK now provides a comprehensive class map to the `php-serialize` library:

```typescript
const classMap = {
  stdClass: stdClass,
  'Illuminate\\Support\\Collection': Collection,
  'Carbon\\Carbon': Carbon,
  // ... all other Laravel classes
};

phpSerialize.unserialize(data, classMap);
```

### JavaScript Class Definitions

Each Laravel class has a corresponding JavaScript class:

```typescript
// stdClass - Generic object
class stdClass {
  [key: string]: any;
}

// Collection - Array wrapper
class Collection extends Array {
  [key: string]: any;
}

// Carbon - Date/time
class Carbon extends Date {
  [key: string]: any;
}

// Model - Eloquent model
class Model {
  attributes: any = {};
  relations: any = {};
}
```

## 📝 Best Practices

### 1. Type Safety with Custom Models

```typescript
// Define strongly-typed classes for your models
class User {
  id!: number;
  name!: string;
  email!: string;
  created_at!: Date;
}

PhpSerializer.addClassMapping('App\\Models\\User', User);

// Now you get type hints!
const session = await client.validateSession(sessionId);
const user: User = session.current_user;
console.log(user.email); // TypeScript knows this exists
```

### 2. Handle Unknown Classes Gracefully

```typescript
try {
    const session = await client.validateSession(sessionId);
} catch (error) {
    if (error.message.includes('Class') && error.message.includes('not found')) {
        // Extract class name from error
        const match = error.message.match(/Class (.+?) not found/);
        if (match) {
            console.log(`Unknown class: ${match[1]}`);
            console.log('Add it with: PhpSerializer.addClassMapping()');
        }
    }
}
```

### 3. Initialize Mappings Early

```typescript
// In your app initialization file
import { PhpSerializer } from 'laravel-session-sdk';
import { User, Product, Order } from './models';

// Set up all mappings once
PhpSerializer.addClassMapping('App\\Models\\User', User);
PhpSerializer.addClassMapping('App\\Models\\Product', Product);
PhpSerializer.addClassMapping('App\\Models\\Order', Order);

// Now all sessions will work throughout your app
```

## 🧪 Testing

### Test Built-in Classes

```typescript
import { PhpSerializer } from 'laravel-session-sdk';

// Test stdClass
const stdClassData = 'O:8:"stdClass":1:{s:4:"name";s:4:"John";}';
const result1 = PhpSerializer.unserialize(stdClassData);
console.assert(result1.name === 'John');

// Test Collection
const collectionData = 'O:29:"Illuminate\\Support\\Collection":1:{s:5:"items";a:2:{i:0;s:5:"apple";i:1;s:6:"banana";}}';
const result2 = PhpSerializer.unserialize(collectionData);
console.assert(result2 instanceof Array);
console.assert(result2.length === 2);
```

### Test Custom Mappings

```typescript
class CustomClass {
  value?: string;
}

PhpSerializer.addClassMapping('App\\Custom', CustomClass);

const data = 'O:10:"App\\Custom":1:{s:5:"value";s:4:"test";}';
const result = PhpSerializer.unserialize(data);
console.assert(result instanceof CustomClass);
console.assert(result.value === 'test');
```

## 📚 Documentation

- [SUPPORTED_CLASSES.md](SUPPORTED_CLASSES.md) - Full class reference
- [STDCLASS_FIX.md](STDCLASS_FIX.md) - Technical implementation details
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [README.md](README.md) - Main documentation

## 🎉 Summary

Version 1.0.2 brings **comprehensive Laravel class support** to the SDK:

- ✅ **8 built-in Laravel classes** supported out of the box
- ✅ **Custom class API** for application-specific models
- ✅ **Zero configuration** for common scenarios
- ✅ **100% backward compatible** with v1.0.1
- ✅ **No more "Class not found" errors** for common Laravel sessions

**Upgrade today and enjoy seamless Laravel session handling!** 🚀
