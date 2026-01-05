# Custom Permissions Key Configuration

## Overview

The Laravel Session SDK now supports configurable permissions keys, allowing you to specify where permissions are stored in your Laravel session.

## Configuration

### Basic Usage (Default Behavior)

By default, the SDK automatically checks common permission keys:
- `permissions`
- `user_permissions`
- `auth_permissions`
- `laravel_permissions`
- `role_permissions`
- `access_permissions`
- `user.permissions`
- `auth.permissions`

```typescript
const client = new LaravelSessionClient({
  database: { /* ... */ },
  session: { /* ... */ },
  appKey: process.env.APP_KEY,
  // No permissionsKey needed - uses auto-detection
});
```

### Custom Permissions Key

If your Laravel application stores permissions in a specific location, you can specify it:

```typescript
const client = new LaravelSessionClient({
  database: { /* ... */ },
  session: { /* ... */ },
  appKey: process.env.APP_KEY,
  permissionsKey: 'permissions', // Your custom key
});
```

### Nested Keys

The SDK supports nested keys using dot notation:

```typescript
// For permissions stored at: sessionData.user.permissions
permissionsKey: 'user.permissions'

// For permissions stored at: sessionData.auth.permissions
permissionsKey: 'auth.permissions'

// For permissions stored at: sessionData.custom.user.perms
permissionsKey: 'custom.user.perms'
```

## Examples

### Example 1: Standard Laravel Setup
```typescript
// Permissions stored directly in session as 'permissions'
const client = new LaravelSessionClient({
  // ... other config
  permissionsKey: 'permissions',
});
```

### Example 2: Custom Laravel Package
```typescript
// Permissions stored as 'spatie_permissions' (e.g., using Spatie)
const client = new LaravelSessionClient({
  // ... other config
  permissionsKey: 'spatie_permissions',
});
```

### Example 3: Nested in User Object
```typescript
// Permissions stored at session.user.roles_permissions
const client = new LaravelSessionClient({
  // ... other config
  permissionsKey: 'user.roles_permissions',
});
```

### Example 4: Auto-Detection
```typescript
// Let the SDK automatically find permissions
const client = new LaravelSessionClient({
  // ... other config
  // permissionsKey not specified - auto-detection enabled
});
```

## How It Works

1. **Custom Key Specified**: The SDK first tries your custom `permissionsKey`
2. **Auto-Detection**: If custom key not found or not specified, it checks common locations
3. **Debug Mode**: Enable `debug: true` to see where permissions are found

```typescript
const client = new LaravelSessionClient({
  // ... other config
  permissionsKey: 'permissions',
  debug: true, // See detailed logs
});
```

## Debugging

To see where the SDK is looking for permissions and what it finds:

```typescript
const client = new LaravelSessionClient({
  // ... other config
  debug: true,
});
```

Console output will show:
```
[SessionDecoder] 🔍 Looking for permissions in session payload...
[SessionDecoder] 📋 Session keys: ['_token', 'user_id', 'permissions', ...]
[SessionDecoder] 🔧 Using custom permissions key: "permissions"
[SessionDecoder] ✅ Found permissions in session key: permissions
[SessionDecoder] 📄 Permissions data: { role: "Super Admin", modules: [...], ... }
```

## Expected Permission Structure

The SDK expects permissions to contain:
```typescript
{
  role: string,           // e.g., "Admin"
  role_arr: string[],     // e.g., ["Admin", "Manager"]
  modules: Array<{        // Available modules/features
    id: number,
    acl_name: string,
    title: string,
    // ... other fields
  }>,
  links: string[]         // Available actions/links
}
```

## Migration Guide

If you're upgrading from version 1.0.x:

1. **No changes needed** - Auto-detection still works
2. **Optional**: Add `permissionsKey` for better performance
3. **Recommended**: Enable `debug` temporarily to verify permissions are found

## Version

This feature is available in `laravel-session-sdk` version **1.1.0** and above.

## Support

For issues or questions, please refer to the main README or open an issue on GitHub.

