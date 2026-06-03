import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { v4 as uuidv4 } from 'uuid';
import { envs } from 'src/config/app.config';

import { EmailService } from 'src/modules/email/email.service';
import { MemberService } from 'src/modules/member/member.service';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { Role } from 'src/generated/prisma/client';
import { CreateInvitationDto } from './dto/create-invitation.dto';

const INVITATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const INVITATION_KEY = (id: string) => `invitation:${id}`;
const DUPLICATE_KEY = (homeId: string, email: string) =>
  `invitation:duplicate:${homeId}:${email}`;

interface InvitationPayload {
  homeId: string;
  email: string;
  invitedByUserId: string;
}

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly emailService: EmailService,
    private readonly memberService: MemberService,
    private readonly prisma: PrismaService,
  ) {}

  async create(
    homeId: string,
    invitedByUserId: string,
    dto: CreateInvitationDto,
  ): Promise<{ message: string }> {
    const { email } = dto;

    const alreadyMember = await this.memberService.isExistingMemberByEmail(
      email,
      homeId,
    );
    if (alreadyMember) {
      throw new ConflictException('User is already a member of this household');
    }

    const existing = await this.cacheManager.get(DUPLICATE_KEY(homeId, email));
    if (existing) {
      throw new ConflictException(
        'A pending invitation for this email already exists',
      );
    }

    const invitationId = uuidv4();
    const payload: InvitationPayload = { homeId, email, invitedByUserId };

    await this.cacheManager.set(
      INVITATION_KEY(invitationId),
      payload,
      INVITATION_TTL_MS,
    );
    await this.cacheManager.set(
      DUPLICATE_KEY(homeId, email),
      invitationId,
      INVITATION_TTL_MS,
    );

    try {
      await this.emailService.sendInvitationEmail(email, invitationId);
    } catch (error) {
      await this._cleanupInvitation(invitationId, payload);

      const providerName = envs.EMAIL_PROVIDER;
      this.logger.error(
        `Invitation email could not be sent using provider ${providerName}`,
        error instanceof Error ? error.stack : String(error),
      );

      if (providerName === 'brevo') {
        throw new ServiceUnavailableException(
          'Brevo email service is unavailable. Invitation could not be sent. Please try again.',
        );
      }

      throw new ServiceUnavailableException(
        'Invitation could not be sent. Please try again.',
      );
    }

    return { message: 'Invitation sent successfully' };
  }

  async accept(invitationId: string): Promise<{ message: string }> {
    const payload = await this.cacheManager.get<InvitationPayload>(
      INVITATION_KEY(invitationId),
    );

    if (!payload) {
      throw new NotFoundException('Invitation expired or not found');
    }

    const user = await this.prisma.users.findUnique({
      where: { email: payload.email },
    });
    if (!user) {
      throw new NotFoundException(
        'No account found for this invitation. Please register first.',
      );
    }

    const alreadyMember = await this.memberService.isExistingMemberByEmail(
      payload.email,
      payload.homeId,
    );
    if (alreadyMember) {
      await this._cleanupInvitation(invitationId, payload);
      throw new ConflictException('User is already a member of this household');
    }

    await this.memberService.createMembership(
      user.id,
      payload.homeId,
      Role.GUEST,
    );
    await this._cleanupInvitation(invitationId, payload);

    return { message: 'Invitation accepted. You have joined the household.' };
  }

  async decline(invitationId: string): Promise<{ message: string }> {
    const payload = await this.cacheManager.get<InvitationPayload>(
      INVITATION_KEY(invitationId),
    );

    if (!payload) {
      throw new NotFoundException('Invitation expired or not found');
    }

    await this._cleanupInvitation(invitationId, payload);

    return { message: 'Invitation declined' };
  }

  private async _cleanupInvitation(
    invitationId: string,
    payload: InvitationPayload,
  ) {
    await Promise.all([
      this.cacheManager.del(INVITATION_KEY(invitationId)),
      this.cacheManager.del(DUPLICATE_KEY(payload.homeId, payload.email)),
    ]);
  }
}
