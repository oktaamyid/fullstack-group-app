const { Pool } = require('pg');

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false,
    })
  : new Pool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_NAME || 'livo_local',
      ssl: false,
    });

async function testDatabaseConnection() {
  const result = await pool.query('SELECT 1 AS ok');
  return result.rows[0];
}

module.exports = {
  pool,
  testDatabaseConnection,
};
