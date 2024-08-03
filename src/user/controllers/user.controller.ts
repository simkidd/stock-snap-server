import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserInput } from '../dtos/user.dto';
import { User, UserRole } from '@prisma/client';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserWithoutPassword } from 'src/types/user.type';
import { Request } from 'express';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@ApiTags('user')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Create a new user
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @Post('/create')
  async createUser(@Body() input: CreateUserInput): Promise<User> {
    return this.userService.createUser(input);
  }

  // Get a single user by ID
  @Public()
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'Return a user by ID.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Get('/single/:id')
  async getUser(@Param('id') id: string): Promise<User> {
    return this.userService.getUserById(id);
  }

  // Get the authenticated user's information
  @ApiOperation({ summary: 'Get authenticated user information' })
  @ApiResponse({
    status: 200,
    description: 'Return authenticated user information.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @Get('/auth/me')
  async getMe(@Req() req: Request) {
    const user = req['user'];
    return this.userService.getMe(user.id);
  }
}
