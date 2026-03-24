import { Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InvitationService } from './invitation.service';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post(':invitationId/accept')
  @ApiOperation({ summary: 'Accept a household invitation' })
  accept(@Param('invitationId') invitationId: string) {
    return this.invitationService.accept(invitationId);
  }

  @Post(':invitationId/decline')
  @ApiOperation({ summary: 'Decline a household invitation' })
  decline(@Param('invitationId') invitationId: string) {
    return this.invitationService.decline(invitationId);
  }
}
