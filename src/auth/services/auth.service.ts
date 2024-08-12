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
  CreateNewPasswordInput,
  ForgotPasswordInput,
  LoginRequestInput,
  LoginResponseDTO,
  ResetPasswordInput,
  UpdatePasswordInput,
} from '../dtos/auth.dto';
import { User } from '@prisma/client';
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

      // Sending a login notification email
      // await this.mailService.sendMail({
      //   to: user?.email,
      //   subject: 'Login Alert',
      //   html: `<p>Dear ${user.name},</p><p>You have successfully logged in to your account.</p>`,
      // });

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

      this.mailService.sendMail({
        to: user.email,
        subject: 'Password Updated Successfully',
        html: `<p>Dear ${user.name.split(' ')?.[0]},</p>
        <p>Your password has been successfully updated.</p>`,
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
  async forgotPassword(input: ForgotPasswordInput, origin: string) {
    try {
      const user = await this.userService.getUserByEmail(input.email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      /**
       * generate a reset token for users to change their forgotten password
       */
      const resetToken = this.generateOTP();
      const resetTokenExpires = new Date();
      resetTokenExpires.setMinutes(resetTokenExpires.getMinutes() + 15); // Token valid for 15 minutes

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailToken: resetToken,
          tokenExpiresAt: resetTokenExpires,
        },
      });

      await this.sendPasswordResetEmail(user, resetToken, origin);

      return user.email;
    } catch (error) {
      throw error;
    }
  }

  // reset user password (admin)
  async resetPasswordAdmin(input: ResetPasswordInput): Promise<User> {
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

  // reset user password (User)
  async resetPasswordUser(
    input: CreateNewPasswordInput,
    origin: string,
  ): Promise<User> {
    try {
      const user = await this.userService.findUser(input.userId);
      if (!user || user.emailToken !== input.token) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      // check if the token is expired
      if (user.tokenExpiresAt && user.tokenExpiresAt < new Date()) {
        throw new UnauthorizedException('Token has expired');
      }

      const hashedPassword = await bcrypt.hash(input.newPassword, 10);

      // Update the user's password and invalidate the token
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          emailToken: null,
          tokenExpiresAt: null,
        },
      });

      await this.mailService.sendMail({
        to: user.email,
        subject: 'Password Changed Successfully',
        html: `
      <p>Dear ${user.name.split(' ')[0]},</p>
      <p>Your password has been successfully changed.</p>
      <p>You can now log in to your account using your new password.</p>
      <p>If you did not request this change, please contact support immediately.</p>
      <p>To log in, visit <a href="${origin}/login">this link</a> and use your new password.</p>
    `,
      });

      return {
        ...user,
        password: undefined,
      };
    } catch (error) {
      throw error;
    }
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

  private async generateAccessToken(user: User) {
    const payload = { id: user.id, email: user.email, role: user.role };

    const token = await this.jwtService.signAsync(payload);

    return { token, user };
  }

  private async sendPasswordResetEmail(
    user: User,
    resetToken: string,
    origin: string,
  ) {
    // Create password reset link
    const resetUrl = `${origin}/reset-password?token=${resetToken}&userId=${user.id}`;

    // Read the template file
    const templateContent = readFileSync(
      './src/templates/reset-password.hbs',
      'utf8',
    );
    // Compile the template
    const template = handlebars.compile(templateContent);

    // Render the template with data
    const html = template({
      appName: config.APP_NAME,
      resetUrl,
      userName: user.name.split(' ')?.[0],
      appDomain: config.APP_DOMAIN,
      currentYear: new Date().getFullYear(),
    });

    const mailPayload = {
      to: user.email,
      subject: 'Password Reset Request',
      html: html,
    };

    await this.mailService.sendMail(mailPayload);
  }
}
