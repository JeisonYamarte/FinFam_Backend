import { Module } from '@nestjs/common';
import { InvitationService } from './invitation.service';

@Module({
  providers: [InvitationService]
})
export class InvitationModule {}
