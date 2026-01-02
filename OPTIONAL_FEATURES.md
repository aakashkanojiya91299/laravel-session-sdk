# Optional Features

The Laravel Session SDK provides optional features that require additional peer dependencies. Only install what you need!

## Core Features (Always Available)

The main export includes:
- ✅ `LaravelSessionClient` - Main session client
- ✅ `DatabaseStore` - MySQL/PostgreSQL session storage
- ✅ `validateNextJsSession` - Next.js middleware (no extra deps needed)
- ✅ `SessionDecoder`, `PhpSerializer`, `SessionValidator`

**Usage:**
```typescript
import { LaravelSessionClient, validateNextJsSession } from 'laravel-session-sdk';
```

**No extra dependencies required!**

---

## Optional: Redis Support

**Install:**
```bash
npm install redis
```

**Usage:**
```typescript
import { LaravelSessionClient } from 'laravel-session-sdk';
import { RedisStore } from 'laravel-session-sdk/redis';

const client = new LaravelSessionClient({
  redis: {
    host: '127.0.0.1',
    port: 6379
  },
  session: {
    driver: 'redis'
  }
});
```

---

## Optional: Express.js Middleware

**Install:**
```bash
npm install express
```

**Usage:**
```typescript
import { LaravelSessionClient } from 'laravel-session-sdk';
import { createExpressMiddleware } from 'laravel-session-sdk/express';

const client = new LaravelSessionClient({ /* config */ });
const authMiddleware = createExpressMiddleware(client);

app.get('/api/user', authMiddleware, (req, res) => {
  res.json(req.laravelSession);
});
```

---

## Optional: NestJS Guard

**Install:**
```bash
npm install @nestjs/common
```

**Usage:**
```typescript
import { LaravelSessionClient } from 'laravel-session-sdk';
import { LaravelSessionGuard } from 'laravel-session-sdk/nestjs';

const sessionClient = new LaravelSessionClient({ /* config */ });

@Module({
  providers: [
    { provide: LaravelSessionClient, useValue: sessionClient },
    LaravelSessionGuard,
  ],
})
export class AuthModule {}
```

---

## Why Separate Imports?

This approach prevents errors like:
```
Module not found: Can't resolve '@nestjs/common'
Module not found: Can't resolve 'redis'
```

You only import (and need) what you actually use! 🎯
