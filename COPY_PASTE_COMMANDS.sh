#!/bin/bash

# ============================================================================
# COPY-PASTE COMMANDS FOR LOCAL TESTING
# ============================================================================
# Just copy these commands one by one into your terminal

# ============================================================================
# STEP 1: BUILD AND LINK THE SDK
# ============================================================================

# Navigate to SDK directory
cd /home/aakashkanojiya/Desktop/Desktop/python_script_to_get_the_data/laravel-session-sdk

# Install dependencies and build
npm install
npm run build

# Create global link
npm link

# Verify build
ls -la dist/

# Test import (should show exported classes)
node -e "const sdk = require('./dist'); console.log(Object.keys(sdk));"

# ============================================================================
# STEP 2: CREATE TEST NEXT.JS PROJECT
# ============================================================================

# Go to your workspace
cd ~/Desktop

# Create new Next.js app
npx create-next-app@latest test-laravel-session \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"

# Navigate to project
cd test-laravel-session

# Link the SDK
npm link @yourorg/laravel-session-sdk

# Install peer dependencies
npm install mysql2

# ============================================================================
# STEP 3: CREATE CONFIGURATION FILES
# ============================================================================

# Create .env.local
cat > .env.local << 'ENVEOF'
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_DATABASE=laravel_db
DB_PORT=3306
SESSION_LIFETIME=1000
SESSION_COOKIE_NAME=laravel_session
NEXT_PUBLIC_LARAVEL_URL=http://localhost:8000
ENVEOF

# Create lib directory
mkdir -p lib

# Create Laravel session client
cat > lib/laravelSession.ts << 'TSEOF'
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
TSEOF

# Create API route directory
mkdir -p app/api/auth/user

# Create API route
cat > app/api/auth/user/route.ts << 'APIEOF'
import { NextRequest, NextResponse } from 'next/server';
import { getLaravelSessionClient } from '@/lib/laravelSession';

export async function GET(request: NextRequest) {
  try {
    const client = getLaravelSessionClient();
    const sessionId = request.cookies.get('laravel_session')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { authenticated: false, error: 'No session cookie' },
        { status: 401 }
      );
    }

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
APIEOF

# Create test page
cat > app/page.tsx << 'PAGEEOF'
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
        <h1 className="text-3xl font-bold mb-8">Laravel Session SDK Test</h1>

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
PAGEEOF

echo ""
echo "✅ All files created!"
echo ""

# ============================================================================
# STEP 4: CONFIGURE LARAVEL (Run these in your Laravel project)
# ============================================================================

echo "Now configure your Laravel backend:"
echo ""
echo "cd /path/to/your-laravel-app"
echo ""
echo "# Update .env file"
echo "echo 'SESSION_DRIVER=database' >> .env"
echo "echo 'SESSION_DOMAIN=.localhost' >> .env"
echo ""
echo "# Create sessions table"
echo "php artisan session:table"
echo "php artisan migrate"
echo ""
echo "# Clear cache"
echo "php artisan config:cache"
echo "php artisan cache:clear"
echo ""

# ============================================================================
# STEP 5: RUN THE TEST
# ============================================================================

echo "To test:"
echo ""
echo "Terminal 1 (Laravel):"
echo "  cd /path/to/your-laravel-app"
echo "  php artisan serve"
echo ""
echo "Terminal 2 (Next.js):"
echo "  cd ~/Desktop/test-laravel-session"
echo "  npm run dev"
echo ""
echo "Then:"
echo "1. Open http://localhost:8000/login and login"
echo "2. Open http://localhost:3000 to see your user data"
echo ""

# ============================================================================
# CLEANUP (When done testing)
# ============================================================================

echo "To clean up when done:"
echo ""
echo "# Unlink from test project"
echo "cd ~/Desktop/test-laravel-session"
echo "npm unlink @yourorg/laravel-session-sdk"
echo ""
echo "# Unlink globally"
echo "cd /home/aakashkanojiya/Desktop/Desktop/python_script_to_get_the_data/laravel-session-sdk"
echo "npm unlink"
echo ""
