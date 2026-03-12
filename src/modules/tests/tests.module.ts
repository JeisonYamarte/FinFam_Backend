import { Module } from '@nestjs/common';
import { TestsController } from './tests.controller';
import { EmailModule } from 'src/modules/email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [TestsController],
})
export class TestsModule {}
