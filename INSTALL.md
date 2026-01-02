# Installation Instructions

## Quick Install & Setup

### 1. Navigate to Project
```bash
cd /home/aakashkanojiya/Desktop/Desktop/python_script_to_get_the_data/laravel-session-sdk
```

### 2. Run Setup Script
```bash
chmod +x setup.sh
./setup.sh
```

This will:
- Install all dependencies
- Compile TypeScript to JavaScript
- Create `dist/` folder with compiled code

### 3. Test Locally

Link the package globally to test in other projects:

```bash
# In this directory
npm link

# In your Next.js/Express project
cd /path/to/your/nextjs-project
npm link @yourorg/laravel-session-sdk
```

### 4. Use in Your Project

```typescript
import { LaravelSessionClient } from '@yourorg/laravel-session-sdk';

const client = new LaravelSessionClient({
  database: {
    type: 'mysql',
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_DATABASE!,
  },
  session: {
    driver: 'database',
  },
});

// Use it
const result = await client.validateSession(sessionId);
```

## Manual Installation

If you prefer manual steps:

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# The dist/ folder now contains compiled code
```

## Verify Installation

Check if build was successful:

```bash
ls -la dist/
```

You should see:
- `index.js`
- `index.d.ts`
- And other compiled files

## Next Steps

1. Read [README.md](README.md) for full documentation
2. Check [examples/](examples/) for usage examples
3. See [GETTING_STARTED.md](GETTING_STARTED.md) for integration guide

## Troubleshooting

### Error: "Cannot find module 'php-serialize'"

Solution:
```bash
npm install
```

### Error: "tsc: command not found"

Solution:
```bash
npm install -g typescript
# or
npx tsc
```

### Build fails with TypeScript errors

Solution:
```bash
# Clean and rebuild
npm run clean
npm run build
```
