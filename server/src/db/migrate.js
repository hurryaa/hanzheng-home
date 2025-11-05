#!/usr/bin/env node
import mysql from 'mysql2/promise';
import config, { KNOWN_COLLECTIONS } from '../config.js';

async function ensureDatabase() {
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
  );
  await connection.end();
  console.log(`✓ Ensured database ${config.db.database} exists`);
}

async function ensureSchema() {
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    multipleStatements: true
  });

  await connection.query(`
    CREATE TABLE IF NOT EXISTS collections (
      name VARCHAR(100) PRIMARY KEY,
      data LONGTEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✓ Ensured collections table exists');

  for (const collectionName of KNOWN_COLLECTIONS) {
    await connection.query(
      `INSERT IGNORE INTO collections (name, data) VALUES (?, '[]')`,
      [collectionName]
    );
  }
  console.log('✓ Inserted default collections');

  await connection.end();
}

async function run() {
  try {
    console.log('Running database migrations...');
    await ensureDatabase();
    await ensureSchema();
    console.log('Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Database migration failed:', error);
    process.exit(1);
  }
}

run();
