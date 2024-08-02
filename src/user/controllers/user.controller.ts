import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserInput } from '../dtos/user.dto';
import { User, UserRole } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('user')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(UserRole.ADMIN)
  @Post('/create')
  async createUser(@Body() input: CreateUserInput): Promise<User> {
    return this.userService.createUser(input);
  }
}
