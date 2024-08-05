import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { UploadService } from '../services/upload.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('image upload')
@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('/brand/:brandId')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a brand image' })
  @ApiParam({ name: 'brandId', type: String, description: 'ID of the brand' })
  @ApiBody({
    description: 'The image file to upload',
    type: 'multipart/form-data',
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: 'Brand image uploaded successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async uploadBrandImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('brandId') brandId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds the 2MB limit');
    }

    await this.uploadService.uploadBrandImage(file, brandId);
    return { message: 'Brand image uploaded successfully' };
  }

  @Post('/user/:userId')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a user avatar' })
  @ApiBody({
    description: 'The avatar file to upload',
    type: 'multipart/form-data',
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: 'User avatar uploaded successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async uploadUserAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Param('userId') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds the 2MB limit');
    }

    await this.uploadService.uploadUserAvatar(file, userId);
    return { message: 'User avatar uploaded successfully' };
  }

  @Post('/product/:productId')
  @UseInterceptors(FilesInterceptor('files')) // Limit to 4 files
  @ApiOperation({ summary: 'Upload multiple product images' })
  @ApiBody({
    description: 'The product image files to upload',
    type: 'multipart/form-data',
    required: true,
    isArray: true,
  })
  @ApiResponse({
    status: 201,
    description: 'Product images uploaded successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async uploadProductImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('productId') productId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Files are required');
    }

    if (files.length > 4) {
      throw new BadRequestException(
        'Cannot upload more than 4 images at a time',
      );
    }
    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) {
        throw new BadRequestException('File size exceeds the 2MB limit');
      }
    }

    await this.uploadService.uploadProductImages(files, productId);
    return { message: 'Product images uploaded successfully' };
  }

  @Post('/product/:productId/update')
  @UseInterceptors(FilesInterceptor('files')) // Limit to 4 files
  @ApiOperation({ summary: 'Update multiple product images' })
  @ApiBody({
    description: 'The product image files to update',
    type: 'multipart/form-data',
    required: true,
    isArray: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Product images updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async updateProductImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('productId') productId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Files are required');
    }

    if (files.length > 4) {
      throw new BadRequestException(
        'Cannot upload more than 4 images at a time',
      );
    }
    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) {
        throw new BadRequestException('File size exceeds the 2MB limit');
      }
    }
    await this.uploadService.updateProductImages(files, productId);
    return { message: 'Product images updated successfully' };
  }

  @Delete('/brand/:brandId')
  @ApiOperation({ summary: 'Delete a brand image' })
  @ApiResponse({ status: 200, description: 'Brand image deleted successfully' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  async deleteBrandImage(@Param('brandId') brandId: string) {
    await this.uploadService.deleteBrandImage(brandId);
    return { message: 'Brand image deleted successfully' };
  }

  @Delete('/user/:userId')
  @ApiOperation({ summary: 'Delete a user avatar' })
  @ApiResponse({ status: 200, description: 'User avatar deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUserAvatar(@Param('userId') userId: string) {
    await this.uploadService.deleteUserAvatar(userId);
    return { message: 'User avatar deleted successfully' };
  }

  @Delete('/product/:productId/:imageId')
  @ApiOperation({ summary: 'Delete a product image' })
  @ApiResponse({
    status: 200,
    description: 'Product image deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Product or image not found' })
  async deleteProductImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    await this.uploadService.deleteProductImage(productId, imageId);
    return { message: 'Product image deleted successfully' };
  }

  @Patch('/:productId/images/:imageId/main')
  @ApiOperation({ summary: 'Set a product image as the main image' })
  @ApiResponse({
    status: 200,
    description: 'Main product image set successfully',
  })
  @ApiResponse({ status: 404, description: 'Product or image not found' })
  async setMainImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ): Promise<void> {
    await this.uploadService.setMainProductImage(productId, imageId);
  }
}
