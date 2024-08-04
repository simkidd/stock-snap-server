import { Test, TestingModule } from '@nestjs/testing';
import { ProductGroupController } from './product-group.controller';
import { ProductGroupService } from '../services/product-group.service';

describe('ProductGroupController', () => {
  let controller: ProductGroupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductGroupController],
      providers: [ProductGroupService],
    }).compile();

    controller = module.get<ProductGroupController>(ProductGroupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
