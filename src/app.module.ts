import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';

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
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        store: [createKeyv(`redis://${envs.REDIS_HOST}:${envs.REDIS_PORT}`)],
        ttl: envs.REDIS_TTL,
      }),
    }),
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
  providers: [],
})
export class AppModule {}
