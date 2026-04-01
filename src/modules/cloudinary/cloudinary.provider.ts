import { v2 as cloudinary } from 'cloudinary';
import { envs } from '../../config/app.config';

export const CLOUDINARY = 'CLOUDINARY';

export const CloudinaryProvider = {
  provide: CLOUDINARY,
  useFactory: () => {
    cloudinary.config({
      // Nombre del cloud — lo encuentras en el Dashboard de Cloudinary
      cloud_name: envs.CLOUDINARY_CLOUD_NAME,
      // API Key — en Settings > API Keys
      api_key: envs.CLOUDINARY_API_KEY,
      // API Secret — en Settings > API Keys (nunca lo expongas al cliente)
      api_secret: envs.CLOUDINARY_API_SECRET,
    });

    return cloudinary;
  },
};
