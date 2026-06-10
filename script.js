/* ===== НОЧНОЙ ГОРОД ЗА ЛАМПОЙ (генерируется случайно) ===== */
(function buildCity() {
  const host = document.getElementById('lamp-city');
  if (!host) return;
  const W = 1200, H = 420;
  const rnd = (a, b) => a + Math.random() * (b - a);

  function building(x, w, h, baseY, fill, winChance, winAlpha) {
    let s = '<rect x="' + x.toFixed(0) + '" y="' + (baseY - h).toFixed(0) +
            '" width="' + w.toFixed(0) + '" height="' + h.toFixed(0) + '" fill="' + fill + '"/>';
    const cw = 6, ch = 9, gx = 13, gy = 17, pad = 7;
    for (let wy = baseY - h + 16; wy < baseY - 14; wy += gy) {
      for (let wx = x + pad; wx < x + w - pad - cw; wx += gx) {
        if (Math.random() < winChance) {
          const a = (winAlpha * rnd(0.5, 1)).toFixed(2);
          const cls = Math.random() < 0.12 ? 'lamp-win tw' : 'lamp-win';
          s += '<rect class="' + cls + '" x="' + wx.toFixed(0) + '" y="' + wy.toFixed(0) +
               '" width="' + cw + '" height="' + ch + '" fill="rgba(255,196,116,' + a + ')"/>';
        }
      }
    }
    return s;
  }

  let far = '', near = '', x = -25;
  while (x < W) { const w = rnd(42, 72), h = rnd(90, 180);  far  += building(x, w, h, H - 46, '#2c2014', 0.30, 0.55); x += w + rnd(3, 10); }
  x = -35;
  while (x < W) { const w = rnd(58, 96), h = rnd(150, 250); near += building(x, w, h, H,      '#160f08', 0.42, 0.9);  x += w + rnd(6, 16); }

  const defs = '<defs>'
    + '<linearGradient id="cityGlow" x1="0" y1="1" x2="0" y2="0">'
    + '<stop offset="0" stop-color="#b4502a" stop-opacity="0.22"/>'
    + '<stop offset="1" stop-color="#b4502a" stop-opacity="0"/></linearGradient>'
    + '<radialGradient id="moonG"><stop offset="0" stop-color="#ffe9c8" stop-opacity="0.45"/>'
    + '<stop offset="1" stop-color="#ffe9c8" stop-opacity="0"/></radialGradient></defs>';
  const glow = '<rect x="0" y="' + (H - 300) + '" width="' + W + '" height="300" fill="url(#cityGlow)"/>';

  host.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMax slice">'
    + defs + glow
    + '<g class="city-far">' + far + '</g>'
    + '<g class="city-near">' + near + '</g></svg>';
})();

/* ===== ЗВЁЗДНОЕ НЕБО + ЛУНА (верхняя часть заставки) ===== */
(function buildSky() {
  const sky = document.getElementById('lamp-sky');
  if (!sky) return;
  const rnd = (a, b) => a + Math.random() * (b - a);
  let html = '';
  // луна — справа сверху
  const ms = Math.round(rnd(54, 78));
  html += '<div class="moon-disc" style="width:' + ms + 'px;height:' + ms + 'px;top:11%;right:13%;"></div>';
  // звёзды в верхних ~62% экрана
  for (let i = 0; i < 70; i++) {
    const s = rnd(1, 2.6).toFixed(1);
    const o = rnd(0.35, 0.9).toFixed(2);
    const tw = Math.random() < 0.5 ? ' tw' : '';
    const delay = rnd(0, 3.2).toFixed(2);
    html += '<span class="star' + tw + '" style="left:' + rnd(1, 99).toFixed(1) + '%;top:' +
            rnd(1, 62).toFixed(1) + '%;width:' + s + 'px;height:' + s + 'px;opacity:' + o +
            ';--o:' + o + ';animation-delay:' + delay + 's;"></span>';
  }
  sky.innerHTML = html;
})();

/* ===== LAMP CORD — пружинная физика верёвки ===== */
const lampScreen = document.getElementById('lamp-screen');
const burst = document.getElementById('light-burst');
const hint = document.getElementById('lamp-hint');
const cp = document.getElementById('cord-path');
const cb = document.getElementById('cord-ball');
const cordEl = document.getElementById('cord');
const lampSkip = document.getElementById('lampSkip');

let pulling = false, pulled = false;
let startX = 0, startY = 0;
let pullY = 0, swingX = 0;   // текущее вытяжение вниз и раскачка в стороны
let velY = 0, velX = 0;      // скорости для пружинной симуляции
const MAX_PULL = 100;   // максимальный радиус вытягивания шарика
const PULL_TRIGGER = 36; // насколько надо оттянуть (в любую сторону), чтобы включить свет

/* ===== ПОДСКАЗКИ ДЛЯ НЕТЕРПЕЛИВЫХ ===== */
/* лёгкое покачивание шнурка сразу — глаз цепляется, что за него можно тянуть */
cordEl.classList.add('idle-sway');

/* через ~4.5с бездействия усиливаем свечение шнурка, чтобы привлечь внимание */
const attractTimer = setTimeout(() => { if (!pulled) cordEl.classList.add('attract'); }, 4500);

/* кнопка «Пропустить» появляется через ~3с — для тех, кто спешит и не хочет играть со шнурком */
const skipTimer = setTimeout(() => { if (!pulled) lampSkip.classList.add('visible'); }, 3000);

function stopIdleHints() {
  cordEl.classList.remove('idle-sway', 'attract');
  clearTimeout(attractTimer);
  clearTimeout(skipTimer);
  lampSkip.classList.remove('visible');
}

lampSkip.addEventListener('click', () => {
  if (pulled) return;
  pulled = true;
  stopIdleHints();
  quickReveal();
});

/* ускоренный показ резюме без анимации натяжения шнурка — тот же финал, но без ожидания */
function quickReveal() {
  lampScreen.classList.add('lit');
  setTimeout(() => { burst.getBoundingClientRect(); burst.classList.add('expand'); }, 120);
  setTimeout(() => {
    lampScreen.classList.add('fade-out');
    document.getElementById('main-content').classList.add('revealed');
    document.body.style.background = '#f5f0e8';
    themeToggleBtn.classList.add('visible');
  }, 700);
  setTimeout(() => { lampScreen.style.display = 'none'; }, 2150);
}

/* рисуем верёвку: вытяжение вниз сгибает её, раскачка наклоняет дугой в сторону */
function drawCord(py, sx) {
  const midY = 38 + py * 0.55;
  const endY = 88 + py;
  const midX = 8 + sx * 0.55;
  const endX = 8 + sx;
  cp.setAttribute('d', `M8,0 C8,${(midY * 0.5).toFixed(1)} ${midX.toFixed(1)},${midY.toFixed(1)} ${endX.toFixed(1)},${endY.toFixed(1)}`);
  cb.setAttribute('cx', endX.toFixed(1));
  cb.setAttribute('cy', (endY + 4).toFixed(1));
}

cordEl.addEventListener('mousedown', e => { startDrag(e.clientX, e.clientY); e.preventDefault(); });
cordEl.addEventListener('touchstart', e => { startDrag(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }, { passive: false });
document.addEventListener('mousemove', e => { if (!pulling || pulled) return; drag(e.clientX, e.clientY); });
document.addEventListener('touchmove', e => { if (!pulling || pulled) return; drag(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }, { passive: false });
document.addEventListener('mouseup', endDrag);
document.addEventListener('touchend', endDrag);

function startDrag(x, y) {
  pulling = true; startX = x; startY = y; velX = 0; velY = 0;
  stopIdleHints();
}

function drag(x, y) {
  // шарик свободно следует за курсором/пальцем в любую сторону, ограничен радиусом
  let dx = x - startX;
  let dy = Math.max(0, y - startY); // вверх не тянем — верёвка висит вниз
  const dist = Math.hypot(dx, dy);
  if (dist > MAX_PULL) { dx *= MAX_PULL / dist; dy *= MAX_PULL / dist; }
  swingX = dx;
  pullY = dy;
  drawCord(pullY, swingX);
  if (Math.hypot(pullY, swingX) > 10) hint.classList.add('hide');
}

function endDrag() {
  if (!pulling || pulled) return;
  pulling = false;
  if (Math.hypot(pullY, swingX) >= PULL_TRIGGER) { pulled = true; snap(); }
  else springRelease(true);
}

/* затухающие колебания пружины — верёвка пружинит и качается, постепенно успокаиваясь */
function springRelease(restoreHint) {
  const stiffness = 0.16, damping = 0.86;
  velY = pullY * 0.05;
  velX = swingX * 0.04;

  function step() {
    velY = (velY - stiffness * pullY) * damping;
    pullY += velY;
    velX = (velX - stiffness * swingX) * damping;
    swingX += velX;
    drawCord(Math.max(0, pullY), swingX);

    if (Math.abs(pullY) > 0.4 || Math.abs(velY) > 0.4 || Math.abs(swingX) > 0.4 || Math.abs(velX) > 0.4) {
      requestAnimationFrame(step);
    } else {
      pullY = 0; swingX = 0;
      drawCord(0, 0);
      if (restoreHint) hint.classList.remove('hide');
    }
  }
  requestAnimationFrame(step);
}

function snap() {
  springRelease(false);
  setTimeout(() => lampScreen.classList.add('lit'), 90);
  setTimeout(() => { burst.getBoundingClientRect(); burst.classList.add('expand'); }, 270);
  setTimeout(() => {
    lampScreen.classList.add('fade-out');
    document.getElementById('main-content').classList.add('revealed');
    document.body.style.background = '#f5f0e8';
    /* показываем кнопку темы после входа */
    themeToggleBtn.classList.add('visible');
  }, 850);
  setTimeout(() => { lampScreen.style.display = 'none'; }, 2300);
}

/* #4 якорные ссылки — плавный скролл через JS вместо CSS scroll-behavior */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ===== PHOTO TILT ===== */
const pw = document.getElementById('photoWrap');
const pi = document.getElementById('photoInner');
if (pw && pi) {
  pw.addEventListener('mouseenter', () => { pi.style.willChange = 'transform'; }); /* #17 will-change динамически */
  pw.addEventListener('mousemove', e => {
    const r = pw.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    pi.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 10}deg) scale(1.03)`;
    pi.style.filter = `drop-shadow(${x * -16}px ${y * -10}px 28px rgba(155,79,42,0.2))`;
  });
  pw.addEventListener('mouseleave', () => {
    pi.style.transition = 'transform 0.7s ease,filter 0.7s ease';
    pi.style.transform = 'rotateY(0) rotateX(0) scale(1)';
    pi.style.filter = 'none';
    pi.style.willChange = 'auto'; /* #17 снимаем после */
    setTimeout(() => pi.style.transition = 'transform 0.12s ease-out', 700);
  });
}

/* ===== PHOTO FLIP #20 — клик переключает реальное фото на мультяшное ===== */
const photoFlip = document.getElementById('photoFlip');
if (photoFlip) {
  const toggleFlip = () => photoFlip.classList.toggle('flipped');
  photoFlip.addEventListener('click', toggleFlip);
  photoFlip.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFlip(); }
  });
}

/* ===== ACCORDION ===== */
/* #10 убрали inline onclick, заменили на addEventListener */
function toggleAcc(header) {
  const item = header.closest('.acc-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.acc-item.open').forEach(i => {
    i.classList.remove('open');
    i.querySelector('.acc-header').setAttribute('aria-expanded', 'false');
  });
  if (!isOpen) {
    item.classList.add('open');
    header.setAttribute('aria-expanded', 'true');
  }
}

document.querySelectorAll('.acc-header').forEach(header => {
  header.addEventListener('click', () => toggleAcc(header));
  header.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleAcc(header); } });
});

/* ===== NICHE SCROLL ===== */
document.querySelectorAll('.niche-card').forEach(card => {
  card.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(card.getAttribute('href'));
    if (!target) return;
    document.querySelectorAll('.acc-item.open').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.acc-header').setAttribute('aria-expanded', 'false');
    });
    target.classList.add('open');
    target.querySelector('.acc-header').setAttribute('aria-expanded', 'true');
    /* #4 скролл через JS */
    setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  });
});

/* ===== FLIP CARDS TOUCH #11 ===== */
document.querySelectorAll('.flip-card').forEach(card => {
  card.addEventListener('touchend', e => {
    e.preventDefault();
    const wasFlipped = card.classList.contains('flipped');
    document.querySelectorAll('.flip-card.flipped').forEach(c => c.classList.remove('flipped'));
    if (!wasFlipped) card.classList.add('flipped');
  });
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.classList.toggle('flipped');
    }
  });
});

/* ===== TICKER TOUCH PAUSE #11 ===== */
const tickerTrack = document.getElementById('tickerTrack');
if (tickerTrack) {
  tickerTrack.addEventListener('touchstart', () => tickerTrack.classList.add('paused'));
  tickerTrack.addEventListener('touchend', () => tickerTrack.classList.remove('paused'));
}

/* ===== SCROLL PROGRESS + NAV #5 #7 ===== */
const progressBar = document.getElementById('scroll-progress');
const siteNav = document.getElementById('site-nav');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

/* ===== ОЖИВШИЙ ФОНОВЫЙ ТЕКСТ "ЕФ" — реагирует на скролл ===== */
const heroBgText = document.querySelector('.hero-bg-text');
const heroSection = document.getElementById('section-hero');

function onScroll() {
  /* прогресс */
  const scrolled = window.scrollY;
  const total = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = (scrolled / total * 100) + '%';

  /* показать nav после первого скролла */
  if (scrolled > 80) siteNav.classList.add('visible'); else siteNav.classList.remove('visible');

  /* активный раздел */
  let current = '';
  sections.forEach(sec => {
    if (scrolled >= sec.offsetTop - 120) current = sec.id;
  });
  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === '#' + current);
  });

  /* буквы "ЕФ" смещаются и проступают ярче по мере ухода героя за край экрана */
  if (heroBgText && heroSection) {
    const rect = heroSection.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -rect.top / rect.height));
    heroBgText.style.setProperty('--bgtext-shift', (progress * 70) + 'px');
    heroBgText.style.setProperty('--bgtext-glow', (0.05 + progress * 0.07).toFixed(3));
  }
}

window.addEventListener('scroll', onScroll, { passive: true });

/* ===== ТЁМНАЯ ТЕМА #12 ===== */
const themeToggleBtn = document.getElementById('themeToggle');
let isDark = false;
themeToggleBtn.addEventListener('click', () => {
  isDark = !isDark;
  document.body.classList.toggle('dark-mode', isDark);
  themeToggleBtn.textContent = isDark ? '☀' : '☾';
});

/* ===== SCROLL REVEAL ===== */
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), +e.target.dataset.delay || 0);
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.acc-item,.edu-card,.q-card,.flip-card').forEach((el, i) => {
  if (!el.dataset.delay) el.dataset.delay = (i % 4) * 90;
  obs.observe(el);
});
document.querySelectorAll('.niche-card').forEach((el, i) => {
  el.dataset.delay = i * 50;
  obs.observe(el);
});

/* ===== STAT-ORB — кружок-бейдж перетекает между фактами в зоне видимости ===== */
const statOrb = document.getElementById('statOrb');
if (statOrb) {
  const orbNum = statOrb.querySelector('.stat-orb-num');
  const orbLabel = statOrb.querySelector('.stat-orb-label');
  const stats = [
    { num: '7', label: 'лет опыта' },
    { num: '10+', label: 'ниш и сфер' },
    { num: '8', label: 'компаний' },
  ];
  let statIdx = 0;
  let statTimer = null;

  function morphStat() {
    statOrb.classList.add('morph');
    setTimeout(() => {
      statIdx = (statIdx + 1) % stats.length;
      orbNum.textContent = stats[statIdx].num;
      orbLabel.textContent = stats[statIdx].label;
      statOrb.classList.remove('morph');
    }, 320);
  }

  const orbObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        statOrb.classList.add('visible');
        if (!statTimer) statTimer = setInterval(morphStat, 2700);
      } else {
        statOrb.classList.remove('visible');
        clearInterval(statTimer);
        statTimer = null;
      }
    });
  }, { threshold: 0.35 });
  orbObs.observe(statOrb);
}

/* ===== МАСКОТ-ЛАМПОЧКА: глаза следят за курсором ===== */
(function mascotEyes() {
  const mascot = document.getElementById('mascot');
  if (!mascot) return;
  const eyeL = mascot.querySelector('#eyeL');
  const eyeR = mascot.querySelector('#eyeR');
  if (!eyeL || !eyeR) return;
  function moveEye(eye, fracX, cx, cy, rect) {
    const ex = rect.left + rect.width * fracX;
    const ey = rect.top + rect.height * 0.40;
    const ang = Math.atan2(cy - ey, cx - ex);
    const d = Math.min(4.5, Math.hypot(cx - ex, cy - ey) / 45);
    eye.setAttribute('transform', 'translate(' + (Math.cos(ang) * d).toFixed(1) + ',' + (Math.sin(ang) * d).toFixed(1) + ')');
  }
  window.addEventListener('mousemove', e => {
    const rect = mascot.getBoundingClientRect();
    if (!rect.width) return;
    moveEye(eyeL, 0.40, e.clientX, e.clientY, rect);
    moveEye(eyeR, 0.60, e.clientX, e.clientY, rect);
  }, { passive: true });
})();

