import { query } from '../db/connection.js';

export class Storage {
  static async get(key) {
    const rows = await query('SELECT data FROM collections WHERE name = ?', [key]);
    if (rows.length === 0) {
      return null;
    }
    try {
      return JSON.parse(rows[0].data);
    } catch (error) {
      console.error(`Failed to parse data for key ${key}:`, error);
      return null;
    }
  }

  static async set(key, value) {
    const data = JSON.stringify(value);
    await query(
      `INSERT INTO collections (name, data) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE data = ?, updated_at = CURRENT_TIMESTAMP`,
      [key, data, data]
    );
  }

  static async remove(key) {
    await query('DELETE FROM collections WHERE name = ?', [key]);
  }

  static async clear() {
    await query('DELETE FROM collections');
  }

  static async exists(key) {
    const rows = await query('SELECT 1 FROM collections WHERE name = ?', [key]);
    return rows.length > 0;
  }

  static async keys() {
    const rows = await query('SELECT name FROM collections');
    return rows.map(row => row.name);
  }
}

export default Storage;
