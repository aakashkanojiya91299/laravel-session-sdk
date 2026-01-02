const express = require('express');
const cookieParser = require('cookie-parser');
const { LaravelSessionClient, createExpressMiddleware } = require('../../dist');

const app = express();
app.use(cookieParser());

// Initialize Laravel Session SDK
const sessionClient = new LaravelSessionClient({
  database: {
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'laravel_db',
  },
  session: {
    driver: 'database',
    table: 'sessions',
    lifetime: 1000,
    cookieName: 'laravel_session',
  },
  debug: true,
});

// Create authentication middleware
const authMiddleware = createExpressMiddleware(sessionClient);

// Public route
app.get('/', (req, res) => {
  res.json({
    message: 'Express server with Laravel Session SDK',
    endpoints: {
      user: '/api/user (protected)',
      health: '/health (public)',
    },
  });
});

// Protected routes
app.get('/api/user', authMiddleware, (req, res) => {
  res.json({
    authenticated: true,
    user: req.laravelSession.user,
    role: req.laravelSession.role,
    permissions: req.laravelSession.permissions,
  });
});

app.get('/api/profile', authMiddleware, (req, res) => {
  const { user, role } = req.laravelSession;

  res.json({
    profile: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: role,
    },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
  console.log(`Try: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing connections...');
  await sessionClient.close();
  process.exit(0);
});
