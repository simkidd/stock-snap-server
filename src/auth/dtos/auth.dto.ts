import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  Matches,
} from 'class-validator';

export class CreatePasswordInput {
  @ApiProperty({ example: 'Password123!' })
  @IsString()
  password: string;
}

export class LoginRequestInput {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  password: string;
}

export class LoginResponseDTO {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: UserRole.STAFF })
  @IsString()
  role: UserRole;
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
  @ApiProperty({ example: 'john.doe@example.com' })
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
    pattern:
      'Must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
  })
  @IsString()
  @MinLength(8)
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
