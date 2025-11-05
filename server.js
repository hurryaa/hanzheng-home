import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 配置
const config = {
  port: process.env.PORT || 4000,
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sauna_membership',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10
  },
  jwtSecret: process.env.JWT_SECRET || 'please_change_me_in_production',
  corsOrigin: process.env.CORS_ORIGIN || '*'
};

// 数据库连接池
let pool = null;

async function getPool() {
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
      enableKeepAlive: true
    });
    console.log('✓ MySQL 连接池已创建');
  }
  return pool;
}

// 数据库初始化
async function initDatabase() {
  console.log('开始初始化数据库...');
  
  // 创建数据库（如果不存在）
  const tempConnection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password
  });
  
  await tempConnection.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await tempConnection.end();
  console.log(`✓ 数据库 ${config.db.database} 已就绪`);
  
  // 创建表
  const db = await getPool();
  
  await db.query(`
    CREATE TABLE IF NOT EXISTS collections (
      name VARCHAR(100) PRIMARY KEY,
      data LONGTEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✓ collections 表已创建');
  
  // 初始化集合
  const collections = [
    'members', 'recharges', 'consumptions', 'cardTypes',
    'systemSettings', 'accounts', 'operationLogs', 'rolePermissions',
    'staffMembers', 'teamGroups', 'branchSettings'
  ];
  
  for (const name of collections) {
    await db.query(
      `INSERT IGNORE INTO collections (name, data) VALUES (?, '[]')`,
      [name]
    );
  }
  console.log('✓ 默认集合已初始化');
  
  // 创建管理员账户
  const [accounts] = await db.query('SELECT data FROM collections WHERE name = ?', ['accounts']);
  const accountsData = accounts.length > 0 ? JSON.parse(accounts[0].data) : [];
  
  if (accountsData.length === 0) {
    const hashedPassword = await bcrypt.hash('123456', 10);
    const adminAccount = {
      id: 'admin',
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      name: '系统管理员',
      email: '',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    accountsData.push(adminAccount);
    await db.query(
      'UPDATE collections SET data = ? WHERE name = ?',
      [JSON.stringify(accountsData), 'accounts']
    );
    console.log('✓ 管理员账户已创建 (admin/123456)');
  } else {
    console.log('✓ 管理员账户已存在');
  }
  
  console.log('数据库初始化完成！');
}

// 中间件
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// API 路由
app.get('/api/health', async (req, res) => {
  try {
    const db = await getPool();
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 获取所有集合
app.get('/api/bootstrap', async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query('SELECT name, data FROM collections');
    const result = {};
    rows.forEach(row => {
      try {
        result[row.name] = JSON.parse(row.data);
      } catch {
        result[row.name] = [];
      }
    });
    res.json({ data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单个集合
app.get('/api/collections/:name', async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query('SELECT data FROM collections WHERE name = ?', [req.params.name]);
    if (rows.length === 0) {
      return res.json({ data: [] });
    }
    res.json({ data: JSON.parse(rows[0].data) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新集合
app.put('/api/collections/:name', async (req, res) => {
  try {
    const db = await getPool();
    const data = JSON.stringify(req.body.data);
    await db.query(
      `INSERT INTO collections (name, data) VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE data = ?, updated_at = CURRENT_TIMESTAMP`,
      [req.params.name, data, data]
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除集合
app.delete('/api/collections/:name', async (req, res) => {
  try {
    const db = await getPool();
    await db.query('UPDATE collections SET data = ? WHERE name = ?', ['[]', req.params.name]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 批量导入
app.post('/api/import', async (req, res) => {
  try {
    const db = await getPool();
    const { collections } = req.body;
    
    for (const [name, data] of Object.entries(collections)) {
      const jsonData = JSON.stringify(data);
      await db.query(
        `INSERT INTO collections (name, data) VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE data = ?, updated_at = CURRENT_TIMESTAMP`,
        [name, jsonData, jsonData]
      );
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 清空所有数据
app.post('/api/clear', async (req, res) => {
  try {
    const db = await getPool();
    await db.query('UPDATE collections SET data = ?', ['[]']);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    
    const db = await getPool();
    const [rows] = await db.query('SELECT data FROM collections WHERE name = ?', ['accounts']);
    const accounts = rows.length > 0 ? JSON.parse(rows[0].data) : [];
    
    const account = accounts.find(acc => acc.username === username);
    if (!account) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    if (account.status !== 'active') {
      return res.status(403).json({ error: '账户已被禁用' });
    }
    
    const token = jwt.sign(
      { id: account.id, username: account.username, role: account.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
    
    // 记录登录日志
    const [logRows] = await db.query('SELECT data FROM collections WHERE name = ?', ['operationLogs']);
    const logs = logRows.length > 0 ? JSON.parse(logRows[0].data) : [];
    logs.unshift({
      id: `LOG${Date.now()}`,
      operator: account.username,
      action: '登录系统',
      module: 'auth',
      details: `用户 ${account.username} 登录系统`,
      timestamp: new Date().toISOString()
    });
    await db.query('UPDATE collections SET data = ? WHERE name = ?', [JSON.stringify(logs), 'operationLogs']);
    
    res.json({
      token,
      user: {
        id: account.id,
        username: account.username,
        role: account.role,
        name: account.name,
        email: account.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 静态文件服务（生产环境）
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, 'dist', 'static');
  app.use(express.static(staticPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// 错误处理
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  res.status(500).json({ error: '服务器内部错误', message: error.message });
});

// 启动服务器
async function start() {
  try {
    // 初始化数据库
    await initDatabase();
    
    // 启动服务器
    app.listen(config.port, () => {
      console.log('');
      console.log('=========================================');
      console.log('🚀 汗蒸会员管理系统已启动');
      console.log('=========================================');
      console.log('');
      console.log(`📍 服务地址: http://localhost:${config.port}`);
      console.log(`📊 健康检查: http://localhost:${config.port}/api/health`);
      console.log('');
      console.log('👤 默认账号: admin');
      console.log('🔑 默认密码: 123456');
      console.log('');
      console.log('⚠️  首次登录后请立即修改密码！');
      console.log('=========================================');
      console.log('');
    });
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

start();
