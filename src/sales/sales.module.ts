import { Module } from '@nestjs/common';
import { SalesController } from './controllers/sales.controller';
import { SalesService } from './services/sales.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [SalesController],
  providers: [SalesService, PrismaService],
})
export class SalesModule {}
