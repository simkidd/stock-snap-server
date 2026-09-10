import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadedFileResponse {
  @ApiProperty({ example: 'https://res.cloudinary.com/demo/image/upload/v12345/products/item.jpg' })
  url: string;

  @ApiProperty({ example: 'stock_snap/products/item_abc123' })
  publicId: string;

  @ApiPropertyOptional({ example: 'jpg' })
  format?: string;

  @ApiPropertyOptional({ example: 1048576 })
  bytes?: number;

  @ApiPropertyOptional({ example: 'golden-morn.jpg' })
  originalFilename?: string;
}

export class UploadFilesResponse {
  @ApiProperty({ type: [UploadedFileResponse] })
  files: UploadedFileResponse[];

  @ApiProperty({ example: '1 file(s) uploaded successfully' })
  message: string;
}

export class DeleteImageResponse {
  @ApiProperty({ example: 'Asset deleted successfully' })
  message: string;
}
