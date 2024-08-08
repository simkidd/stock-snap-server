import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { verify } from 'jsonwebtoken';
import { PrismaService } from 'src/prisma/prisma.service';
import { config } from 'src/utils/config';
import {
  CreateUserInput,
  FilterUsersInput,
  UpdateUserInput,
} from '../dtos/user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers(): Promise<User[]> {
    try {
      const users = await this.prisma.user.findMany();
      return users;
    } catch (error) {
      throw error;
    }
  }

  async filterUsers(input?: FilterUsersInput): Promise<User[]> {
    const limit = Number(input?.limit) || 10;
    const page = input?.page || 1;
    const skip = (page - 1) * limit;
    const search = input?.search ? input?.search.toLowerCase() : '';

    try {
      const users = await this.prisma.user.findMany({
        where: {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        },
        skip,
        take: limit,
      });

      return users.map((user) => ({
        ...user,
        password: undefined,
      }));
    } catch (error) {
      throw error;
    }
  }

  async getUserById(id: string): Promise<User> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        throw new NotFoundException('User id not found');
      }

      return {
        ...user,
        password: undefined,
      };
    } catch (error) {
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async createUser(input: CreateUserInput): Promise<User> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const user = await this.prisma.user.create({
        data: {
          ...input,
          password: hashedPassword,
        },
      });

      return {
        ...user,
        password: undefined,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateUser(input: UpdateUserInput): Promise<User> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: input.id },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      await this.prisma.user.update({
        where: { id: input.id },
        data: input,
      });

      return {
        ...user,
        password: undefined,
      };
    } catch (error) {
      throw error;
    }
  }

  async decodeJWT(token: string): Promise<User> {
    if (!token) return null;
    try {
      const { id } = verify(token, config.JWT_SECRET) as { id: string };
      const user = await this.getUserById(id);

      return user;
    } catch (error) {
      console.error('Invalid signature on decodeJWT');
      return null;
    }
  }

  async getMe(id: string): Promise<User> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        throw new NotFoundException(`User not found`);
      }
      // if (!user.isEmailVerified) {
      //   throw new UnauthorizedException('Please verify your email');
      // }

      return {
        ...user,
        password: undefined,
      };
    } catch (error) {
      throw error;
    }
  }
}
