const express        = require('express');
const multer         = require('multer');
const path           = require('path');
const fs             = require('fs');
const session        = require('express-session');
const { v4: uuidv4 } = require('uuid');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Root relative to this file (works regardless of CWD) ─────────────────────
const ROOT = __dirname;
function rp(...parts) { return path.join(ROOT, ...parts); }

// ── Ensure required directories & files exist ────────────────────────────────
['uploads/videos', 'uploads/photos', 'data'].forEach(dir => {
  if (!fs.existsSync(rp(dir))) fs.mkdirSync(rp(dir), { recursive: true });
});

if (!fs.existsSync(rp('data/media.json')))       fs.writeFileSync(rp('data/media.json'),       '[]');
if (!fs.existsSync(rp('data/app-media.json')))   fs.writeFileSync(rp('data/app-media.json'),   '[]');
if (!fs.existsSync(rp('data/store-media.json'))) fs.writeFileSync(rp('data/store-media.json'), '[]');

const defaultServices = [
  { id: uuidv4(), title: 'Professional AI Videos & Assets',                    description: 'Cutting-edge AI-generated visuals crafted to elevate your brand. From concept to final render, every frame is built with purpose and precision.' },
  { id: uuidv4(), title: 'AI Inserts for Dynamic Music Videos',                 description: 'Seamlessly blended AI-generated sequences that amplify the energy of your music video. Custom visuals that move with the music and tell the story.' },
  { id: uuidv4(), title: 'Creative Direction & Consultation',                   description: 'Strategic vision for your visual identity. We guide projects from concept to execution, ensuring every creative decision aligns with your brand.' },
  { id: uuidv4(), title: 'Imaging & Visualizers for Brands, Artists & Labels',  description: 'Bespoke visual content for brands, recording artists, and labels. Immersive imagery and motion visuals designed to make a lasting impression.' }
];
if (!fs.existsSync(rp('data/services.json'))) {
  fs.writeFileSync(rp('data/services.json'), JSON.stringify(defaultServices, null, 2));
}

const defaultPageNames  = { home: 'Home', work: 'Work', services: 'Services', app: 'App Store', store: 'Store', letstalk: "Let's Talk" };
const defaultPageTitles = { home: '', work: 'Work', services: 'Services', app: 'App Store', store: 'Store', letstalk: "Let's Talk" };

if (!fs.existsSync(rp('config.json'))) {
  fs.writeFileSync(rp('config.json'), JSON.stringify({
    creatorName:    'YOUR NAME',
    accentColor:    '#ffffff',
    backgroundColor:'#000000',
    instagram:      'https://instagram.com/username',
    email:          'your@email.com',
    pageNames:      defaultPageNames,
    pageTitles:     defaultPageTitles,
    adminUsername:  'LVCHLDSTUDIOS',
    adminPassword:  'LVCHLDSTUDIOS'
  }, null, 2));
} else {
  const cfg = JSON.parse(fs.readFileSync(rp('config.json'), 'utf8'));
  if (!cfg.adminUsername)              cfg.adminUsername   = 'LVCHLDSTUDIOS';
  if (!cfg.adminPassword)              cfg.adminPassword   = 'LVCHLDSTUDIOS';
  if (!cfg.shopUrl)                    cfg.shopUrl         = 'https://futureworldsport.com';
  if (cfg.appStoreUrl   === undefined) cfg.appStoreUrl     = '';
  if (cfg.googlePlayUrl === undefined) cfg.googlePlayUrl   = '';
  if (!cfg.pageNames)  cfg.pageNames  = defaultPageNames;
  else Object.keys(defaultPageNames).forEach(k => { if (!cfg.pageNames[k])  cfg.pageNames[k]  = defaultPageNames[k]; });
  if (!cfg.pageTitles) cfg.pageTitles = defaultPageTitles;
  else Object.keys(defaultPageTitles).forEach(k => { if (cfg.pageTitles[k] === undefined) cfg.pageTitles[k] = defaultPageTitles[k]; });
  delete cfg.appStoreLink;
  delete cfg.storeLink;
  fs.writeFileSync(rp('config.json'), JSON.stringify(cfg, null, 2));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function readMedia()         { return JSON.parse(fs.readFileSync(rp('data/media.json'),       'utf8')); }
function writeMedia(d)       { fs.writeFileSync(rp('data/media.json'),       JSON.stringify(d, null, 2)); }
function readAppMedia()      { return JSON.parse(fs.readFileSync(rp('data/app-media.json'),   'utf8')); }
function writeAppMedia(d)    { fs.writeFileSync(rp('data/app-media.json'),   JSON.stringify(d, null, 2)); }
function readStoreMedia()    { return JSON.parse(fs.readFileSync(rp('data/store-media.json'), 'utf8')); }
function writeStoreMedia(d)  { fs.writeFileSync(rp('data/store-media.json'), JSON.stringify(d, null, 2)); }
function readConfig()        { return JSON.parse(fs.readFileSync(rp('config.json'),           'utf8')); }
function writeConfig(d)      { fs.writeFileSync(rp('config.json'),           JSON.stringify(d, null, 2)); }
function readServices()      { return JSON.parse(fs.readFileSync('data/services.json',    'utf8')); }
function writeServices(d)    { fs.writeFileSync('data/services.json',    JSON.stringify(d, null, 2)); }

// ── Middleware ────────────────────────────────────────────────────────────────
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

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session && req.session.loggedIn) return next();
  res.redirect('/admin/login');
}

// ── Multer ────────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const folder = file.mimetype.startsWith('video/') ? 'videos' : 'photos';
    cb(null, rp('uploads', folder));
  },
  filename(req, file, cb) {
    cb(null, uuidv4() + path.extname(file.originalname).toLowerCase());
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = ['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm','video/x-msvideo'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only images and videos are allowed'));
  }
});

// ── Generic media upload helper ───────────────────────────────────────────────
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

// ── Public API ────────────────────────────────────────────────────────────────
app.get('/api/config',      (req, res) => { const { adminUsername, adminPassword, ...pub } = readConfig(); res.json(pub); });
app.get('/api/media',       (req, res) => res.json(readMedia()));
app.get('/api/services',    (req, res) => res.json(readServices()));
app.get('/api/app-media',   (req, res) => res.json(readAppMedia()));
app.get('/api/store-media', (req, res) => res.json(readStoreMedia()));

// ── Admin login / logout ──────────────────────────────────────────────────────
app.get('/admin/login', (req, res) => {
  if (req.session && req.session.loggedIn) return res.redirect('/admin');
  res.sendFile(rp('admin/login.html'));
});
app.post('/admin/login', (req, res) => {
  const cfg = readConfig();
  const { username, password } = req.body;
  if (username === cfg.adminUsername && password === cfg.adminPassword) {
    req.session.loggedIn = true; res.redirect('/admin');
  } else {
    res.redirect('/admin/login?error=1');
  }
});
app.get('/admin/logout', (req, res) => { req.session.destroy(); res.redirect('/admin/login'); });

// ── Admin API — Config ────────────────────────────────────────────────────────
app.post('/api/config', requireAuth, (req, res) => {
  const cfg = readConfig();
  const { creatorName, accentColor, backgroundColor, instagram, email, muteBtn,
          shopUrl, appStoreUrl, googlePlayUrl,
          pageNames, pageTitles, adminUsername, adminPassword } = req.body;
  if (!creatorName || !email) return res.status(400).json({ error: 'creatorName and email are required' });
  writeConfig({
    ...cfg,
    creatorName, accentColor, backgroundColor, instagram, email, muteBtn,
    shopUrl:       shopUrl       !== undefined ? shopUrl       : cfg.shopUrl,
    appStoreUrl:   appStoreUrl   !== undefined ? appStoreUrl   : cfg.appStoreUrl,
    googlePlayUrl: googlePlayUrl !== undefined ? googlePlayUrl : cfg.googlePlayUrl,
    pageNames:   pageNames   || cfg.pageNames,
    pageTitles:  pageTitles  || cfg.pageTitles,
    adminUsername: adminUsername || cfg.adminUsername,
    adminPassword: adminPassword || cfg.adminPassword
  });
  res.json({ ok: true });
});

// ── Admin API — Services ──────────────────────────────────────────────────────
app.post('/api/services', requireAuth, (req, res) => {
  const services = readServices();
  const entry = { id: uuidv4(), title: req.body.title || '', description: req.body.description || '' };
  services.push(entry);
  writeServices(services);
  res.json({ ok: true, item: entry });
});
app.patch('/api/services/:id', requireAuth, (req, res) => {
  const services = readServices();
  const item = services.find(s => s.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  if (req.body.title       !== undefined) item.title       = req.body.title;
  if (req.body.description !== undefined) item.description = req.body.description;
  writeServices(services);
  res.json({ ok: true });
});
app.delete('/api/services/:id', requireAuth, (req, res) => {
  const services = readServices();
  if (!services.find(s => s.id === req.params.id)) return res.status(404).json({ error: 'Not found' });
  writeServices(services.filter(s => s.id !== req.params.id));
  res.json({ ok: true });
});

// ── Admin API — Main media ────────────────────────────────────────────────────
app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  const entry = makeMediaEntry(req);
  const media = readMedia(); media.unshift(entry); writeMedia(media);
  res.json({ ok: true, item: entry });
});
app.patch('/api/media/:id', requireAuth, (req, res) => {
  const media = readMedia(); const item = media.find(m => m.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  if (req.body.description  !== undefined) item.description  = req.body.description;
  if (req.body.textPosition !== undefined) item.textPosition = req.body.textPosition;
  if (req.body.linkUrl      !== undefined) item.linkUrl      = req.body.linkUrl;
  writeMedia(media); res.json({ ok: true });
});
app.delete('/api/media/:id', requireAuth, (req, res) => {
  const media = readMedia(); const item = media.find(m => m.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  const fp = rp(item.path.replace(/^\//, '')); if (fs.existsSync(fp)) fs.unlinkSync(fp);
  writeMedia(media.filter(m => m.id !== req.params.id)); res.json({ ok: true });
});

// ── Admin API — App page media ────────────────────────────────────────────────
app.post('/api/app-media/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  const entry = makeMediaEntry(req);
  const media = readAppMedia(); media.unshift(entry); writeAppMedia(media);
  res.json({ ok: true, item: entry });
});
app.patch('/api/app-media/:id', requireAuth, (req, res) => {
  const media = readAppMedia(); const item = media.find(m => m.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  if (req.body.description  !== undefined) item.description  = req.body.description;
  if (req.body.textPosition !== undefined) item.textPosition = req.body.textPosition;
  if (req.body.linkUrl      !== undefined) item.linkUrl      = req.body.linkUrl;
  writeAppMedia(media); res.json({ ok: true });
});
app.delete('/api/app-media/:id', requireAuth, (req, res) => {
  const media = readAppMedia(); const item = media.find(m => m.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  const fp = rp(item.path.replace(/^\//, '')); if (fs.existsSync(fp)) fs.unlinkSync(fp);
  writeAppMedia(media.filter(m => m.id !== req.params.id)); res.json({ ok: true });
});

// ── Admin API — Store page media ──────────────────────────────────────────────
app.post('/api/store-media/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  const entry = makeMediaEntry(req);
  const media = readStoreMedia(); media.unshift(entry); writeStoreMedia(media);
  res.json({ ok: true, item: entry });
});
app.patch('/api/store-media/:id', requireAuth, (req, res) => {
  const media = readStoreMedia(); const item = media.find(m => m.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  if (req.body.description  !== undefined) item.description  = req.body.description;
  if (req.body.textPosition !== undefined) item.textPosition = req.body.textPosition;
  if (req.body.linkUrl      !== undefined) item.linkUrl      = req.body.linkUrl;
  writeStoreMedia(media); res.json({ ok: true });
});
app.delete('/api/store-media/:id', requireAuth, (req, res) => {
  const media = readStoreMedia(); const item = media.find(m => m.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  const fp = rp(item.path.replace(/^\//, '')); if (fs.existsSync(fp)) fs.unlinkSync(fp);
  writeStoreMedia(media.filter(m => m.id !== req.params.id)); res.json({ ok: true });
});

// ── Admin pages ───────────────────────────────────────────────────────────────
app.get('/admin',  requireAuth, (req, res) => res.sendFile(rp('admin/index.html')));
app.get('/admin/', requireAuth, (req, res) => res.sendFile(rp('admin/index.html')));

// ── Public page routes ────────────────────────────────────────────────────────
app.get('/',         (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/work',     (req, res) => res.sendFile(path.join(__dirname, 'public/work.html')));
app.get('/services', (req, res) => res.sendFile(path.join(__dirname, 'public/services.html')));
app.get('/app',      (req, res) => res.sendFile(path.join(__dirname, 'public/app.html')));
app.get('/store',    (req, res) => res.sendFile(path.join(__dirname, 'public/store.html')));
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
