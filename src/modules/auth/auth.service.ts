import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from 'src/modules/users/user.service';
import {
  CreateNewPasswordInput,
  ForgotPasswordInput,
  LoginRequestInput,
  LoginResponseDTO,
  PinLoginInput,
  ResetPasswordInput,
  SetPinInput,
  UpdatePasswordInput,
  VerifyManagerPinInput,
} from './dtos/auth.dto';
import { User, UserRole } from 'src/generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/utils/mailer';
import { readFileSync } from 'fs';
import handlebars from 'handlebars';
import { config } from 'src/utils/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private jwtService: JwtService,
  ) {}

  // Helper to generate access & refresh tokens
  private async generateTokens(user: User): Promise<{ token: string; refreshToken: string }> {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      tenantId: user.tenantId,
      storeId: user.storeId,
    };

    const [token, refreshToken] = await Promise.all([
      this.jwtService.signAsync({ ...payload, tokenType: 'access' }, { expiresIn: '24h' }),
      this.jwtService.signAsync({ id: user.id, tokenType: 'refresh' }, { expiresIn: '7d' }),
    ]);

    return { token, refreshToken };
  }

  // Standard email + password login
  async signIn(input: LoginRequestInput): Promise<LoginResponseDTO> {
    const user = await this.userService.getUserByEmail(input.email);
    if (!user || !user.auth?.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await this.comparePassword(user.auth.password, input.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId ?? undefined,
      storeId: user.storeId ?? undefined,
    };
  }

  // Fast Cashier / Staff PIN login
  async pinLogin(input: PinLoginInput): Promise<LoginResponseDTO> {
    const user = await this.userService.getUserByEmail(input.email);
    if (!user) {
      throw new UnauthorizedException('Staff account not found');
    }

    if (!user.auth?.pinCode) {
      throw new BadRequestException('PIN code not set for this account. Please log in with password first.');
    }

    const isMatch = await bcrypt.compare(input.pin, user.auth.pinCode);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid PIN code');
    }

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId ?? undefined,
      storeId: user.storeId ?? undefined,
    };
  }

  // Refresh expired access token with valid refresh token
  async refreshToken(input: { refreshToken: string }): Promise<LoginResponseDTO> {
    try {
      const payload = await this.jwtService.verifyAsync(input.refreshToken, {
        secret: config.JWT_SECRET,
      });

      if (payload.tokenType !== 'refresh') {
        throw new UnauthorizedException('Invalid token type for refresh');
      }

      const user = await this.userService.findUser(payload.id);
      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('User account is inactive or not found');
      }

      const tokens = await this.generateTokens(user);

      return {
        ...tokens,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId ?? undefined,
        storeId: user.storeId ?? undefined,
      };
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        throw e;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // Verify Manager PIN for counter overrides, discounts > limit, or refunds
  async verifyManagerPin(
    input: VerifyManagerPinInput,
    tenantId?: string,
  ): Promise<{ authorized: boolean; managerName: string; managerId: string }> {
    // Find all active managers or admins in this tenant
    const managers = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.ADMIN, UserRole.STORE_MANAGER] },
        status: 'ACTIVE',
        ...(tenantId ? { tenantId } : {}),
      },
      include: { auth: true },
    });

    for (const manager of managers) {
      if (manager.auth?.pinCode) {
        const isMatch = await bcrypt.compare(input.pin, manager.auth.pinCode);
        if (isMatch) {
          return {
            authorized: true,
            managerName: manager.name,
            managerId: manager.id,
          };
        }
      }
    }

    throw new ForbiddenException('Invalid Manager authorization PIN');
  }

  // Set or update 4-digit PIN for staff
  async setPin(userId: string, input: SetPinInput): Promise<{ message: string }> {
    const hashedPin = await bcrypt.hash(input.pin, 10);
    await this.prisma.auth.upsert({
      where: { userId },
      update: { pinCode: hashedPin },
      create: { userId, pinCode: hashedPin, password: '' },
    });
    return { message: 'PIN updated successfully' };
  }

  // update user password
  async updatePassword(input: UpdatePasswordInput): Promise<User> {
    const user = await this.userService.findUser(input.id);
    if (!user || !user.auth?.password) {
      throw new NotFoundException('User authentication record not found');
    }

    const isMatch = await this.comparePassword(
      user.auth.password,
      input.currentPassword,
    );
    if (!isMatch) {
      throw new ConflictException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(input.newPassword, 10);

    await this.prisma.auth.update({
      where: { userId: user.id },
      data: {
        password: hashedPassword,
      },
    });

    return user;
  }

  // forgot password
  async forgotPassword(input: ForgotPasswordInput, origin: string) {
    const user = await this.userService.getUserByEmail(input.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resetToken = this.generateOTP();
    const resetTokenExpires = new Date();
    resetTokenExpires.setMinutes(resetTokenExpires.getMinutes() + 15);

    await this.prisma.auth.update({
      where: { userId: user.id },
      data: {
        emailToken: resetToken,
        tokenExpiresAt: resetTokenExpires,
      },
    });

    await this.sendPasswordResetEmail(user, resetToken, origin);

    return user.email;
  }

  // reset user password (admin)
  async resetPasswordAdmin(input: ResetPasswordInput): Promise<User> {
    const user = await this.userService.findUser(input.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(input.newPassword, 10);
    await this.prisma.auth.update({
      where: { userId: user.id },
      data: {
        password: hashedPassword,
      },
    });

    return user;
  }

  // reset user password (User)
  async resetPasswordUser(
    input: CreateNewPasswordInput,
    origin: string,
  ): Promise<User> {
    const user = await this.userService.findUser(input.userId);
    if (!user || !user.auth || user.auth.emailToken !== input.token) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (user.auth.tokenExpiresAt && user.auth.tokenExpiresAt < new Date()) {
      throw new UnauthorizedException('Token has expired');
    }

    const hashedPassword = await bcrypt.hash(input.newPassword, 10);

    await this.prisma.auth.update({
      where: { userId: user.id },
      data: {
        password: hashedPassword,
        emailToken: null,
        tokenExpiresAt: null,
      },
    });

    return user;
  }

  private comparePassword(
    hashedPassword: string,
    plainPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private generateOTP(): string {
    return (Math.floor(Math.random() * 50000) + 10000).toString();
  }

  private async sendPasswordResetEmail(
    user: User,
    resetToken: string,
    origin: string,
  ) {
    try {
      const resetUrl = `${origin}/reset-password?token=${resetToken}&userId=${user.id}`;
      const templateContent = readFileSync(
        './src/templates/reset-password.hbs',
        'utf8',
      );
      const template = handlebars.compile(templateContent);

      const html = template({
        appName: config.APP_NAME,
        resetUrl,
        userName: user.name.split(' ')?.[0],
        appDomain: config.APP_DOMAIN,
        currentYear: new Date().getFullYear(),
      });

      await this.mailService.sendMail({
        to: user.email,
        subject: 'Password Reset Request',
        html: html,
      });
    } catch (e) {
      console.warn('Could not send password reset email:', e);
    }
  }
}
