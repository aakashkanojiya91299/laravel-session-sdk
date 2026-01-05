# Multiple Permissions Keys Support

## 🎯 New Feature in v1.3.0

The SDK now supports extracting **multiple custom keys** from the Laravel session, perfect for applications that store additional data like competition information alongside permissions.

---

## 📋 Use Case: Competition Data

Your Laravel application stores multiple keys in the session:
- `permissions` - User roles, modules, links
- `competitionIds` - Array of competition IDs
- `competitionsData` - Competition details
- `competitionCategories` - Competition categories

**Now you can extract ALL of them at once!**

---

## 🔧 Configuration

### Single Key (Original Behavior)

```typescript
const client = new LaravelSessionClient({
  // ... other config
  permissionsKey: 'permissions', // Single string
});
```

**Result:**
```json
{
  "role": "Super Admin",
  "modules": [...],
  "links": [...]
}
```

### Multiple Keys (New Feature)

```typescript
const client = new LaravelSessionClient({
  // ... other config
  permissionsKey: [
    'permissions',
    'competitionIds',
    'competitionsData',
    'competitionCategories'
  ] // Array of strings
});
```

**Result:**
```json
{
  "permissions": {
    "role": "Super Admin",
    "modules": [...],
    "links": [...]
  },
  "competitionIds": [1, 5, 12, 23],
  "competitionsData": [
    { "id": 1, "name": "National Championship" },
    { "id": 5, "name": "State Level" }
  ],
  "competitionCategories": [
    { "id": 1, "name": "Rifle Shooting" },
    { "id": 2, "name": "Pistol Shooting" }
  ]
}
```

---

## 💻 Frontend Implementation

### Update `frontend/lib/laravelSession.ts`:

```typescript
import { LaravelSessionClient } from 'laravel-session-sdk';

let client: LaravelSessionClient | null = null;

export function getLaravelSessionClient(): LaravelSessionClient {
  if (!client) {
    client = new LaravelSessionClient({
      database: {
        type: 'mysql',
        host: process.env.DB_HOST!,
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_NAME!,
        connectionLimit: 10,
      },
      session: {
        driver: 'database',
        table: process.env.SESSION_TABLE || 'sessions',
        lifetime: parseInt(process.env.SESSION_LIFETIME || '1000'),
        cookieName: process.env.SESSION_COOKIE_NAME || 'laravel_session',
      },
      appKey: process.env.APP_KEY,
      debug: process.env.NODE_ENV === 'development',
      // ✨ NEW: Extract multiple keys from session
      permissionsKey: [
        'permissions',
        'competitionIds',
        'competitionsData',
        'competitionCategories'
      ]
    });
  }

  return client;
}
```

### API Route (`app/api/auth/user/route.ts`):

```typescript
import { getLaravelSessionClient } from '@/lib/laravelSession';

export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  
  if (!cookieHeader) {
    return Response.json({ error: 'No session cookie' }, { status: 401 });
  }

  const client = getLaravelSessionClient();
  const validSession = await client.validateSession(cookieHeader);

  if (!validSession.valid) {
    return Response.json({ error: validSession.error }, { status: 401 });
  }

  // ✨ Now permissions includes all requested keys!
  return Response.json({
    user: validSession.user,
    permissions: validSession.permissions, // Contains all 4 keys
    csrfToken: validSession.csrfToken,
  });
}
```

### Frontend Component Usage:

```typescript
// In your React component
const { user, permissions, loading } = useLaravelAuth();

if (permissions) {
  // Access permissions
  console.log('Role:', permissions.permissions.role);
  console.log('Modules:', permissions.permissions.modules);
  
  // ✨ Access competition data
  console.log('Competition IDs:', permissions.competitionIds);
  console.log('Competitions:', permissions.competitionsData);
  console.log('Categories:', permissions.competitionCategories);
}
```

---

## 🔍 Laravel Side: Storing Multiple Keys

### In Your Login Controller:

```php
<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        // ... validate credentials
        
        if (Auth::attempt($credentials)) {
            $user = Auth::user();
            
            // Store permissions in session
            session([
                'permissions' => [
                    'role' => $user->roles->first()->role_name,
                    'role_arr' => $user->roles->pluck('role_name')->toArray(),
                    'modules' => $user->getModules(),
                    'links' => $user->getLinks(),
                ],
                
                // Store competition data
                'competitionIds' => $user->competitions->pluck('id')->toArray(),
                'competitionsData' => $user->competitions->map(fn($c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'start_date' => $c->start_date,
                    'end_date' => $c->end_date,
                ])->toArray(),
                'competitionCategories' => $user->competitionCategories->toArray(),
            ]);
            
            return redirect('/dashboard');
        }
        
        return back()->withErrors(['email' => 'Invalid credentials']);
    }
}
```

---

## 📊 How It Works

### Flow Diagram:

```
User Login (Laravel)
    ↓
Store multiple keys in session:
  - permissions
  - competitionIds
  - competitionsData
  - competitionCategories
    ↓
Session saved to database (PHP serialized + base64)
    ↓
Frontend makes request with session cookie
    ↓
SDK decrypts cookie → Gets session ID
    ↓
SDK queries database → Gets payload
    ↓
SDK decodes payload (base64 + PHP unserialize)
    ↓
SDK extracts ALL specified keys
    ↓
Returns object with all keys:
{
  permissions: {...},
  competitionIds: [...],
  competitionsData: [...],
  competitionCategories: [...]
}
```

---

## ✅ Benefits

1. **🚀 Performance**: Single query to get all data
2. **🎯 Simplicity**: No need for multiple API calls
3. **🔄 Consistency**: All data comes from the same session
4. **💾 Cached**: Session data is cached by Laravel
5. **🔧 Flexible**: Works with any number of keys

---

## 🎛️ Backward Compatibility

**Single key still works:**
```typescript
permissionsKey: 'permissions' // Returns just the permissions object
```

**Multiple keys:**
```typescript
permissionsKey: ['permissions', 'competitionIds'] // Returns object with both
```

---

## 🧪 Testing

### Test Multiple Keys:

```bash
cd /home/aakashkanojiya/Desktop/Desktop/python_script_to_get_the_data/laravel-session-sdk

# Build the SDK
npm run build

# Publish v1.3.0
npm publish

# Install in frontend
cd ../frontend
npm install laravel-session-sdk@1.3.0

# Start dev server
npm run dev
```

### Check Browser Console:

```javascript
// You should see:
{
  permissions: {
    role: "Super Admin",
    modules: [...143 items],
    links: [...91 items]
  },
  competitionIds: [1, 5, 12, 23],
  competitionsData: [...],
  competitionCategories: [...]
}
```

---

## 🐛 Troubleshooting

### "Keys not found in session"

**Problem**: Laravel isn't storing the keys

**Solution**: Check your Laravel login controller and ensure you're calling:
```php
session(['competitionIds' => ...]);
```

### "Getting null for some keys"

**Problem**: Keys exist but are empty/null in session

**Solution**: Verify the data exists:
```php
// In Laravel
dd(session()->all()); // Check what's actually in the session
```

### "Only seeing permissions, not other keys"

**Problem**: SDK config might not be updated

**Solution**: 
1. Rebuild SDK: `npm run build`
2. Reinstall in frontend: `npm install`
3. Restart dev server

---

## 📚 References

- Main README: `README.md`
- Permissions Guide: `PERMISSIONS_KEY_GUIDE.md`
- Dual-Source Strategy: `DUAL_SOURCE_PERMISSIONS.md`
- Changelog: `CHANGELOG.md`

