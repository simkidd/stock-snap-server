import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import {
  LoginRequestInput,
  ResetPasswordInput,
  UpdatePasswordInput,
} from '../dtos/auth.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { Public } from '../decorators/public.decorator';
import { User, UserRole } from '@prisma/client';
import { Roles } from '../decorators/roles.decorator';

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
  @Patch('/reset-password')
  async resetPassword(@Body() input: ResetPasswordInput): Promise<User> {
    return this.authService.resetPassword(input);
  }

  // // Forgot password
  // @ApiOperation({ summary: 'Forgot password' })
  // @ApiResponse({ status: 200, description: 'Password reset email sent.' })
  // @ApiResponse({ status: 404, description: 'User not found.' })
  // @Post('forgot-password')
  // async forgotPassword(
  //   @Body() input: ForgotPasswordInput,
  // ): Promise<void> {
  //   return this.userService.forgotPassword(input);
  // }
}
