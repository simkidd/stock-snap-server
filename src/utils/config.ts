import * as dotenv from 'dotenv';

dotenv.config();

export type INODE_ENV = 'development' | 'production' | undefined;

const env: INODE_ENV = (process.env.NODE_ENV as INODE_ENV) || 'development';

export const config = {
  PORT: process.env.PORT || 8080,
  API_PATH: process.env.API_PATH || '/api/v1',
  NODE_ENV: env,
  JWT: {
    SECRET: process.env.JWT_SECRET || 'r78hbi8hyin',
    SIGN_IN_EXPIRY: process.env.JWT_SIGN_IN_EXPIRY || '24h',
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'kjkjkjhkh',
    REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // Brevo (Transactional Email & SMS API)
  BREVO_API_KEY: process.env.BREVO_API_KEY || '',
  BREVO_SMS_SENDER: process.env.BREVO_SMS_SENDER || 'StockSnap',
  BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL || 'contact@stocksnap.ng',
  BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME || 'StockSnap Retail',

  // Cloudinary
  CLOUDINARY_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_SECRET: process.env.CLOUDINARY_API_SECRET,

  APP_NAME: 'StockSnap',
  APP_DOMAIN: 'stocksnap.ng',
};
