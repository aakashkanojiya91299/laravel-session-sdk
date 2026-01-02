# Laravel Session SDK

> Universal Node.js SDK for validating and managing Laravel sessions in any JavaScript/TypeScript project.

[![npm version](https://badge.fury.io/js/laravel-session-sdk.svg)](https://www.npmjs.com/package/laravel-session-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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
