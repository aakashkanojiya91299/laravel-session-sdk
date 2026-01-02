# Laravel Session SDK v1.0.2 Release Notes

## 🎉 Release Date: January 2, 2026

## What's New

### 🐛 Bug Fixes

#### Fixed stdClass Deserialization Error
The major fix in this release resolves the critical issue where Laravel sessions containing `stdClass` objects could not be deserialized.

**Error Fixed:**
```
❌ Failed to decode session: Session decode failed:
PHP unserialization failed: Class stdClass not found in given scope
```

**Now Works:**
```
✅ Session deserialized successfully
```

## Changes in This Release

### Modified Files

1. **src/decoders/PhpSerializer.ts**
   - Added `stdClass` class definition
   - Updated `unserialize()` to provide stdClass to php-serialize library

2. **package.json**
   - Updated version from `1.0.1` to `1.0.2`

3. **Documentation** (New Files)
   - `CHANGELOG.md` - Version history and changelog
   - `STDCLASS_FIX.md` - Detailed fix documentation
   - `VERSION_1.0.2_RELEASE.md` - This file

## Technical Details

### The Fix

**Before:**
```typescript
static unserialize(data: string): any {
  try {
    return phpSerialize.unserialize(data);
  } catch (error: any) {
    throw new Error(`PHP unserialization failed: ${error.message}`);
  }
}
```

**After:**
```typescript
// Define stdClass for PHP unserialization
class stdClass {
  [key: string]: any;
}

static unserialize(data: string): any {
  try {
    // Provide stdClass in the scope for php-serialize
    return phpSerialize.unserialize(data, { stdClass });
  } catch (error: any) {
    throw new Error(`PHP unserialization failed: ${error.message}`);
  }
}
```

### Why This Was Needed

Laravel sessions often contain `stdClass` objects, which are PHP's generic dynamic objects:

```php
// In Laravel/PHP
$data = new stdClass();
$data->user = 'John';
$data->role = 'admin';
session()->put('userInfo', $data);

// Serialized as:
// O:8:"stdClass":2:{s:4:"user";s:4:"John";s:4:"role";s:5:"admin";}
```

The `php-serialize` library needs the `stdClass` constructor available in JavaScript scope to recreate these objects.

## Upgrade Instructions

### For npm Users

```bash
npm update laravel-session-sdk
```

### For npm link Users (Development)

```bash
# In laravel-session-sdk directory
cd laravel-session-sdk
npm run build
npm link

# In your project directory
cd your-project
npm link laravel-session-sdk
```

### For Existing Projects

If you're using v1.0.1, simply update:

```bash
npm install laravel-session-sdk@1.0.2
# or
yarn add laravel-session-sdk@1.0.2
```

## Breaking Changes

**None** - This release is fully backward compatible with v1.0.1.

## What Sessions Are Now Supported

With this fix, the SDK now correctly handles sessions containing:

- ✅ stdClass objects
- ✅ User data objects
- ✅ Flash messages with object data
- ✅ Custom session data using dynamic objects
- ✅ Any PHP object serialized as stdClass
- ✅ All previously supported session types

## Testing

### Before Upgrading
```bash
# Test current version
npm test
```

### After Upgrading
```bash
# Verify installation
npm list laravel-session-sdk

# Should show: laravel-session-sdk@1.0.2

# Run tests
npm test
```

### Manual Testing

```typescript
import { LaravelSessionClient } from 'laravel-session-sdk';

const client = new LaravelSessionClient({
  driver: 'database',
  connection: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password',
    database: 'laravel'
  }
});

// This should now work with stdClass in sessions
const session = await client.validateSession('session-id-here');
console.log('Session data:', session);
```

## Compatibility

### Node.js Versions
- ✅ Node.js >= 16.0.0 (unchanged)

### Frameworks
- ✅ Express.js 4.x, 5.x
- ✅ Next.js 14.x, 15.x, 16.x
- ✅ NestJS 8.x, 9.x, 10.x, 11.x

### Laravel Versions
- ✅ Laravel 8.x
- ✅ Laravel 9.x
- ✅ Laravel 10.x
- ✅ Laravel 11.x

### PHP Versions
- ✅ PHP 7.4+
- ✅ PHP 8.0+
- ✅ PHP 8.1+
- ✅ PHP 8.2+
- ✅ PHP 8.3+

## Performance Impact

This fix has **negligible performance impact**:
- Adds ~10 lines of code
- No additional dependencies
- No runtime overhead
- Same deserialization speed

## Known Issues

### Resolved in This Version
- ~~stdClass deserialization fails~~ ✅ Fixed

### Current Issues
- None currently known

## Future Plans

See [CHANGELOG.md](CHANGELOG.md) for upcoming features.

Planned for future releases:
- Support for File and Cookie session drivers
- Session writing/updating capabilities
- More helper methods
- Performance optimizations

## Contributors

- **Aakash Kanojiya** - Main developer and maintainer

## Support

### Getting Help

- **Documentation**: [README.md](README.md)
- **Issues**: [GitHub Issues](https://github.com/aakashkanojiya91299/laravel-session-sdk/issues)
- **Email**: aakash.wowrooms69@gmail.com

### Reporting Bugs

If you encounter any issues with v1.0.2, please report them on GitHub:

1. Go to [GitHub Issues](https://github.com/aakashkanojiya91299/laravel-session-sdk/issues)
2. Click "New Issue"
3. Provide:
   - SDK version (1.0.2)
   - Node.js version
   - Laravel version
   - Steps to reproduce
   - Error messages/logs

## Verification

To verify you're using the correct version:

```bash
# Check installed version
npm list laravel-session-sdk

# Should output:
# └── laravel-session-sdk@1.0.2

# Check in code
import { LaravelSessionClient } from 'laravel-session-sdk';
const pkg = require('laravel-session-sdk/package.json');
console.log('SDK Version:', pkg.version); // Should show: 1.0.2
```

## Rollback Instructions

If you need to rollback to v1.0.1:

```bash
npm install laravel-session-sdk@1.0.1
# or
yarn add laravel-session-sdk@1.0.1
```

**Note**: v1.0.1 will still have the stdClass deserialization issue.

## Summary

Version 1.0.2 is a **critical bug fix release** that resolves session deserialization issues with stdClass objects. We recommend all users upgrade to this version.

### Quick Facts
- **Type**: Bug fix release
- **Breaking Changes**: None
- **New Features**: None
- **Bug Fixes**: 1 (critical)
- **Performance Impact**: None
- **Migration Required**: No

---

**Thank you for using Laravel Session SDK!** 🚀

For questions or feedback, please open an issue on GitHub or contact the maintainer.
