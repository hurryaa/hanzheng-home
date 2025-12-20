import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { existsSync } from 'fs';
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

const originalDbHost = config.db.host;
const dbConnectTimeout = (() => {
  const envValue = Number(process.env.DB_CONNECT_TIMEOUT);
  if (Number.isNaN(envValue) || envValue <= 0) {
    return 5000;
  }
  return envValue;
})();

let resolvedDbHost = null;
let hostResolutionPromise = null;

function parseFallbackHosts() {
  const fallbackEnv = process.env.DB_HOST_FALLBACKS;
  if (fallbackEnv && fallbackEnv.trim().length > 0) {
    return fallbackEnv
      .split(',')
      .map(host => host.trim())
      .filter(Boolean);
  }
  if (['127.0.0.1', 'localhost'].includes(originalDbHost)) {
    return ['host.docker.internal', '172.17.0.1'];
  }
  return [];
}

async function resolveDbHost() {
  if (resolvedDbHost) {
    return resolvedDbHost;
  }

  if (!hostResolutionPromise) {
    hostResolutionPromise = (async () => {
      const fallbackHosts = parseFallbackHosts();
      const candidates = [
        config.db.host,
        ...fallbackHosts.filter(host => host && host !== config.db.host)
      ];

      const attemptErrors = [];

      for (const host of candidates) {
        try {
          const connection = await mysql.createConnection({
            host,
            port: config.db.port,
            user: config.db.user,
            password: config.db.password,
            connectTimeout: dbConnectTimeout
          });
          await connection.query('SELECT 1');
          await connection.end();

          resolvedDbHost = host;
          config.db.host = host;

          if (host !== originalDbHost) {
            console.warn(`⚠️  数据库主机不可达 (${originalDbHost})，自动切换到: ${host}`);
          } else {
            console.log(`✓ 数据库主机: ${host}`);
          }

          return host;
        } catch (error) {
          attemptErrors.push({
            host,
            code: error.code,
            message: error.message
          });
        }
      }

      const resolutionError = new Error('无法连接到数据库，请检查 DB_HOST 配置');
      resolutionError.code = 'DB_HOST_RESOLUTION_FAILED';
      resolutionError.originalHost = originalDbHost;
      resolutionError.attempts = attemptErrors;
      resolutionError.candidates = candidates;
      throw resolutionError;
    })();
  }

  try {
    return await hostResolutionPromise;
  } catch (error) {
    hostResolutionPromise = null;
    throw error;
  }
}

// 数据库连接池
let pool = null;

async function getPool() {
  if (!pool) {
    const host = await resolveDbHost();
    pool = mysql.createPool({
      host,
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
  
  // 解析数据库主机
  try {
    await resolveDbHost();
  } catch (error) {
    if (error.code === 'DB_HOST_RESOLUTION_FAILED') {
      console.error('');
      console.error('无法连接到任何数据库主机');
      if (Array.isArray(error.attempts) && error.attempts.length > 0) {
        console.error('尝试的主机列表:');
        error.attempts.forEach(attempt => {
          const code = attempt.code ? ` (${attempt.code})` : '';
          console.error(`  - ${attempt.host}${code}: ${attempt.message}`);
        });
      }
      console.error('');
    }
    throw error;
  }
  
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
    'staffMembers', 'teamGroups', 'branchSettings',
    // 汗蒸系统新增
    'stores', 'packageConfigs', 'packageStoreMaps',
    'userPackages', 'userPackageStoreMaps',
    'purchaseRecords', 'redemptionRecords', 'sessionAdjustments',
    'distributorProfiles', 'inviteBindings', 'commissionRecords',
    'auditLogs'
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

// ========== 新增：员工登录 ==========
app.post('/api/auth/staff-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    
    const db = await getPool();
    const [rows] = await db.query('SELECT data FROM collections WHERE name = ?', ['staffMembers']);
    const staffMembers = rows.length > 0 ? JSON.parse(rows[0].data) : [];
    
    const staff = staffMembers.find((s) => s.username === username);
    if (!staff) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, staff.password_hash || staff.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    if (staff.status !== 'active') {
      return res.status(403).json({ error: '账户已被禁用' });
    }
    
    const token = jwt.sign(
      { id: staff.id, username: staff.username, role: 'staff', storeId: staff.storeId },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: staff.id,
        username: staff.username,
        role: 'staff',
        name: staff.name,
        storeId: staff.storeId
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== 新增：会员管理 API ==========
app.get('/api/members', async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query('SELECT data FROM collections WHERE name = ?', ['members']);
    const members = rows.length > 0 ? JSON.parse(rows[0].data) : [];
    res.json({ data: members });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/members/:id', async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query('SELECT data FROM collections WHERE name = ?', ['members']);
    const members = rows.length > 0 ? JSON.parse(rows[0].data) : [];
    const member = members.find((m) => m.id === req.params.id);
    
    if (!member) {
      return res.status(404).json({ error: '会员不存在' });
    }
    
    res.json({ data: member });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/members', async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query('SELECT data FROM collections WHERE name = ?', ['members']);
    const members = rows.length > 0 ? JSON.parse(rows[0].data) : [];
    
    const newMember = {
      id: `USER${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    members.unshift(newMember);
    await db.query('UPDATE collections SET data = ? WHERE name = ?', [JSON.stringify(members), 'members']);
    
    res.json({ data: newMember });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/members/search', async (req, res) => {
  try {
    const keyword = req.query.keyword || '';
    const db = await getPool();
    const [rows] = await db.query('SELECT data FROM collections WHERE name = ?', ['members']);
    const members = rows.length > 0 ? JSON.parse(rows[0].data) : [];
    
    const filtered = members.filter((m) =>
      m.name.includes(keyword) || m.phone.includes(keyword)
    );
    
    res.json({ data: filtered });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== 新增：套餐配置 API ==========
app.get('/api/packages', async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query('SELECT data FROM collections WHERE name = ?', ['packageConfigs']);
    const packages = rows.length > 0 ? JSON.parse(rows[0].data) : [];
    res.json({ data: packages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/packages', async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query('SELECT data FROM collections WHERE name = ?', ['packageConfigs']);
    const packages = rows.length > 0 ? JSON.parse(rows[0].data) : [];
    
    const newPackage = {
      id: `PKG${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    packages.push(newPackage);
    await db.query('UPDATE collections SET data = ? WHERE name = ?', [JSON.stringify(packages), 'packageConfigs']);
    
    res.json({ data: newPackage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/packages/:id', async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query('SELECT data FROM collections WHERE name = ?', ['packageConfigs']);
    const packages = rows.length > 0 ? JSON.parse(rows[0].data) : [];
    
    const index = packages.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: '套餐不存在' });
    }
    
    packages[index] = { ...packages[index], ...req.body };
    await db.query('UPDATE collections SET data = ? WHERE name = ?', [JSON.stringify(packages), 'packageConfigs']);
    
    res.json({ data: packages[index] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/packages/:id', async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query('SELECT data FROM collections WHERE name = ?', ['packageConfigs']);
    const packages = rows.length > 0 ? JSON.parse(rows[0].data) : [];
    
    const filtered = packages.filter((p) => p.id !== req.params.id);
    await db.query('UPDATE collections SET data = ? WHERE name = ?', [JSON.stringify(filtered), 'packageConfigs']);
    
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== 新增：用户次卡 API ==========
app.get('/api/users/:userId/packages', async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query('SELECT data FROM collections WHERE name = ?', ['userPackages']);
    const packages = rows.length > 0 ? JSON.parse(rows[0].data) : [];
    
    const userPackages = packages.filter((p) => p.userId === req.params.userId);
    res.json({ data: userPackages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:userId/package-balance', async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query('SELECT data FROM collections WHERE name = ?', ['userPackages']);
    const packages = rows.length > 0 ? JSON.parse(rows[0].data) : [];
    
    const userPackages = packages.filter((p) => p.userId === req.params.userId);
    const now = new Date();
    
    let availableSessions = 0;
    let expiringSessions = 0;
    let expiredSessions = 0;
    let totalSessions = 0;
    
    userPackages.forEach((pkg) => {
      const expiresAt = new Date(pkg.expiresAt);
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      if (pkg.status === 'active' && expiresAt > now) {
        availableSessions += pkg.remainingSessions;
        totalSessions += pkg.totalSessions;
        if (expiresAt <= sevenDaysLater) {
          expiringSessions += pkg.remainingSessions;
        }
      } else if (pkg.status === 'active' && expiresAt <= now) {
        expiredSessions += pkg.remainingSessions;
        totalSessions += pkg.totalSessions;
      } else {
        totalSessions += pkg.totalSessions;
      }
    });
    
    res.json({
      data: {
        availableSessions,
        expiringSessions,
        expiredSessions,
        redeemedSessions: 0,
        totalSessions
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== 新增：购买记录 API ==========
app.post('/api/purchase-records', async (req, res) => {
  try {
    const db = await getPool();
    
    // 创建购买记录
    const [purchaseRows] = await db.query('SELECT data FROM collections WHERE name = ?', ['purchaseRecords']);
    const purchases = purchaseRows.length > 0 ? JSON.parse(purchaseRows[0].data) : [];
    
    const newPurchase = {
      id: `PR${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    purchases.unshift(newPurchase);
    await db.query('UPDATE collections SET data = ? WHERE name = ?', [JSON.stringify(purchases), 'purchaseRecords']);
    
    // 创建用户次卡
    const [packageRows] = await db.query('SELECT data FROM collections WHERE name = ?', ['userPackages']);
    const userPackages = packageRows.length > 0 ? JSON.parse(packageRows[0].data) : [];
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (req.body.validDays || 180));
    
    const userPackage = {
      id: `UP${Date.now()}`,
      userId: req.body.userId,
      packageId: req.body.packageId,
      totalSessions: req.body.sessionsAdded,
      remainingSessions: req.body.sessionsAdded,
      priceAmount: req.body.amount,
      purchasedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      applicableStoreScope: 'all',
      status: 'active'
    };
    
    userPackages.unshift(userPackage);
    await db.query('UPDATE collections SET data = ? WHERE name = ?', [JSON.stringify(userPackages), 'userPackages']);
    
    res.json({ data: newPurchase });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== 新增：核销记录 API ==========
app.post('/api/redemption-records', async (req, res) => {
  try {
    const db = await getPool();
    
    // 创建核销记录
    const [redemptionRows] = await db.query('SELECT data FROM collections WHERE name = ?', ['redemptionRecords']);
    const redemptions = redemptionRows.length > 0 ? JSON.parse(redemptionRows[0].data) : [];
    
    const newRedemption = {
      id: `RD${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    redemptions.unshift(newRedemption);
    await db.query('UPDATE collections SET data = ? WHERE name = ?', [JSON.stringify(redemptions), 'redemptionRecords']);
    
    // 更新用户次卡的剩余次数
    const [packageRows] = await db.query('SELECT data FROM collections WHERE name = ?', ['userPackages']);
    const userPackages = packageRows.length > 0 ? JSON.parse(packageRows[0].data) : [];
    
    const pkgIndex = userPackages.findIndex((p) => p.id === req.body.userPackageId);
    if (pkgIndex !== -1) {
      userPackages[pkgIndex].remainingSessions -= req.body.sessionsDeducted;
      await db.query('UPDATE collections SET data = ? WHERE name = ?', [JSON.stringify(userPackages), 'userPackages']);
    }
    
    res.json({ data: newRedemption });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/redemption-records/:id/void', async (req, res) => {
  try {
    const db = await getPool();
    
    // 更新核销记录状态
    const [redemptionRows] = await db.query('SELECT data FROM collections WHERE name = ?', ['redemptionRecords']);
    const redemptions = redemptionRows.length > 0 ? JSON.parse(redemptionRows[0].data) : [];
    
    const record = redemptions.find((r) => r.id === req.params.id);
    if (!record) {
      return res.status(404).json({ error: '核销记录不存在' });
    }
    
    record.status = 'void';
    await db.query('UPDATE collections SET data = ? WHERE name = ?', [JSON.stringify(redemptions), 'redemptionRecords']);
    
    // 回滚用户次卡的剩余次数
    const [packageRows] = await db.query('SELECT data FROM collections WHERE name = ?', ['userPackages']);
    const userPackages = packageRows.length > 0 ? JSON.parse(packageRows[0].data) : [];
    
    const pkgIndex = userPackages.findIndex((p) => p.id === record.userPackageId);
    if (pkgIndex !== -1) {
      userPackages[pkgIndex].remainingSessions += record.sessionsDeducted;
      await db.query('UPDATE collections SET data = ? WHERE name = ?', [JSON.stringify(userPackages), 'userPackages']);
    }
    
    res.json({ data: record });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/redemption-records', async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query('SELECT data FROM collections WHERE name = ?', ['redemptionRecords']);
    const records = rows.length > 0 ? JSON.parse(rows[0].data) : [];
    res.json({ data: records });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== 新增：其他API占位符 ==========
// 这些API可以在后续迭代中补充实现
app.get('/api/distributors/:userId', async (req, res) => {
  res.json({ data: null });
});

app.get('/api/audit-logs', async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query('SELECT data FROM collections WHERE name = ?', ['auditLogs']);
    const logs = rows.length > 0 ? JSON.parse(rows[0].data) : [];
    res.json({ data: logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/audit-logs', async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query('SELECT data FROM collections WHERE name = ?', ['auditLogs']);
    const logs = rows.length > 0 ? JSON.parse(rows[0].data) : [];
    
    const newLog = {
      id: `AL${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    logs.unshift(newLog);
    await db.query('UPDATE collections SET data = ? WHERE name = ?', [JSON.stringify(logs), 'auditLogs']);
    
    res.json({ data: newLog });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 静态文件服务（生产环境）
if (process.env.NODE_ENV === 'production') {
  const distDir = path.join(__dirname, 'dist');
  const candidates = [
    path.join(distDir, 'static'),
    distDir
  ];

  const staticPath = candidates.find((dir) => existsSync(path.join(dir, 'index.html')));

  if (!staticPath) {
    console.error('');
    console.error('❌ 错误: 未找到构建文件');
    console.error('   已尝试路径:');
    candidates.forEach((dir) => console.error(`     - ${path.join(dir, 'index.html')}`));
    console.error('');
    console.error('💡 请先运行构建命令:');
    console.error('   pnpm run build');
    console.error('');
    process.exit(1);
  }

  const indexPath = path.join(staticPath, 'index.html');
  console.log(`✓ 静态资源目录: ${staticPath}`);

  app.use(express.static(staticPath));

  app.get('*', (req, res) => {
    res.sendFile(indexPath, (error) => {
      if (error) {
        console.error('静态资源响应错误:', error);
        res.status(500).send('静态资源加载失败，请检查构建结果。');
      }
    });
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
    
    // 提供针对性的错误提示
    if (error.code === 'ECONNREFUSED') {
      console.error('');
      console.error('========================================');
      console.error('💡 数据库连接失败 - 请检查以下几点:');
      console.error('========================================');
      console.error('');
      console.error('1. MySQL 是否已启动？');
      console.error('   检查命令: systemctl status mysql');
      console.error('');
      console.error('2. 连接配置是否正确？');
      console.error(`   当前配置: ${config.db.host}:${config.db.port}`);
      console.error('');
      console.error('3. Docker 部署注意事项:');
      console.error('   ❌ 不能使用: DB_HOST=127.0.0.1');
      console.error('   ✅ Linux 使用: DB_HOST=172.17.0.1');
      console.error('   ✅ Mac/Win 使用: DB_HOST=host.docker.internal');
      console.error('');
      console.error('4. MySQL 是否允许远程连接？');
      console.error('   编辑 /etc/mysql/mysql.conf.d/mysqld.cnf');
      console.error('   设置 bind-address = 0.0.0.0');
      console.error('   重启命令: sudo systemctl restart mysql');
      console.error('');
      console.error('详细说明请查看: TROUBLESHOOTING.md');
      console.error('========================================');
      console.error('');
    } else if (error.code === 'DB_HOST_RESOLUTION_FAILED') {
      console.error('');
      console.error('========================================');
      console.error('💡 无法连接到数据库主机');
      console.error('========================================');
      console.error('');
      if (Array.isArray(error.attempts) && error.attempts.length > 0) {
        console.error('尝试的主机:');
        error.attempts.forEach(attempt => {
          const code = attempt.code ? ` (${attempt.code})` : '';
          console.error(`   - ${attempt.host}${code}: ${attempt.message}`);
        });
        console.error('');
      }
      console.error(`.env 中配置的 DB_HOST: ${error.originalHost || originalDbHost}`);
      console.error('');
      console.error('Docker 部署请使用:');
      console.error('   - Linux:   DB_HOST=172.17.0.1');
      console.error('   - Mac/Win: DB_HOST=host.docker.internal');
      console.error('');
      console.error('如需自定义回退主机，可设置环境变量:');
      console.error('   DB_HOST_FALLBACKS=host1,host2');
      console.error('');
      console.error('详细说明请查看 DOCKER_DEPLOYMENT.md 和 TROUBLESHOOTING.md');
      console.error('========================================');
      console.error('');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('');
      console.error('========================================');
      console.error('💡 MySQL 认证失败 - 请检查:');
      console.error('========================================');
      console.error('');
      console.error('1. 用户名和密码是否正确？');
      console.error(`   当前用户: ${config.db.user}`);
      console.error('');
      console.error('2. 用户是否有权限访问？');
      console.error('   测试命令: mysql -h HOST -u USER -p');
      console.error('');
      console.error('========================================');
      console.error('');
    }
    
    process.exit(1);
  }
}

start();
