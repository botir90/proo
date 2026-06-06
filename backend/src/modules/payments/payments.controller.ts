import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentDto, PaymentQueryDto, StudentPayDto } from './dto/payment.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get('my-payments')
  @Roles(Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: 'Student/Ota-ona o\'z to\'lovlarini ko\'rish' })
  getMyPayments(@CurrentUser('id') userId: string) {
    return this.paymentsService.getMyPayments(userId);
  }

  @Post(':id/pay')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Student to\'lovni amalga oshirish' })
  payByStudent(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: StudentPayDto,
  ) {
    return this.paymentsService.payByStudent(id, userId, dto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get all payments' })
  findAll(@Query() query: PaymentQueryDto) {
    return this.paymentsService.findAll(query);
  }

  @Get('revenue/:year')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get monthly revenue for year' })
  getMonthlyRevenue(@Param('year') year: string) {
    return this.paymentsService.getMonthlyRevenue(parseInt(year));
  }

  @Get('student/:studentId/debt')
  @ApiOperation({ summary: 'Get student debt' })
  getStudentDebt(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.paymentsService.getStudentDebt(studentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create payment' })
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  @Post('generate-invoices')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Generate monthly invoices for group' })
  generateInvoices(@Body() body: { groupId: string; month: number; year: number }) {
    return this.paymentsService.generateMonthlyInvoices(body.groupId, body.month, body.year);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update payment' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePaymentDto) {
    return this.paymentsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Delete payment' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.remove(id);
  }
}
