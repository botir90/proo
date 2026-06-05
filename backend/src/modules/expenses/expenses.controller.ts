import { Controller, Get, Post, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ExpenseService } from './expenses.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Expenses')
@ApiBearerAuth('JWT-auth')
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
@Controller('expenses')
export class ExpensesController {
  constructor(private expenseService: ExpenseService) {}

  @Get()
  @ApiOperation({ summary: 'Xarajatlar ro\'yxati' })
  findAll(
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('category') category?: string,
  ) {
    return this.expenseService.findAll({
      month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined,
      category,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Xarajat qo\'shish' })
  create(@Body() dto: { title: string; amount: number; category: string; description?: string; date?: string }) {
    return this.expenseService.create(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xarajat o\'chirish' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.expenseService.remove(id);
  }
}
