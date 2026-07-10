const express        = require('express');
const multer         = require('multer');
const path           = require('path');
const fs             = require('fs');
const session        = require('express-session');
const { v4: uuidv4 } = require('uuid');

const app  = express();
const PORT = process.env.PORT || 3000;

const ROOT = __dirname;
function rp(...parts) { return path.join(ROOT, ...parts); }

// ── Ensure directories & data files ───────────────────────────────────────
['uploads/photos', 'uploads/videos', 'uploads/hero', 'data'].forEach(dir => {
  if (!fs.existsSync(rp(dir))) fs.mkdirSync(rp(dir), { recursive: true });
});
['data/atnp-media.json', 'data/mndkd-media.json', 'data/abs-media.json'].forEach(f => {
  if (!fs.existsSync(rp(f))) fs.writeFileSync(rp(f), '[]');
});

// ── Config ─────────────────────────────────────────────────────────────────
if (!fs.existsSync(rp('config.json'))) {
  fs.writeFileSync(rp('config.json'), JSON.stringify({
    creatorName:    'LVCHLDSTUDIOS',
    accentColor:    '#ffffff',
    backgroundColor:'#000000',
    instagram:      'https://www.instagram.com/christianlovechild/',
    email:          'your@email.com',
    shopUrl:        'https://futureworldsport.com',
    appStoreUrl:    '',
    googlePlayUrl:  '',
    heroImage:      '',
    adminUsername:  'LVCHLDSTUDIOS',
    adminPassword:  'LVCHLDSTUDIOS'
  }, null, 2));
} else {
  const cfg = JSON.parse(fs.readFileSync(rp('config.json'), 'utf8'));
  if (!cfg.adminUsername)              cfg.adminUsername  = 'LVCHLDSTUDIOS';
  if (!cfg.adminPassword)              cfg.adminPassword  = 'LVCHLDSTUDIOS';
  if (!cfg.shopUrl)                    cfg.shopUrl        = 'https://futureworldsport.com';
  if (cfg.appStoreUrl   === undefined) cfg.appStoreUrl    = '';
  if (cfg.googlePlayUrl === undefined) cfg.googlePlayUrl  = '';
  if (cfg.heroImage     === undefined) cfg.heroImage      = '';
  fs.writeFileSync(rp('config.json'), JSON.stringify(cfg, null, 2));
}

// ── Helpers ────────────────────────────────────────────────────────────────
function readATNP()    { return JSON.parse(fs.readFileSync(rp('data/atnp-media.json'),  'utf8')); }
function writeATNP(d)  { fs.writeFileSync(rp('data/atnp-media.json'),  JSON.stringify(d, null, 2)); }
function readMNDKD()   { return JSON.parse(fs.readFileSync(rp('data/mndkd-media.json'), 'utf8')); }
function writeMNDKD(d) { fs.writeFileSync(rp('data/mndkd-media.json'), JSON.stringify(d, null, 2)); }
function readABS()     { return JSON.parse(fs.readFileSync(rp('data/abs-media.json'),   'utf8')); }
function writeABS(d)   { fs.writeFileSync(rp('data/abs-media.json'),   JSON.stringify(d, null, 2)); }
function readConfig()  { return JSON.parse(fs.readFileSync(rp('config.json'),           'utf8')); }
function writeConfig(d){ fs.writeFileSync(rp('config.json'),           JSON.stringify(d, null, 2)); }

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'lvchld-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));
app.use('/uploads', express.static(rp('uploads')));
app.use(express.static(rp('public')));

function requireAuth(req, res, next) {
  if (req.session && req.session.loggedIn) return next();
  res.redirect('/admin/login');
}

// ── Multer — media ─────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, rp('uploads', file.mimetype.startsWith('video/') ? 'videos' : 'photos'));
  },
  filename(req, file, cb) { cb(null, uuidv4() + path.extname(file.originalname).toLowerCase()); }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const ok = ['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm','video/x-msvideo'];
    if (ok.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only images and videos are allowed'));
  }
});

// ── Multer — hero image ────────────────────────────────────────────────────
const heroUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) { cb(null, rp('uploads/hero')); },
    filename(req, file, cb)    { cb(null, 'hero' + path.extname(file.originalname).toLowerCase()); }
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Images only'));
  }
});

function makeMediaEntry(req) {
  const isVideo = req.file.mimetype.startsWith('video/');
  return {
    id:           uuidv4(),
    type:         isVideo ? 'video' : 'photo',
    filename:     req.file.filename,
    originalName: req.file.originalname,
    path:         `/uploads/${isVideo ? 'videos' : 'photos'}/${req.file.filename}`,
    size:         req.file.size,
    description:  req.body.description  || '',
    textPosition: req.body.textPosition || 'bottom',
    aspectRatio:  req.body.aspectRatio  ? parseFloat(req.body.aspectRatio) : 0,
    linkUrl:      req.body.linkUrl      || '',
    uploadedAt:   new Date().toISOString()
  };
}

// ── CRUD factory ───────────────────────────────────────────────────────────
function makeCrud(read, write) {
  return {
    upload: [requireAuth, upload.single('file'), (req, res) => {
      if (!req.file) return res.status(400).json({ error: 'No file received' });
      const entry = makeMediaEntry(req);
      const media = read(); media.unshift(entry); write(media);
      res.json({ ok: true, item: entry });
    }],
    patch: [requireAuth, (req, res) => {
      const media = read(), item = media.find(m => m.id === req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      if (req.body.description  !== undefined) item.description  = req.body.description;
      if (req.body.textPosition !== undefined) item.textPosition = req.body.textPosition;
      if (req.body.linkUrl      !== undefined) item.linkUrl      = req.body.linkUrl;
      write(media); res.json({ ok: true });
    }],
    del: [requireAuth, (req, res) => {
      const media = read(), item = media.find(m => m.id === req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      const fp = rp(item.path.replace(/^\//, ''));
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
      write(media.filter(m => m.id !== req.params.id)); res.json({ ok: true });
    }]
  };
}

const atnpCrud  = makeCrud(readATNP,  writeATNP);
const mndkdCrud = makeCrud(readMNDKD, writeMNDKD);
const absCrud   = makeCrud(readABS,   writeABS);

// ── Public API ─────────────────────────────────────────────────────────────
app.get('/api/config',      (req, res) => { const { adminUsername, adminPassword, ...pub } = readConfig(); res.json(pub); });
app.get('/api/atnp-media',  (req, res) => res.json(readATNP()));
app.get('/api/mndkd-media', (req, res) => res.json(readMNDKD()));
app.get('/api/abs-media',   (req, res) => res.json(readABS()));

// ── Admin auth ─────────────────────────────────────────────────────────────
app.get('/admin/login', (req, res) => {
  if (req.session && req.session.loggedIn) return res.redirect('/admin');
  res.sendFile(rp('admin/login.html'));
});
app.post('/admin/login', (req, res) => {
  const cfg = readConfig();
  if (req.body.username === cfg.adminUsername && req.body.password === cfg.adminPassword) {
    req.session.loggedIn = true; res.redirect('/admin');
  } else {
    res.redirect('/admin/login?error=1');
  }
});
app.get('/admin/logout', (req, res) => { req.session.destroy(); res.redirect('/admin/login'); });

// ── Admin API — Config ─────────────────────────────────────────────────────
app.post('/api/config', requireAuth, (req, res) => {
  const cfg = readConfig();
  const { creatorName, accentColor, backgroundColor, instagram, email,
          shopUrl, appStoreUrl, googlePlayUrl, adminUsername, adminPassword } = req.body;
  if (!creatorName || !email) return res.status(400).json({ error: 'creatorName and email are required' });
  writeConfig({
    ...cfg,
    creatorName, accentColor, backgroundColor, instagram, email,
    shopUrl:       shopUrl       !== undefined ? shopUrl       : cfg.shopUrl,
    appStoreUrl:   appStoreUrl   !== undefined ? appStoreUrl   : cfg.appStoreUrl,
    googlePlayUrl: googlePlayUrl !== undefined ? googlePlayUrl : cfg.googlePlayUrl,
    adminUsername: adminUsername || cfg.adminUsername,
    adminPassword: adminPassword || cfg.adminPassword
  });
  res.json({ ok: true });
});

// ── Admin API — Hero image ─────────────────────────────────────────────────
app.post('/api/hero-upload', requireAuth, heroUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  const heroPath = `/uploads/hero/${req.file.filename}`;
  const cfg = readConfig(); cfg.heroImage = heroPath; writeConfig(cfg);
  res.json({ ok: true, path: heroPath });
});

// ── Admin API — ATNP ──────────────────────────────────────────────────────
app.post('/api/atnp-media/upload', ...atnpCrud.upload);
app.patch('/api/atnp-media/:id',   ...atnpCrud.patch);
app.delete('/api/atnp-media/:id',  ...atnpCrud.del);

// ── Admin API — MNDKD ─────────────────────────────────────────────────────
app.post('/api/mndkd-media/upload', ...mndkdCrud.upload);
app.patch('/api/mndkd-media/:id',   ...mndkdCrud.patch);
app.delete('/api/mndkd-media/:id',  ...mndkdCrud.del);

// ── Admin API — ABS ───────────────────────────────────────────────────────
app.post('/api/abs-media/upload', ...absCrud.upload);
app.patch('/api/abs-media/:id',   ...absCrud.patch);
app.delete('/api/abs-media/:id',  ...absCrud.del);

// ── Admin pages ────────────────────────────────────────────────────────────
app.get('/admin',  requireAuth, (req, res) => res.sendFile(rp('admin/index.html')));
app.get('/admin/', requireAuth, (req, res) => res.sendFile(rp('admin/index.html')));

// ── Public pages ───────────────────────────────────────────────────────────
app.get('/',      (req, res) => res.sendFile(rp('public/index.html')));
app.get('/atnp',  (req, res) => res.sendFile(rp('public/atnp.html')));
app.get('/mndkd', (req, res) => res.sendFile(rp('public/mndkd.html')));
app.get('/abs',   (req, res) => res.sendFile(rp('public/abs.html')));

// ── Error handler ──────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`\n✓ Site running at    http://localhost:${PORT}`);
  console.log(`✓ Admin panel at     http://localhost:${PORT}/admin\n`);
});
