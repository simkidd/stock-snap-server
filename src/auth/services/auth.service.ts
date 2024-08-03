import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from 'src/user/services/user.service';
import { LoginRequestInput, LoginResponseDTO } from '../dtos/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService,
  ) {}

  async signIn(input: LoginRequestInput): Promise<LoginResponseDTO> {
    try {
      const user = await this.userService.getUserByEmail(input.email);
      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const isMatch = await this.comparePassword(user.password, input.password);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid password');
      }

      const payload = { id: user.id, email: user.email, role: user.role };
      const token = await this.jwtService.signAsync(payload);

      return {
        token,
        email: user.email,
        role: user.role,
      };
    } catch (error) {
      throw error;
    }
  }

  
  private async comparePassword(
    hashedPassword: string,
    plainPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
