import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { envs } from 'src/env.model';
import { BcryptModule } from 'src/bcrypt/bcrypt.module';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [
    UsersModule,
    BcryptModule,
    EmailModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: envs.JWT_SECRET,
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
