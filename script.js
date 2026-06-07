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
const MAX_PULL = 70;
const MAX_SWING = 26;

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
  pullY = Math.max(0, Math.min(y - startY, MAX_PULL));
  swingX = Math.max(-MAX_SWING, Math.min(x - startX, MAX_SWING));
  drawCord(pullY, swingX);
  if (pullY > 8) hint.classList.add('hide');
}

function endDrag() {
  if (!pulling || pulled) return;
  pulling = false;
  if (pullY >= 28) { pulled = true; snap(); }
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
