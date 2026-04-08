import { Module } from '@nestjs/common';
import { CloudinaryModule } from 'src/modules/cloudinary/cloudinary.module';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

@Module({
  imports: [CloudinaryModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}

