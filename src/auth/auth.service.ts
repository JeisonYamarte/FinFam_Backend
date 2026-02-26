import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { Payload } from './models/payload';
import { RegisterDto } from './dto/register.dto';
import { AuthUserDto } from './dto/auth.dto';

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

  async register(createUserDto: RegisterDto): Promise<AuthUserDto> {
    const user = await this.usersService.create(createUserDto);

    return user;
  }

  generateJwt(userId: string) {
    const payload: Payload = { sub: userId };
    return this.jwtService.sign(payload);
  }
}
