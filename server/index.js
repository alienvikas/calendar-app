require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'calendar_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function rowToShift(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startDate: row.start_date,
    startTime: row.start_time,
    endDate: row.end_date,
    endTime: row.end_time,
    color: row.color,
    location: row.location,
    createdAt: row.created_at ? Number(row.created_at) : undefined,
    createdBy: row.created_by,
    acceptedByDriver: row.accepted_by_driver,
    acceptedAt: row.accepted_at ? Number(row.accepted_at) : undefined,
  };
}

// ── Database setup ────────────────────────────────────────────────────────────

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shifts (
      id              TEXT PRIMARY KEY,
      role            TEXT NOT NULL,
      storage_date    TEXT NOT NULL,
      title           TEXT NOT NULL,
      description     TEXT    DEFAULT '',
      start_date      TEXT,
      start_time      TEXT,
      end_date        TEXT,
      end_time        TEXT,
      color           TEXT,
      location        TEXT    DEFAULT '',
      created_at      BIGINT,
      created_by      TEXT,
      accepted_by_driver BOOLEAN DEFAULT FALSE,
      accepted_at     BIGINT
    )
  `);
  console.log('Database ready');
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/shifts?role=manager
// Returns { storageDate: [shift, ...], ... }
app.get('/api/shifts', async (req, res) => {
  const { role } = req.query;
  if (!role) return res.status(400).json({ error: 'role query param is required' });
  try {
    const result = await pool.query(
      'SELECT * FROM shifts WHERE role = $1 ORDER BY storage_date, created_at',
      [role],
    );
    const grouped = {};
    result.rows.forEach((row) => {
      if (!grouped[row.storage_date]) grouped[row.storage_date] = [];
      grouped[row.storage_date].push(rowToShift(row));
    });
    res.json(grouped);
  } catch (err) {
    console.error('GET /api/shifts error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/shifts
app.post('/api/shifts', async (req, res) => {
  const {
    role, storageDate, id, title, description,
    startDate, startTime, endDate, endTime,
    color, location, createdAt, createdBy,
  } = req.body;
  if (!id || !role || !storageDate || !title) {
    return res.status(400).json({ error: 'id, role, storageDate and title are required' });
  }
  try {
    await pool.query(
      `INSERT INTO shifts
         (id, role, storage_date, title, description,
          start_date, start_time, end_date, end_time,
          color, location, created_at, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (id) DO NOTHING`,
      [
        id, role, storageDate, title, description || '',
        startDate, startTime, endDate, endTime,
        color, location || '', createdAt, createdBy,
      ],
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('POST /api/shifts error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/shifts/:id
app.put('/api/shifts/:id', async (req, res) => {
  const { id } = req.params;
  const {
    role, storageDate, title, description,
    startDate, startTime, endDate, endTime,
    color, location,
  } = req.body;
  try {
    await pool.query(
      `UPDATE shifts SET
         role = $2, storage_date = $3, title = $4, description = $5,
         start_date = $6, start_time = $7, end_date = $8, end_time = $9,
         color = $10, location = $11
       WHERE id = $1`,
      [
        id, role, storageDate, title, description || '',
        startDate, startTime, endDate, endTime,
        color, location || '',
      ],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/shifts/:id error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/shifts/:id
app.delete('/api/shifts/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM shifts WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/shifts/:id error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/shifts/:id/accept
app.patch('/api/shifts/:id/accept', async (req, res) => {
  try {
    await pool.query(
      'UPDATE shifts SET accepted_by_driver = TRUE, accepted_at = $2 WHERE id = $1',
      [req.params.id, Date.now()],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('PATCH /api/shifts/:id/accept error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '3001', 10);

initDb()
  .then(() => app.listen(PORT, () => console.log(`API server → http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('Failed to connect to database:', err.message);
    console.error('Check your server/.env credentials and make sure PostgreSQL is running.');
    process.exit(1);
  });
