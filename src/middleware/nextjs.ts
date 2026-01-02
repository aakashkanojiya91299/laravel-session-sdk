import { NextApiRequest, NextApiResponse } from 'next';
import { LaravelSessionClient } from '../LaravelSessionClient';
import { SessionValidationResult } from '../types';

export interface NextApiRequestWithSession extends NextApiRequest {
  laravelSession?: SessionValidationResult;
}

export function createNextJsMiddleware(client: LaravelSessionClient) {
  return async (
    req: NextApiRequestWithSession,
    res: NextApiResponse,
    next: () => void
  ) => {
    const sessionId = req.cookies[client.getSessionCookieName()];

    if (!sessionId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No session cookie found',
      });
    }

    try {
      const result = await client.validateSession(sessionId);

      if (!result.valid) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: result.error,
          reason: result.reason,
        });
      }

      // Attach session data to request
      req.laravelSession = result;

      next();
    } catch (error: any) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  };
}

/**
 * Helper function for Next.js API routes
 */
export async function validateNextJsSession(
  req: NextApiRequest,
  client: LaravelSessionClient
): Promise<SessionValidationResult> {
  const sessionId = req.cookies[client.getSessionCookieName()];

  if (!sessionId) {
    return {
      valid: false,
      error: 'No session cookie found',
    };
  }

  return client.validateSession(sessionId);
}
