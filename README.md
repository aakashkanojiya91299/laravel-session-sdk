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
- ✅ **Database & Redis** - Supports both session drivers
- ✅ **TypeScript** - Full type definitions included
- ✅ **Session Decoding** - Handles PHP serialization automatically
- ✅ **Single Session Enforcement** - Respects Laravel's session logic
- ✅ **2FA Support** - Validates two-factor authentication
- ✅ **Permissions** - Access user permissions from session
- ✅ **Production Ready** - Connection pooling, error handling, logging

## 📦 Installation

```bash
npm install laravel-session-sdk mysql2
```

For Redis support:
```bash
npm install laravel-session-sdk mysql2 redis
```

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

## 🔒 Laravel Setup (Zero Code Changes!)

### Step 1: Change Session Driver

In your Laravel app's `.env`:

```env
SESSION_DRIVER=database  # Change from 'file'
SESSION_DOMAIN=.yourdomain.com
SESSION_SECURE_COOKIE=true
```

### Step 2: Create Sessions Table

```bash
php artisan session:table
php artisan migrate
```

### Step 3: Clear Cache

```bash
php artisan config:cache
php artisan cache:clear
```

That's it! No code changes needed in Laravel.

## 📚 API Reference

### LaravelSessionClient

#### `constructor(config: LaravelSessionConfig)`

Creates a new client instance.

#### `validateSession(sessionId: string): Promise<SessionValidationResult>`

Validates a Laravel session and returns user data.

**Returns:**
```typescript
{
  valid: boolean;
  user?: {
    id: number;
    email: string;
    name?: string;
  };
  role?: string;
  permissions?: any;
  sessionId?: string;
  csrfToken?: string;
  error?: string;
  reason?: string;
}
```

#### `getSessionCookieName(): string`

Returns the session cookie name (default: `laravel_session`).

#### `close(): Promise<void>`

Closes all database connections. Call this during graceful shutdown.

### Middleware Functions

#### `createExpressMiddleware(client: LaravelSessionClient)`

Creates Express.js middleware.

#### `validateNextJsSession(req: NextApiRequest, client: LaravelSessionClient)`

Helper for Next.js API routes.

#### `createNextJsMiddleware(client: LaravelSessionClient)`

Creates Next.js middleware (for custom middleware chains).

### Types

```typescript
interface LaravelSessionConfig {
  database?: {
    type: 'mysql' | 'postgres';
    host: string;
    port?: number;
    user: string;
    password: string;
    database: string;
    connectionLimit?: number;
  };
  redis?: {
    host: string;
    port?: number;
    password?: string;
    db?: number;
  };
  session: {
    driver: 'database' | 'redis';
    table?: string;
    lifetime?: number;
    cookieName?: string;
    prefix?: string;
  };
  appKey?: string;
  debug?: boolean;
}
```

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

```typescript
const client = new LaravelSessionClient({
  database: {
    // ...
    connectionLimit: 10, // Reuse connections
  },
});
```

### Caching (Optional)

For high-traffic apps, cache validation results:

```typescript
// Pseudo-code
const cacheKey = `session:${sessionId}`;
let result = await redis.get(cacheKey);

if (!result) {
  result = await client.validateSession(sessionId);
  await redis.setex(cacheKey, 300, JSON.stringify(result)); // 5 min cache
}
```

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

## ❓ FAQ

### Q: Do I need to modify my Laravel application?

**A:** No! This SDK is read-only and requires zero changes to your Laravel code. Just configure `SESSION_DRIVER=database` in your `.env` file.

### Q: Can I use this with file-based sessions?

**A:** No, this SDK requires database or Redis sessions. File-based sessions cannot be reliably shared across applications.

### Q: Does this work with Laravel Sanctum or Passport?

**A:** Yes! This SDK validates Laravel sessions regardless of the authentication system. It works with Laravel's built-in auth, Sanctum, Passport, or custom auth implementations.

### Q: Can I modify sessions from Node.js?

**A:** This SDK is read-only for safety. Session modifications should only be done through Laravel to maintain data integrity. However, you can delete sessions (e.g., for logout).

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

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

Made with ❤️ for Laravel + Node.js developers
