import dotenv from 'dotenv';

dotenv.config();

const asNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const KNOWN_COLLECTIONS = [
  'members',
  'recharges',
  'consumptions',
  'cardTypes',
  'systemSettings',
  'accounts',
  'operationLogs',
  'rolePermissions',
  'staffMembers',
  'teamGroups',
  'branchSettings'
];

const config = {
  env: process.env.NODE_ENV || 'development',
  port: asNumber(process.env.SERVER_PORT, 4000),
  corsOrigins: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: asNumber(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sauna_membership',
    connectionLimit: asNumber(process.env.DB_CONNECTION_LIMIT, 10)
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'please_change_me',
    bcryptSaltRounds: asNumber(process.env.BCRYPT_SALT_ROUNDS, 10)
  }
};

export default config;
