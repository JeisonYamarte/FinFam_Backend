import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';

import { Payload } from './models/payload';
import { AuthUserDto } from './dto/auth.dto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from '@nestjs/cache-manager';
import { BcryptService } from 'src/bcrypt/bcrypt.service';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private bcryptService: BcryptService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.getUserByEmail(email);
    if (!user) {
      console.warn(`Authentication failed: No user found with email ${email}`);
      throw new UnauthorizedException('Unauthorized');
    }

    const isMatch = await this.bcryptService.comparePassword(
      pass,
      user.password,
    );

    if (!isMatch) {
      console.warn(
        `Authentication failed: Incorrect password for email ${email}`,
      );
      throw new UnauthorizedException('Unauthorized');
    }

    return user;
  }

  async register(createUserDto: CreateUserDto): Promise<AuthUserDto> {
    const user: AuthUserDto = await this.usersService.create(createUserDto);
    const uuid = uuidv4();
    const ttl = 60 * 60 * 24 * 7; // 7 days in seconds
    await this.cacheManager.set(uuid, user.id, ttl); // Cache for 7 days

    await this.emailService.sendVerificationEmail(user.email, uuid);
    return user;
  }

  async verifyEmail(token: string): Promise<void> {
    const keys = await this.cacheManager.get<string>(token);
    console.log(' token: ', keys);
    if (!keys) {
      console.warn(
        `Email verification failed: Invalid or expired token ${token}`,
      );
      throw new UnauthorizedException('Invalid or expired token');
    }
    console.log('userId: ', keys);
    await this.usersService.verifyEmail(keys);
    await this.cacheManager.del(token); // Remove token after successful verification
  }

  generateJwt(userId: string) {
    const payload: Payload = { sub: userId };
    return this.jwtService.sign(payload);
  }
}
