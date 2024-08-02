import * as dotenv from 'dotenv';

dotenv.config();

export type INODE_ENV = 'development' | 'production' | undefined;

const env: INODE_ENV = (process.env.NODE_ENV as INODE_ENV) || 'development';

export const config = {
  PORT: process.env.PORT || 8080,
  API_PATH: process.env.API_PATH || '/api/v1',
  NODE_ENV: env,
};
