# Getting Started with Laravel Session SDK

## Installation & Setup Guide

### Step 1: Install the Package

```bash
cd laravel-session-sdk
npm install
```

### Step 2: Build the Package

```bash
npm run build
```

This will compile TypeScript to JavaScript in the `dist/` directory.

### Step 3: Test Locally (Before Publishing)

**Quick Method:**
```bash
# Run the quick test script
./QUICK_TEST.sh
```

**Manual Method:**
```bash
# In the laravel-session-sdk directory
npm link

# In your Next.js/Express project
npm link @yourorg/laravel-session-sdk
```

📖 **For detailed testing instructions, see [LOCAL_TESTING_GUIDE.md](LOCAL_TESTING_GUIDE.md)**

### Step 4: Use in Your Project

#### For Next.js:

1. Create `.env.local`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_DATABASE=laravel_db
SESSION_LIFETIME=1000
NEXT_PUBLIC_LARAVEL_URL=http://localhost:8000
```

2. Create `lib/laravelSession.ts`:

```typescript
import { LaravelSessionClient } from '@yourorg/laravel-session-sdk';

let client: LaravelSessionClient | null = null;

export function getLaravelSessionClient(): LaravelSessionClient {
  if (!client) {
    client = new LaravelSessionClient({
      database: {
        type: 'mysql',
        host: process.env.DB_HOST!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_DATABASE!,
      },
      session: {
        driver: 'database',
        lifetime: parseInt(process.env.SESSION_LIFETIME || '1000'),
      },
      debug: process.env.NODE_ENV === 'development',
    });
  }
  return client;
}
```

3. Create API route `pages/api/auth/user.ts`:

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { getLaravelSessionClient } from '@/lib/laravelSession';
import { validateNextJsSession } from '@yourorg/laravel-session-sdk';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = getLaravelSessionClient();
  const result = await validateNextJsSession(req, client);

  if (!result.valid) {
    return res.status(401).json({ error: result.error });
  }

  return res.json({
    authenticated: true,
    user: result.user,
    role: result.role,
  });
}
```

4. Use in React component:

```typescript
import { useLaravelAuth } from '@/hooks/useLaravelAuth';

export default function Dashboard() {
  const { user, role, loading, authenticated } = useLaravelAuth();

  if (loading) return <div>Loading...</div>;
  if (!authenticated) return <div>Please login</div>;

  return (
    <div>
      <h1>Welcome, {user?.email}</h1>
      <p>Role: {role}</p>
    </div>
  );
}
```

### Step 5: Configure Laravel Backend

In your Laravel `.env` file:

```env
SESSION_DRIVER=database
SESSION_DOMAIN=.localhost  # For local dev
SESSION_SECURE_COOKIE=false  # true for production HTTPS
```

Run migrations:

```bash
cd /path/to/your-laravel-app
php artisan session:table
php artisan migrate
php artisan config:cache
```

### Step 6: Test the Integration

1. Login to your Laravel app at `http://localhost:8000/login`
2. The session cookie will be set: `laravel_session=...`
3. Navigate to your Next.js app at `http://localhost:3000`
4. The Next.js app should detect the session and show user data

### Step 7: Publish to NPM (Optional)

When ready to publish:

```bash
# Login to NPM
npm login

# Publish
npm publish --access public
```

Then install in any project:

```bash
npm install @yourorg/laravel-session-sdk mysql2
```

## Troubleshooting

### Issue: "Cannot find module"

Make sure you've built the package:
```bash
npm run build
```

### Issue: "Database connection failed"

Check your `.env` credentials match your database:
```bash
mysql -u root -p
SHOW DATABASES;
```

### Issue: "Session not found"

1. Verify `SESSION_DRIVER=database` in Laravel
2. Check if sessions table exists: `SHOW TABLES LIKE 'sessions';`
3. Verify cookie is being sent (check browser DevTools > Application > Cookies)

### Issue: "MAC verification failed"

This happens when trying to decrypt sessions without the correct `APP_KEY`. Either:
1. Don't set `appKey` in config (for unencrypted sessions)
2. Or copy exact `APP_KEY` from Laravel's `.env`

## Development Workflow

```bash
# Watch mode for development
npm run dev

# Format code
npm run format

# Lint code
npm run lint

# Run tests
npm test

# Clean build
npm run clean
npm run build
```

## Next Steps

- Read the full [README.md](README.md)
- Check [examples/](examples/) for complete working examples
- Review [API Reference](README.md#api-reference)
