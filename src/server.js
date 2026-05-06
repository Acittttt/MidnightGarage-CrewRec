const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const recruitmentRoutes = require('./routes/recruitment');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin:  process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static files ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', recruitmentRoutes);

// ── Catch-all: serve SPA index ────────────────────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   🏎️  MIDNIGHT GARAGE — CREW REC API    ║
  ║   Server running on http://localhost:${PORT}  ║
  ╚══════════════════════════════════════════╝
  `);
});
