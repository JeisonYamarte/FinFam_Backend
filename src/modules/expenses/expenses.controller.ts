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
import {
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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
  @ApiOperation({
    summary: 'Get open-period totals for household balance calculation',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        period: {
          type: 'object',
          properties: {
            startDate: {
              type: 'string',
              nullable: true,
              description: 'Open period start date in YYYY-MM-DD format',
              example: '2026-05-01',
            },
            endDate: {
              type: 'string',
              nullable: true,
              description: 'Null while the period is open',
              example: null,
            },
          },
          required: ['startDate', 'endDate'],
        },
        openExpensesCount: {
          type: 'number',
          description: 'Number of open expenses in the current period',
          example: 7,
        },
        totalSpentOpenPeriod: {
          type: 'number',
          description: 'Total spent across all open expenses in the period',
          example: 240500,
        },
        totalsByUser: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              paid: {
                type: 'number',
                example: 15000,
              },
              split: {
                type: 'number',
                example: 36250,
              },
              net: {
                type: 'number',
                example: -21250,
              },
            },
            required: ['paid', 'split', 'net'],
          },
          example: {
            '350329d7-7dff-43eb-a184-4d1cbb39cbc2': {
              paid: 15000,
              split: 36250,
              net: -21250,
            },
            '5a9a0fde-7262-4b9b-bf66-6a1ca445a6fd': {
              paid: 8000,
              split: 48916.68,
              net: -40916.68,
            },
            '9775d1c9-3185-40c3-8ee2-1d05a28017a5': {
              paid: 150000,
              split: 33916.66,
              net: 116083.34,
            },
            'e549b06f-6053-497c-8b9d-9d08da0ba5d8': {
              paid: 67500,
              split: 121416.66,
              net: -53916.66,
            },
          },
        },
      },
      required: [
        'period',
        'openExpensesCount',
        'totalSpentOpenPeriod',
        'totalsByUser',
      ],
      example: {
        period: {
          startDate: '2026-05-01',
          endDate: null,
        },
        openExpensesCount: 7,
        totalSpentOpenPeriod: 240500,
        totalsByUser: {
          '350329d7-7dff-43eb-a184-4d1cbb39cbc2': {
            paid: 15000,
            split: 36250,
            net: -21250,
          },
          '5a9a0fde-7262-4b9b-bf66-6a1ca445a6fd': {
            paid: 8000,
            split: 48916.68,
            net: -40916.68,
          },
          '9775d1c9-3185-40c3-8ee2-1d05a28017a5': {
            paid: 150000,
            split: 33916.66,
            net: 116083.34,
          },
          'e549b06f-6053-497c-8b9d-9d08da0ba5d8': {
            paid: 67500,
            split: 121416.66,
            net: -53916.66,
          },
        },
      },
    },
  })
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
