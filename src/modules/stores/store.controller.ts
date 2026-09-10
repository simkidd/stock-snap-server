import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { StoreService } from './store.service';

@ApiTags('stores')
@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Public()
  @ApiOperation({ summary: 'Get business profile & active store branches' })
  @ApiResponse({ status: 200, description: 'Return tenant and store details.' })
  @Get('business-profile')
  getBusinessProfile(@Req() req: Request) {
    const tenantId = req['user']?.tenantId;
    return this.storeService.getTenantInfo(tenantId);
  }

  @Public()
  @ApiOperation({ summary: 'Get all store branches' })
  @ApiResponse({ status: 200, description: 'Return all stores.' })
  @Get()
  getAllStores(@Req() req: Request) {
    const tenantId = req['user']?.tenantId;
    return this.storeService.getAllStores(tenantId);
  }

  @Public()
  @ApiOperation({ summary: 'Get store branch by ID' })
  @ApiResponse({ status: 200, description: 'Return store details.' })
  @Get(':id')
  getStoreById(@Param('id') id: string) {
    return this.storeService.getStoreById(id);
  }
}
