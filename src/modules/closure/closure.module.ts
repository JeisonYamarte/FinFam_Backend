import { Module } from '@nestjs/common';
import { BalanceEngineModule } from 'src/modules/balance-engine/balance-engine.module';
import { ClosureController } from './closure.controller';
import { ClosureService } from './closure.service';
import { ClosureBalancesService } from './closure-balances.service';

@Module({
  imports: [BalanceEngineModule],
  controllers: [ClosureController],
  providers: [ClosureService, ClosureBalancesService],
  exports: [ClosureService, ClosureBalancesService],
})
export class ClosureModule {}
