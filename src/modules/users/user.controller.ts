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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User, UserRole } from 'src/generated/prisma';
import { Request } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import {
  CreateUserInput,
  UpdateRoleInput,
  UpdateStatusInput,
  UpdateUserInput,
} from './dtos/user.dto';
import { UserService } from './user.service';

@ApiTags('users')
@ApiBearerAuth('Authorization')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @ApiOperation({
    summary: 'Get all staff users with optional search & pagination',
  })
  @ApiResponse({ status: 200, description: 'Return list of users.' })
  @Get()
  getUsers(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<User[]> {
    if (search || page || limit) {
      return this.userService.filterUsers({ search, page, limit });
    }
    return this.userService.getAllUsers();
  }

  @ApiOperation({ summary: 'Get currently authenticated staff profile' })
  @ApiResponse({
    status: 200,
    description: 'Return authenticated user information.',
  })
  @Get('me')
  getMe(@Req() req: Request) {
    const user = req['user'];
    return this.userService.getMe(user.id);
  }

  @Public()
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'Return a user by ID.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Get(':id')
  getUserById(@Param('id') id: string): Promise<User> {
    return this.userService.getUserById(id);
  }

  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'Create a new staff member' })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @Post()
  createUser(@Body() input: CreateUserInput): Promise<User> {
    return this.userService.createUser(input);
  }

  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'Update staff user profile' })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() input: UpdateUserInput) {
    return this.userService.updateUser({ ...input, id });
  }

  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update staff role' })
  @ApiResponse({ status: 200, description: 'User role updated successfully.' })
  @Patch('role/update')
  updateUserRole(@Body() input: UpdateRoleInput): Promise<User> {
    return this.userService.updateUserRole(input);
  }

  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({
    summary: 'Update staff status (Active, Inactive, Suspended)',
  })
  @ApiResponse({
    status: 200,
    description: 'User status updated successfully.',
  })
  @Patch('status/update')
  updateUserStatus(@Body() input: UpdateStatusInput): Promise<User> {
    return this.userService.updateUserStatus(input);
  }
}
