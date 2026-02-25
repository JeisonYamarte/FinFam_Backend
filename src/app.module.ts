import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HouseholdsModule } from './households/households.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ClosureModule } from './closure/closure.module';
import { BcryptModule } from './bcrypt/bcrypt.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    HouseholdsModule,
    ExpensesModule,
    ClosureModule,
    BcryptModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
