import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User, UserRole } from 'src/generated/prisma';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import {
  CreateNewPasswordInput,
  ForgotPasswordInput,
  LoginRequestInput,
  LoginResponseDTO,
  PinLoginInput,
  RefreshTokenInput,
  ResetPasswordInput,
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
  @ApiResponse({ status: 200, description: 'User successfully logged in.', type: LoginResponseDTO })
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
  @ApiResponse({ status: 200, description: 'Staff successfully authenticated.', type: LoginResponseDTO })
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
  @ApiResponse({ status: 200, description: 'Tokens successfully refreshed.', type: LoginResponseDTO })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token.' })
  @Post('/refresh')
  refreshToken(@Body() input: RefreshTokenInput): Promise<LoginResponseDTO> {
    return this.authService.refreshToken(input);
  }

  /**
   * Verify Manager PIN for counter overrides, voids, or discount authorizations
   */
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'Verify Manager PIN for POS overrides' })
  @ApiResponse({ status: 200, description: 'Manager PIN verified successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Invalid manager PIN.' })
  @Post('/verify-manager-pin')
  verifyManagerPin(@Body() input: VerifyManagerPinInput, @Req() req: Request) {
    const user = req['user'];
    return this.authService.verifyManagerPin(input, user?.tenantId);
  }

  /**
   * Set or update PIN code for currently authenticated user
   */
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'Set or update 4-digit PIN for staff' })
  @ApiResponse({ status: 200, description: 'PIN updated successfully.' })
  @Patch('/set-pin')
  setPin(@Body() input: SetPinInput, @Req() req: Request) {
    const user = req['user'];
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
