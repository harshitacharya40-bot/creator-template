// ── Apply config to page ───────────────────────────────────────────────────
async function applyConfig() {
  const cfg = await fetch('/api/config').then(r => r.json());

  // Creator name
  const nameEl = document.getElementById('creatorName');
  if (nameEl) nameEl.textContent = cfg.creatorName;

  // Tab title
  document.title = cfg.creatorName;

  // Colors
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
    const key = a.dataset.page;
    if (names[key]) a.textContent = names[key];
  });

  return cfg;
}

// ── Active nav link ────────────────────────────────────────────────────────
function setActiveNav() {
  const p = window.location.pathname;
  document.querySelectorAll('nav a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === p);
  });
}

// ── Sort: 16:9 (wide) first ────────────────────────────────────────────────
function sortByAspect(items) {
  return [...items].sort((a, b) => {
    const aWide = (a.aspectRatio || 0) >= 1.6;
    const bWide = (b.aspectRatio || 0) >= 1.6;
    if (aWide && !bWide) return -1;
    if (!aWide && bWide) return  1;
    return 0;
  });
}

// ── Create mute/unmute pill button ─────────────────────────────────────────
function createMuteBtn(video) {
  const btn = document.createElement('button');
  btn.className   = 'mute-btn';
  btn.textContent = 'UNMUTE';
  btn.addEventListener('click', () => {
    video.muted     = !video.muted;
    btn.textContent = video.muted ? 'UNMUTE' : 'MUTE';
  });
  return btn;
}

// ── IntersectionObserver ───────────────────────────────────────────────────
const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.play().catch(() => {});
    else                  e.target.pause();
  });
}, { threshold: 0.15 });
function observeVideo(v) { videoObserver.observe(v); }

// ── HOME — masonry wall ────────────────────────────────────────────────────
function renderWall(items) {
  const wall = document.getElementById('mediaWall');
  if (!wall) return;
  if (!items.length) { wall.innerHTML = '<p class="empty">No content yet — upload from the admin panel.</p>'; return; }

  const sorted = [
    ...sortByAspect(items.filter(i => i.type === 'video')),
    ...items.filter(i => i.type === 'photo')
  ];

  wall.innerHTML = '';
  sorted.forEach(item => {
    const wrap = document.createElement('div');
    wrap.className = 'media-item';
    if (item.type === 'video') {
      const v = document.createElement('video');
      v.src = item.path; v.muted = true; v.loop = true; v.playsInline = true;
      v.setAttribute('preload', 'metadata');
      wrap.appendChild(v); observeVideo(v); wrap.appendChild(createMuteBtn(v));
    } else {
      const img = document.createElement('img');
      img.src = item.path; img.alt = ''; img.loading = 'lazy';
      wrap.appendChild(img);
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

  sorted.forEach(item => {
    const row = document.createElement('div');
    row.className = 'work-row';

    const vWrap = document.createElement('div');
    vWrap.className = 'work-video-wrap';

    if (item.type === 'video') {
      const v = document.createElement('video');
      v.src = item.path; v.muted = true; v.loop = true; v.playsInline = true;
      v.setAttribute('preload', 'metadata');
      vWrap.appendChild(v); observeVideo(v); vWrap.appendChild(createMuteBtn(v));
    } else {
      const img = document.createElement('img');
      img.src = item.path; img.alt = ''; img.loading = 'lazy';
      img.style.cssText = 'width:100%;height:auto;display:block;';
      vWrap.appendChild(img);
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
      <div class="service-title">${svc.title}</div>
      <div class="service-desc">${svc.description}</div>
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
