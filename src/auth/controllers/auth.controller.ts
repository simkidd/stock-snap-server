import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginRequestInput } from '../dtos/auth.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { Public } from '../decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('/login')
  signIn(@Body() input: LoginRequestInput) {
    return this.authService.signIn(input);
  }

  @UseGuards(AuthGuard)
  @Get('/me')
  getProfile(@Request() req) {
    return req.user;
  }
}
