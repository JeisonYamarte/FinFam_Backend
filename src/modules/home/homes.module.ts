import { Module } from '@nestjs/common';
import { HomesController } from './homes.controller';
import { HomesService } from './homes.service';
import { MemberModule } from 'src/modules/member/member.module';
import { InvitationModule } from 'src/modules/invitation/invitation.module';
import { IsMemberGuard } from 'src/common/guards/is-member.guard';
import { IsAdminGuard } from 'src/common/guards/is-admin.guard';

@Module({
  imports: [MemberModule, InvitationModule],
  controllers: [HomesController],
  providers: [HomesService, IsMemberGuard, IsAdminGuard],
})
export class HomesModule {}
