require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json({limit: '1mb'}));

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || 'blood';
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;

let pool;
async function initPool() {
  pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    port: DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

initPool().catch(err => {
  console.error('Failed to create DB pool', err);
  process.exit(1);
});

app.get('/api/health', (req, res) => {
  res.json({status: 'ok'});
});

// WARNING: This endpoint executes arbitrary SQL. Use only for local development.
app.post('/api/query', async (req, res) => {
  const { query, params } = req.body || {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Missing `query` string in body.' });
  }

  try {
    // Use execute for parameterized queries
    const [rows] = await pool.execute(query, params || []);
    res.json({ rows });
  } catch (err) {
    console.error('Query error:', err);
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
