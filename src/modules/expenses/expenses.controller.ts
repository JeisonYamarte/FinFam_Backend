import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { UpdatePayersDto } from './dto/update-payers.dto';
import { UpdateSplitsDto } from './dto/update-splits.dto';
import { ListExpensesQueryDto } from './dto/list-expenses-query.dto';

@ApiTags('expenses')
@UseGuards(JwtAuthGuard)
@Controller()
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  // POST /expenses
  @Post('expenses')
  @ApiOperation({ summary: 'Create a new expense (admin only)' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('receipt', { storage: memoryStorage() }))
  create(
    @CurrentUser() userId: string,
    @Body() dto: CreateExpenseDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.expensesService.create(userId, dto, file);
  }

  // GET /households/:householdId/expenses
  @Get('households/:householdId/expenses')
  @ApiOperation({ summary: 'List expenses of a household (paginated)' })
  findAll(
    @CurrentUser() userId: string,
    @Param('householdId') householdId: string,
    @Query() query: ListExpensesQueryDto,
  ) {
    return this.expensesService.findAll(userId, householdId, query);
  }

  // GET /households/:householdId/expenses/calculation
  @Get('households/:householdId/expenses/calculation')
  @ApiOperation({ summary: 'Get expenses for balance calculation engine' })
  getForCalculation(
    @CurrentUser() userId: string,
    @Param('householdId') householdId: string,
  ) {
    return this.expensesService.getForCalculation(userId, householdId);
  }

  // GET /expenses/:expenseId
  @Get('expenses/:expenseId')
  @ApiOperation({ summary: 'Get expense details' })
  findOne(
    @CurrentUser() userId: string,
    @Param('expenseId') expenseId: string,
  ) {
    return this.expensesService.findOne(userId, expenseId);
  }

  // PATCH /expenses/:expenseId
  @Patch('expenses/:expenseId')
  @ApiOperation({ summary: 'Update an expense (admin only)' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('receipt', { storage: memoryStorage() }))
  update(
    @CurrentUser() userId: string,
    @Param('expenseId') expenseId: string,
    @Body() dto: UpdateExpenseDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.expensesService.update(userId, expenseId, dto, file);
  }

  // DELETE /expenses/:expenseId
  @Delete('expenses/:expenseId')
  @ApiOperation({ summary: 'Delete an expense (admin only)' })
  remove(@CurrentUser() userId: string, @Param('expenseId') expenseId: string) {
    return this.expensesService.remove(userId, expenseId);
  }

  // PUT /expenses/:expenseId/payers
  @Put('expenses/:expenseId/payers')
  @ApiOperation({ summary: 'Replace expense payers (admin only)' })
  updatePayers(
    @CurrentUser() userId: string,
    @Param('expenseId') expenseId: string,
    @Body() dto: UpdatePayersDto,
  ) {
    return this.expensesService.updatePayers(userId, expenseId, dto);
  }

  // PUT /expenses/:expenseId/splits
  @Put('expenses/:expenseId/splits')
  @ApiOperation({ summary: 'Replace expense splits (admin only)' })
  updateSplits(
    @CurrentUser() userId: string,
    @Param('expenseId') expenseId: string,
    @Body() dto: UpdateSplitsDto,
  ) {
    return this.expensesService.updateSplits(userId, expenseId, dto);
  }
}
