import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from 'src/generated/prisma';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  Matches,
  IsOptional,
  Length,
} from 'class-validator';

export class CreatePasswordInput {
  @ApiProperty({ example: 'Password123!' })
  @IsString()
  password: string;
}

export class LoginRequestInput {
  @ApiProperty({ example: 'cashier@stocksnap.ng' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  password: string;
}

export class PinLoginInput {
  @ApiProperty({
    example: 'cashier@stocksnap.ng',
    description: 'Staff Email or username',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '0000',
    description: '4-digit Cashier/Manager PIN code',
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 6, { message: 'PIN must be between 4 and 6 digits' })
  pin: string;
}

export class RefreshTokenInput {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token to obtain a fresh access token',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class VerifyManagerPinInput {
  @ApiProperty({
    example: '9999',
    description: '4-digit Manager PIN code for overrides/refunds',
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 6, { message: 'PIN must be between 4 and 6 digits' })
  pin: string;
}

export class SetPinInput {
  @ApiProperty({ example: '0000', description: 'New 4-digit PIN code' })
  @IsString()
  @IsNotEmpty()
  @Length(4, 6, { message: 'PIN must be between 4 and 6 digits' })
  pin: string;
}

export class LoginResponseDTO {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  token: string;

  @ApiPropertyOptional({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiProperty({ example: 'user_cuid' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'Blessing Jumbo' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'cashier@stocksnap.ng' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: UserRole.CASHIER })
  @IsString()
  role: UserRole;

  @ApiPropertyOptional({ example: 'tenant_cuid' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ example: 'store_cuid' })
  @IsOptional()
  @IsString()
  storeId?: string;
}

export class UpdatePasswordInput {
  @ApiProperty({ example: 'user_id' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'OldPassword123!' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}

export class ResetPasswordInput {
  @ApiProperty({ example: 'user_id' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}

export class ForgotPasswordInput {
  @ApiProperty({ example: 'admin@stocksnap.ng' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class CreateNewPasswordInput {
  @ApiProperty({
    example: 'user_id',
    description: 'The unique identifier of the user.',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    example: 'reset_token',
    description: 'The token used for password reset.',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'NewPassword123!',
    description: 'The new password that the user wants to set.',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter',
  })
  @Matches(/\d/, { message: 'Password must contain at least one number' })
  @Matches(/[\W_]/, {
    message: 'Password must contain at least one special character',
  })
  newPassword: string;
}
