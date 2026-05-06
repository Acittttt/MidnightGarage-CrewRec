const express = require('express');
const multer  = require('multer');
const path    = require('path');
const { v4: uuidv4 } = require('uuid');

const pool   = require('../config/database');
const { getBucket } = require('../config/storage');

const router = express.Router();

// ── Multer: memory storage only — no file ever touches local disk ─────────────
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB cap
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipe file tidak diizinkan. Gunakan JPEG, PNG, WEBP, atau PDF.'));
    }
  },
});

// ── POST /api/apply ───────────────────────────────────────────────────────────
router.post('/apply', upload.single('ktp_file'), async (req, res) => {
  try {
    const { full_name, email } = req.body;
    const file = req.file;

    // Input validation
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email wajib diisi.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Format email tidak valid.' });
    }
    if (!file) {
      return res.status(400).json({ success: false, message: 'File KTP/SIM wajib diunggah.' });
    }

    // ── STAGE 1: Upload file buffer to GCS (no local save) ────────────────────
    const ext            = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueFileName = `crew-applications/${uuidv4()}${ext}`;
    const gcsFile        = getBucket().file(uniqueFileName);

    await gcsFile.save(file.buffer, {
      metadata:  { contentType: file.mimetype },
      resumable: false,
      public:    true,
    });

    // ── STAGE 2: Build the public GCS URL ─────────────────────────────────────
    const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${uniqueFileName}`;

    // ── STAGE 3: Persist Name, Email, and URL to Cloud SQL ────────────────────
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        'INSERT INTO crew_applications (full_name, email, ktp_url) VALUES (?, ?, ?)',
        [full_name.trim(), email.trim().toLowerCase(), publicUrl],
      );
    } finally {
      connection.release();
    }

    return res.status(201).json({
      success: true,
      message: 'Lamaran berhasil dikirim! Kami akan menghubungi kamu segera.',
      data: {
        full_name: full_name.trim(),
        email:     email.trim().toLowerCase(),
        ktp_url:   publicUrl,
      },
    });

  } catch (err) {
    console.error('[/api/apply] Error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server. Silakan coba lagi.',
    });
  }
});

// ── GET /api/health ───────────────────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({ status: 'OK', service: 'Midnight Garage Crew Recruitment API', ts: new Date().toISOString() });
});

module.exports = router;
