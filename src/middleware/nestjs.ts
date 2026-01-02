import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { LaravelSessionClient } from '../LaravelSessionClient';

@Injectable()
export class LaravelSessionGuard implements CanActivate {
  constructor(private client: LaravelSessionClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionId = request.cookies[this.client.getSessionCookieName()];

    if (!sessionId) {
      return false;
    }

    const result = await this.client.validateSession(sessionId);

    if (!result.valid) {
      return false;
    }

    // Attach session to request
    request.laravelSession = result;

    return true;
  }
}
