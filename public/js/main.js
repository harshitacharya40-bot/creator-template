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

  const socials = [
    {
      href: 'https://www.futureworldsport.com/',
      label: 'FutureWorldSport',
      svg: `<span class="footer-fws-text">FWS</span>`
    },
    {
      href: 'https://www.instagram.com/futureworldsport',
      label: 'Instagram',
      svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`
    },
    {
      href: 'https://www.youtube.com/@FUTUREWORLDSPORT',
      label: 'YouTube',
      svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`
    },
    {
      href: 'https://www.tiktok.com/@futureworldsport',
      label: 'TikTok',
      svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/></svg>`
    },
    {
      href: 'https://www.twitch.tv/FUTUREWORLDSPORT',
      label: 'Twitch',
      svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>`
    },
    {
      href: 'https://apps.apple.com/us/app/futureworldsport/id6479718250',
      label: 'App Store',
      svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>`
    }
  ];

  footer.innerHTML = `
    <div class="footer-icons">
      ${socials.map(s => `
        <a href="${s.href}" target="_blank" rel="noopener" class="footer-icon-link" aria-label="${s.label}">
          ${s.svg}
        </a>
      `).join('')}
    </div>
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
