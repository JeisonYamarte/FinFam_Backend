import { Module } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';
import { EmailModule } from 'src/modules/email/email.module';
import { MemberModule } from 'src/modules/member/member.module';

@Module({
  imports: [EmailModule, MemberModule],
  controllers: [InvitationController],
  providers: [InvitationService],
  exports: [InvitationService],
})
export class InvitationModule {}
