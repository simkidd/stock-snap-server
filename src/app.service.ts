import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { config } from './utils/config';

export interface HealthCheckResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptime: number;
  environment: string;
  service: string;
  database: 'connected' | 'disconnected';
}

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth(): Promise<HealthCheckResponse> {
    let databaseStatus: 'connected' | 'disconnected' = 'connected';

    try {
      // Fast query to check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      databaseStatus = 'disconnected';
    }

    return {
      status: databaseStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: config.NODE_ENV || 'development',
      service: 'StockSnap Retail POS Server',
      database: databaseStatus,
    };
  }
}
