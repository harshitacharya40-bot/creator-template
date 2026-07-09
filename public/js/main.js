// ── Path → page key ────────────────────────────────────────────────────────
function pathToKey(p) {
  if (p === '/')          return 'home';
  if (p === '/work')      return 'work';
  if (p === '/services')  return 'services';
  if (p === '/app')       return 'app';
  if (p === '/store')     return 'store';
  if (p === '/letstalk')  return 'letstalk';
  return 'home';
}

// ── Build ticker ───────────────────────────────────────────────────────────
function buildTicker(cfg) {
  if (document.getElementById('siteTicker')) return;
  const name = cfg.creatorName || 'LVCHLDSTUDIOS';
  const words = [name, 'ART', 'DESIGN', 'FWS ARCHIVE', name, 'ART', 'DESIGN', 'FWS ARCHIVE'];
  const chunk = words.map(w =>
    `<span class="ticker-item">${w}</span><span class="ticker-sep">—</span>`
  ).join('');

  const ticker = document.createElement('div');
  ticker.className = 'ticker';
  ticker.id = 'siteTicker';
  ticker.innerHTML = `<div class="ticker-inner">${chunk}${chunk}</div>`;

  const nav = document.querySelector('nav');
  if (nav) nav.insertAdjacentElement('afterend', ticker);
}

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
  const igUrl = cfg.instagram || '#';

  footer.innerHTML = `
    <a href="${shopUrl}" target="_blank" rel="noopener" class="footer-shop">
      <span class="footer-shop-label">Shop</span>
      <span class="footer-shop-name">FutureWorldSport.com</span>
    </a>
    <div class="footer-badges">
      <a href="${iosUrl}" target="_blank" rel="noopener" class="app-badge">
        <span class="badge-icon">⌘</span>
        <div class="badge-text">
          <span>Download on the</span>
          <strong>App Store</strong>
        </div>
      </a>
      <a href="${playUrl}" target="_blank" rel="noopener" class="app-badge">
        <span class="badge-icon">▶</span>
        <div class="badge-text">
          <span>Get it on</span>
          <strong>Google Play</strong>
        </div>
      </a>
    </div>
    <a href="${igUrl}" target="_blank" rel="noopener" class="footer-ig">
      ${igHandle ? '@' + igHandle : 'Instagram'} ↗
    </a>
  `;
}

// ── Apply config to page ───────────────────────────────────────────────────
async function applyConfig() {
  const cfg = await fetch('/api/config').then(r => r.json());

  // Nav logo
  const logoEl = document.querySelector('.nav-logo');
  if (logoEl) logoEl.textContent = cfg.creatorName;

  // Per-page title
  const key       = pathToKey(window.location.pathname);
  const titles    = cfg.pageTitles || {};
  const pageTitle = (titles[key] !== undefined && titles[key] !== '') ? titles[key] : cfg.creatorName;
  const nameEl    = document.getElementById('creatorName');
  if (nameEl) nameEl.textContent = pageTitle;

  document.title = cfg.creatorName;

  document.documentElement.style.setProperty('--accent', cfg.accentColor    || '#ffffff');
  document.documentElement.style.setProperty('--bg',     cfg.backgroundColor || '#000000');

  // Mute button styles
  const mb  = cfg.muteBtn || {};
  const sizeMap    = { small: '0.62rem', medium: '0.75rem', large: '0.95rem' };
  const paddingMap = { small: '3px 12px', medium: '5px 18px', large: '8px 26px' };
  const sz = mb.size || 'medium';
  document.documentElement.style.setProperty('--btn-bg',      mb.bgColor     || 'transparent');
  document.documentElement.style.setProperty('--btn-border',  mb.borderColor || '#ffffff');
  document.documentElement.style.setProperty('--btn-text',    mb.textColor   || '#ffffff');
  document.documentElement.style.setProperty('--btn-fs',      sizeMap[sz]    || sizeMap.medium);
  document.documentElement.style.setProperty('--btn-padding', paddingMap[sz] || paddingMap.medium);

  // Nav names
  const names = cfg.pageNames || {};
  document.querySelectorAll('nav a[data-page]').forEach(a => {
    const k = a.dataset.page;
    if (names[k]) a.textContent = names[k];
  });

  buildTicker(cfg);
  buildFooter(cfg);

  return cfg;
}

// ── Active nav link ────────────────────────────────────────────────────────
function setActiveNav() {
  const p = window.location.pathname;
  document.querySelectorAll('nav a[data-page]').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === p);
  });
}

// ── Sort: wide (16:9) first ────────────────────────────────────────────────
function sortByAspect(items) {
  return [...items].sort((a, b) => {
    const aWide = (a.aspectRatio || 0) >= 1.6;
    const bWide = (b.aspectRatio || 0) >= 1.6;
    if (aWide && !bWide) return -1;
    if (!aWide && bWide) return  1;
    return 0;
  });
}

// ── Mute/unmute pill button ────────────────────────────────────────────────
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

// ── IntersectionObserver for autoplay ─────────────────────────────────────
const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.play().catch(() => {});
    else                  e.target.pause();
  });
}, { threshold: 0.15 });
function observeVideo(v) { videoObserver.observe(v); }

// ── HOME — doom scroll wall ────────────────────────────────────────────────
function renderWall(items) {
  const wall = document.getElementById('mediaWall');
  if (!wall) return;
  if (!items.length) {
    wall.innerHTML = '<p class="empty">No content yet — upload from the admin panel.</p>';
    return;
  }

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
        a.appendChild(img);
        wrap.appendChild(a);
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

// ── WORK / APP / STORE — row layout ───────────────────────────────────────
function renderRowPage(items, wallId, emptyMsg) {
  const wall = document.getElementById(wallId);
  if (!wall) return;
  if (!items.length) { wall.innerHTML = `<p class="empty">${emptyMsg}</p>`; return; }

  const sorted = sortByAspect(items);
  wall.innerHTML = '';

  sorted.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = 'work-row';

    const vWrap = document.createElement('div');
    vWrap.className = 'work-video-wrap';

    if (item.type === 'video') {
      const v = document.createElement('video');
      v.src = item.path; v.muted = true; v.loop = true; v.playsInline = true;
      v.setAttribute('preload', 'metadata');
      observeVideo(v);
      if (item.linkUrl) {
        v.style.cursor = 'pointer';
        v.addEventListener('click', () => window.open(item.linkUrl, '_blank'));
      }
      vWrap.appendChild(v);
      vWrap.appendChild(createMuteBtn(v));
    } else {
      const img = document.createElement('img');
      img.src = item.path; img.alt = '';
      img.loading = idx < 2 ? 'eager' : 'lazy';
      img.style.cssText = 'width:100%;height:auto;display:block;';
      if (item.linkUrl) {
        const a = document.createElement('a');
        a.href = item.linkUrl; a.target = '_blank'; a.rel = 'noopener';
        a.appendChild(img); vWrap.appendChild(a);
      } else {
        vWrap.appendChild(img);
      }
    }

    const desc = document.createElement('div');
    desc.className   = 'work-desc';
    desc.textContent = item.description || '';

    const layout = item.textPosition || 'bottom';
    row.classList.add('layout-' + layout);

    if (layout === 'top') { row.appendChild(desc); row.appendChild(vWrap); }
    else                  { row.appendChild(vWrap); row.appendChild(desc); }

    wall.appendChild(row);
  });
}

// ── SERVICES page ─────────────────────────────────────────────────────────
function renderServices(services) {
  const wrap = document.getElementById('servicesWrap');
  if (!wrap) return;
  if (!services.length) { wrap.innerHTML = '<p class="empty">No services listed yet.</p>'; return; }
  wrap.innerHTML = '';
  services.forEach((svc, i) => {
    const item = document.createElement('div');
    item.className = 'service-item';
    item.innerHTML = `
      <span class="service-number">${String(i + 1).padStart(2, '0')}</span>
      <div>
        <div class="service-title">${svc.title}</div>
        <div class="service-desc">${svc.description}</div>
      </div>
    `;
    wrap.appendChild(item);
  });
}

// ── Let's Talk ────────────────────────────────────────────────────────────
function renderContact(cfg) {
  const wrap = document.getElementById('contactWrap');
  if (!wrap) return;
  const handle = cfg.instagram
    ? cfg.instagram.replace(/https?:\/\/(www\.)?instagram\.com\/?/, '').replace(/\/$/, '')
    : '';
  wrap.innerHTML = `
    <div class="contact-block">
      <p class="contact-label">Instagram</p>
      <a class="contact-link" href="${cfg.instagram}" target="_blank" rel="noopener">
        ${handle ? '@' + handle : cfg.instagram}
      </a>
    </div>
    <div class="contact-block">
      <p class="contact-label">Email</p>
      <a class="contact-link" href="mailto:${cfg.email}">${cfg.email}</a>
    </div>
  `;
}

// ── Page entry points ──────────────────────────────────────────────────────
async function initHome() {
  const [cfg, media] = await Promise.all([applyConfig(), fetch('/api/media').then(r => r.json())]);
  setActiveNav();
  renderWall(media);
}

async function initWork() {
  const [cfg, media] = await Promise.all([applyConfig(), fetch('/api/media').then(r => r.json())]);
  setActiveNav();
  renderRowPage(media.filter(m => m.type === 'video'), 'mediaWall', 'No videos yet — upload from the admin panel.');
}

async function initServices() {
  const [cfg, services] = await Promise.all([applyConfig(), fetch('/api/services').then(r => r.json())]);
  setActiveNav();
  renderServices(services);
}

async function initApp() {
  const [cfg, media] = await Promise.all([applyConfig(), fetch('/api/app-media').then(r => r.json())]);
  setActiveNav();
  renderRowPage(media, 'mediaWall', 'No content yet — upload from the admin panel.');
}

async function initStore() {
  const [cfg, media] = await Promise.all([applyConfig(), fetch('/api/store-media').then(r => r.json())]);
  setActiveNav();
  renderRowPage(media, 'mediaWall', 'No content yet — upload from the admin panel.');
}

async function initLetsTalk() {
  const cfg = await applyConfig();
  setActiveNav();
  renderContact(cfg);
}
