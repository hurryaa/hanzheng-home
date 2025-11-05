import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config.js';
import { getPool } from './db/connection.js';
import collectionsRouter from './routes/collections.js';
import authRouter from './routes/auth.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/api/health', async (req, res) => {
  try {
    const pool = await getPool();
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.use('/api', collectionsRouter);
app.use('/api/auth', authRouter);

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal Server Error', message: error.message });
});

const port = config.port;
app.listen(port, () => {
  console.log(`🚀 Sauna Management API server is running at http://localhost:${port}`);
});
