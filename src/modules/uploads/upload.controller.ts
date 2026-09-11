import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { DeleteImageResponse, UploadFilesResponse } from './dtos/image.dto';

@ApiTags('uploads')
@ApiBearerAuth('Authorization')
@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Universal Single/Multiple File Upload Endpoint
   * Accepts one or more files and an optional folder name
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: 'Upload single or multiple images to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'folder',
    required: false,
    example: 'products',
    description: 'Target sub-folder (e.g. products, brands, avatars, stores)',
  })
  @ApiBody({
    description: 'Files to upload',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Files successfully uploaded.',
    type: UploadFilesResponse,
  })
  @ApiResponse({ status: 400, description: 'Bad Request / No files provided' })
  uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder?: string,
  ): Promise<UploadFilesResponse> {
    return this.uploadService.uploadFiles(files, folder || 'products');
  }

  /**
   * Universal Asset Deletion Endpoint
   */
  @Delete()
  @ApiOperation({ summary: 'Delete any asset from Cloudinary by publicId' })
  @ApiQuery({
    name: 'publicId',
    required: true,
    example: 'stock_snap/products/item_123',
    description: 'Cloudinary public_id of the asset to delete',
  })
  @ApiResponse({
    status: 200,
    description: 'Asset successfully deleted.',
    type: DeleteImageResponse,
  })
  deleteAsset(
    @Query('publicId') publicId: string,
  ): Promise<DeleteImageResponse> {
    return this.uploadService.deleteAsset(publicId);
  }
}
