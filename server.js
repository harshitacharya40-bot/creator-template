const express        = require('express');
const multer         = require('multer');
const path           = require('path');
const fs             = require('fs');
const session        = require('express-session');
const { v4: uuidv4 } = require('uuid');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Ensure required directories & files exist ────────────────────────────────
['uploads/videos', 'uploads/photos', 'data'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

if (!fs.existsSync('data/media.json')) {
  fs.writeFileSync('data/media.json', '[]');
}
if (!fs.existsSync('config.json')) {
  fs.writeFileSync('config.json', JSON.stringify({
    creatorName:    'YOUR NAME',
    accentColor:    '#ffffff',
    backgroundColor:'#000000',
    instagram:      'https://instagram.com/username',
    email:          'your@email.com',
    adminUsername:  'LVCHLDSTUDIOS',
    adminPassword:  'LVCHLDSTUDIOS'
  }, null, 2));
} else {
  // Add default credentials if missing from existing config
  const cfg = JSON.parse(fs.readFileSync('config.json', 'utf8'));
  if (!cfg.adminUsername) cfg.adminUsername = 'LVCHLDSTUDIOS';
  if (!cfg.adminPassword) cfg.adminPassword = 'LVCHLDSTUDIOS';
  fs.writeFileSync('config.json', JSON.stringify(cfg, null, 2));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function readMedia()   { return JSON.parse(fs.readFileSync('data/media.json', 'utf8')); }
function writeMedia(d) { fs.writeFileSync('data/media.json', JSON.stringify(d, null, 2)); }
function readConfig()  { return JSON.parse(fs.readFileSync('config.json',     'utf8')); }
function writeConfig(d){ fs.writeFileSync('config.json',     JSON.stringify(d, null, 2)); }

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'lvchld-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 days
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session && req.session.loggedIn) return next();
  res.redirect('/admin/login');
}

// ── Multer (file uploads) ─────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const folder = file.mimetype.startsWith('video/') ? 'videos' : 'photos';
    cb(null, path.join(__dirname, 'uploads', folder));
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uuidv4() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only images and videos are allowed'));
  }
});

// ── Public API ────────────────────────────────────────────────────────────────
app.get('/api/config', (req, res) => {
  const cfg = readConfig();
  // Never expose credentials to public
  const { adminUsername, adminPassword, ...publicCfg } = cfg;
  res.json(publicCfg);
});
app.get('/api/media', (req, res) => res.json(readMedia()));

// ── Admin login / logout ──────────────────────────────────────────────────────
app.get('/admin/login', (req, res) => {
  if (req.session && req.session.loggedIn) return res.redirect('/admin');
  res.sendFile(path.join(__dirname, 'admin/login.html'));
});

app.post('/admin/login', (req, res) => {
  const cfg = readConfig();
  const { username, password } = req.body;
  if (username === cfg.adminUsername && password === cfg.adminPassword) {
    req.session.loggedIn = true;
    res.redirect('/admin');
  } else {
    res.redirect('/admin/login?error=1');
  }
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// ── Admin API (protected) ─────────────────────────────────────────────────────
app.post('/api/config', requireAuth, (req, res) => {
  const cfg = readConfig();
  const { creatorName, accentColor, backgroundColor, instagram, email, muteBtn,
          adminUsername, adminPassword } = req.body;
  if (!creatorName || !email) {
    return res.status(400).json({ error: 'creatorName and email are required' });
  }
  writeConfig({
    ...cfg,
    creatorName, accentColor, backgroundColor, instagram, email, muteBtn,
    adminUsername: adminUsername || cfg.adminUsername,
    adminPassword: adminPassword || cfg.adminPassword
  });
  res.json({ ok: true });
});

app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  const isVideo = req.file.mimetype.startsWith('video/');
  const entry = {
    id:           uuidv4(),
    type:         isVideo ? 'video' : 'photo',
    filename:     req.file.filename,
    originalName: req.file.originalname,
    path:         `/uploads/${isVideo ? 'videos' : 'photos'}/${req.file.filename}`,
    size:         req.file.size,
    description:  req.body.description  || '',
    textPosition: req.body.textPosition || 'bottom',
    aspectRatio:  req.body.aspectRatio  ? parseFloat(req.body.aspectRatio) : 0,
    uploadedAt:   new Date().toISOString()
  };
  const media = readMedia();
  media.unshift(entry);
  writeMedia(media);
  res.json({ ok: true, item: entry });
});

app.patch('/api/media/:id', requireAuth, (req, res) => {
  const media = readMedia();
  const item  = media.find(m => m.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  if (req.body.description  !== undefined) item.description  = req.body.description;
  if (req.body.textPosition !== undefined) item.textPosition = req.body.textPosition;
  writeMedia(media);
  res.json({ ok: true });
});

app.delete('/api/media/:id', requireAuth, (req, res) => {
  const media = readMedia();
  const item  = media.find(m => m.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  const filePath = path.join(__dirname, item.path);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  writeMedia(media.filter(m => m.id !== req.params.id));
  res.json({ ok: true });
});

// ── Admin pages (protected) ───────────────────────────────────────────────────
app.get('/admin',  requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'admin/index.html')));
app.get('/admin/', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'admin/index.html')));

// ── Public page routes ────────────────────────────────────────────────────────
app.get('/',         (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/work',     (req, res) => res.sendFile(path.join(__dirname, 'public/work.html')));
app.get('/letstalk', (req, res) => res.sendFile(path.join(__dirname, 'public/letstalk.html')));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`\n✓ Site running at    http://localhost:${PORT}`);
  console.log(`✓ Admin panel at     http://localhost:${PORT}/admin\n`);
});
