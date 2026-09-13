import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User } from 'src/generated/prisma';
import { Public } from 'src/common/decorators/public.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import {
  CreateNewPasswordInput,
  ForgotPasswordInput,
  LoginRequestInput,
  LoginResponseDTO,
  PinLoginInput,
  RefreshTokenInput,
  SetPinInput,
  UpdatePasswordInput,
  VerifyManagerPinInput,
} from './dtos/auth.dto';
import { AuthService } from './auth.service';
import { Request } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * User login with Email and Password
   */
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login with Email and Password' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in.',
    type: LoginResponseDTO,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @Post('/login')
  signIn(@Body() input: LoginRequestInput): Promise<LoginResponseDTO> {
    return this.authService.signIn(input);
  }

  /**
   * Cashier fast login with 4-digit PIN
   */
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cashier / Staff fast login with 4-digit PIN' })
  @ApiResponse({
    status: 200,
    description: 'Staff successfully authenticated.',
    type: LoginResponseDTO,
  })
  @ApiResponse({ status: 401, description: 'Invalid PIN or credentials.' })
  @Post('/pin-login')
  pinLogin(@Body() input: PinLoginInput): Promise<LoginResponseDTO> {
    return this.authService.pinLogin(input);
  }

  /**
   * Refresh expired access token using refresh token
   */
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Tokens successfully refreshed.',
    type: LoginResponseDTO,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token.',
  })
  @Post('/refresh')
  refreshToken(@Body() input: RefreshTokenInput): Promise<LoginResponseDTO> {
    return this.authService.refreshToken(input);
  }

  /**
   * User logout
   */
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged out.',
  })
  @Post('/logout')
  logout(
    @CurrentUser() user: any,
  ): Promise<{ success: boolean; message: string }> {
    return this.authService.logout(user?.id);
  }

  /**
   * Get currently authenticated user profile
   */
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'Get currently authenticated user profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns the authenticated user profile.',
  })
  @Get('/me')
  getMe(@CurrentUser() user: any): Promise<User> {
    if (!user?.id) {
      throw new UnauthorizedException('Authentication required');
    }
    return this.authService.getMe(user.id);
  }

  /**
   * Verify Manager PIN for counter overrides, voids, or discount authorizations
   */
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'Verify Manager PIN for POS overrides' })
  @ApiResponse({
    status: 200,
    description: 'Manager PIN verified successfully.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden: Invalid manager PIN.' })
  @Post('/verify-manager-pin')
  verifyManagerPin(
    @Body() input: VerifyManagerPinInput,
    @CurrentUser() user: any,
  ) {
    return this.authService.verifyManagerPin(input, user?.tenantId);
  }

  /**
   * Set or update PIN code for currently authenticated user
   */
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'Set or update 4-digit PIN for staff' })
  @ApiResponse({ status: 200, description: 'PIN updated successfully.' })
  @Patch('/set-pin')
  setPin(@Body() input: SetPinInput, @CurrentUser() user: any) {
    if (!user?.id) {
      throw new UnauthorizedException('Authentication required');
    }
    return this.authService.setPin(user.id, input);
  }

  // update password
  @ApiOperation({ summary: 'Update password' })
  @ApiResponse({ status: 200, description: 'Password updated successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Patch('/update-password')
  updatePassword(@Body() input: UpdatePasswordInput): Promise<User> {
    return this.authService.updatePassword(input);
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
