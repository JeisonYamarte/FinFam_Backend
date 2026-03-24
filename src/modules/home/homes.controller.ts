import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { HomesService } from './homes.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { IsMemberGuard } from 'src/common/guards/is-member.guard';
import { IsAdminGuard } from 'src/common/guards/is-admin.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CurrentMembership } from 'src/common/decorators/current-membership.decorator';
import { CreateHomeDto } from './dto/create-home.dto';
import { UpdateHomeDto } from './dto/update-home.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { CreateInvitationDto } from 'src/modules/invitation/dto/create-invitation.dto';
import type { Memberships } from 'src/generated/prisma/client';

@ApiTags('homes')
@Controller('homes')
@UseGuards(JwtAuthGuard)
export class HomesController {
  constructor(private readonly homesService: HomesService) {}

  // POST /homes
  @Post()
  @ApiOperation({ summary: 'Create a new household' })
  create(@CurrentUser() userId: string, @Body() dto: CreateHomeDto) {
    return this.homesService.create(userId, dto);
  }

  // GET /homes
  @Get()
  @ApiOperation({ summary: 'Get all households the user belongs to' })
  findUserHomes(@CurrentUser() userId: string) {
    return this.homesService.findUserHomes(userId);
  }

  // GET /homes/:homeId
  @Get(':homeId')
  @UseGuards(IsMemberGuard)
  @ApiOperation({ summary: 'Get household details' })
  findOne(@Param('homeId') homeId: string) {
    return this.homesService.findOne(homeId);
  }

  // PATCH /homes/:homeId
  @Patch(':homeId')
  @UseGuards(IsAdminGuard)
  @ApiOperation({ summary: 'Update household name (admin only)' })
  update(@Param('homeId') homeId: string, @Body() dto: UpdateHomeDto) {
    return this.homesService.update(homeId, dto);
  }

  // DELETE /homes/:homeId
  @Delete(':homeId')
  @UseGuards(IsAdminGuard)
  @ApiOperation({ summary: 'Delete household (admin only)' })
  delete(@Param('homeId') homeId: string) {
    return this.homesService.delete(homeId);
  }

  // GET /homes/:homeId/members
  @Get(':homeId/members')
  @UseGuards(IsMemberGuard)
  @ApiOperation({ summary: 'List all household members' })
  listMembers(@Param('homeId') homeId: string) {
    return this.homesService.listMembers(homeId);
  }

  // PATCH /homes/:homeId/members/:memberId/role
  @Patch(':homeId/members/:memberId/role')
  @UseGuards(IsAdminGuard)
  @ApiOperation({ summary: 'Change a member role (admin only)' })
  changeMemberRole(
    @Param('homeId') homeId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.homesService.changeMemberRole(homeId, memberId, dto);
  }

  // DELETE /homes/:homeId/members/:memberId
  @Delete(':homeId/members/:memberId')
  @UseGuards(IsMemberGuard)
  @ApiOperation({ summary: 'Remove a member (admin or self)' })
  removeMember(
    @Param('homeId') homeId: string,
    @Param('memberId') memberId: string,
    @CurrentMembership() requesterMembership: Memberships,
  ) {
    return this.homesService.removeMember(
      homeId,
      memberId,
      requesterMembership,
    );
  }

  // POST /homes/:homeId/invitations
  @Post(':homeId/invitations')
  @UseGuards(IsAdminGuard)
  @ApiOperation({ summary: 'Invite a user to the household (admin only)' })
  invite(
    @Param('homeId') homeId: string,
    @CurrentUser() userId: string,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.homesService.invite(homeId, userId, dto);
  }

  // POST /homes/:homeId/leave
  @Post(':homeId/leave')
  @UseGuards(IsMemberGuard)
  @ApiOperation({ summary: 'Leave a household' })
  leave(@Param('homeId') homeId: string, @CurrentUser() userId: string) {
    return this.homesService.leave(homeId, userId);
  }
}
