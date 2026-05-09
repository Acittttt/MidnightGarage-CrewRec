const { Pool } = require('pg'); // Pake library pg buat PostgreSQL
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10) || 5432, // Port default Postgres
  // Cloud SQL butuh SSL kalo konek via Public IP
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

module.exports = pool;