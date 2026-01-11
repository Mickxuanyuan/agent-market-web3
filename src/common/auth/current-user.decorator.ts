import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { CurrentUser as CurrentUserType } from './types';

// 从 request.user 里取出当前用户上下文。
// request.user 由 WalletAuthGuard 写入，所以此装饰器必须配合 guard 使用。
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserType => {
    const request =
      ctx.switchToHttp().getRequest<{ user?: CurrentUserType }>();
    if (!request.user) {
      throw new Error('CurrentUser requires JwtAuthGuard');
    }
    return request.user;
  },
);
