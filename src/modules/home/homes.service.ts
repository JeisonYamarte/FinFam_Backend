import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Memberships, Role } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { MemberService } from 'src/modules/member/member.service';
import { InvitationService } from 'src/modules/invitation/invitation.service';
import { CreateHomeDto } from './dto/create-home.dto';
import { UpdateHomeDto } from './dto/update-home.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { CreateInvitationDto } from 'src/modules/invitation/dto/create-invitation.dto';

@Injectable()
export class HomesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly memberService: MemberService,
    private readonly invitationService: InvitationService,
  ) {}

  // ─── CREATE HOUSEHOLD ────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateHomeDto) {
    return this.prisma.households.create({
      data: {
        name: dto.name,
        memberships: {
          create: { userId, role: Role.ADMIN },
        },
      },
      select: { id: true, name: true, createdAt: true },
    });
  }

  // ─── GET USER HOUSEHOLDS ──────────────────────────────────────────────────────

  async findUserHomes(userId: string) {
    const memberships = await this.prisma.memberships.findMany({
      where: { userId, isActive: true },
      include: { household: { select: { id: true, name: true } } },
    });

    return memberships.map((m) => ({
      id: m.household.id,
      name: m.household.name,
      role: m.role,
    }));
  }

  // ─── GET HOUSEHOLD DETAIL ─────────────────────────────────────────────────────

  async findOne(homeId: string) {
    const home = await this.prisma.households.findUnique({
      where: { id: homeId },
      include: {
        _count: { select: { memberships: { where: { isActive: true } } } },
      },
    });

    if (!home) throw new NotFoundException('Household not found');

    return {
      id: home.id,
      name: home.name,
      createdAt: home.createdAt,
      membersCount: home._count.memberships,
    };
  }

  // ─── LIST MEMBERS ─────────────────────────────────────────────────────────────

  async listMembers(homeId: string) {
    const memberships = await this.prisma.memberships.findMany({
      where: { householdId: homeId, isActive: true },
      include: {
        user: { select: { name: true, lastName: true, email: true } },
      },
    });

    return memberships.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: `${m.user.name} ${m.user.lastName}`,
      email: m.user.email,
      role: m.role,
    }));
  }

  // ─── CHANGE MEMBER ROLE ───────────────────────────────────────────────────────

  async changeMemberRole(
    homeId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
  ) {
    const membership = await this.prisma.memberships.findFirst({
      where: { id: memberId, householdId: homeId, isActive: true },
    });

    if (!membership) throw new NotFoundException('Member not found');

    if (membership.role === Role.ADMIN && dto.role !== Role.ADMIN) {
      const adminCount = await this.memberService.countAdmins(homeId);
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot demote the last admin');
      }
    }

    return this.prisma.memberships.update({
      where: { id: memberId },
      data: { role: dto.role },
      select: { id: true, userId: true, role: true },
    });
  }

  // ─── REMOVE MEMBER ────────────────────────────────────────────────────────────

  async removeMember(homeId: string, memberId: string, requester: Memberships) {
    const target = await this.prisma.memberships.findFirst({
      where: { id: memberId, householdId: homeId, isActive: true },
    });

    if (!target) throw new NotFoundException('Member not found');

    const isSelf = target.userId === requester.userId;
    const isAdmin = requester.role === Role.ADMIN;

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to remove this member',
      );
    }

    if (target.role === Role.ADMIN) {
      const adminCount = await this.memberService.countAdmins(homeId);
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last admin');
      }
    }

    await this.prisma.memberships.update({
      where: { id: memberId },
      data: { isActive: false },
    });

    return { message: 'Member removed successfully' };
  }

  // ─── LEAVE HOUSEHOLD ──────────────────────────────────────────────────────────

  async leave(homeId: string, userId: string) {
    const membership = await this.memberService.findActiveMembership(
      userId,
      homeId,
    );
    if (!membership)
      throw new NotFoundException('You are not a member of this household');

    const activeMemberCount = await this.prisma.memberships.count({
      where: { householdId: homeId, isActive: true },
    });

    if (activeMemberCount <= 1) {
      await this._deleteHome(homeId);
      return {
        message:
          'You left and the household was deleted (no remaining members)',
      };
    }

    if (membership.role === Role.ADMIN) {
      const adminCount = await this.memberService.countAdmins(homeId);
      if (adminCount <= 1) {
        throw new BadRequestException(
          'You are the last admin. Transfer the admin role to another member before leaving.',
        );
      }
    }

    await this.prisma.memberships.update({
      where: { id: membership.id },
      data: { isActive: false },
    });

    return { message: 'You have left the household' };
  }

  // ─── UPDATE HOUSEHOLD ─────────────────────────────────────────────────────────

  async update(homeId: string, dto: UpdateHomeDto) {
    return this.prisma.households.update({
      where: { id: homeId },
      data: { name: dto.name },
      select: { id: true, name: true, updatedAt: true },
    });
  }

  // ─── DELETE HOUSEHOLD ─────────────────────────────────────────────────────────

  async delete(homeId: string) {
    await this._deleteHome(homeId);
    return { message: 'Household deleted successfully' };
  }

  // ─── INVITE MEMBER ────────────────────────────────────────────────────────────

  async invite(
    homeId: string,
    invitedByUserId: string,
    dto: CreateInvitationDto,
  ) {
    return this.invitationService.create(homeId, invitedByUserId, dto);
  }

  // ─── PRIVATE HELPERS ─────────────────────────────────────────────────────────

  private async _deleteHome(homeId: string) {
    await this.prisma.$transaction(async (tx) => {
      // Delete expense splits and expenses
      // TODO: Finalize when expense module logic is complete
      const expenses = await tx.expenses.findMany({
        where: { householdId: homeId },
        select: { id: true },
      });
      await tx.expenseSplits.deleteMany({
        where: { expenseId: { in: expenses.map((e) => e.id) } },
      });
      await tx.expenses.deleteMany({ where: { householdId: homeId } });

      // Delete closure balances and closures
      const closures = await tx.closures.findMany({
        where: { householdId: homeId },
        select: { id: true },
      });
      await tx.closureBalance.deleteMany({
        where: { closureId: { in: closures.map((c) => c.id) } },
      });
      await tx.closures.deleteMany({ where: { householdId: homeId } });

      // Delete memberships
      await tx.memberships.deleteMany({ where: { householdId: homeId } });

      // Delete household
      await tx.households.delete({ where: { id: homeId } });
    });
  }
}
