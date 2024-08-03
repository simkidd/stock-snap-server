import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserInput } from '../dtos/user.dto';
import * as bcrypt from 'bcryptjs';
import { verify } from 'jsonwebtoken';
import { config } from 'src/utils/config';
import { UserWithoutPassword } from 'src/types/user.type';

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
