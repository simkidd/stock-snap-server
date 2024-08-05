import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ImageUploadResponse {
  @ApiProperty({ example: 'Upload successful' })
  @IsString()
  message: string;
}

export class CloudinaryUploadResponse {
  @IsString()
  publicId: string;

  @IsString()
  imageUrl: string;
}
