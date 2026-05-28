require('dotenv').config();

module.exports = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  DATABASE_PATH: process.env.DATABASE_PATH || './database.sqlite',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  TAX_RATE: parseFloat(process.env.TAX_RATE) || 0.13,
  NODE_ENV: process.env.NODE_ENV || 'development',
};
