# Laravel Session SDK

> Universal Node.js SDK for validating and managing Laravel sessions in any JavaScript/TypeScript project.

[![npm version](https://badge.fury.io/js/laravel-session-sdk.svg)](https://www.npmjs.com/package/laravel-session-sdk)
[![npm downloads](https://img.shields.io/npm/dm/laravel-session-sdk.svg)](https://www.npmjs.com/package/laravel-session-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/laravel-session-sdk.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/aakashkanojiya91299/laravel-session-sdk/pulls)

## Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Usage Examples](#-usage-examples)
  - [Express.js](#expressjs)
  - [Next.js API Route](#nextjs-api-route)
  - [Next.js with Singleton Pattern](#nextjs-with-singleton-pattern)
  - [React Hook](#react-hook)
  - [NestJS](#nestjs)
- [Configuration](#️-configuration)
- [Laravel Setup](#-laravel-setup-zero-code-changes)
- [API Reference](#-api-reference)
- [How It Works](#-how-it-works)
- [Security](#️-security)
- [Performance](#-performance)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [FAQ](#-faq)
- [Contributing](#-contributing)
- [Support](#-support)
- [License](#-license)
- [Links](#-links)

## 🚀 Features

- ✅ **Zero Laravel Code Changes** - Read-only session validation
- ✅ **Multiple Frameworks** - Express, Next.js, NestJS support
- ✅ **Database & Redis Sessions** - Full support for both session drivers
- ✅ **TypeScript** - Full type definitions included
- ✅ **Session Decoding** - Handles PHP serialization automatically
- ✅ **Single Session Enforcement** - Respects Laravel's session logic
- ✅ **2FA Support** - Validates two-factor authentication
- ✅ **Dual-Source Permissions** - Extracts from session payload with database fallback
- ✅ **Multiple Permissions Keys** - Extract multiple custom keys from session (v1.3.0+)
- ✅ **Nested Key Support** - Dot notation for nested session keys (e.g., `user.permissions`)
- ✅ **Debug Mode** - Conditional logging for development (v1.4.0+)
- ✅ **Production Ready** - Connection pooling, error handling, graceful shutdown

## 📦 Installation

### Database Session Driver (Recommended)

If you're using database sessions:

```bash
npm install laravel-session-sdk mysql2
```

**Note:** `mysql2` is required as a peer dependency because the SDK needs it to connect to your database for session validation and user/role queries.

### Redis Session Driver

If you're using Redis sessions:

```bash
npm install laravel-session-sdk mysql2 redis
```

**Important:** Both `mysql2` and `redis` are required because:
- `redis` is used to read session data from Redis
- `mysql2` is **still required** because user information, roles, and permissions are stored in database tables (not in Redis)
- The SDK uses Redis only for session storage, but queries the database for user/role/permission data

### Why Peer Dependencies?

`mysql2` and `redis` are **peer dependencies** (not automatically installed) because:
- You may already have them installed in your project
- Different projects may use different versions
- You only need to install what your driver requires
- Prevents version conflicts with your existing dependencies

## 🎯 Quick Start

```typescript
import { LaravelSessionClient } from 'laravel-session-sdk';

const client = new LaravelSessionClient({
  database: {
    type: 'mysql',
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'laravel_db',
  },
  session: {
    driver: 'database',
    lifetime: 1000, // minutes
  },
});

// Validate session
const result = await client.validateSession(sessionId);

if (result.valid) {
  console.log('User:', result.user);
  console.log('Role:', result.role);
  console.log('Permissions:', result.permissions);
}
```

## 📖 Usage Examples

### Express.js

```javascript
const express = require('express');
const cookieParser = require('cookie-parser');
const { LaravelSessionClient, createExpressMiddleware } = require('laravel-session-sdk');

const app = express();
app.use(cookieParser());

const sessionClient = new LaravelSessionClient({
  database: { /* config */ },
  session: { driver: 'database' }
});

const authMiddleware = createExpressMiddleware(sessionClient);

app.get('/api/user', authMiddleware, (req, res) => {
  res.json({
    user: req.laravelSession.user,
    role: req.laravelSession.role,
  });
});

app.listen(3000);
```

### Next.js API Route

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { LaravelSessionClient, validateNextJsSession } from 'laravel-session-sdk';

const client = new LaravelSessionClient({ /* config */ });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const result = await validateNextJsSession(req, client);

  if (!result.valid) {
    return res.status(401).json({ error: result.error });
  }

  return res.json({
    user: result.user,
    role: result.role,
  });
}
```

### Next.js with Singleton Pattern

```typescript
// lib/laravelSession.ts
import { LaravelSessionClient } from '@yourorg/laravel-session-sdk';

let client: LaravelSessionClient | null = null;

export function getLaravelSessionClient(): LaravelSessionClient {
  if (!client) {
    client = new LaravelSessionClient({
      database: {
        host: process.env.DB_HOST!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_DATABASE!,
      },
      session: { driver: 'database' },
    });
  }
  return client;
}
```

```typescript
// pages/api/user.ts
import { getLaravelSessionClient } from '@/lib/laravelSession';
import { validateNextJsSession } from '@yourorg/laravel-session-sdk';

export default async function handler(req, res) {
  const client = getLaravelSessionClient();
  const result = await validateNextJsSession(req, client);

  if (!result.valid) {
    return res.status(401).json({ error: result.error });
  }

  return res.json({ user: result.user });
}
```

### React Hook

```typescript
// hooks/useLaravelAuth.ts
import { useEffect, useState } from 'react';

export function useLaravelAuth() {
  const [state, setState] = useState({
    user: null,
    role: null,
    loading: true,
    authenticated: false,
  });

  useEffect(() => {
    fetch('/api/auth/user', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setState({
            user: data.user,
            role: data.role,
            loading: false,
            authenticated: true,
          });
        }
      });
  }, []);

  return state;
}
```

### NestJS

```typescript
import { Module } from '@nestjs/common';
import { LaravelSessionClient, LaravelSessionGuard } from 'laravel-session-sdk';

const sessionClient = new LaravelSessionClient({ /* config */ });

@Module({
  providers: [
    { provide: LaravelSessionClient, useValue: sessionClient },
    LaravelSessionGuard,
  ],
})
export class AuthModule {}
```

## ⚙️ Configuration

### Database Session Driver

```typescript
const client = new LaravelSessionClient({
  database: {
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password',
    database: 'laravel_db',
    connectionLimit: 10,
  },
  session: {
    driver: 'database',
    table: 'sessions',
    lifetime: 1000, // minutes
    cookieName: 'laravel_session',
  },
  debug: true,
});
```

### Redis Session Driver

```typescript
const client = new LaravelSessionClient({
  database: { /* still needed for user/role queries */ },
  redis: {
    host: '127.0.0.1',
    port: 6379,
    password: 'secret',
    db: 0,
  },
  session: {
    driver: 'redis',
    prefix: 'laravel_session:',
    lifetime: 1000,
  },
});
```

### With Encrypted Sessions

```typescript
const client = new LaravelSessionClient({
  database: { /* ... */ },
  session: { driver: 'database' },
  appKey: process.env.LARAVEL_APP_KEY, // From Laravel's .env
});
```

### With Custom Permissions Key

```typescript
const client = new LaravelSessionClient({
  database: { /* ... */ },
  session: { driver: 'database' },
  // Single key (backward compatible)
  permissionsKey: 'permissions',
  // Or nested key with dot notation
  permissionsKey: 'user.permissions',
});
```

### With Multiple Permissions Keys (v1.3.0+)

Extract multiple custom keys from the session at once:

```typescript
const client = new LaravelSessionClient({
  database: { /* ... */ },
  session: { driver: 'database' },
  // Extract multiple keys from session
  permissionsKey: [
    'permissions',
    'competitionIds',
    'competitionsData',
    'competitionCategories'
  ],
});

// Result will be:
// {
//   permissions: { role: '...', modules: [...], links: [...] },
//   competitionIds: [1, 5, 12],
//   competitionsData: [...],
//   competitionCategories: [...]
// }
```

### With Debug Logging (v1.4.0+)

Enable detailed logging for development:

```typescript
const client = new LaravelSessionClient({
  database: { /* ... */ },
  session: { driver: 'database' },
  debug: process.env.NODE_ENV === 'development', // Enable debug logs
});
```

### Log Verbosity Levels (v1.4.4+)

Control how much sensitive data is shown in logs:

**Secure Mode (Default - Recommended for Production):**
```typescript
const client = new LaravelSessionClient({
  database: { /* ... */ },
  session: { driver: 'database' },
  debug: true,
  logLevel: 'secure', // Sanitized logs, no sensitive data (default)
});
```

**Verbose Mode (Development Only - Shows All Data):**
```typescript
const client = new LaravelSessionClient({
  database: { /* ... */ },
  session: { driver: 'database' },
  debug: true,
  logLevel: 'verbose', // Full logs with sensitive data (use only in secure dev environments)
});
```

**⚠️ Security Warning:** 
- `logLevel: 'secure'` (default) - Masks session IDs, tokens, passwords, and sensitive data
- `logLevel: 'verbose'` - Shows full session data, decrypted values, user IDs, etc.
- **Never use `verbose` mode in production** - it exposes sensitive information
- Use `verbose` only in secure development environments for debugging

## 🔒 Laravel Setup (Zero Code Changes!)

### Option 1: Database Session Driver

#### Step 1: Change Session Driver

In your Laravel app's `.env`:

```env
SESSION_DRIVER=database  # Change from 'file'
SESSION_DOMAIN=.yourdomain.com
SESSION_SECURE_COOKIE=true
```

#### Step 2: Create Sessions Table

```bash
php artisan session:table
php artisan migrate
```

#### Step 3: Clear Cache

```bash
php artisan config:cache
php artisan cache:clear
```

### Option 2: Redis Session Driver

#### Step 1: Change Session Driver

In your Laravel app's `.env`:

```env
SESSION_DRIVER=redis
SESSION_CONNECTION=default
SESSION_DOMAIN=.yourdomain.com
SESSION_SECURE_COOKIE=true
```

#### Step 2: Configure Redis Connection

Ensure Redis is configured in `config/database.php` and running.

#### Step 3: Clear Cache

```bash
php artisan config:cache
php artisan cache:clear
```

**Note:** Redis driver still requires database configuration in the SDK for user/role/permission queries.

That's it! No code changes needed in Laravel.

## 📚 API Reference

### LaravelSessionClient

#### `constructor(config: LaravelSessionConfig)`

Creates a new client instance.

**Configuration Options:**

```typescript
interface LaravelSessionConfig {
  database?: {
    type: 'mysql' | 'postgres';
    host: string;
    port?: number;
    user: string;
    password: string;
    database: string;
    connectionLimit?: number; // Default: 10
  };
  session: {
    driver: 'database' | 'redis' | 'file';
    table?: string; // Default: 'sessions'
    lifetime?: number; // In minutes
    cookieName?: string; // Default: 'laravel_session'
    prefix?: string; // For Redis driver
  };
  appKey?: string; // Laravel APP_KEY for encrypted sessions
  debug?: boolean; // Enable debug logging (v1.4.0+)
  logLevel?: 'secure' | 'verbose'; // Log verbosity: 'secure' (default) or 'verbose' (v1.4.4+)
  permissionsKey?: string | string[]; // Custom permissions key(s) (v1.3.0+)
}
```

#### `validateSession(sessionId: string): Promise<SessionValidationResult>`

Validates a Laravel session and returns user data.

**Parameters:**
- `sessionId`: The Laravel session cookie value (may be encrypted)

**Returns:**
```typescript
{
  valid: boolean;
  user?: {
    id: number;
    email: string;
    name?: string;
    google2fa_enable?: number;
    [key: string]: any;
  };
  role?: string;
  permissions?: any; // Single key: object, Multiple keys: object with keys
  sessionId?: string;
  csrfToken?: string;
  error?: string;
  reason?: string;
}
```

**Example:**
```typescript
const result = await client.validateSession(cookieValue);

if (result.valid) {
  console.log('User:', result.user);
  console.log('Role:', result.role);
  
  // Single permissionsKey: result.permissions is the value
  // Multiple permissionsKey: result.permissions is an object with keys
  console.log('Permissions:', result.permissions);
}
```

#### `getSessionCookieName(): string`

Returns the session cookie name (default: `laravel_session`).

#### `close(): Promise<void>`

Closes all database connections. Call this during graceful shutdown.

**Example:**
```typescript
// In your application shutdown handler
process.on('SIGTERM', async () => {
  await client.close();
  process.exit(0);
});
```

### Middleware Functions

#### `createExpressMiddleware(client: LaravelSessionClient)`

Creates Express.js middleware.

#### `validateNextJsSession(req: NextApiRequest, client: LaravelSessionClient)`

Helper for Next.js API routes.

#### `createNextJsMiddleware(client: LaravelSessionClient)`

Creates Next.js middleware (for custom middleware chains).

### Permissions Extraction

The SDK supports flexible permissions extraction with multiple strategies:

#### Single Key (Default)

```typescript
const client = new LaravelSessionClient({
  permissionsKey: 'permissions', // Single string
});

// Result.permissions = { role: '...', modules: [...], links: [...] }
```

#### Multiple Keys (v1.3.0+)

```typescript
const client = new LaravelSessionClient({
  permissionsKey: ['permissions', 'competitionIds', 'competitionsData'],
});

// Result.permissions = {
//   permissions: { role: '...', modules: [...] },
//   competitionIds: [1, 5, 12],
//   competitionsData: [...]
// }
```

#### Nested Keys (Dot Notation)

```typescript
const client = new LaravelSessionClient({
  permissionsKey: 'user.permissions', // Supports dot notation
});
```

#### Dual-Source Strategy

The SDK automatically uses a dual-source strategy for permissions:

1. **Primary**: Extract from session payload (fast, single query)
2. **Fallback**: Query database tables if not found in session

This ensures permissions are always available, even if Laravel doesn't store them in the session. The fallback queries these tables:
- `user_roles` → `roles`
- `module_permissions` → `modules`
- `link_permissions` → `links`

See [DUAL_SOURCE_PERMISSIONS.md](./DUAL_SOURCE_PERMISSIONS.md) for details.

## 🔍 How It Works

1. **Laravel handles authentication** (login/logout)
2. **Sessions stored in database** (via `SESSION_DRIVER=database`)
3. **Node.js reads from same database**
4. **SDK decodes PHP-serialized session data**
5. **Validates user, role, and permissions**
6. **Returns user data to your app**

```
┌─────────────┐       ┌─────────────┐       ┌──────────────┐
│   Browser   │──────▶│  Next.js    │──────▶│   MySQL      │
│   Cookie    │       │    SDK      │       │   sessions   │
└─────────────┘       └─────────────┘       └──────────────┘
                             │
                             ▼
                      ┌─────────────┐
                      │   Laravel   │
                      │   (Auth)    │
                      └─────────────┘
```

## 🛡️ Security

- ✅ **Read-only** - SDK never modifies Laravel sessions
- ✅ **HTTPS Required** - Use `SESSION_SECURE_COOKIE=true` in production
- ✅ **Session Validation** - Checks expiration, user status, 2FA
- ✅ **Single Session** - Enforces Shooter single-session rule
- ✅ **Connection Pooling** - Prevents connection exhaustion

## 🚀 Performance

### Connection Pooling

The SDK uses connection pooling by default to reuse database connections:

```typescript
const client = new LaravelSessionClient({
  database: {
    // ...
    connectionLimit: 10, // Default: 10 connections in pool
  },
});
```

**Best Practices:**
- Use singleton pattern to reuse client instance across requests
- Adjust `connectionLimit` based on your application's concurrency
- Call `client.close()` during graceful shutdown to release connections

### Performance Characteristics

**Session Payload Permissions (Primary):**
- ⚡ **~10-20ms** per validation
- Single database query
- Fastest option

**Database Fallback Permissions:**
- 🐢 **~50-100ms** per validation
- 3-4 database queries with JOINs
- Always available, real-time data

### Caching (Optional)

For high-traffic apps, cache validation results:

```typescript
// Example with Redis caching
const cacheKey = `session:${sessionId}`;
let result = await redis.get(cacheKey);

if (!result) {
  result = await client.validateSession(sessionId);
  if (result.valid) {
    await redis.setex(cacheKey, 300, JSON.stringify(result)); // 5 min cache
  }
}
```

**Cache Invalidation:**
- Invalidate cache when user logs out
- Consider shorter TTL for permissions if they change frequently
- Use session expiration time as cache TTL

## 🧪 Testing

```bash
npm test
```

Example test:

```typescript
import { LaravelSessionClient } from 'laravel-session-sdk';

const client = new LaravelSessionClient({ /* config */ });

const result = await client.validateSession('test-session-id');

expect(result.valid).toBe(true);
expect(result.user.email).toBe('test@example.com');
```

## 🔧 Troubleshooting

### Session Not Validating

**Problem**: `validateSession()` returns `valid: false`

**Solutions**:
1. Check database connection credentials
2. Verify `SESSION_DRIVER=database` in Laravel `.env`
3. Ensure sessions table exists (`php artisan session:table && php artisan migrate`)
4. Check if session cookie is being sent from frontend
5. Verify `SESSION_DOMAIN` and `SESSION_SECURE_COOKIE` settings match your environment

### Cookie Not Being Sent

**Problem**: Session cookie is not being sent from the browser

**Solutions**:
1. Ensure `credentials: 'include'` in fetch requests:
   ```typescript
   fetch('/api/user', { credentials: 'include' })
   ```
2. Set `SESSION_DOMAIN=.yourdomain.com` in Laravel (include leading dot for subdomains)
3. For local development, use `SESSION_DOMAIN=localhost` or `SESSION_DOMAIN=null`
4. Verify CORS settings allow credentials

### Connection Pool Exhausted

**Problem**: `Error: Connection pool exhausted`

**Solutions**:
1. Increase connection pool limit:
   ```typescript
   database: { connectionLimit: 20 }
   ```
2. Call `client.close()` during graceful shutdown
3. Use singleton pattern to reuse client instance
4. Check for connection leaks in your code

### TypeScript Errors

**Problem**: TypeScript type errors when using the SDK

**Solutions**:
1. Ensure you're importing types correctly:
   ```typescript
   import { LaravelSessionClient, SessionValidationResult } from 'laravel-session-sdk';
   ```
2. Update to latest version: `npm update laravel-session-sdk`
3. Check your `tsconfig.json` includes `"moduleResolution": "node"`

### Sessions Not Decrypting

**Problem**: Encrypted sessions fail to validate

**Solutions**:
1. Provide Laravel's APP_KEY:
   ```typescript
   appKey: process.env.LARAVEL_APP_KEY
   ```
2. Ensure APP_KEY format is correct (starts with `base64:`)
3. Verify APP_KEY matches between Laravel and Node.js
4. Enable debug mode to see decryption attempts:
   ```typescript
   debug: true
   ```

### Permissions Not Found

**Problem**: `permissions` is `null` or `undefined` in validation result

**Solutions**:
1. Check if Laravel stores permissions in session:
   ```php
   // In Laravel, after login
   session(['permissions' => [...]]);
   ```
2. Verify permissions key matches your Laravel session structure:
   ```typescript
   permissionsKey: 'permissions' // or 'user.permissions' for nested
   ```
3. The SDK will automatically fallback to database queries if not found in session
4. Enable debug mode to see permission extraction process:
   ```typescript
   debug: true
   ```

### Multiple Keys Not Working

**Problem**: When using array of `permissionsKey`, only some keys are returned

**Solutions**:
1. Ensure all keys exist in Laravel session:
   ```php
   session([
     'permissions' => [...],
     'competitionIds' => [...],
     'competitionsData' => [...]
   ]);
   ```
2. Keys that don't exist will be `undefined` in the result object
3. Check debug logs to see which keys were found:
   ```typescript
   debug: true
   ```

## ❓ FAQ

### Q: Do I need to modify my Laravel application?

**A:** No! This SDK is read-only and requires zero changes to your Laravel code. Just configure `SESSION_DRIVER=database` in your `.env` file.

### Q: Can I use this with file-based sessions?

**A:** No, this SDK requires database or Redis sessions. File-based sessions cannot be reliably shared across applications.

### Q: Does Redis driver require database configuration?

**A:** Yes, Redis driver still requires database configuration because user information, roles, and permissions are stored in database tables. Redis is only used for session storage, while database is used for user/role/permission queries.

### Q: Does this work with Laravel Sanctum or Passport?

**A:** Yes! This SDK validates Laravel sessions regardless of the authentication system. It works with Laravel's built-in auth, Sanctum, Passport, or custom auth implementations.

### Q: Can I modify sessions from Node.js?

**A:** This SDK is read-only for safety. Session modifications should only be done through Laravel to maintain data integrity. However, you can delete sessions directly from the database if needed (e.g., for logout).

### Q: How do I extract multiple custom keys from the session?

**A:** Use the `permissionsKey` configuration option with an array of keys:

```typescript
const client = new LaravelSessionClient({
  permissionsKey: ['permissions', 'competitionIds', 'competitionsData'],
});

const result = await client.validateSession(sessionId);
// result.permissions.permissions - permissions data
// result.permissions.competitionIds - competition IDs
// result.permissions.competitionsData - competition data
```

See [MULTIPLE_PERMISSIONS_KEYS.md](./MULTIPLE_PERMISSIONS_KEYS.md) for detailed examples.

### Q: How does the dual-source permissions strategy work?

**A:** The SDK first tries to extract permissions from the session payload (fast). If not found, it automatically falls back to querying database tables (`user_roles`, `modules`, `links`). This ensures permissions are always available. See [DUAL_SOURCE_PERMISSIONS.md](./DUAL_SOURCE_PERMISSIONS.md) for details.

### Q: How do I enable debug logging?

**A:** Set `debug: true` in your configuration:

```typescript
const client = new LaravelSessionClient({
  database: { /* ... */ },
  session: { driver: 'database' },
  debug: process.env.NODE_ENV === 'development',
});
```

Debug logs will show session validation steps, permission extraction, and any errors. Disable in production for better performance.

### Q: Can I see full logs with sensitive data for debugging?

**A:** Yes, but use with extreme caution! Set `logLevel: 'verbose'`:

```typescript
const client = new LaravelSessionClient({
  database: { /* ... */ },
  session: { driver: 'database' },
  debug: true,
  logLevel: 'verbose', // Shows full session data, decrypted values, etc.
});
```

**⚠️ Important Security Notes:**
- **Default is `logLevel: 'secure'`** - sanitizes sensitive data (recommended)
- **`logLevel: 'verbose'`** - shows everything including session IDs, tokens, passwords
- **Never use `verbose` in production** - it violates security best practices
- Use `verbose` only in secure development environments when you need to debug session issues
- The SDK defaults to `secure` mode to prevent CWE-312, CWE-359, and CWE-532 vulnerabilities

### Q: What's the performance impact?

**A:** Minimal. With connection pooling enabled, validation takes ~5-20ms. For high-traffic apps, add caching to reduce database queries.

### Q: Is this production-ready?

**A:** Yes! This SDK includes connection pooling, error handling, logging, and has been tested in production environments.

### Q: Does it support multi-tenancy?

**A:** Yes, as long as your Laravel app uses database sessions. Each tenant can have their own database, or you can use a shared sessions table.

### Q: Can I use this with Next.js 13+ App Router?

**A:** Yes! Use it in Server Components, Route Handlers, or Server Actions:
```typescript
import { cookies } from 'next/headers';
import { getLaravelSessionClient } from '@/lib/laravelSession';

export async function GET() {
  const sessionCookie = (await cookies()).get('laravel_session');
  const client = getLaravelSessionClient();
  const result = await client.validateSession(sessionCookie?.value || '');
  return Response.json(result);
}
```

### Q: How do I handle session expiration on the frontend?

**A:** Check the `valid` field and redirect to login:
```typescript
const response = await fetch('/api/auth/user', { credentials: 'include' });
const data = await response.json();

if (!data.valid || !data.authenticated) {
  window.location.href = '/login';
}
```

### Q: Can I use this with Nuxt.js or Vue.js?

**A:** Yes! The SDK works with any Node.js backend. Use it in your Nuxt server middleware or API routes.

## 💬 Support

### Getting Help

- **Documentation**: Read the [full documentation](https://github.com/aakashkanojiya91299/laravel-session-sdk#readme)
- **Issues**: Report bugs or request features on [GitHub Issues](https://github.com/aakashkanojiya91299/laravel-session-sdk/issues)
- **Discussions**: Ask questions in [GitHub Discussions](https://github.com/aakashkanojiya91299/laravel-session-sdk/discussions)
- **Security**: Report vulnerabilities via [Security Policy](https://github.com/aakashkanojiya91299/laravel-session-sdk/security/policy)

### Commercial Support

For enterprise support, custom integrations, or consulting services, contact: [aakash.wowrooms69@gmail.com](mailto:aakash.wowrooms69@gmail.com)

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 License

MIT © [Aakash Kanojiya](https://github.com/aakashkanojiya91299)

## 🔗 Links

- [Documentation](https://github.com/aakashkanojiya91299/laravel-session-sdk#readme)
- [NPM Package](https://www.npmjs.com/package/laravel-session-sdk)
- [GitHub Repository](https://github.com/aakashkanojiya91299/laravel-session-sdk)
- [Report Issues](https://github.com/aakashkanojiya91299/laravel-session-sdk/issues)

## 📚 Additional Documentation

- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and release notes
- **[MULTIPLE_PERMISSIONS_KEYS.md](./MULTIPLE_PERMISSIONS_KEYS.md)** - Guide for extracting multiple session keys
- **[DUAL_SOURCE_PERMISSIONS.md](./DUAL_SOURCE_PERMISSIONS.md)** - Understanding the dual-source permissions strategy
- **[PERMISSIONS_KEY_GUIDE.md](./PERMISSIONS_KEY_GUIDE.md)** - Permissions key configuration guide
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Step-by-step getting started guide
- **[LOCAL_TESTING_GUIDE.md](./LOCAL_TESTING_GUIDE.md)** - Guide for local development and testing

## 📝 Changelog

### Version 1.4.0 (Latest)
- ✅ Conditional debug logging - all logging respects `debug` configuration option
- ✅ Better production performance by eliminating unnecessary logging

### Version 1.3.0
- ✅ Multiple permissions keys support - extract multiple custom keys from session
- ✅ Array support for `permissionsKey` configuration

### Version 1.2.0
- ✅ Dual-source permissions strategy - session payload with database fallback
- ✅ Configurable permissions key with dot notation support

See [CHANGELOG.md](./CHANGELOG.md) for complete version history.

---

Made with ❤️ for Laravel + Node.js developers
