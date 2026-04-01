import { Module } from '@nestjs/common';
import { TestsController } from './tests.controller';
import { EmailModule } from 'src/modules/email/email.module';
import { CloudinaryModule } from 'src/modules/cloudinary/cloudinary.module';

@Module({
  imports: [EmailModule, CloudinaryModule],
  controllers: [TestsController],
})
export class TestsModule {}
