const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '8mb' }));

const port = process.env.PORT || 3000;

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.MYSQL_URL;

if (!databaseUrl) {
  console.error(
    'Missing DATABASE_URL / MYSQL_URL. Set it to your Aiven MySQL connection URL.'
  );
  process.exit(1);
}

const pool = mysql.createPool({
  uri: databaseUrl,
  waitForConnections: true,
  connectionLimit: 10,
  ssl:
    process.env.MYSQL_SSL === 'false'
      ? undefined
      : { rejectUnauthorized: false }
});


// ==========================================
// DATABASE HEALTH CHECK
// ==========================================

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');

    res.json({
      ok: true,
      database: 'mysql'
    });

  } catch (e) {
    console.error(e);

    res.status(503).json({
      ok: false,
      error: 'Database unavailable'
    });
  }
});


// ==========================================
// GET DATA
// ==========================================

app.get('/api/state/:key', async (req, res) => {
  try {

    const [rows] = await pool.query(
      'SELECT data FROM floorline_state WHERE state_key=? LIMIT 1',
      [req.params.key]
    );

    if (!rows.length) {
      return res.json({
        value: null
      });
    }

    res.json({
      value: JSON.parse(rows[0].data)
    });

  } catch (e) {

    console.error(e);

    res.status(500).json({
      error: 'Read failed'
    });
  }
});


// ==========================================
// SAVE / UPDATE DATA
// ==========================================

app.put('/api/state/:key', async (req, res) => {
  try {

    const data = JSON.stringify(
      req.body.value ?? null
    );

    await pool.query(
      `INSERT INTO floorline_state
        (state_key, data, updated_at)
       VALUES
        (?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE
        data = VALUES(data),
        updated_at = CURRENT_TIMESTAMP`,
      [
        req.params.key,
        data
      ]
    );

    res.json({
      ok: true
    });

  } catch (e) {

    console.error(e);

    res.status(500).json({
      error: 'Write failed'
    });
  }
});


// ==========================================
// SERVE WEBSITE
// ==========================================

app.use(
  express.static(path.join(__dirname))
);

app.get('/', (_req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      'factory-manager-updated.html'
    )
  );

});


// ==========================================
// START SERVER
// ==========================================

app.listen(port, () => {

  console.log(
    `Floorline server listening on port ${port}`
  );

});