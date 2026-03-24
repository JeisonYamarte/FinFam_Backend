import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Role } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { RequestWithMembership } from './is-member.guard';

@Injectable()
export class IsAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithMembership>();
    const userId = req.user?.userId;
    const homeId = req.params.homeId;

    const membership = await this.prisma.memberships.findUnique({
      where: { userId_householdId: { userId, householdId: homeId } },
    });

    if (!membership || !membership.isActive || membership.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can perform this action');
    }

    req.membership = membership;
    return true;
  }
}
