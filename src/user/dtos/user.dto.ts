import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatusEnum } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateUserInput {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  password: string;

  @ApiProperty({ example: 'Male' })
  @IsString()
  gender: string;

  @ApiProperty({ example: 'ADMIN', enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ example: '123 Main St, Springfield', required: false })
  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdateUserInput extends CreateUserInput {
  @ApiProperty({ example: 'user-id' })
  @IsString()
  id: string;
}

export class FilterUsersInput {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  skip?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  page?: number;
}

export class UpdateRoleInput {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdateStatusInput {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsEnum(UserStatusEnum)
  status: UserStatusEnum;
}
