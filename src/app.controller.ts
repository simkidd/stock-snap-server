import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService, HealthCheckResponse } from './app.service';
import { Public } from './common/decorators/public.decorator';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'System Health Check & Database Connectivity' })
  @ApiResponse({
    status: 200,
    description: 'Service is operational.',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2026-09-10T12:00:00.000Z',
        uptime: 3600,
        environment: 'development',
        service: 'StockSnap Retail POS Server',
        database: 'connected',
      },
    },
  })
  @Get('health')
  getHealth(): Promise<HealthCheckResponse> {
    return this.appService.getHealth();
  }
}
