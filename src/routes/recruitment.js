const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Pastikan config/database.js lo sudah pake library 'pg'
const pool = require('../config/database');
const { getBucket } = require('../config/storage');

const router = express.Router();

// ── Multer: memory storage (Stateless - Modul 5) ─────────────
const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ── POST /api/apply ───────────────────────────────────────────
router.post('/apply', upload.single('ktp_file'), async (req, res) => {
  try {
    const { full_name, email } = req.body;
    const file = req.file;

    // Validasi input sederhana
    if (!full_name || !email || !file) {
      return res.status(400).json({ success: false, message: 'Data tidak lengkap.' });
    }

    // ── STAGE 1: Upload ke GCS (Object Storage) ────────────────────
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueFileName = `crew-applications/${uuidv4()}${ext}`;
    const gcsFile = getBucket().file(uniqueFileName);

    await gcsFile.save(file.buffer, {
      metadata: { contentType: file.mimetype },
      resumable: false,
    });

    // ── STAGE 2: Ambil URL Publik ─────────────────────────────────────
    const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${uniqueFileName}`;

    // ── STAGE 3: Simpan ke PostgreSQL (DBaaS) ────────────────────
    // Perubahan: Pake pool.query langsung & ganti '?' jadi '$1, $2, $3'
    const queryText = 'INSERT INTO crew_applications (full_name, email, ktp_url) VALUES ($1, $2, $3) RETURNING *';
    const values = [full_name.trim(), email.trim().toLowerCase(), publicUrl];

    const dbResult = await pool.query(queryText, values);

    return res.status(201).json({
      success: true,
      message: 'Selamat! Kamu berhasil masuk radar Midnight Garage.',
      data: dbResult.rows[0],
    });

  } catch (err) {
    // Log error di terminal biar lo bisa liat detailnya
    console.error('[/api/apply] Error Detail:', err.message);
    return res.status(500).json({
      success: false,
      message: `Gagal: ${err.message}`, // Menampilkan pesan error biar gampang debug
    });
  }
});

router.get('/health', (_req, res) => {
  res.json({ status: 'OK', ts: new Date().toISOString() });
});

module.exports = router;