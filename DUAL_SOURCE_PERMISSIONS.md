# Dual-Source Permissions Strategy

## 🎯 Overview

Version 1.2.0 introduces a **smart dual-source permissions strategy** that provides flexibility and reliability:

1. **Primary Source**: Session payload (fast, single query)
2. **Fallback Source**: Database tables (comprehensive, always available)

This ensures your application always has access to user permissions, regardless of how Laravel stores them.

---

## 🔄 How It Works

### The Flow:

```
User Request
    ↓
Validate Session & Get User ID
    ↓
Try: Get Permissions from Session Payload
    ├─ ✅ Found → Return permissions
    │
    └─ ❌ Not Found
        ↓
    Fallback: Query Database Tables
        ├─ user_roles
        ├─ modules
        └─ links
        ↓
    ✅ Return all permissions
```

### Code Implementation:

```typescript
async getUserPermissions(userId: number): Promise<any> {
  // Step 1: Try to get from session payload
  const session = await getSessionByUserId(userId);
  const sessionData = decode(session.payload);
  const permissions = extractPermissions(sessionData);
  
  if (permissions) {
    return permissions; // ✅ Found in session
  }
  
  // Step 2: Fallback to database
  return await getAllPermissionsFromDatabase(userId); // ✅ Fetch from DB
}
```

---

## 📊 Comparison

### Primary: Session Payload

**Pros:**
- ⚡ **Fast**: Single database query
- 🎯 **Simple**: No complex JOINs
- 🔄 **Consistent**: Same data Laravel uses
- 💾 **Cached**: Already in memory (session)

**Cons:**
- ⚠️ Requires permissions to be stored in session
- 🔄 Needs session refresh when permissions change

**When to use:**
- Laravel stores permissions in session after login
- You want maximum performance
- Permissions don't change frequently during session

### Fallback: Database Tables

**Pros:**
- ✅ **Always works**: No session configuration needed
- 🔄 **Real-time**: Always reflects latest permissions
- 📊 **Comprehensive**: Gets all permission details
- 🛡️ **Reliable**: Independent of session structure

**Cons:**
- 🐢 Slower (3+ database queries with JOINs)
- 🔧 Requires specific table structure

**When to use:**
- Laravel doesn't store permissions in session
- Permissions change frequently
- You need real-time permission updates

---

## 🎛️ Configuration

No configuration needed! The SDK automatically:
1. ✅ Tries session first
2. ✅ Falls back to database if needed

### Optional: Specify Permissions Key

If your Laravel app stores permissions in session with a custom key:

```typescript
const client = new LaravelSessionClient({
  // ... other config
  permissionsKey: 'user.permissions', // Custom key (supports dot notation)
});
```

---

## 📈 Performance

### Scenario 1: Permissions in Session (Primary)

```
1 DB query → Decode payload → Extract permissions
⏱️ ~10-20ms
```

### Scenario 2: Fallback to Database

```
1 DB query (session) + 3 DB queries (roles, modules, links)
⏱️ ~50-100ms
```

Both are fast enough for most applications!

---

## 🔍 Database Schema Requirements (for Fallback)

The fallback method expects these tables:

### `user_roles` table:
```sql
CREATE TABLE user_roles (
  user_id INT,
  role_id INT
);
```

### `roles` table:
```sql
CREATE TABLE roles (
  id INT PRIMARY KEY,
  role_name VARCHAR(255)
);
```

### `modules` table:
```sql
CREATE TABLE modules (
  id INT PRIMARY KEY,
  module_name VARCHAR(255),
  url VARCHAR(255),
  deleted_at TIMESTAMP NULL
);
```

### `module_permissions` table:
```sql
CREATE TABLE module_permissions (
  module_id INT,
  role_id INT,
  deleted_at TIMESTAMP NULL
);
```

### `links` table:
```sql
CREATE TABLE links (
  id INT PRIMARY KEY,
  link_name VARCHAR(255),
  permission_module_id INT,
  url VARCHAR(255),
  deleted_at TIMESTAMP NULL
);
```

### `link_permissions` table:
```sql
CREATE TABLE link_permissions (
  link_id INT,
  role_id INT,
  deleted_at TIMESTAMP NULL
);
```

---

## 🎯 Use Cases

### Use Case 1: Maximum Performance

**Scenario**: High-traffic application, permissions don't change often

**Solution**:
```php
// Laravel: Store permissions in session after login
session(['permissions' => [
    'role' => $user->role,
    'modules' => $user->modules,
    'links' => $user->links,
]]);
```

**Result**: ⚡ SDK uses session payload (10-20ms per request)

### Use Case 2: Real-Time Permissions

**Scenario**: Permissions change frequently, need immediate updates

**Solution**:
- Don't store permissions in session (or use custom key)
- Let SDK use database fallback

**Result**: 🔄 Always fresh permissions (50-100ms per request)

### Use Case 3: Hybrid Approach

**Scenario**: Want speed + freshness

**Solution**:
```php
// Laravel: Cache permissions in session for 5 minutes
if (!session()->has('permissions') || session('permissions_cached_at') < now()->subMinutes(5)) {
    session([
        'permissions' => $user->getPermissions(),
        'permissions_cached_at' => now(),
    ]);
}
```

**Result**: ⚡ Fast (session) + 🔄 Fresh (refreshes every 5 min)

---

## 🐛 Debugging

### Check Which Source is Being Used

Look at the logs:

#### Session Payload Found:
```
[DatabaseStore] ✅ Permissions extracted from session payload
[DatabaseStore] 📋 Role: Super Admin
[DatabaseStore] 📋 Modules: 143
[DatabaseStore] 📋 Links: 91
```

#### Fallback to Database:
```
[DatabaseStore] ⚠️  No permissions found in session payload
[DatabaseStore] 🔄 Fetching all permissions from database as fallback...
[DatabaseStore] 📊 Fetching all permissions from database tables...
[DatabaseStore] 👤 User roles: ["Super Admin"]
[DatabaseStore] 📋 User modules: 143
[DatabaseStore] 🔗 User links: 91
[DatabaseStore] ✅ All permissions fetched from database
```

---

## ✅ Benefits of Dual-Source

1. **Flexibility**: Works with any Laravel permission storage strategy
2. **Reliability**: Always returns permissions (if user has any)
3. **Performance**: Fast when possible, reliable always
4. **Zero Configuration**: Automatic fallback, no setup needed
5. **Backward Compatible**: Works with existing applications

---

## 🚀 Migration Guide

### From Version 1.1.0 → 1.2.0

**Good News**: No breaking changes! 

The SDK will automatically use the dual-source strategy. Your existing code works without modifications.

**Optional Optimization**:

If you want to use session payload (faster), add this to your Laravel login:

```php
// In LoginController or AuthController
public function login(Request $request) {
    // ... validate credentials
    
    Auth::login($user);
    
    // Store permissions in session
    session(['permissions' => [
        'role' => $user->roles->first()->role_name,
        'role_arr' => $user->roles->pluck('role_name')->toArray(),
        'modules' => $user->getModules(),
        'links' => $user->getLinks(),
    ]]);
    
    return redirect('/dashboard');
}
```

---

## 📚 References

- Main README: `README.md`
- Permissions Key Guide: `PERMISSIONS_KEY_GUIDE.md`
- Changelog: `CHANGELOG.md`
- Example Usage: `examples/`

