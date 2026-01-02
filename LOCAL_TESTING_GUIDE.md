# Local Testing Guide - Laravel Session SDK

Complete guide to test the SDK locally before publishing to NPM.

---

## 🧪 Testing Methods

### Method 1: Using `npm link` (Recommended)
### Method 2: Using `npm pack`
### Method 3: Direct path installation

---

## Method 1: Using `npm link` (Recommended)

### Step 1: Build the SDK Package

```bash
# Navigate to SDK directory
cd /home/aakashkanojiya/Desktop/Desktop/python_script_to_get_the_data/laravel-session-sdk

# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Verify build
ls -la dist/
# You should see: index.js, index.d.ts, and other compiled files
```

### Step 2: Link the Package Globally

```bash
# Still in laravel-session-sdk directory
npm link

# This creates a global symlink
# Output: /usr/local/lib/node_modules/@yourorg/laravel-session-sdk -> /path/to/laravel-session-sdk
```

### Step 3: Create a Test Next.js Project

```bash
# Go to your projects directory
cd ~/Desktop

# Create a new Next.js app
npx create-next-app@latest test-laravel-session --typescript --tailwind --app --no-src-dir

# Navigate to the project
cd test-laravel-session
```

### Step 4: Link the SDK in Your Test Project

```bash
# In test-laravel-session directory
npm link @yourorg/laravel-session-sdk

# Install peer dependencies
npm install mysql2

# Verify installation
npm list @yourorg/laravel-session-sdk
# Should show: @yourorg/laravel-session-sdk -> ./../laravel-session-sdk
```

### Step 5: Configure Environment Variables

Create `.env.local`:

```bash
cat > .env.local << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_DATABASE=laravel_db
DB_PORT=3306

# Session Configuration
SESSION_LIFETIME=1000
SESSION_COOKIE_NAME=laravel_session

# Laravel Backend URL
NEXT_PUBLIC_LARAVEL_URL=http://localhost:8000
EOF
```

### Step 6: Create Laravel Session Client

Create `lib/laravelSession.ts`:

```bash
mkdir -p lib
cat > lib/laravelSession.ts << 'EOF'
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
        port: parseInt(process.env.DB_PORT || '3306'),
      },
      session: {
        driver: 'database',
        lifetime: parseInt(process.env.SESSION_LIFETIME || '1000'),
        cookieName: process.env.SESSION_COOKIE_NAME || 'laravel_session',
      },
      debug: process.env.NODE_ENV === 'development',
    });
  }
  return client;
}
EOF
```

### Step 7: Create API Route for Testing

Create `app/api/auth/user/route.ts`:

```bash
mkdir -p app/api/auth/user
cat > app/api/auth/user/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { getLaravelSessionClient } from '@/lib/laravelSession';

export async function GET(request: NextRequest) {
  try {
    const client = getLaravelSessionClient();

    // Get session cookie
    const sessionId = request.cookies.get('laravel_session')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { authenticated: false, error: 'No session cookie' },
        { status: 401 }
      );
    }

    // Validate session
    const result = await client.validateSession(sessionId);

    if (!result.valid) {
      return NextResponse.json(
        { authenticated: false, error: result.error, reason: result.reason },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: result.user,
      role: result.role,
      permissions: result.permissions,
      csrfToken: result.csrfToken,
    });
  } catch (error: any) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
EOF
```

### Step 8: Create Test Page

Create `app/page.tsx`:

```bash
cat > app/page.tsx << 'EOF'
'use client';

import { useEffect, useState } from 'react';

interface User {
  id: number;
  email: string;
  name?: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/user', { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
          setRole(data.role);
        } else {
          setError(data.error);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Not Authenticated</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <a
            href="http://localhost:8000/login"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Login to Laravel
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Laravel Session Test</h1>

        <div className="bg-white shadow-md rounded-lg p-6 mb-4">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <div className="space-y-2">
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Name:</strong> {user?.name || 'N/A'}</p>
            <p><strong>ID:</strong> {user?.id}</p>
            <p><strong>Role:</strong> {role || 'N/A'}</p>
          </div>
        </div>

        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <strong>✅ Success!</strong> Laravel session validation working!
        </div>
      </div>
    </div>
  );
}
EOF
```

### Step 9: Configure Laravel Backend

In your Laravel application:

```bash
# Navigate to your Laravel app
cd /path/to/your-laravel-app

# Update .env
echo "SESSION_DRIVER=database" >> .env
echo "SESSION_DOMAIN=.localhost" >> .env

# Create sessions table if not exists
php artisan session:table
php artisan migrate

# Clear cache
php artisan config:cache
php artisan cache:clear
```

### Step 10: Test the Integration

1. **Start Laravel server:**
   ```bash
   cd /path/to/your-laravel-app
   php artisan serve
   # Running on http://localhost:8000
   ```

2. **Login to Laravel:**
   - Open browser: `http://localhost:8000/login`
   - Login with your credentials
   - Session cookie will be set

3. **Start Next.js dev server:**
   ```bash
   cd ~/Desktop/test-laravel-session
   npm run dev
   # Running on http://localhost:3000
   ```

4. **Test the session:**
   - Open browser: `http://localhost:3000`
   - Should show authenticated user data
   - If not authenticated, click "Login to Laravel"

### Step 11: Debug & Verify

Check if SDK is working:

```bash
# In Next.js terminal, you should see debug logs:
# [LaravelSessionSDK] 🔍 Validating session: abc123...
# [LaravelSessionSDK] ✅ Session found in store
# [LaravelSessionSDK] ✅ User authenticated, ID: 1
# [LaravelSessionSDK] 🎉 Session validation successful!
```

Check browser DevTools:
1. Open DevTools (F12)
2. Go to Application → Cookies
3. Verify `laravel_session` cookie exists
4. Go to Network tab
5. Check API request to `/api/auth/user`
6. Should return 200 with user data

### Step 12: Make Changes and Test

When you update the SDK:

```bash
# 1. Make changes in SDK
cd laravel-session-sdk
# Edit src files...

# 2. Rebuild
npm run build

# 3. Test automatically updates (npm link is live)
# Just refresh your Next.js app!
```

---

## Method 2: Using `npm pack`

### Step 1: Pack the SDK

```bash
cd laravel-session-sdk

# Build first
npm run build

# Create tarball
npm pack
# Creates: yourorg-laravel-session-sdk-1.0.0.tgz
```

### Step 2: Install in Test Project

```bash
cd ~/Desktop/test-laravel-session

# Install from tarball
npm install /path/to/laravel-session-sdk/yourorg-laravel-session-sdk-1.0.0.tgz

# Install peer dependencies
npm install mysql2
```

### Step 3: Test (same as Method 1, Steps 5-11)

**Note**: With this method, you need to re-pack and re-install after every change.

---

## Method 3: Direct Path Installation

### Install Directly from Local Path

```bash
cd ~/Desktop/test-laravel-session

# Install from local directory
npm install /path/to/laravel-session-sdk

# Or add to package.json
cat >> package.json << 'EOF'
{
  "dependencies": {
    "@yourorg/laravel-session-sdk": "file:../laravel-session-sdk"
  }
}
EOF

npm install
```

---

## 🧪 Testing Different Scenarios

### Test 1: Valid Session

```bash
# 1. Login to Laravel
# 2. Open Next.js app
# Expected: User data displayed
```

### Test 2: Expired Session

```bash
# 1. Set SESSION_LIFETIME=1 in .env.local
# 2. Wait 2 minutes
# 3. Refresh Next.js app
# Expected: "Session expired" error
```

### Test 3: Invalid Session

```bash
# 1. Manually delete session cookie in browser
# 2. Refresh Next.js app
# Expected: "No session cookie" error
```

### Test 4: Shooter Single Session

```bash
# 1. Login as Shooter user
# 2. Open in another browser
# 3. Login again
# Expected: First session invalidated
```

### Test 5: 2FA Verification

```bash
# 1. Login as user with 2FA enabled
# 2. Don't complete 2FA
# 3. Check Next.js app
# Expected: "2FA verification required" error
```

---

## 🔍 Debugging Tips

### Enable Debug Mode

In `.env.local`:
```env
NODE_ENV=development
```

In SDK client:
```typescript
const client = new LaravelSessionClient({
  // ... config
  debug: true, // Enable verbose logging
});
```

### Check Database Queries

```sql
-- View active sessions
SELECT * FROM sessions ORDER BY last_activity DESC LIMIT 10;

-- Check specific session
SELECT * FROM sessions WHERE id = 'your-session-id';

-- View session data
SELECT
  id,
  user_id,
  FROM_UNIXTIME(last_activity) as last_seen,
  SUBSTRING(payload, 1, 100) as payload_preview
FROM sessions
WHERE user_id IS NOT NULL;
```

### Check Logs

```bash
# Next.js logs
# Check terminal output

# Laravel logs
tail -f /path/to/laravel/storage/logs/laravel.log
```

### Common Issues

**Issue**: "Cannot find module @yourorg/laravel-session-sdk"
```bash
# Solution: Re-link
cd laravel-session-sdk && npm link
cd test-project && npm link @yourorg/laravel-session-sdk
```

**Issue**: "Database connection failed"
```bash
# Solution: Check .env.local credentials
cat .env.local
mysql -u root -p -e "SHOW DATABASES;"
```

**Issue**: "Session not found"
```bash
# Solution:
# 1. Verify SESSION_DRIVER=database in Laravel
# 2. Check if sessions table exists
# 3. Verify cookie is sent (check DevTools)
```

---

## ✅ Testing Checklist

Before publishing, verify:

- [ ] SDK builds without errors: `npm run build`
- [ ] TypeScript types are generated: `ls dist/*.d.ts`
- [ ] `npm link` works correctly
- [ ] Can validate valid session
- [ ] Returns error for invalid session
- [ ] Returns error for expired session
- [ ] Single session enforcement works (for Shooters)
- [ ] 2FA validation works
- [ ] Permissions are loaded correctly
- [ ] CSRF token is returned
- [ ] Debug logging works
- [ ] Connection pooling works
- [ ] Graceful shutdown works
- [ ] No TypeScript errors in consumer project
- [ ] Works with both MySQL and Redis (if implemented)

---

## 🚀 Ready to Publish?

Once all tests pass:

```bash
# 1. Unlink from test projects
cd test-laravel-session
npm unlink @yourorg/laravel-session-sdk

# 2. Clean SDK
cd laravel-session-sdk
npm run clean
npm run build

# 3. Test one more time with npm pack
npm pack
cd ../test-laravel-session
npm install ../laravel-session-sdk/yourorg-laravel-session-sdk-1.0.0.tgz

# 4. If all works, publish!
cd ../laravel-session-sdk
npm publish --access public
```

---

## 📚 Additional Resources

- [npm link documentation](https://docs.npmjs.com/cli/v8/commands/npm-link)
- [npm pack documentation](https://docs.npmjs.com/cli/v8/commands/npm-pack)
- [Testing npm packages locally](https://docs.npmjs.com/cli/v8/commands/npm-install#local-paths)

---

**Happy Testing! 🧪**
