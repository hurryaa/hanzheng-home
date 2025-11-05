import mysql from 'mysql2/promise';
import config from '../config.js';

let pool = null;

export async function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      connectionLimit: config.db.connectionLimit,
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
    
    console.log('✓ MySQL connection pool created');
    
    // Test connection
    try {
      const connection = await pool.getConnection();
      console.log('✓ Successfully connected to MySQL database');
      connection.release();
    } catch (error) {
      console.error('✗ Failed to connect to MySQL:', error.message);
      throw error;
    }
  }
  
  return pool;
}

export async function query(sql, params) {
  const pool = await getPool();
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function transaction(callback) {
  const pool = await getPool();
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✓ MySQL connection pool closed');
  }
}
