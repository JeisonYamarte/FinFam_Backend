import { Module } from '@nestjs/common';
import { TestsController } from './tests.controller';
import { EmailService } from 'src/email/email.service';

@Module({
  providers: [EmailService],
  controllers: [TestsController],
})
export class TestsModule {}
