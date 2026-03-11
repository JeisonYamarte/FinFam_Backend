import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HouseholdsModule } from './households/households.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ClosureModule } from './closure/closure.module';
import { BcryptModule } from './bcrypt/bcrypt.module';
import { EmailModule } from './email/email.module';
import { TestsModule } from './tests/tests.module';
import { envs } from './env.model';
import KeyvRedis from '@keyv/redis';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => {
        return {
          stores: [
            new KeyvRedis(`redis://${envs.REDIS_HOST}:${envs.REDIS_PORT}`),
          ],
        };
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3, // 3 requests per second
      },
      {
        name: 'long',
        ttl: 60 * 1000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    HouseholdsModule,
    ExpensesModule,
    ClosureModule,
    BcryptModule,
    EmailModule,
    TestsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
