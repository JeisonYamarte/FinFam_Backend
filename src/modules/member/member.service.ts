import { Injectable } from '@nestjs/common';
import { Role } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class MemberService {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveMembership(userId: string, householdId: string) {
    return this.prisma.memberships.findFirst({
      where: { userId, householdId, isActive: true },
    });
  }

  async countAdmins(householdId: string): Promise<number> {
    return this.prisma.memberships.count({
      where: { householdId, role: Role.ADMIN, isActive: true },
    });
  }

  async createMembership(
    userId: string,
    householdId: string,
    role: Role = Role.GUEST,
  ) {
    return this.prisma.memberships.create({
      data: { userId, householdId, role },
    });
  }

  async isExistingMemberByEmail(
    email: string,
    householdId: string,
  ): Promise<boolean> {
    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user) return false;
    const membership = await this.prisma.memberships.findFirst({
      where: { userId: user.id, householdId, isActive: true },
    });
    return !!membership;
  }
}
