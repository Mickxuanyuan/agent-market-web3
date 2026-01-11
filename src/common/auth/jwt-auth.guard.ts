import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { CurrentUser } from './types';

type JwtPayload = {
  sub: string;
  walletAddress: string;
  iat?: number;
  exp?: number;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  // 注入 JWT 服务。
  constructor(private readonly jwt: JwtService) {}

  // 校验 Authorization Bearer token，并注入 request.user。
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, unknown>; user?: CurrentUser }>();

    const authHeader = request.headers['authorization'];
    if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Missing Authorization token');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    if (!payload?.sub || !payload.walletAddress) {
      throw new UnauthorizedException('Invalid token payload');
    }

    request.user = {
      id: BigInt(payload.sub),
      walletAddress: payload.walletAddress,
    };
    return true;
  }
}
