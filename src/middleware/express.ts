import { Request, Response, NextFunction } from 'express';
import { LaravelSessionClient } from '../LaravelSessionClient';
import { SessionValidationResult } from '../types';

declare global {
  namespace Express {
    interface Request {
      laravelSession?: SessionValidationResult;
    }
  }
}

export function createExpressMiddleware(client: LaravelSessionClient) {
  return async (req: Request, res: Response, next: NextFunction) => {
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

      return next();
    } catch (error: any) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  };
}
