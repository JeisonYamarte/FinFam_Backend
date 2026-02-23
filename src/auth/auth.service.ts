import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { Users } from 'src/generated/prisma/client';
import { Payload } from './models/payload';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.getUserByEmail(email);
    if (!user) {
      console.warn(`Authentication failed: No user found with email ${email}`);
      throw new UnauthorizedException('Unauthorized');
    }

    const isMatch = await bcrypt.compare(pass, user.password);

    if (!isMatch) {
      console.warn(
        `Authentication failed: Incorrect password for email ${email}`,
      );
      throw new UnauthorizedException('Unauthorized');
    }

    return user;
  }

  generateJwt(user: Users) {
    const payload: Payload = { sub: user.id };
    return this.jwtService.sign(payload);
  }
}
