import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from 'src/user/services/user.service';
import {
  ForgotPasswordInput,
  LoginRequestInput,
  LoginResponseDTO,
  ResetPasswordInput,
  UpdatePasswordInput,
} from '../dtos/auth.dto';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // login user
  async signIn(input: LoginRequestInput): Promise<LoginResponseDTO> {
    try {
      const user = await this.userService.getUserByEmail(input.email);
      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const isMatch = await this.comparePassword(user.password, input.password);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid password');
      }

      const payload = { id: user.id, email: user.email, role: user.role };
      const token = await this.jwtService.signAsync(payload);

      return {
        token,
        email: user.email,
        role: user.role,
      };
    } catch (error) {
      throw error;
    }
  }

  // update user password
  async updatePassword(input: UpdatePasswordInput): Promise<User> {
    try {
      const user = await this.userService.findUser(input.id);
      if (!user) {
        throw new NotFoundException('user not found');
      }

      const isMatch = await this.comparePassword(
        user.password,
        input.currentPassword,
      );
      if (!isMatch) {
        throw new ConflictException('Current password is incorrect');
      }

      const hashedPassword = await bcrypt.hash(input.newPassword, 10);
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
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

  // forgot password
  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    try {
      const user = await this.userService.getUserByEmail(input.email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      /**
       * to be worked on later
       */
      const resetToken = '';
    } catch (error) {
      throw error;
    }
  }

  // reset user password (admin)
  async resetPassword(input: ResetPasswordInput): Promise<User> {
    try {
      const user = await this.userService.findUser(input.id);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const hashedPassword = await bcrypt.hash(input.newPassword, 10);
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
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

  private async comparePassword(
    hashedPassword: string,
    plainPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
