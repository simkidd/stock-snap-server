import { Injectable } from '@nestjs/common';
import { CreateProductGroupDto } from './dto/create-product-group.dto';
import { UpdateProductGroupDto } from './dto/update-product-group.dto';

@Injectable()
export class ProductGroupService {
  create(createProductGroupDto: CreateProductGroupDto) {
    return 'This action adds a new productGroup';
  }

  findAll() {
    return `This action returns all productGroup`;
  }

  findOne(id: number) {
    return `This action returns a #${id} productGroup`;
  }

  update(id: number, updateProductGroupDto: UpdateProductGroupDto) {
    return `This action updates a #${id} productGroup`;
  }

  remove(id: number) {
    return `This action removes a #${id} productGroup`;
  }
}
