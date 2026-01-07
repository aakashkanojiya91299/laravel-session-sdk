---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

## Bug Description

A clear and concise description of what the bug is.

## Steps to Reproduce

1. Initialize SDK with '...'
2. Call method '...'
3. Expected '...' but got '...'
4. See error

## Expected Behavior

A clear description of what you expected to happen.

## Actual Behavior

What actually happened.

## Code Sample

```typescript
// Your code here
const client = new LaravelSessionClient({
  // ...
});

const result = await client.validateSession('...');
```

## Environment

- **SDK Version**: [e.g., 1.4.0]
- **Node.js Version**: [e.g., 20.11.0]
- **Framework**: [e.g., Next.js 16.1.1, Express 4.x]
- **Database**: [e.g., MySQL 8.0, PostgreSQL 15]
- **Session Driver**: [database / redis]
- **Laravel Version**: [e.g., 11.x]
- **OS**: [e.g., Ubuntu 22.04, macOS 14]

## Error Messages

```
Paste any error messages or stack traces here
```

## Configuration

```typescript
// Your configuration (remove sensitive data)
const config = {
  database: {
    type: 'mysql',
    // ...
  },
  session: {
    driver: 'database',
    // ...
  },
};
```

## Additional Context

Add any other context about the problem here (logs, screenshots, etc.).

## Possible Solution

If you have suggestions on how to fix the bug, please describe them here.
