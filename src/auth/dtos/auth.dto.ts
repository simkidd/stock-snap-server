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
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;
}

export class ResetPasswordInput {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;
}

export class ForgotPasswordInput {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
