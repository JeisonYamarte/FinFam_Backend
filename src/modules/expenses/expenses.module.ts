import { Module } from '@nestjs/common';
import { BalanceEngineModule } from 'src/modules/balance-engine/balance-engine.module';
import { CloudinaryModule } from 'src/modules/cloudinary/cloudinary.module';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

@Module({
  imports: [CloudinaryModule, BalanceEngineModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
