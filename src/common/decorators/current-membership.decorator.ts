import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Memberships } from 'src/generated/prisma/client';

export const CurrentMembership = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Memberships => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ membership?: Memberships }>();
    return request.membership as Memberships;
  },
);
