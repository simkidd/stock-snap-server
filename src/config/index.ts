import * as dotenv from 'dotenv';

dotenv.config();

export const config = () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT ?? '8080', 10),
  apiPath: process.env.API_PATH || '/api/v1',
  database: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'r78hbi8hyin',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  brevo: {
    apiKey: process.env.BREVO_API_KEY || '',
    smsSender: process.env.BREVO_SMS_SENDER || 'StockSnap',
    senderEmail: process.env.BREVO_SENDER_EMAIL || 'contact@stocksnap.ng',
    senderName: process.env.BREVO_SENDER_NAME || 'StockSnap Retail',
  },
  app: {
    name: process.env.APP_NAME || 'StockSnap',
    domain: process.env.APP_DOMAIN || 'stocksnap.ng',
  },
});
