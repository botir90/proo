import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('revenue-chart')
  @ApiOperation({ summary: 'Get revenue chart data' })
  getRevenueChart(@Query('year') year?: string) {
    return this.dashboardService.getRevenueChart(year ? parseInt(year) : undefined);
  }

  @Get('groups-overview')
  @ApiOperation({ summary: 'Get active groups overview' })
  getGroupsOverview() {
    return this.dashboardService.getGroupsOverview();
  }
}
