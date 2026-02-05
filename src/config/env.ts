import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'ls-d6ba512515d3100a24bd07020ebbd8d80d546eff.c5evnamfcnk6.us-east-1.rds.amazonaws.com',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'nixtrack',
    password: process.env.DB_PASSWORD || 'K4nd4d0',
    name: process.env.DB_NAME || 'nixtrack',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  uploadPath: process.env.UPLOAD_PATH || 'uploads/',
};
