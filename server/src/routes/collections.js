import { Router } from 'express';
import Storage from '../models/Storage.js';
import { KNOWN_COLLECTIONS } from '../config.js';

const router = Router();

const parseData = (payload, fallback = []) => {
  if (!payload) return fallback;
  if (Array.isArray(payload)) return payload;
  if (typeof payload === 'object') return payload;
  try {
    return JSON.parse(payload);
  } catch (error) {
    return fallback;
  }
};

router.get('/bootstrap', async (_, res) => {
  const result = {};

  for (const collection of KNOWN_COLLECTIONS) {
    const data = await Storage.get(collection);
    result[collection] = parseData(data, []);
  }

  res.json({ data: result });
});

router.get('/collections/:name', async (req, res) => {
  const { name } = req.params;
  if (!KNOWN_COLLECTIONS.includes(name)) {
    return res.status(404).json({ error: `Collection ${name} is not registered` });
  }

  const data = await Storage.get(name);
  res.json({ data: parseData(data, []) });
});

router.put('/collections/:name', async (req, res) => {
  const { name } = req.params;
  const { data } = req.body;

  if (!KNOWN_COLLECTIONS.includes(name)) {
    return res.status(404).json({ error: `Collection ${name} is not registered` });
  }

  if (!Array.isArray(data) && typeof data !== 'object') {
    return res.status(400).json({ error: 'Data must be an array or object' });
  }

  await Storage.set(name, data);
  res.json({ ok: true });
});

router.delete('/collections/:name', async (req, res) => {
  const { name } = req.params;
  if (!KNOWN_COLLECTIONS.includes(name)) {
    return res.status(404).json({ error: `Collection ${name} is not registered` });
  }

  await Storage.set(name, []);
  res.json({ ok: true });
});

router.post('/import', async (req, res) => {
  const { collections } = req.body;

  if (!collections || typeof collections !== 'object') {
    return res.status(400).json({ error: 'Collections payload is required' });
  }

  for (const [name, data] of Object.entries(collections)) {
    if (KNOWN_COLLECTIONS.includes(name)) {
      await Storage.set(name, parseData(data, []));
    }
  }

  res.json({ ok: true });
});

router.post('/clear', async (_, res) => {
  for (const collection of KNOWN_COLLECTIONS) {
    await Storage.set(collection, []);
  }
  res.json({ ok: true });
});

export default router;
