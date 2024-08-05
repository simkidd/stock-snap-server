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
import { ImageUploadResponse } from '../dtos/image.dto';

@ApiTags('image upload')
@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // brand image upload
  @Post('/brand/:brandId')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a brand image' })
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
  uploadBrandImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('brandId') brandId: string,
  ) {
    return this.uploadService.uploadBrandImage(file, brandId);
  }

  // upload user profile image
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
  uploadUserAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Param('userId') userId: string,
  ) {
    return this.uploadService.uploadUserAvatar(file, userId);
  }

  // upload product images
  @Post('/product/add/:productId')
  @UseInterceptors(FilesInterceptor('files'))
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
  uploadProductImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('productId') productId: string,
  ) {
    return this.uploadService.uploadProductImages(files, productId);
  }

  // update product images
  @Post('/product/update/:productId')
  @UseInterceptors(FilesInterceptor('files')) 
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
  updateProductImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('productId') productId: string,
  ) {
    return this.uploadService.updateProductImages(files, productId);
  }

  // delete brand image
  @Delete('/brand/:brandId')
  @ApiOperation({ summary: 'Delete a brand image' })
  @ApiResponse({ status: 200, description: 'Brand image deleted successfully' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  deleteBrandImage(@Param('brandId') brandId: string) {
    return this.uploadService.deleteBrandImage(brandId);
  }

  // delete user image
  @Delete('/user/:userId')
  @ApiOperation({ summary: 'Delete a user avatar' })
  @ApiResponse({ status: 200, description: 'User avatar deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  deleteUserAvatar(@Param('userId') userId: string) {
    return this.uploadService.deleteUserAvatar(userId);
  }

  // delete product image
  @Delete('/product/:productId/:imageId')
  @ApiOperation({ summary: 'Delete a product image' })
  @ApiResponse({
    status: 200,
    description: 'Product image deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Product or image not found' })
  deleteProductImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.uploadService.deleteProductImage(productId, imageId);
  }

  // select main product image
  @Patch('/product/:productId/images/:imageId/main')
  @ApiOperation({ summary: 'Set a product image as the main image' })
  @ApiResponse({
    status: 200,
    description: 'Main product image set successfully',
  })
  @ApiResponse({ status: 404, description: 'Product or image not found' })
  setMainImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.uploadService.setMainProductImage(productId, imageId);
  }
}
