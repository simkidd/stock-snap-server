import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/generated/prisma';
import * as bcrypt from 'bcryptjs';
import { verify } from 'jsonwebtoken';
import { PrismaService } from 'src/prisma/prisma.service';
import { config } from 'src/utils/config';
import {
  CreateUserInput,
  FilterUsersInput,
  UpdateRoleInput,
  UpdateStatusInput,
  UpdateUserInput,
} from './dtos/user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async filterUsers(input?: FilterUsersInput): Promise<User[]> {
    const limit = Number(input?.limit) || 10;
    const page = input?.page || 1;
    const skip = (page - 1) * limit;
    const search = input?.search ? input?.search.toLowerCase() : '';

    return this.prisma.user.findMany({
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
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('User id not found');
    }
    return user;
  }

  async findUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { auth: true, store: true, tenant: true },
    });
    if (!user) {
      throw new NotFoundException('User id not found');
    }
    return user;
  }

  async getUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { auth: true, store: true, tenant: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const { password: _password, ...userData } = input;

    return this.prisma.user.create({
      data: {
        ...userData,
        auth: {
          create: {
            password: hashedPassword,
          },
        },
      },
    });
  }

  async updateUser(input: UpdateUserInput): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: input.id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: input.id },
      data: input,
    });
  }

  async decodeJWT(token: string): Promise<User | null> {
    if (!token) return null;
    try {
      const { id } = verify(token, config.JWT.SECRET) as { id: string };
      return await this.getUserById(id);
    } catch (_error) {
      console.error('Invalid signature on decodeJWT');
      return null;
    }
  }

  async getMe(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        store: true,
        tenant: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateUserRole(input: UpdateRoleInput): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: input.id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: { role: input.role },
    });
  }

  async updateUserStatus(input: UpdateStatusInput): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: input.id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: { status: input.status },
    });
  }
}
