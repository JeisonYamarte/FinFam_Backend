import {
  Controller,
  Post,
  Get,
  Req,
  Res,
  UseGuards,
  Body,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { Users } from 'src/generated/prisma/client';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { QueryAuthDto } from './dto/query-auth.dto';
import { envs } from '../env.model';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: LoginResponseDto })
  @Post('login')
  async login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const user = req.user as Users;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    const refresh_token = await this.authService.createSession(
      user.id,
      ip,
      userAgent,
    );
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: envs.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
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
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RegisterResponseDto> {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    const { user, refresh_token } = await this.authService.register(
      dto,
      ip,
      userAgent,
    );
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: envs.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return {
      user,
      access_token: this.authService.generateJwt(user.id),
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh_token cookie' })
  @ApiOkResponse({
    schema: {
      properties: {
        access_token: { type: 'string' },
      },
    },
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ access_token: string }> {
    const refreshToken = req.cookies?.refresh_token as string;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found in cookies');
    }
    const { access_token, refresh_token } =
      await this.authService.refreshSession(refreshToken);
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: envs.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return { access_token };
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify user email with token' })
  async verifyEmail(
    @Query() query: QueryAuthDto,
  ): Promise<{ message: string }> {
    const { token } = query;
    await this.authService.verifyEmail(token);
    return { message: 'Email verified successfully' };
  }
}
