/* =========================================================
   Portfolio de Cyriac Clermont - interactions et animations
   (thème, texte tapé, particules, défilement, hyper motion…)
   ========================================================= */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Thème ---------- */
  const root = document.documentElement;
  try { const t = localStorage.getItem('theme'); if (t) root.dataset.theme = t; } catch (e) {}
  $('#themeBtn').addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
    netColors(); drawThumbs();
  });

  /* ---------- Toast ---------- */
  let toastT;
  const toast = (msg) => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); };

  /* ---------- Nom lettre par lettre ---------- */
  let ci = 0;
  $$('.hero h1 .line > span').forEach(s => {
    const txt = s.textContent; s.textContent = ''; s.setAttribute('aria-label', txt);
    [...txt].forEach(c => { const l = document.createElement('span'); l.className = 'ch'; l.textContent = c; l.style.setProperty('--i', ci++); l.setAttribute('aria-hidden', 'true'); s.appendChild(l); });
  });

  /* ---------- Titres mot par mot ---------- */
  $$('.sec-head h2').forEach(h => {
    const words = h.textContent.trim().split(/\s+/); h.textContent = '';
    words.forEach((w, i) => {
      const m = document.createElement('span'); m.className = 'wm';
      const s = document.createElement('span'); s.className = 'w'; s.textContent = w; s.style.transitionDelay = i * 70 + 'ms';
      m.appendChild(s); h.appendChild(m); if (i < words.length - 1) h.appendChild(document.createTextNode(' '));
    });
  });

  /* ---------- Effet de décodage (style terminal) ---------- */
  const glyphs = '!<>-_/[]{}=+*^?#01';
  function scramble(el) {
    if (!el || reduce) return;
    const final = el.dataset.final || (el.dataset.final = el.textContent);
    let f = 0; const total = 22;
    clearInterval(el._s);
    el._s = setInterval(() => {
      f++;
      el.textContent = [...final].map((c, i) => (i < (f / total) * final.length || c === ' ') ? c : glyphs[Math.random() * glyphs.length | 0]).join('');
      if (f >= total) { clearInterval(el._s); el.textContent = final; }
    }, 32);
  }
  $('.logo').addEventListener('mouseenter', () => { const t = $('.logo'); if (t._s) return; const html = t.innerHTML; t._s = 1; let f = 0; const txt = 'cyriac.dev'; const iv = setInterval(() => { f++; t.textContent = [...txt].map((c, i) => i < f / 2 ? c : glyphs[Math.random() * glyphs.length | 0]).join(''); if (f >= txt.length * 2) { clearInterval(iv); t.innerHTML = html; t._s = 0; } }, 30); });

  /* ---------- Texte tapé ---------- */
  const words = ['Apprenti technicien', 'Réseaux & systèmes', 'Cybersécurité', 'Électronique'];
  const el = $('#typed');
  if (!reduce) {
    let w = 0, i = words[0].length, del = true;
    const tick = () => {
      const word = words[w];
      i += del ? -1 : 1;
      el.textContent = word.slice(0, i);
      let d = del ? 45 : 85;
      if (!del && i === word.length) { del = true; d = 1800; }
      else if (del && i === 0) { del = false; w = (w + 1) % words.length; d = 300; }
      setTimeout(tick, d);
    };
    setTimeout(tick, 2200);
  }

  /* ---------- Réseau de particules (hero) ---------- */
  const cv = $('#net'), ctx = cv.getContext('2d');
  let pts = [], W = 0, H = 0, mouse = { x: -999, y: -999 }, heroRect = null;
  const hexToRgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  let COL = { acc: '#0b8a8f', dot: 'rgba(91,109,117,.7)', line: [] };
  function netColors() {
    const [r, g, b] = hexToRgb(css('--accent') || '#0b8a8f'), [fr, fg, fb] = hexToRgb(css('--muted') || '#5b6d75');
    COL = { acc: `rgb(${r},${g},${b})`, dot: `rgba(${fr},${fg},${fb},.7)`, line: [.1, .2, .3].map(a => `rgba(${fr},${fg},${fb},${a})`) };
  }
  netColors();
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = cv.offsetWidth; H = cv.offsetHeight; heroRect = null;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(innerWidth < 700 ? 34 : 60, Math.floor(W * H / 18000));
    pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4 }));
  };
  const LINK = 130, LINK2 = LINK * LINK;
  const frame = () => {
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      if (!reduce) { p.x += p.vx; p.y += p.vy; }
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < 14400 && d2 > 1 && !reduce) { const dm = Math.sqrt(d2); p.x += dx / dm * 1.2; p.y += dy / dm * 1.2; }
    }
    // les traits sont regroupés en 3 niveaux d'opacité : 3 dessins au lieu d'un par trait
    const buckets = [[], [], []];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const c = pts[j], dx = a.x - c.x, dy = a.y - c.y, d2 = dx * dx + dy * dy;
        if (d2 < LINK2) buckets[d2 < LINK2 * .25 ? 2 : d2 < LINK2 * .6 ? 1 : 0].push(a.x, a.y, c.x, c.y);
      }
    }
    ctx.lineWidth = 1;
    buckets.forEach((bk, k) => {
      if (!bk.length) return;
      ctx.strokeStyle = COL.line[k]; ctx.beginPath();
      for (let i = 0; i < bk.length; i += 4) { ctx.moveTo(bk[i], bk[i + 1]); ctx.lineTo(bk[i + 2], bk[i + 3]); }
      ctx.stroke();
    });
    ctx.fillStyle = COL.dot; ctx.beginPath();
    const near = [];
    for (const p of pts) {
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      if (dx * dx + dy * dy < 25600) { near.push(p); continue; }
      ctx.moveTo(p.x + 1.6, p.y); ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
    }
    ctx.fill();
    if (near.length) { ctx.fillStyle = COL.acc; ctx.beginPath(); near.forEach(p => { ctx.moveTo(p.x + 2.6, p.y); ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2); }); ctx.fill(); }
    if (!reduce && netOn && !document.hidden) requestAnimationFrame(frame); else netRunning = false;
  };
  let netOn = true, netRunning = true;
  resize(); frame();
  const wakeNet = () => { if (netOn && !netRunning && !reduce && !document.hidden) { netRunning = true; requestAnimationFrame(frame); } };
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { netOn = e.isIntersecting; wakeNet(); }).observe($('.hero'));
  document.addEventListener('visibilitychange', wakeNet);
  addEventListener('resize', () => { resize(); if (reduce) frame(); drawThumbs(); });
  $('.hero').addEventListener('mousemove', (e) => { const r = heroRect || (heroRect = cv.getBoundingClientRect()); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; }, { passive: true });
  addEventListener('scroll', () => { heroRect = null; }, { passive: true });
  $('.hero').addEventListener('mouseleave', () => { mouse.x = mouse.y = -999; });

  /* ---------- Vignettes de projets génératives ---------- */
  function rand(seed) { return () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }; }
  function drawThumbs() {
    const acc = css('--accent'), sur = css('--surface'), line = css('--line'), fg = css('--fg');
    $$('.card').forEach(card => {
      const c = $('canvas', card), x = c.getContext('2d');
      const w = c.offsetWidth, h = c.offsetHeight, dpr = Math.min(devicePixelRatio || 1, 2);
      if (!w) return;
      c.width = w * dpr; c.height = h * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
      const R = rand(+card.dataset.seed * 97);
      x.fillStyle = line; x.fillRect(0, 0, w, h);
      const kind = +card.dataset.seed % 3;
      if (kind === 0) { // fenêtre de navigateur
        x.fillStyle = sur; x.fillRect(w * .1, h * .14, w * .8, h * .86);
        x.fillStyle = acc; [0, 1, 2].forEach(i => { x.beginPath(); x.arc(w * .14 + i * 12, h * .2, 3.5, 0, 7); x.fill(); });
        x.fillStyle = fg; x.globalAlpha = .85; x.fillRect(w * .16, h * .34, w * .42, 12);
        x.globalAlpha = .3; for (let i = 0; i < 4; i++) x.fillRect(w * .16, h * .48 + i * 12, w * (.3 + R() * .35), 5);
        x.globalAlpha = 1; x.fillStyle = acc; x.fillRect(w * .62, h * .34, w * .22, h * .4);
      } else if (kind === 1) { // graphique
        x.strokeStyle = acc; x.lineWidth = 3; x.beginPath();
        let y = h * .7; for (let i = 0; i <= 10; i++) { y = Math.max(h * .2, Math.min(h * .85, y - (R() - .35) * h * .18)); i ? x.lineTo(w * .08 + i * w * .084, y) : x.moveTo(w * .08, y); }
        x.stroke(); x.lineTo(w * .92, h); x.lineTo(w * .08, h); x.closePath(); x.globalAlpha = .18; x.fillStyle = acc; x.fill(); x.globalAlpha = 1;
      } else { // composition graphique
        for (let i = 0; i < 7; i++) { x.fillStyle = i % 3 === 0 ? acc : (i % 3 === 1 ? sur : fg); x.globalAlpha = i % 3 === 2 ? .15 : 1; x.beginPath(); x.arc(R() * w, R() * h, 18 + R() * 60, 0, 7); x.fill(); }
        x.globalAlpha = 1;
      }
    });
  }
  requestAnimationFrame(drawThumbs);
  document.fonts && document.fonts.ready.then(drawThumbs);

  /* ---------- Apparition au défilement ---------- */
  const reveals = $$('.reveal');
  if (!reduce && 'IntersectionObserver' in window) {
    // Seuls les éléments hors de l'écran au chargement sont masqués
    reveals.forEach(r => { if (r.getBoundingClientRect().top < innerHeight) { r.classList.add('in'); if (r.classList.contains('sec-head')) scramble($('.tag', r)); } });
    document.body.classList.add('reveal-ready');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const sibs = [...e.target.parentElement.children].filter(c => c.classList.contains('reveal'));
        e.target.style.transitionDelay = (sibs.indexOf(e.target) % 6) * 80 + 'ms';
        e.target.classList.add('in'); io.unobserve(e.target);
        if (e.target.classList.contains('sec-head')) scramble($('.tag', e.target));
      });
    }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(r => { if (!r.classList.contains('in')) io.observe(r); });
  }

  /* ---------- Compteurs ---------- */
  const counters = $$('[data-count]');
  const runCount = (n) => {
    const end = +n.dataset.count, t0 = performance.now(), dur = 1600;
    const step = (t) => { const p = Math.min(1, (t - t0) / dur); n.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  if (reduce || !('IntersectionObserver' in window)) counters.forEach(n => n.textContent = n.dataset.count);
  else {
    const co = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); } }), { threshold: .6 });
    counters.forEach(n => co.observe(n));
  }

  /* ---------- Défilement fluide (Lenis) ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    root.style.scrollBehavior = 'auto';
    lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    if (window.gsap) { gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const lr = (t) => { lenis.raf(t); requestAnimationFrame(lr); }; requestAnimationFrame(lr); }
  }
  const goTo = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: target === 0 ? 0 : -70 });
    else if (target === 0) scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const t = id === '#top' ? 0 : document.querySelector(id);
    if (t === null) return;
    e.preventDefault(); goTo(t);
  }));

  /* ---------- Défilement : progression, nav, frise ---------- */
  const nav = $('#nav'), prog = $('#progress'), fill = $('#tlFill'), tl = $('#timeline');
  const sections = $$('section[id]'), navLinks = $$('.links a'), steps = $$('.step');
  const tp = $('#totop'), ring = $('#ringProg'), hc = $('#heroContent');
  let last = {};
  const onScroll = () => {
    // 1) lectures (aucune écriture avant, pour éviter les recalculs de mise en page forcés)
    const y = scrollY, vh = innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    const ratio = max > 0 ? y / max : 0;
    const r = tl.getBoundingClientRect();
    const lit = steps.filter(s => !s.classList.contains('lit') && s.getBoundingClientRect().top < vh * .7);
    let cur = '';
    sections.forEach(s => { if (s.getBoundingClientRect().top < vh * .4) cur = s.id; });
    // 2) écritures
    const p = Math.max(0, Math.min(1, (vh * .7 - r.top) / r.height));
    prog.style.transform = `scaleX(${ratio})`;
    if (last.sc !== (y > 10)) nav.classList.toggle('scrolled', last.sc = y > 10);
    if (Math.abs((last.p ?? -1) - p) > .001) { fill.style.height = `calc(${p * 100}% - 12px)`; last.p = p; }
    lit.forEach(s => s.classList.add('lit'));
    if (last.tp !== (y > vh * .6)) tp.classList.toggle('show', last.tp = y > vh * .6);
    ring.style.strokeDashoffset = 150.8 * (1 - ratio);
    if (!reduce && !window.gsap && y < vh * 1.2) { hc.style.transform = `translate3d(0, ${y * .25}px, 0)`; hc.style.opacity = Math.max(0, 1 - y / (vh * .9)); }
    if (last.cur !== cur) { navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur)); last.cur = cur; }
  };
  let scrollQueued = false;
  addEventListener('scroll', () => {
    if (scrollQueued) return; scrollQueued = true;
    requestAnimationFrame(() => { scrollQueued = false; onScroll(); });
  }, { passive: true });
  onScroll();

  /* ---------- Filtres de projets ---------- */
  $$('.chip').forEach(ch => ch.addEventListener('click', () => {
    $$('.chip').forEach(c => c.classList.toggle('on', c === ch));
    const f = ch.dataset.filter;
    $$('.card').forEach(card => {
      const show = f === 'all' || card.dataset.cat === f;
      card.classList.toggle('hide', !show);
      if (show && !reduce) card.animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
    drawThumbs();
  }));

  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Cartes inclinables 3D ---------- */
  if (fine && !reduce) $$('.card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `rotateY(${px * 10}deg) rotateX(${-py * 10}deg) translateY(-4px)`;
      card.style.setProperty('--mx', (px + .5) * 100 + '%'); card.style.setProperty('--my', (py + .5) * 100 + '%');
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

  /* ---------- Boutons magnétiques ---------- */
  if (fine && !reduce) $$('.magnetic').forEach(b => {
    b.addEventListener('mousemove', (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`; });
    b.addEventListener('mouseleave', () => { b.style.transform = ''; });
  });

  /* ---------- Curseur personnalisé ---------- */
  if (fine && !reduce) {
    const c = $('#cursor'), d = $('#cursorDot');
    let mx = 0, my = 0, cx = 0, cy = 0;
    addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; d.style.transform = `translate3d(${mx}px, ${my}px, 0)`; document.body.classList.add('has-cursor'); });
    document.addEventListener('mouseleave', () => document.body.classList.remove('has-cursor'));
    let running = false;
    const loop = () => {
      cx += (mx - cx) * .2; cy += (my - cy) * .2;
      c.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      if (Math.abs(mx - cx) + Math.abs(my - cy) > .3) requestAnimationFrame(loop); else running = false;
    };
    addEventListener('mousemove', () => { if (!running) { running = true; requestAnimationFrame(loop); } }, { passive: true });
    $$('a, button, .card, input, textarea').forEach(el => {
      el.addEventListener('mouseenter', () => c.classList.add('big'));
      el.addEventListener('mouseleave', () => c.classList.remove('big'));
    });
  }

  /* ---------- Retour en haut ---------- */
  tp.addEventListener('click', () => goTo(0));

  /* ---------- Onde sur les boutons ---------- */
  if (!reduce) $$('.btn').forEach(b => b.addEventListener('click', (e) => {
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height), rp = document.createElement('span');
    rp.className = 'ripple'; rp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    b.appendChild(rp); setTimeout(() => rp.remove(), 650);
  }));

  /* ---------- Étincelles au clic ---------- */
  if (!reduce) {
    const sc = $('#sparks'), sx = sc.getContext('2d'); let sparks = [], running = false;
    const fit = () => { const dpr = Math.min(devicePixelRatio || 1, 2); sc.width = innerWidth * dpr; sc.height = innerHeight * dpr; sx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    fit(); addEventListener('resize', fit);
    const run = () => {
      sx.clearRect(0, 0, innerWidth, innerHeight);
      sparks = sparks.filter(p => p.life > 0);
      for (const p of sparks) {
        p.x += p.vx; p.y += p.vy; p.vy += .12; p.vx *= .98; p.life -= 1;
        sx.globalAlpha = Math.max(0, p.life / 50); sx.fillStyle = p.c;
        sx.beginPath(); sx.arc(p.x, p.y, p.r, 0, 7); sx.fill();
      }
      sx.globalAlpha = 1;
      if (sparks.length) requestAnimationFrame(run); else running = false;
    };
    addEventListener('click', (e) => {
      const cols = [css('--accent'), css('--accent-2')];
      for (let i = 0; i < 18; i++) { const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 4; sparks.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5, r: 1.5 + Math.random() * 2.5, life: 35 + Math.random() * 20, c: cols[i % 2] }); }
      if (!running) { running = true; requestAnimationFrame(run); }
    });
  }

  /* ---------- Copier l'e-mail ---------- */
  $('#copyBtn').addEventListener('click', () => {
    const txt = $('#mail').textContent;
    const fallback = () => { const s = getSelection(), r = document.createRange(); r.selectNodeContents($('#mail')); s.removeAllRanges(); s.addRange(r); toast('Adresse sélectionnée, fais Ctrl+C'); };
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => toast('Adresse copiée'), fallback); else fallback();
  });

  /* ---------- Formulaire ---------- */
  $('#form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#f-name').value.trim(), mail = $('#f-email').value.trim(), msg = $('#f-msg').value.trim(), err = $('#err');
    if (!name || !mail || !msg) { err.textContent = 'Remplis les trois champs pour envoyer ton message.'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) { err.textContent = 'Cette adresse e-mail ne semble pas valide.'; return; }
    err.textContent = '';
    e.target.reset();
    toast(`Merci ${name} ! (démo : branche un service comme Formspree pour recevoir les messages)`);
  });


  /* =====================================================================
     HYPER MOTION : animations pilotées par le défilement (GSAP + ScrollTrigger)
     ===================================================================== */
  const motion = { vel: 0 };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  (function hyperMotion() {
    if (reduce || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) lenis.on('scroll', (l) => { motion.vel = l.velocity || 0; ScrollTrigger.update(); });
    else ScrollTrigger.create({ onUpdate: (s) => { motion.vel = s.getVelocity() / 60; } });
    gsap.ticker.add(() => { if (!lenis) motion.vel *= .9; });

    // 1. Le nom explose quand on quitte le haut de page
    const hero = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6 };
    const lines = $$('.hero h1 .line');
    gsap.to(lines[0], { scrollTrigger: hero, xPercent: -28, rotate: -5, opacity: .1, ease: 'none' });
    gsap.to(lines[1], { scrollTrigger: hero, xPercent: 34, rotate: 4, opacity: .1, ease: 'none' });
    gsap.to(['.hero .eyebrow', '.typed', '.hero-cta', '.scroll-hint'], { scrollTrigger: hero, y: (i) => -60 - i * 40, opacity: 0, ease: 'none', stagger: .05 });
    gsap.to('.badge', { scrollTrigger: hero, scale: 2.2, rotate: 160, opacity: 0, ease: 'none' });
    gsap.to('#net', { scrollTrigger: hero, scale: 1.35, opacity: .2, ease: 'none' });
    gsap.to('.blob.b1', { scrollTrigger: hero, yPercent: 60, ease: 'none' });
    gsap.to('.blob.b2', { scrollTrigger: hero, yPercent: -80, xPercent: 40, ease: 'none' });

    // 2. Les mots du « À propos » s'allument au fil du défilement
    const words = [];
    $$('.about > div:first-child p').forEach(p => {
      const walk = (node) => [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(w => {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
            const s = document.createElement('span'); s.className = 'fw'; s.textContent = w; frag.appendChild(s); words.push(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'STRONG') walk(n);
        else if (n.nodeType === 1) words.push(n);
      });
      walk(p);
    });
    let litN = 0;
    ScrollTrigger.create({
      trigger: '.about', start: 'top 80%', end: 'bottom 45%', scrub: true,
      onUpdate: (s) => {
        const n = Math.round(s.progress * words.length);
        if (n === litN) return;
        for (let i = Math.min(n, litN); i < Math.max(n, litN); i++) words[i].classList.toggle('lit', i < n);
        litN = n;
      }
    });

    // 3. Les grandes lignes de texte glissent en sens inverse
    gsap.fromTo('.k1', { xPercent: 0 }, { xPercent: -35, ease: 'none', scrollTrigger: { trigger: '.kinetic', start: 'top bottom', end: 'bottom top', scrub: .4 } });
    gsap.fromTo('.k2', { xPercent: -30 }, { xPercent: 5, ease: 'none', scrollTrigger: { trigger: '.kinetic', start: 'top bottom', end: 'bottom top', scrub: .4 } });

    // 4. Inclinaison selon la vitesse de défilement
    $$('.sec-head h2').forEach(h => h.classList.add('skewable'));
    const skewTargets = [...$$('.sec-head h2'), ...$$('.krow')];
    const skewers = skewTargets.map(el => gsap.quickTo(el, 'skewX', { duration: .5, ease: 'power3' }));
    const track = $('.marquee .track');
    let mx = 0, dirM = -1;
    if (track) track.style.animation = 'none';
    let half = track ? track.scrollWidth / 2 : 0, lastSk = 0, mqOn = true;
    addEventListener('resize', () => { if (track) half = track.scrollWidth / 2; });
    if (track) new IntersectionObserver(([e]) => { mqOn = e.isIntersecting; }).observe(track);
    gsap.ticker.add((time, delta) => {
      const v = clamp(motion.vel, -80, 80);
      const sk = Math.round(clamp(-v * .35, -14, 14) * 10) / 10;
      if (sk !== lastSk) { skewers.forEach(q => q(sk)); lastSk = sk; }
      if (track && mqOn) {
        if (Math.abs(v) > .5) dirM = v > 0 ? -1 : 1;
        mx += dirM * (0.6 + Math.abs(v) * .25) * (delta / 16.7);
        if (mx <= -half) mx += half; if (mx > 0) mx -= half;
        track.style.transform = `translate3d(${mx}px,0,0) skewX(${sk * .6}deg)`;
      }
    });

    // 5. Le Lab 3D s'ouvre comme un écran qui s'allume
    gsap.fromTo('.lab', { scale: .9, y: 40 }, { scale: 1, y: 0, ease: 'none', scrollTrigger: { trigger: '.lab', start: 'top 95%', end: 'top 35%', scrub: .5 } });
    $$('.viewer-card, .step').forEach(el => { el.classList.remove('reveal'); el.style.transitionDelay = ''; });
    $$('.viewer-card').forEach((c, i) => gsap.fromTo(c, { rotateX: 18, y: 60, transformPerspective: 900 }, { rotateX: 0, y: 0, ease: 'none', scrollTrigger: { trigger: c, start: 'top bottom', end: 'top 60%', scrub: .6 } }));

    // 6. Projets : défilement horizontal épinglé (grand écran)
    const mm = gsap.matchMedia();
    mm.add('(min-width: 960px)', () => {
      const sec = $('#projets'), grid = $('#projects'), bar = $('#hbar');
      sec.classList.add('hscroll');
      const dist = () => Math.max(0, grid.scrollWidth - grid.parentElement.clientWidth);
      const tw = gsap.to(grid, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top 64px', end: () => '+=' + dist(), pin: true, scrub: .6, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (s) => { bar.style.transform = `scaleX(${s.progress})`; } }
      });
      $$('#projects .card').forEach(c => gsap.fromTo($('.thumb canvas', c), { xPercent: -6, scale: 1.12 }, { xPercent: 6, scale: 1.12, ease: 'none', scrollTrigger: { trigger: c, containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } }));
      requestAnimationFrame(drawThumbs);
      return () => { sec.classList.remove('hscroll'); gsap.set(grid, { clearProps: 'x' }); requestAnimationFrame(drawThumbs); };
    });
    $$('.chip').forEach(ch => ch.addEventListener('click', () => setTimeout(() => ScrollTrigger.refresh(), 50)));

    // 7. Frise et contact
    $$('.step').forEach((s, i) => gsap.fromTo(s, { x: i % 2 ? 80 : -80, rotate: i % 2 ? 2 : -2 }, { x: 0, rotate: 0, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'top 65%', scrub: .6 } }));
    gsap.fromTo('#contact .big', { yPercent: 45, scale: .86, rotate: -3 }, { yPercent: 0, scale: 1, rotate: 0, ease: 'none', scrollTrigger: { trigger: '#contact', start: 'top bottom', end: 'top 40%', scrub: .6 } });
    gsap.fromTo('#contact .big em', { letterSpacing: '.25em' }, { letterSpacing: '-.02em', ease: 'none', scrollTrigger: { trigger: '#contact', start: 'top 90%', end: 'top 40%', scrub: .6 } });
    gsap.fromTo('.stats .stat', { y: (i) => 40 + i * 25 }, { y: 0, ease: 'none', stagger: .05, scrollTrigger: { trigger: '.stats', start: 'top bottom', end: 'top 55%', scrub: .6 } });

    addEventListener('load', () => ScrollTrigger.refresh());
  })();

  /* Outils partagés avec js/lab3d.js */
  window.portfolio = { $, $$, reduce, motion, clamp, get lenis() { return lenis; } };
})();
