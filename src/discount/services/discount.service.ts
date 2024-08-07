import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDiscountInput } from '../dtos/discount.dto';
import { Discount } from '@prisma/client';
import { generateRandomCode } from 'src/utils/helpers';

@Injectable()
export class DiscountService {
  constructor(private readonly prisma: PrismaService) {}

  async createDiscount(input: CreateDiscountInput): Promise<Discount> {
    // Validate that startDate is before endDate
    if (input.startDate >= input.endDate) {
      throw new BadRequestException('End date must be after start date.');
    }

    try {
      const discountCode = await this.generateUniqueCode();

      const discount = await this.prisma.discount.create({
        data: {
          ...input,
          code: discountCode,
        },
      });

      return discount;
    } catch (error) {
      throw error;
    }
  }

  private async generateUniqueCode(): Promise<string> {
    let code: string;
    let isUnique = false;

    while (!isUnique) {
      code = generateRandomCode(); // Generate a random alphanumeric code

      // Check if the code already exists
      const existingDiscount = await this.prisma.discount.findUnique({
        where: { code },
      });

      if (!existingDiscount) {
        isUnique = true; // Unique code found
      }
    }

    return code;
  }
}
