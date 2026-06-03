import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';

import { Payload } from './models/payload';
import { AuthUserDto } from './dto/auth.dto';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from '@nestjs/cache-manager';
import { BcryptService } from 'src/modules/bcrypt/bcrypt.service';
import { EmailService } from 'src/modules/email/email.service';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private bcryptService: BcryptService,
    private emailService: EmailService,
    private prismaService: PrismaService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.getUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const isMatch = await this.bcryptService.comparePassword(
      pass,
      user.password,
    );

    if (!isMatch) {
      throw new UnauthorizedException('Unauthorized');
    }

    return user;
  }

  async createSession(
    userId: string,
    ip?: string,
    userAgent?: string,
  ): Promise<string> {
    const refreshToken = uuidv4();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await this.prismaService.sessions.create({
      data: { userId, refreshToken, expiresAt, ip, userAgent },
    });
    return refreshToken;
  }

  async register(
    createUserDto: CreateUserDto,
    ip?: string,
    userAgent?: string,
  ): Promise<{ user: AuthUserDto; refresh_token: string }> {
    const user: AuthUserDto = await this.usersService.create(createUserDto);
    const uuid = uuidv4();
    const ttl = 60 * 60 * 24 * 7 * 1000; // 7 días en milisegundos
    await this.cacheManager.set(uuid, user.id, ttl); // Cache for 7 days

    try {
      await this.emailService.sendVerificationEmail(user.email, uuid);
    } catch {
      console.warn(
        'Verification email could not be sent, but account was created successfully.',
      );
    }
    const refresh_token = await this.createSession(user.id, ip, userAgent);
    return { user, refresh_token };
  }

  async verifyEmail(token: string): Promise<void> {
    const keys = await this.cacheManager.get<string>(token);
    if (!keys) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    await this.usersService.verifyEmail(keys);
    await this.cacheManager.del(token); // Remove token after successful verification
  }

  async refreshSession(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const session = await this.prismaService.sessions.findUnique({
      where: { refreshToken },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const newRefreshToken = uuidv4();
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.prismaService.sessions.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt,
        createdAt: new Date(),
      },
    });

    return {
      access_token: this.generateJwt(session.userId),
      refresh_token: newRefreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prismaService.sessions.deleteMany({
      where: { refreshToken },
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.getUserByEmail(email);
    // Silent fail to avoid leaking whether an email is registered
    if (!user) return;
    const uuid = uuidv4();
    const ttl = 60 * 15 * 1000; // 15 minutos en milisegundos
    await this.cacheManager.set(`reset:${uuid}`, user.id, ttl);
    this.emailService.sendPasswordResetEmail(user.email, uuid).catch((err) => {
      console.warn('Password reset email could not be sent:', err);
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.cacheManager.get<string>(`reset:${token}`);
    if (!userId) {
      throw new UnauthorizedException(
        'Invalid or expired password reset token',
      );
    }
    await this.usersService.updatePassword(userId, newPassword);
    await this.cacheManager.del(`reset:${token}`);
  }

  async getMe(userId: string): Promise<AuthUserDto> {
    return this.usersService.findOne(userId);
  }

  generateJwt(userId: string) {
    const payload: Payload = { sub: userId };
    return this.jwtService.sign(payload);
  }
}
