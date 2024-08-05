import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { UploadService } from '../services/upload.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('image upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('/brand/:brandId')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBrandImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('brandId') brandId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    await this.uploadService.uploadBrandImage(file, brandId);
    return { message: 'Brand image uploaded successfully' };
  }

  @Post('/user/:userId')
  @UseInterceptors(FileInterceptor('file'))
  async uploadUserAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Param('userId') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    await this.uploadService.uploadUserAvatar(file, userId);
    return { message: 'User avatar uploaded successfully' };
  }

  @Post('/product/:productId')
  @UseInterceptors(FilesInterceptor('files', 4)) // Limit to 4 files
  async uploadProductImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('productId') productId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Files are required');
    }
    await this.uploadService.uploadProductImages(files, productId);
    return { message: 'Product images uploaded successfully' };
  }

  @Post('/product/:productId/update')
  @UseInterceptors(FilesInterceptor('files', 4)) // Limit to 4 files
  async updateProductImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('productId') productId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Files are required');
    }
    await this.uploadService.updateProductImages(files, productId);
    return { message: 'Product images updated successfully' };
  }

  @Delete('/brand/:brandId')
  async deleteBrandImage(@Param('brandId') brandId: string) {
    await this.uploadService.deleteBrandImage(brandId);
    return { message: 'Brand image deleted successfully' };
  }

  @Delete('/user/:userId')
  async deleteUserAvatar(@Param('userId') userId: string) {
    await this.uploadService.deleteUserAvatar(userId);
    return { message: 'User avatar deleted successfully' };
  }

  @Delete('/product/:productId/:imageId')
  async deleteProductImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    await this.uploadService.deleteProductImage(productId, imageId);
    return { message: 'Product image deleted successfully' };
  }
}
