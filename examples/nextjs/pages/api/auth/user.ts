import { NextApiRequest, NextApiResponse } from 'next';
import { LaravelSessionClient, validateNextJsSession } from '../../../../../dist';

// Initialize client (in production, use singleton pattern)
const sessionClient = new LaravelSessionClient({
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await validateNextJsSession(req, sessionClient);

    if (!result.valid) {
      return res.status(401).json({
        authenticated: false,
        error: result.error,
        reason: result.reason,
      });
    }

    return res.status(200).json({
      authenticated: true,
      user: result.user,
      role: result.role,
      permissions: result.permissions,
      csrfToken: result.csrfToken,
    });
  } catch (error: any) {
    console.error('Session validation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
