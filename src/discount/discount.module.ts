import { Module } from '@nestjs/common';
import { DiscountController } from './controllers/discount.controller';
import { DiscountService } from './services/discount.service';

@Module({
  controllers: [DiscountController],
  providers: [DiscountService]
})
export class DiscountModule {}
