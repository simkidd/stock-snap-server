import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User, UserRole } from '@prisma/client';
import { Request } from 'express';
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import {
  CreateUserInput,
  FilterUsersInput,
  UpdateRoleInput,
  UpdateStatusInput,
  UpdateUserInput,
} from '../dtos/user.dto';
import { UserService } from '../services/user.service';

@ApiTags('user')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Get all users
  @Public()
  // @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'Return a list of users.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @Get('/')
  getAllUsers(): Promise<User[]> {
    return this.userService.getAllUsers();
  }

  // Get all users with pagination and search
  @Public()
  // @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Filter users with pagination and search' })
  @ApiResponse({
    status: 200,
    description: 'Return a list of filtered users.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @Get('/filter')
  getFilteredUsers(
    @Query('search') search?: string,
    @Query('skip') skip?: number,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ): Promise<User[]> {
    const input: FilterUsersInput = {
      search,
      skip,
      limit,
      page,
    };
    return this.userService.filterUsers(input);
  }

  // Create a new user
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @Post('/create')
  createUser(@Body() input: CreateUserInput): Promise<User> {
    return this.userService.createUser(input);
  }

  // update user
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully updated.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @Patch('/update/:id')
  updateUser(@Body() input: UpdateUserInput) {
    return this.userService.updateUser(input);
  }

  // Get a single user by ID
  @Public()
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'Return a user by ID.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Get('/single/:id')
  getUser(@Param('id') id: string): Promise<User> {
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
  getMe(@Req() req: Request) {
    const user = req['user'];
    return this.userService.getMe(user.id);
  }

  // Update user role
  @ApiOperation({ summary: 'Update user role' })
  @ApiResponse({ status: 200, description: 'User role updated successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Patch('/update-role')
  updateUserRole(@Body() input: UpdateRoleInput): Promise<User> {
    return this.userService.updateUserRole(input);
  }

  // Update user status
  @ApiOperation({ summary: 'Update user status' })
  @ApiResponse({
    status: 200,
    description: 'User status updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Patch('/update-status')
  updateUserStatus(@Body() input: UpdateStatusInput): Promise<User> {
    return this.userService.updateUserStatus(input);
  }
}
