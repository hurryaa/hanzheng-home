import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Storage from '../models/Storage.js';
import config from '../config.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  let accounts = await Storage.get('accounts') || [];

  if (accounts.length === 0) {
    const hashedPassword = await bcrypt.hash('admin123', config.security.bcryptSaltRounds);
    const defaultAccount = {
      id: 'admin',
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      name: '系统管理员',
      email: '',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    accounts = [defaultAccount];
    await Storage.set('accounts', accounts);
  }

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
    config.security.jwtSecret,
    { expiresIn: '7d' }
  );

  const logs = await Storage.get('operationLogs') || [];
  logs.unshift({
    id: `LOG${Date.now()}`,
    operator: account.username,
    action: '登录系统',
    module: 'auth',
    details: `用户 ${account.username} 登录系统`,
    timestamp: new Date().toISOString()
  });
  await Storage.set('operationLogs', logs);

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
});

router.post('/logout', async (req, res) => {
  res.json({ ok: true });
});

export default router;
