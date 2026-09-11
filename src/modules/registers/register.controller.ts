import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { RegisterService } from './register.service';
import {
  CloseShiftInput,
  CreateRegisterInput,
  OpenShiftInput,
} from './dtos/register.dto';

@ApiTags('registers')
@Controller('registers')
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}

  @Public()
  @ApiOperation({ summary: 'Get all registers and their active sessions' })
  @ApiResponse({ status: 200, description: 'Return all registers.' })
  @Get()
  getAllRegisters(@Req() req: Request) {
    const tenantId = req['user']?.tenantId;
    return this.registerService.getAllRegisters(tenantId);
  }

  @Public()
  @ApiOperation({ summary: 'Get current active shift metrics for a register' })
  @ApiResponse({ status: 200, description: 'Return active shift metrics.' })
  @Get(':id/active-shift')
  getActiveShift(@Param('id') id: string) {
    return this.registerService.getActiveShift(id);
  }

  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'Create a new register / counter' })
  @ApiResponse({ status: 201, description: 'Register created successfully.' })
  @Post()
  createRegister(@Body() input: CreateRegisterInput, @Req() req: Request) {
    const user = req['user'];
    return this.registerService.createRegister(input, user.id, user.tenantId);
  }

  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: 'Cashier opens shift with opening cash float (e.g. ₦10,000)',
  })
  @ApiResponse({ status: 201, description: 'Shift session opened.' })
  @Post('open-shift')
  openShift(@Body() input: OpenShiftInput, @Req() req: Request) {
    const user = req['user'];
    return this.registerService.openShift(input, user.id, user.tenantId);
  }

  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: 'Cashier closes shift / End-of-Day Z-Report with cash variance',
  })
  @ApiResponse({
    status: 200,
    description: 'Shift closed and Z-Report generated.',
  })
  @Post('close-shift')
  closeShift(@Body() input: CloseShiftInput) {
    return this.registerService.closeShift(input);
  }
}
