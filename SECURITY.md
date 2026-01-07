# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.4.x   | :white_check_mark: |
| 1.3.x   | :white_check_mark: |
| 1.2.x   | :white_check_mark: |
| 1.1.x   | :x:                |
| 1.0.x   | :x:                |
| < 1.0   | :x:                |

**Note**: We strongly recommend always using the latest version to benefit from the latest security patches and features.

## Reporting a Vulnerability

We take the security of Laravel Session SDK seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Where to Report

**Please DO NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to:

**Email**: [aakash.wowrooms69@gmail.com](mailto:aakash.wowrooms69@gmail.com)

**Subject Line**: `[SECURITY] Laravel Session SDK - [Brief Description]`

### What to Include

Please include the following information in your report:

- **Type of vulnerability** (e.g., SQL injection, authentication bypass, information disclosure)
- **Full paths of source file(s)** related to the vulnerability
- **Location of the affected source code** (tag/branch/commit or direct URL)
- **Step-by-step instructions to reproduce** the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact of the issue**, including how an attacker might exploit it
- **Your name/pseudonym** for credit (if desired)

### What to Expect

After you submit a vulnerability report:

1. **Acknowledgment**: We will acknowledge receipt of your vulnerability report within **48 hours**
2. **Assessment**: We will investigate and validate the vulnerability within **5 business days**
3. **Updates**: We will keep you informed about our progress on fixing the vulnerability
4. **Fix Timeline**: Critical vulnerabilities will be patched within **7 days**, non-critical within **30 days**
5. **Disclosure**: We will coordinate with you on the public disclosure timing
6. **Credit**: We will credit you in the release notes (unless you prefer to remain anonymous)

## Security Best Practices

When using Laravel Session SDK, please follow these security best practices:

### 1. Use HTTPS in Production

Always use HTTPS in production and set secure cookie flags:

```env
# Laravel .env
SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax
```

### 2. Protect Database Credentials

- **Never commit** database credentials to version control
- Use environment variables for all sensitive configuration
- Restrict database user permissions to only what's needed (READ access to sessions/users tables)
- Use separate database users for Node.js and Laravel

### 3. Secure Your Laravel APP_KEY

```typescript
// Use environment variables
const client = new LaravelSessionClient({
  appKey: process.env.LARAVEL_APP_KEY, // Never hardcode!
  // ...
});
```

### 4. Implement Connection Limits

Prevent connection exhaustion attacks:

```typescript
const client = new LaravelSessionClient({
  database: {
    connectionLimit: 10, // Adjust based on your needs
    // ...
  },
});
```

### 5. Input Validation

Always validate session IDs before passing them to the SDK:

```typescript
const sessionId = req.cookies.laravel_session;

// Validate format (avoid injection attacks)
if (!sessionId || !/^[a-zA-Z0-9]{40,}$/.test(sessionId)) {
  return res.status(401).json({ error: 'Invalid session' });
}

const result = await client.validateSession(sessionId);
```

### 6. Rate Limiting

Implement rate limiting on your authentication endpoints:

```typescript
// Example with express-rate-limit
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
});

app.use('/api/auth', authLimiter);
```

### 7. Session Timeout

Respect session lifetime configuration:

```typescript
const client = new LaravelSessionClient({
  session: {
    lifetime: 120, // Match Laravel's SESSION_LIFETIME
  },
});
```

### 8. Error Handling

Don't expose sensitive information in error messages:

```typescript
try {
  const result = await client.validateSession(sessionId);
  if (!result.valid) {
    // Generic error message
    return res.status(401).json({ error: 'Authentication failed' });
  }
} catch (error) {
  // Log detailed error internally
  console.error('[Auth Error]', error);
  // Return generic message to user
  return res.status(500).json({ error: 'Internal server error' });
}
```

### 9. Database Security

- Use prepared statements (SDK does this automatically)
- Enable SSL/TLS for database connections in production
- Regularly update database credentials
- Monitor database access logs

### 10. Dependency Management

Keep dependencies updated:

```bash
# Check for security vulnerabilities
npm audit

# Update dependencies
npm update

# Update to specific versions
npm install laravel-session-sdk@latest
```

## Known Security Considerations

### Read-Only Design

This SDK is intentionally **read-only** for security:

- ✅ Validates sessions without modifying them
- ✅ Cannot create or update user data
- ✅ Reduces attack surface
- ✅ Maintains data integrity

### Session Deletion

The SDK allows session deletion (for logout functionality). This is safe but should be protected:

```typescript
// Protect logout endpoints
app.post('/api/auth/logout', requireAuth, async (req, res) => {
  // Only allow users to delete their own session
  await deleteSession(req.session.id);
});
```

### SQL Injection Protection

The SDK uses parameterized queries for all database operations, protecting against SQL injection:

```typescript
// Safe - uses prepared statements
await pool.execute('SELECT * FROM sessions WHERE id = ?', [sessionId]);
```

### PHP Deserialization

The SDK uses `php-serialize` to deserialize Laravel session data. We only deserialize:

- Session data from trusted sources (your database)
- Standard PHP types (strings, arrays, objects)
- Laravel framework objects (User, Role, Permission)

**Important**: Never deserialize untrusted or user-provided data.

## Security Updates

Security updates will be released as:

- **Patch versions** for minor security fixes (e.g., 1.4.0 → 1.4.1)
- **Minor versions** for moderate security improvements (e.g., 1.4.0 → 1.5.0)
- **Major versions** for breaking security changes (e.g., 1.x.x → 2.0.0)

Subscribe to [GitHub Releases](https://github.com/aakashkanojiya91299/laravel-session-sdk/releases) to stay informed.

## Security Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine affected versions
2. Audit code to find similar problems
3. Prepare fixes for all supported versions
4. Release patches as soon as possible
5. Credit the reporter in release notes (with permission)

### Public Disclosure Timing

- **Critical vulnerabilities**: 7 days after patch release
- **High severity**: 14 days after patch release
- **Medium/Low severity**: 30 days after patch release

We will coordinate with reporters on disclosure timing.

## Bug Bounty Program

We currently do not have a formal bug bounty program. However, we deeply appreciate security researchers who responsibly disclose vulnerabilities:

- Your name/pseudonym will be credited in release notes
- You'll be listed in our Hall of Fame (if desired)
- We're happy to provide references for your responsible disclosure

## Hall of Fame

We thank the following security researchers for their responsible disclosure:

*No vulnerabilities reported yet*

---

## Contact

- **Security Issues**: [aakash.wowrooms69@gmail.com](mailto:aakash.wowrooms69@gmail.com)
- **General Issues**: [GitHub Issues](https://github.com/aakashkanojiya91299/laravel-session-sdk/issues)
- **Documentation**: [GitHub Repository](https://github.com/aakashkanojiya91299/laravel-session-sdk)

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Laravel Security Documentation](https://laravel.com/docs/security)

---

**Last Updated**: January 2025
