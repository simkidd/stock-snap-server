import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { deleteImage, uploadImage } from 'src/utils/cloudinary';
import {
  DeleteImageResponse,
  UploadedFileResponse,
  UploadFilesResponse,
} from './dtos/image.dto';

@Injectable()
export class UploadService {
  /**
   * Universal upload for single or multiple files to Cloudinary
   * @param files Array of uploaded Multer files
   * @param folder Target folder name in Cloudinary (e.g. 'products', 'brands', 'avatars', 'receipts')
   */
  async uploadFiles(
    files: Express.Multer.File[],
    folder = 'products',
  ): Promise<UploadFilesResponse> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided for upload');
    }

    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
    const uploadPromises = files.map(async (file) => {
      try {
        const result = await uploadImage(file, {
          folder: `stock_snap/${sanitizedFolder}`,
          transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }],
        });

        const uploaded: UploadedFileResponse = {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
          originalFilename: file.originalname,
        };
        return uploaded;
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error';
        throw new InternalServerErrorException(
          `Failed to upload ${file.originalname}: ${errorMsg}`,
        );
      }
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    return {
      files: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
    };
  }

  /**
   * Universal delete for any Cloudinary asset by its publicId
   */
  async deleteAsset(publicId: string): Promise<DeleteImageResponse> {
    if (!publicId) {
      throw new BadRequestException('publicId is required');
    }

    try {
      await deleteImage(publicId);
      return { message: `Asset "${publicId}" deleted successfully` };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `Failed to delete asset: ${errorMsg}`,
      );
    }
  }
}
