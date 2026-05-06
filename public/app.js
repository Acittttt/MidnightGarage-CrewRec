/* ============================================================
   MIDNIGHT GARAGE — Canvas Background + Form Logic
   app.js v1.0
============================================================ */

/* ────────────────────────────────────────────────────────────
   1.  CANVAS BACKGROUND — speed-star particle field
──────────────────────────────────────────────────────────── */
(function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');

  let W, H, particles, speedLines;

  // ── Particle (drifting star with horizontal trail) ────────
  class Particle {
    constructor() { this.reset(true); }

    reset(randomX = false) {
      this.x       = randomX ? Math.random() * W : W + 20;
      this.y       = Math.random() * H;
      this.speed   = Math.random() * 0.6 + 0.15;
      this.size    = Math.random() * 1.2 + 0.3;
      this.opacity = Math.random() * 0.5 + 0.08;
      this.trail   = this.speed * (Math.random() * 40 + 10);
      // amber vs white tint
      this.amber   = Math.random() < 0.15;
    }

    update() {
      this.x -= this.speed;
      if (this.x < -this.trail) this.reset();
    }

    draw() {
      const grd = ctx.createLinearGradient(this.x + this.trail, this.y, this.x, this.y);
      const c   = this.amber ? `255, 179, 0` : `220, 225, 240`;
      grd.addColorStop(0, `rgba(${c}, 0)`);
      grd.addColorStop(1, `rgba(${c}, ${this.opacity})`);
      ctx.beginPath();
      ctx.moveTo(this.x + this.trail, this.y);
      ctx.lineTo(this.x, this.y);
      ctx.strokeStyle = grd;
      ctx.lineWidth   = this.size;
      ctx.stroke();
    }
  }

  // ── Speed line (occasional horizontal flash) ─────────────
  class SpeedLine {
    constructor() { this.active = false; }

    fire() {
      this.x       = W + 300;
      this.y       = Math.random() * H;
      this.speed   = Math.random() * 25 + 18;
      this.length  = Math.random() * 200 + 80;
      this.opacity = Math.random() * 0.25 + 0.08;
      this.thick   = Math.random() * 1.5 + 0.5;
      this.active  = true;
    }

    update() {
      if (!this.active) return;
      this.x -= this.speed;
      if (this.x < -this.length) this.active = false;
    }

    draw() {
      if (!this.active) return;
      const grd = ctx.createLinearGradient(this.x + this.length, this.y, this.x, this.y);
      grd.addColorStop(0,   'rgba(255, 120, 50, 0)');
      grd.addColorStop(0.4, `rgba(255, 120, 50, ${this.opacity})`);
      grd.addColorStop(0.7, `rgba(255, 200, 80, ${this.opacity * 0.7})`);
      grd.addColorStop(1,   'rgba(255, 200, 80, 0)');
      ctx.beginPath();
      ctx.moveTo(this.x + this.length, this.y);
      ctx.lineTo(this.x, this.y);
      ctx.strokeStyle = grd;
      ctx.lineWidth   = this.thick;
      ctx.stroke();
    }
  }

  function setup() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;

    particles  = Array.from({ length: 160 }, () => new Particle());
    speedLines = Array.from({ length: 6 },   () => new SpeedLine());

    // Randomly fire speed lines
    setInterval(() => {
      const idle = speedLines.find(l => !l.active);
      if (idle && Math.random() < 0.7) idle.fire();
    }, 600);
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);

    // Subtle grid overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.018)';
    ctx.lineWidth   = 0.5;
    const gridSize  = 80;
    for (let x = 0; x < W; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    particles.forEach(p  => { p.update(); p.draw(); });
    speedLines.forEach(l => { l.update(); l.draw(); });

    requestAnimationFrame(loop);
  }

  setup();
  loop();
  window.addEventListener('resize', setup);
})();


/* ────────────────────────────────────────────────────────────
   2.  FORM LOGIC
──────────────────────────────────────────────────────────── */
(function initForm() {
  const form         = document.getElementById('recruitment-form');
  const submitBtn    = document.getElementById('submit-btn');
  const btnDefault   = submitBtn.querySelector('.btn-default');
  const btnLoading   = submitBtn.querySelector('.btn-loading');
  const uploadZone   = document.getElementById('upload-zone');
  const fileInput    = document.getElementById('ktp_file');
  const placeholder  = document.getElementById('upload-placeholder');
  const previewWrap  = document.getElementById('upload-preview');
  const previewImg   = document.getElementById('preview-img');
  const previewPdf   = document.getElementById('preview-pdf');
  const previewName  = document.getElementById('preview-name');
  const previewSize  = document.getElementById('preview-size');
  const previewRemove = document.getElementById('preview-remove');
  const previewChange = document.getElementById('preview-change');
  const errorBanner  = document.getElementById('form-error-banner');
  const errorText    = document.getElementById('form-error-text');
  const formView     = document.getElementById('form-view');
  const successView  = document.getElementById('success-view');

  let selectedFile = null;

  /* ── Helpers ──────────────────────────────────────────── */
  function showFieldError(id, msg) {
    const el      = document.getElementById(id);
    const groupId = { 'name-error': 'group-name', 'email-error': 'group-email', 'file-error': 'group-file' }[id];
    el.textContent = msg;
    el.classList.add('visible');
    if (groupId) document.getElementById(groupId).classList.add('has-error');
  }

  function clearFieldError(id) {
    const el      = document.getElementById(id);
    const groupId = { 'name-error': 'group-name', 'email-error': 'group-email', 'file-error': 'group-file' }[id];
    el.textContent = '';
    el.classList.remove('visible');
    if (groupId) document.getElementById(groupId).classList.remove('has-error');
  }

  function clearAllErrors() {
    ['name-error', 'email-error', 'file-error'].forEach(clearFieldError);
    errorBanner.style.display = 'none';
  }

  function showBannerError(msg) {
    errorText.textContent    = msg;
    errorBanner.style.display = 'flex';
    // Re-trigger shake animation
    errorBanner.style.animation = 'none';
    errorBanner.offsetHeight; // reflow
    errorBanner.style.animation = '';
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    btnDefault.style.display = loading ? 'none' : 'flex';
    btnLoading.style.display = loading ? 'flex' : 'none';
  }

  function formatBytes(bytes) {
    if (bytes < 1024)       return `${bytes} B`;
    if (bytes < 1024 ** 2)  return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  }

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  /* ── File selection & preview ─────────────────────────── */
  function applyFile(file) {
    if (!file) return;

    const MAX = 10 * 1024 * 1024;
    const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

    if (!ALLOWED.includes(file.type)) {
      showFieldError('file-error', 'Tipe file tidak valid. Gunakan JPEG, PNG, WEBP, atau PDF.');
      return;
    }
    if (file.size > MAX) {
      showFieldError('file-error', 'Ukuran file melebihi batas 10 MB.');
      return;
    }

    clearFieldError('file-error');
    selectedFile = file;

    previewName.textContent = file.name;
    previewSize.textContent = formatBytes(file.size);

    const isPdf = file.type === 'application/pdf';
    previewPdf.style.display = isPdf ? 'flex' : 'none';
    previewImg.style.display = isPdf ? 'none' : 'block';

    if (!isPdf) {
      const reader = new FileReader();
      reader.onload = e => { previewImg.src = e.target.result; };
      reader.readAsDataURL(file);
    }

    uploadZone.classList.add('has-file');
    placeholder.style.display  = 'none';
  }

  function clearFile() {
    selectedFile = null;
    fileInput.value = '';
    previewImg.src  = '';
    uploadZone.classList.remove('has-file');
    placeholder.style.display = 'flex';
  }

  /* ── Click / keyboard on upload zone ──────────────────── */
  uploadZone.addEventListener('click', (e) => {
    if (e.target === previewRemove || previewRemove.contains(e.target)) return;
    if (e.target === previewChange  || previewChange.contains(e.target))  return;
    if (!uploadZone.classList.contains('has-file')) fileInput.click();
  });
  uploadZone.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !uploadZone.classList.contains('has-file')) {
      e.preventDefault(); fileInput.click();
    }
  });

  // "Choose file" link
  document.querySelector('.upload-link').addEventListener('click', (e) => {
    e.stopPropagation(); fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) applyFile(fileInput.files[0]);
  });

  previewRemove.addEventListener('click', (e) => {
    e.stopPropagation(); clearFile();
  });
  previewChange.addEventListener('click', (e) => {
    e.stopPropagation(); fileInput.click();
  });

  /* ── Drag & Drop ──────────────────────────────────────── */
  uploadZone.addEventListener('dragenter', (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone.addEventListener('dragover',  (e) => { e.preventDefault(); });
  uploadZone.addEventListener('dragleave', (e) => {
    if (!uploadZone.contains(e.relatedTarget)) uploadZone.classList.remove('drag-over');
  });
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) applyFile(file);
  });

  /* ── Clear errors on typing ───────────────────────────── */
  document.getElementById('full_name').addEventListener('input', () => clearFieldError('name-error'));
  document.getElementById('email').addEventListener('input',     () => clearFieldError('email-error'));

  /* ── Form submission ──────────────────────────────────── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();

    const fullName = document.getElementById('full_name').value.trim();
    const email    = document.getElementById('email').value.trim();

    let valid = true;
    if (!fullName) {
      showFieldError('name-error', 'Nama lengkap wajib diisi.');
      valid = false;
    } else if (fullName.length < 2) {
      showFieldError('name-error', 'Nama terlalu pendek.');
      valid = false;
    }
    if (!email) {
      showFieldError('email-error', 'Alamat email wajib diisi.');
      valid = false;
    } else if (!isValidEmail(email)) {
      showFieldError('email-error', 'Format email tidak valid.');
      valid = false;
    }
    if (!selectedFile) {
      showFieldError('file-error', 'Harap unggah foto KTP atau SIM kamu.');
      valid = false;
    }

    if (!valid) return;

    setLoading(true);

    const formData = new FormData();
    formData.append('full_name', fullName);
    formData.append('email',     email);
    formData.append('ktp_file',  selectedFile);

    try {
      const res  = await fetch('/api/apply', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        showSuccess(data.data);
      } else {
        showBannerError(data.message || 'Terjadi kesalahan. Silakan coba lagi.');
      }
    } catch {
      showBannerError('Koneksi gagal. Periksa jaringan dan coba lagi.');
    } finally {
      setLoading(false);
    }
  });

  /* ── Success view ─────────────────────────────────────── */
  function showSuccess(data) {
    document.getElementById('success-name').textContent = data.full_name;

    const details = document.getElementById('success-details');
    details.innerHTML = `
      <div style="display:grid;gap:0.4rem;">
        <div><strong>Nama:</strong> ${escHtml(data.full_name)}</div>
        <div><strong>Email:</strong> ${escHtml(data.email)}</div>
        <div style="word-break:break-all;"><strong>Dokumen:</strong>
          <a href="${escHtml(data.ktp_url)}" target="_blank" rel="noopener noreferrer"
             style="color:var(--clr-primary-lt);text-decoration:underline;">
            Lihat File ↗
          </a>
        </div>
      </div>`;

    formView.style.display    = 'none';
    successView.style.display = 'block';
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Reset ────────────────────────────────────────────── */
  window.resetForm = function () {
    form.reset();
    clearFile();
    clearAllErrors();
    setLoading(false);
    successView.style.display = 'none';
    formView.style.display    = 'block';
  };

})();
