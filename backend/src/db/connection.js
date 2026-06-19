import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

pool.on('error', (err) => console.error('PG pool error:', err));

export default {
  prepare(sql) {
    let i = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++i}`);
    return {
      async get(...params) {
        const { rows } = await pool.query(pgSql, params);
        return rows[0] ?? null;
      },
      async all(...params) {
        const { rows } = await pool.query(pgSql, params);
        return rows;
      },
      async run(...params) {
        const res = await pool.query(pgSql, params);
        return {
          changes: res.rowCount,
          lastInsertRowid: res.rows[0]?.id ?? null,
        };
      },
    };
  },
  async query(sql, params = []) {
    return pool.query(sql, params);
  },
  async transaction(fn) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },
  pool,
};