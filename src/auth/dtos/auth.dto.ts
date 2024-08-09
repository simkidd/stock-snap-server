import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

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
