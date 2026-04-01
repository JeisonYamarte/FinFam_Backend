import { Inject, Injectable } from '@nestjs/common';
import {
  UploadApiErrorResponse,
  UploadApiResponse,
  v2 as cloudinary,
} from 'cloudinary';
import { CLOUDINARY } from './cloudinary.provider';
import { Readable } from 'stream';

export interface CloudinaryUploadResult {
  url: string; // URL pública del archivo
  publicId: string; // Identificador en Cloudinary (necesario para eliminar)
  format: string; // Formato del archivo (jpg, png, pdf, etc.)
  bytes: number; // Tamaño en bytes
}

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject(CLOUDINARY) private readonly cloudinaryClient: typeof cloudinary,
  ) {}

  /**
   * Sube un archivo a Cloudinary desde un buffer (multer MemoryStorage)
   * @param buffer  - Buffer del archivo recibido por multer
   * @param folder  - Carpeta destino en Cloudinary (ej: 'expenses/receipts')
   * @param resourceType - Tipo de recurso: 'image' | 'raw' | 'video' | 'auto'
   */
  async uploadFile(
    buffer: Buffer,
    folder: string,
    resourceType: 'image' | 'raw' | 'video' | 'auto' = 'auto',
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinaryClient.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error || !result) {
            const uploadError = error
              ? new Error(`Cloudinary upload error: ${error.message}`)
              : new Error('Upload failed: no result');
            return reject(uploadError);
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes,
          });
        },
      );

      // Convierte el buffer a stream y lo pipe al upload
      Readable.from(buffer).pipe(uploadStream);
    });
  }

  /**
   * Elimina un archivo de Cloudinary usando su publicId
   * @param publicId     - El public_id retornado al subir el archivo
   * @param resourceType - Debe coincidir con el tipo usado al subir
   */
  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'raw' | 'video' | 'auto' = 'image',
  ): Promise<void> {
    await this.cloudinaryClient.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  }
}
