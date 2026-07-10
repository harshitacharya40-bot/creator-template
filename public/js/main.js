// ── Path → page key ────────────────────────────────────────────────────────
function pathToKey(p) {
  if (p === '/')      return 'home';
  if (p === '/atnp')  return 'atnp';
  if (p === '/mndkd') return 'mndkd';
  if (p === '/abs')   return 'abs';
  return 'home';
}

const PAGE_TITLES = {
  atnp:  "Art That's Not Paintings",
  mndkd: "My Nixxas Don't Know Design",
  abs:   "Archival Brand Sh*t"
};


// ── Build footer ───────────────────────────────────────────────────────────
function buildFooter(cfg) {
  const footer = document.getElementById('siteFooter');
  if (!footer) return;
  const shopUrl  = cfg.shopUrl       || 'https://futureworldsport.com';
  const iosUrl   = cfg.appStoreUrl   || '#';
  const playUrl  = cfg.googlePlayUrl || '#';
  const igHandle = cfg.instagram
    ? cfg.instagram.replace(/https?:\/\/(www\.)?instagram\.com\/?/, '').replace(/\/$/, '')
    : '';
  footer.innerHTML = `
    <a href="${shopUrl}" target="_blank" rel="noopener" class="footer-shop">
      <span class="footer-shop-label">Shop</span>
      <span class="footer-shop-name">FutureWorldSport.com</span>
    </a>
    <div class="footer-badges">
      <a href="${iosUrl}" target="_blank" rel="noopener" class="app-badge">
        <span class="badge-icon">⌘</span>
        <div class="badge-text"><span>Download on the</span><strong>App Store</strong></div>
      </a>
      <a href="${playUrl}" target="_blank" rel="noopener" class="app-badge">
        <span class="badge-icon">▶</span>
        <div class="badge-text"><span>Get it on</span><strong>Google Play</strong></div>
      </a>
    </div>
    <a href="${cfg.instagram || '#'}" target="_blank" rel="noopener" class="footer-ig">
      ${igHandle ? '@' + igHandle : 'Instagram'} ↗
    </a>
  `;
}

// ── Apply config ───────────────────────────────────────────────────────────
async function applyConfig() {
  const cfg = await fetch('/api/config').then(r => r.json());

  const logoEl = document.querySelector('.hero-logo');
  if (logoEl) logoEl.textContent = cfg.creatorName;

  const key = pathToKey(window.location.pathname);
  const nameEl = document.getElementById('creatorName');
  if (nameEl) nameEl.textContent = PAGE_TITLES[key] || cfg.creatorName;

  document.title = cfg.creatorName;
  document.documentElement.style.setProperty('--accent', cfg.accentColor    || '#ffffff');
  document.documentElement.style.setProperty('--bg',     cfg.backgroundColor || '#000000');

  const mb  = cfg.muteBtn || {};
  const sizeMap    = { small: '0.62rem', medium: '0.75rem', large: '0.95rem' };
  const paddingMap = { small: '3px 12px', medium: '5px 18px', large: '8px 26px' };
  const sz = mb.size || 'medium';
  document.documentElement.style.setProperty('--btn-bg',      mb.bgColor     || 'transparent');
  document.documentElement.style.setProperty('--btn-border',  mb.borderColor || '#ffffff');
  document.documentElement.style.setProperty('--btn-text',    mb.textColor   || '#ffffff');
  document.documentElement.style.setProperty('--btn-fs',      sizeMap[sz]    || sizeMap.medium);
  document.documentElement.style.setProperty('--btn-padding', paddingMap[sz] || paddingMap.medium);

  buildFooter(cfg);
  return cfg;
}

// ── Active nav ─────────────────────────────────────────────────────────────
function setActiveNav() {
  const p = window.location.pathname;
  document.querySelectorAll('a[data-page]').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === p);
  });
}

// ── Mute button ────────────────────────────────────────────────────────────
function createMuteBtn(video) {
  const btn = document.createElement('button');
  btn.className   = 'mute-btn';
  btn.textContent = 'UNMUTE';
  btn.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    video.muted     = !video.muted;
    btn.textContent = video.muted ? 'UNMUTE' : 'MUTE';
  });
  return btn;
}

// ── Video autoplay observer ────────────────────────────────────────────────
const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.play().catch(() => {});
    else                  e.target.pause();
  });
}, { threshold: 0.15 });
function observeVideo(v) { videoObserver.observe(v); }

// ── Doom scroll renderer (MNDKD + ABS) ────────────────────────────────────
function renderDoomScroll(items, emptyMsg) {
  const wall = document.getElementById('mediaWall');
  if (!wall) return;
  if (!items.length) { wall.innerHTML = `<p class="empty">${emptyMsg}</p>`; return; }

  wall.className = 'doom-wall';
  wall.innerHTML = '';
  const total = items.length;

  items.forEach((item, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'doom-item';

    if (item.type === 'video') {
      const v = document.createElement('video');
      v.src = item.path; v.muted = true; v.loop = true; v.playsInline = true;
      v.setAttribute('preload', 'metadata');
      observeVideo(v);
      if (item.linkUrl) {
        v.style.cursor = 'pointer';
        v.addEventListener('click', () => window.open(item.linkUrl, '_blank'));
      }
      wrap.appendChild(v);
      wrap.appendChild(createMuteBtn(v));
    } else {
      const img = document.createElement('img');
      img.src = item.path; img.alt = '';
      img.loading = idx < 2 ? 'eager' : 'lazy';
      if (item.linkUrl) {
        const a = document.createElement('a');
        a.href = item.linkUrl; a.target = '_blank'; a.rel = 'noopener';
        a.style.cssText = 'display:block;width:100%;height:100%;';
        a.appendChild(img); wrap.appendChild(a);
      } else {
        wrap.appendChild(img);
      }
    }

    const overlay = document.createElement('div');
    overlay.className = 'doom-overlay';
    wrap.appendChild(overlay);

    const counter = document.createElement('div');
    counter.className = 'doom-counter';
    counter.textContent = `${String(idx + 1).padStart(3, '0')} / ${String(total).padStart(3, '0')}`;
    wrap.appendChild(counter);

    if (item.description) {
      const desc = document.createElement('div');
      desc.className = 'doom-desc';
      desc.textContent = item.description;
      wrap.appendChild(desc);
    }

    wall.appendChild(wrap);
  });
}

// ── Photo grid renderer (ATNP) ─────────────────────────────────────────────
function renderPhotoGrid(items) {
  const wall = document.getElementById('mediaWall');
  if (!wall) return;
  const photos = items.filter(i => i.type === 'photo');
  if (!photos.length) { wall.innerHTML = '<p class="empty">No content yet — upload from the admin panel.</p>'; return; }

  wall.innerHTML = '';
  photos.forEach(item => {
    const wrap = document.createElement('div');
    wrap.className = 'grid-item';
    const img = document.createElement('img');
    img.src = item.path; img.alt = ''; img.loading = 'lazy';
    if (item.linkUrl) {
      const a = document.createElement('a');
      a.href = item.linkUrl; a.target = '_blank'; a.rel = 'noopener';
      a.appendChild(img); wrap.appendChild(a);
    } else {
      wrap.appendChild(img);
    }
    wall.appendChild(wrap);
  });
}

// ── Page entry points ──────────────────────────────────────────────────────
async function initHome() {
  const cfg = await applyConfig();
  setActiveNav();
  const heroImg   = document.getElementById('heroImg');
  const heroEmpty = document.getElementById('heroEmpty');
  if (cfg.heroImage) {
    heroImg.style.backgroundImage = `url('${cfg.heroImage}')`;
  } else if (heroEmpty) {
    heroEmpty.style.display = 'flex';
  }
}

async function initATNP() {
  const [cfg, media] = await Promise.all([applyConfig(), fetch('/api/atnp-media').then(r => r.json())]);
  setActiveNav();
  renderPhotoGrid(media);
}

async function initMNDKD() {
  const [cfg, media] = await Promise.all([applyConfig(), fetch('/api/mndkd-media').then(r => r.json())]);
  setActiveNav();
  renderDoomScroll(media.filter(m => m.type === 'video'), 'No videos yet — upload from the admin panel.');
}

async function initABS() {
  const [cfg, media] = await Promise.all([applyConfig(), fetch('/api/abs-media').then(r => r.json())]);
  setActiveNav();
  renderDoomScroll(media, 'No content yet — upload from the admin panel.');
}
