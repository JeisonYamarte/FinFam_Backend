import { Controller, Post, Req, UseGuards, Body } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { Users } from 'src/generated/prisma/client';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: LoginResponseDto })
  @Post('login')
  login(@Req() req: Request): LoginResponseDto {
    const user = req.user as Users;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;
    return {
      user: safeUser,
      access_token: this.authService.generateJwt(user.id),
    };
  }

  @Post('register')
  @ApiBody({ type: RegisterDto })
  @ApiOkResponse({ type: RegisterResponseDto })
  async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    const user = await this.authService.register(dto);
    return {
      user,
      access_token: this.authService.generateJwt(user.id),
    };
  }
}
