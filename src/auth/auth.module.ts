import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { envs } from 'src/env.model';
import { BcryptService } from 'src/bcrypt/bcrypt.service';
import { EmailService } from 'src/email/email.service';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: envs.JWT_SECRET,
        signOptions: { expiresIn: '6d' },
      }),
    }),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    BcryptService,
    EmailService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
