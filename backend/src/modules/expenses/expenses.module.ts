import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpenseService } from './expenses.service';

@Module({
  controllers: [ExpensesController],
  providers: [ExpenseService],
})
export class ExpensesModule {}
