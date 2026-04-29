import { Module } from '@nestjs/common';
import { BalanceEngineService } from './balance-engine.service';

@Module({
  providers: [BalanceEngineService],
  exports: [BalanceEngineService],
})
export class BalanceEngineModule {}
