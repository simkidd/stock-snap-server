import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User, UserRole } from '@prisma/client';
import { Public } from '../decorators/public.decorator';
import { Roles } from '../decorators/roles.decorator';
import {
  CreateNewPasswordInput,
  ForgotPasswordInput,
  LoginRequestInput,
  ResetPasswordInput,
  UpdatePasswordInput,
} from '../dtos/auth.dto';
import { AuthService } from '../services/auth.service';
import { Request } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * User login
   * @returns Access token for authenticated user
   */
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'User successfully logged in.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @Post('/login')
  signIn(@Body() input: LoginRequestInput) {
    return this.authService.signIn(input);
  }

  // update password
  @ApiOperation({ summary: 'Update password' })
  @ApiResponse({ status: 200, description: 'Password updated successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Patch('/update-password')
  updatePassword(@Body() input: UpdatePasswordInput): Promise<User> {
    return this.authService.updatePassword(input);
  }

  // Reset password (Admin)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reset password (Admin)' })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Patch('/admin/reset-password')
  async resetPasswordAdmin(@Body() input: ResetPasswordInput): Promise<User> {
    return this.authService.resetPasswordAdmin(input);
  }

  // Reset password (User)
  @Public()
  @ApiOperation({ summary: 'Reset password (User)' })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Patch('/user/reset-password')
  async resetPassword(
    @Body() input: CreateNewPasswordInput,
    @Req() req: Request,
  ): Promise<User> {
    const origin = req.headers.origin;
    return this.authService.resetPasswordUser(input, origin);
  }

  // Forgot password
  @Public()
  @ApiOperation({ summary: 'Forgot password' })
  @ApiResponse({ status: 200, description: 'Password reset email sent.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Post('/forgot-password')
  forgotPassword(@Body() input: ForgotPasswordInput, @Req() req: Request) {
    const origin = req.headers.origin;
    return this.authService.forgotPassword(input, origin);
  }
}
