import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HouseholdsModule } from './modules/households/households.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { ClosureModule } from './modules/closure/closure.module';
import { TestsModule } from './modules/tests/tests.module';
import { envs } from './config/app.config';
import { HomeModule } from './modules/home/home.module';
import { MemberModule } from './modules/member/member.module';
import { InvitationModule } from './modules/invitation/invitation.module';
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
    TestsModule,
    HomeModule,
    MemberModule,
    InvitationModule,
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
