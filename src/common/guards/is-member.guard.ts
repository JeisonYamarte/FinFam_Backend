import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { Memberships } from 'src/generated/prisma/client';

export interface RequestWithMembership extends Request {
  user: { userId: string };
  membership: Memberships;
  params: { homeId: string; [key: string]: string };
}

@Injectable()
export class IsMemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithMembership>();
    const userId = req.user?.userId;
    const homeId = req.params.homeId;

    const membership = await this.prisma.memberships.findUnique({
      where: { userId_householdId: { userId, householdId: homeId } },
    });

    if (!membership || !membership.isActive) {
      throw new ForbiddenException('You are not a member of this household');
    }

    req.membership = membership;
    return true;
  }
}
