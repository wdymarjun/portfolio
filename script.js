// ==========================================================================
// ARJUN SINGH — PORTFOLIO ENGINE
// One rAF loop drives every scroll-linked effect:
//   hero field + parallax · word-mask reveals · scroll-scrubbed lead text ·
//   velocity-reactive ticker · stacked project cards · image parallax ·
//   footer wordmark · counters · nav scrollspy · lightbox
// Vanilla JS, no dependencies. Respects prefers-reduced-motion.
// ==========================================================================

(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  const html = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const NAV_H = 56;
  const state = {
    y: 0, lastY: 0, vel: 0, vh: window.innerHeight, vw: window.innerWidth,
    dirty: true, heroActive: true, tickerActive: true, canStack: false, ready: false,
  };

  // ------------------------------------------------------------------------
  // 1. TEXT SPLITTING (word-mask reveals + scroll-scrubbed lead)
  // ------------------------------------------------------------------------
  function splitWords() {
    $$('[data-split]').forEach((el) => {
      const words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      words.forEach((word, i) => {
        const outer = document.createElement('span');
        outer.className = 'w';
        const inner = document.createElement('span');
        inner.className = 'wi';
        inner.style.setProperty('--i', i);
        inner.textContent = word;
        outer.appendChild(inner);
        el.appendChild(outer);
        if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      });
    });

    const lead = $('#aboutLead');
    if (lead) {
      const words = lead.textContent.trim().split(/\s+/);
      lead.textContent = '';
      words.forEach((word, i) => {
        const s = document.createElement('span');
        s.className = 'sw';
        s.textContent = word;
        lead.appendChild(s);
        if (i < words.length - 1) lead.appendChild(document.createTextNode(' '));
      });
    }
  }

  // ------------------------------------------------------------------------
  // 2. REVEALS + COUNTERS (start only after the intro is done)
  // ------------------------------------------------------------------------
  const counters = $$('[data-count]');
  counters.forEach((c) => {
    c.dataset.target = c.getAttribute('data-count');
    if (!reduceMotion) c.textContent = '0';
  });

  function runCounter(el) {
    const target = parseFloat(el.dataset.target);
    if (reduceMotion || Number.isNaN(target)) { el.textContent = el.dataset.target; return; }
    const dur = 1700;
    const t0 = performance.now();
    const step = (now) => {
      const p = clamp((now - t0) / dur);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p); // easeOutExpo
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function initReveals() {
    const targets = $$('[data-reveal], [data-split], .project, .cta-stage');
    const show = (el) => {
      el.classList.add('in');
      if (el.matches('.cell-metric')) $$('[data-count]', el).forEach(runCounter);
    };

    if (!('IntersectionObserver' in window) || reduceMotion) {
      targets.forEach(show);
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        show(entry.target);
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    targets.forEach((el) => io.observe(el));
  }

  // ------------------------------------------------------------------------
  // 3. HERO FIELD (monochrome square-dot canvas, pointer + scroll reactive)
  // ------------------------------------------------------------------------
  const field = (() => {
    const cv = $('#heroCanvas');
    if (!cv || !cv.getContext) return { draw() {}, resize() {} };
    const ctx = cv.getContext('2d');
    const SP = 26;
    let W = 0, H = 0, cols = 0, rows = 0;
    const m = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

    function resize() {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / SP) + 1; rows = Math.ceil(H / SP) + 1;
      draw(performance.now());
    }

    function draw(now) {
      if (!W) return;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      m.x += (m.tx - m.x) * 0.12;
      m.y += (m.ty - m.y) * 0.12;
      const t = reduceMotion ? 0 : now * 0.001;
      const sp = state.y * 0.004;
      const inv2s2 = 1 / (2 * 140 * 140);

      for (let i = 0; i < cols; i++) {
        const x = i * SP + SP / 2;
        const fx = 0.32 + 0.68 * (x / W);
        for (let j = 0; j < rows; j++) {
          const y = j * SP + SP / 2;
          let v = Math.sin(x * 0.011 + t * 0.9) + Math.sin(y * 0.015 - t * 0.7 + sp) + Math.sin((x + y) * 0.007 + t * 0.5);
          v = (v + 3) / 6; v *= v;
          const dx = x - m.x, dy = y - m.y;
          const inf = Math.exp(-(dx * dx + dy * dy) * inv2s2);
          const k = Math.min(1, v * 0.9 + inf * 1.0);
          const s = 1.4 + k * 3.8;
          ctx.globalAlpha = (0.14 + k * 0.78) * fx;
          ctx.fillRect(x - s / 2, y - s / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;
    }

    if (finePointer) {
      window.addEventListener('pointermove', (e) => {
        if (!state.heroActive) return;
        const r = cv.getBoundingClientRect();
        m.tx = e.clientX - r.left; m.ty = e.clientY - r.top;
      }, { passive: true });
    }
    return { draw, resize };
  })();


  // Profile card: subtle 3D tilt toward the pointer
  const cardStage = $('#idcardStage');
  if (cardStage && finePointer && !reduceMotion) {
    window.addEventListener('pointermove', (e) => {
      if (!state.heroActive) return;
      const r = cardStage.getBoundingClientRect();
      const px = clamp((e.clientX - (r.left + r.width / 2)) / (state.vw / 2), -1, 1);
      const py = clamp((e.clientY - (r.top + r.height / 2)) / (state.vh / 2), -1, 1);
      cardStage.style.setProperty('--ry', `${(px * 7).toFixed(2)}deg`);
      cardStage.style.setProperty('--rx', `${(py * -5).toFixed(2)}deg`);
    }, { passive: true });
  }

  // ------------------------------------------------------------------------
  // 4. STACK BANNER (two counter-moving tile rows, constant 24.5 px/s — CSS-driven)
  // ------------------------------------------------------------------------
  const ticker = (() => {
    const wrap = $('#ticker');
    const SPEED = 24.5; // px per second, measured from the reference
    if (!wrap) return { step() {}, rebuild() {} };
    function rebuild() {
      $$('.st-row', wrap).forEach((row) => {
        const track = $('.st-track', row);
        const set = track && $('.st-set', track);
        if (!set) return;
        $$('.st-set[data-clone]', track).forEach((n) => n.remove());
        const setW = set.getBoundingClientRect().width;
        if (!setW) return;
        const need = Math.ceil(row.clientWidth / setW) + 1;
        for (let i = 0; i < need; i++) {
          const c = set.cloneNode(true);
          c.setAttribute('data-clone', '');
          c.setAttribute('aria-hidden', 'true');
          track.appendChild(c);
        }
        track.style.setProperty('--st-w', setW + 'px');
        track.style.setProperty('--st-dur', (setW / SPEED).toFixed(2) + 's');
      });
    }
    return { step() {}, rebuild, wrap };
  })();

  // ------------------------------------------------------------------------
  // 5. SCROLL-LINKED UPDATES
  // ------------------------------------------------------------------------
  const progressBar = $('#scrollProgress');
  const nav = $('.nav');
  const hero = $('#hero');
  const heroMain = $('#heroMain');
  const heroCanvas = $('#heroCanvas');
  const lead = $('#aboutLead');
  const leadWords = lead ? $$('.sw', lead) : [];
  const projects = $$('.project');
  const frames = $$('.visual-frame');
  const footer = $('.footer');
  const wordmark = $('#wordmark');

  // Pre-cached geometry to completely eliminate layout thrashing during scroll
  let cardHeights = [];
  let cardStuckTops = [];
  let lastProgs = [];

  function measureCards() {
    if (!projects.length) return;
    const isMobile = state.vw <= 600;
    const navH = isMobile ? 52 : 56;
    const offsetPerCard = isMobile ? 8 : 14;
    const baseOffset = isMobile ? 10 : 20;
    cardHeights = projects.map((p) => p.offsetHeight || 500);
    cardStuckTops = projects.map((_, i) => navH + baseOffset + i * offsetPerCard);
    lastProgs = projects.map(() => -1);
  }

  function updateScroll() {
    const { y, vh } = state;
    const docH = document.documentElement.scrollHeight - vh;

    if (progressBar && docH > 0) progressBar.style.transform = `scaleX(${clamp(y / docH)})`;
    nav && nav.classList.toggle('is-scrolled', y > 24);

    // Hero parallax + fade
    if (hero && state.heroActive && !reduceMotion) {
      const p = clamp(y / (hero.offsetHeight * 0.85));
      heroMain.style.transform = `translate3d(0, ${(p * 70).toFixed(1)}px, 0)`;
      heroMain.style.opacity = (1 - p * 1.15).toFixed(3);
      heroCanvas.style.transform = `translate3d(0, ${(y * 0.28).toFixed(1)}px, 0)`;
    }

    // Scroll-scrubbed lead paragraph
    if (leadWords.length) {
      const r = lead.getBoundingClientRect();
      if (r.bottom > -100 && r.top < vh + 100) {
        const start = vh * 0.88, end = vh * 0.42;
        const p = clamp((start - r.top) / (start - end + r.height));
        const n = leadWords.length;
        for (let i = 0; i < n; i++) {
          const a = clamp(p * (n + 4) - i);
          leadWords[i].style.opacity = reduceMotion ? 1 : (0.16 + a * 0.84).toFixed(3);
        }
      }
    }

    // Image parallax inside frames (desktop / fine pointer only to save mobile GPU)
    if (!reduceMotion && finePointer) {
      frames.forEach((f) => {
        const r = f.getBoundingClientRect();
        if (r.bottom < -50 || r.top > vh + 50) return;
        const c = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
        f.firstElementChild.style.setProperty('--py', `${(c * -r.height * 0.05).toFixed(1)}px`);
      });
    }

    // Stacked project cards: batch-read all rects first, calculate, then batch-write changed values (zero layout reflows)
    if (state.canStack && projects.length > 1) {
      if (!cardHeights.length || cardHeights.length !== projects.length) {
        measureCards();
      }

      const numActive = projects.length - 1;
      // Step 1: Pure batch READ of next project card tops (1 single layout pass)
      const nextTops = new Array(numActive);
      for (let i = 0; i < numActive; i++) {
        nextTops[i] = projects[i + 1].getBoundingClientRect().top;
      }

      // Step 2: Pure batch WRITE with dirty-check to avoid redundant DOM mutations
      for (let i = 0; i < numActive; i++) {
        const box = projects[i].firstElementChild;
        if (!box) continue;

        const stuckTop = cardStuckTops[i];
        const nextStuckTop = cardStuckTops[i + 1];
        const h = cardHeights[i];
        const coverDistance = Math.max((stuckTop + h) - nextStuckTop, 1);
        const distanceCovered = (stuckTop + h) - nextTops[i];
        const rawProg = clamp(distanceCovered / coverDistance);
        const prog = Math.round(rawProg * 1000) / 1000;

        // Skip DOM write if progress hasn't changed meaningfully
        if (Math.abs(prog - lastProgs[i]) < 0.002) continue;
        lastProgs[i] = prog;

        if (prog > 0) {
          box.style.setProperty('--s', (1 - prog * 0.10).toFixed(3));
          box.style.setProperty('--dim', (prog * 0.85).toFixed(3));
          box.style.setProperty('--blur', prog.toFixed(3));
        } else {
          box.style.removeProperty('--s');
          box.style.removeProperty('--dim');
          box.style.removeProperty('--blur');
        }
      }
    }

    // Footer wordmark rises into place
    if (footer && wordmark) {
      const r = footer.getBoundingClientRect();
      const p = clamp((vh - r.top) / r.height);
      wordmark.style.setProperty('--wy', reduceMotion ? '0%' : `${((1 - p) * 42).toFixed(1)}%`);
      wordmark.style.setProperty('--wo', reduceMotion ? '1' : (0.12 + p * 0.88).toFixed(3));
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(now - (frame.last || now), 64);
    frame.last = now;

    state.y = window.scrollY || document.documentElement.scrollTop;
    state.vel = lerp(state.vel, state.y - state.lastY, 0.25);
    if (Math.abs(state.vel) < 0.05) state.vel = 0;
    const moved = state.y !== state.lastY;
    state.lastY = state.y;

    if (state.dirty || moved) { updateScroll(); state.dirty = false; }
    if (state.heroActive && state.ready) field.draw(now);
    if (state.tickerActive && state.ready) ticker.step(dt);
  }

  function updateLayoutFlags() {
    state.vh = window.innerHeight; state.vw = window.innerWidth;
    state.canStack = true;
    html.classList.add('can-stack');
    measureCards();
    state.dirty = true;
  }

  // ------------------------------------------------------------------------
  // 6. NAVIGATION, SCROLLSPY, MOBILE SECTION MENU
  // ------------------------------------------------------------------------
  const sectionIds = ['hero', 'work', 'awards', 'about', 'contact'];
  const desktopLinks = $$('.nav-link[data-section]');
  const mobileLinks = $$('.mobile-link[data-section]');
  const indicator = $('#navPillIndicator');
  const navBrowser = $('#navBrowser');
  const mobileToggle = $('#navMobileToggle');
  const mobileToggleLabel = mobileToggle && $('.nav-toggle-text', mobileToggle);
  const mobileMenu = $('#mobileSectionMenu');
  const mobileClose = $('#mobileMenuClose');
  const mobileBackdrop = $('#mobileMenuBackdrop');

  const initialHash = location.hash.slice(1);
  let activeSection = sectionIds.includes(initialHash) ? initialHash : 'hero';

  function positionIndicator(link, immediate = false) {
    if (!indicator || !link || !navBrowser || state.vw <= 880) return;
    const l = link.getBoundingClientRect(), b = navBrowser.getBoundingClientRect();
    indicator.style.transition = immediate || reduceMotion
      ? 'none'
      : 'transform 0.5s cubic-bezier(0.16,1,0.3,1), width 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.3s';
    indicator.style.transform = `translateX(${l.left - b.left}px)`;
    indicator.style.width = `${l.width}px`;
    indicator.style.opacity = '1';
  }

  function updateToggleLabel(isOpen = false) {
    if (!mobileToggle) return;
    const link = mobileLinks.find((l) => l.dataset.section === activeSection);
    const title = (link && $('.mobile-title', link).textContent.trim()) || 'Home';
    const idx = String(Math.max(1, sectionIds.indexOf(activeSection) + 1)).padStart(2, '0');
    if (mobileToggleLabel) mobileToggleLabel.textContent = `${idx} / ${title}`;
    mobileToggle.setAttribute('aria-label', `${isOpen ? 'Close' : 'Open'} section browser, current section ${title}`);
  }

  function setActive(id, moveIndicator = true) {
    if (!id) return;
    activeSection = id;
    let activeLink = null;
    [...desktopLinks, ...mobileLinks].forEach((l) => {
      const on = l.dataset.section === id;
      l.classList.toggle('active', on);
      if (on) { l.setAttribute('aria-current', 'location'); if (desktopLinks.includes(l)) activeLink = l; }
      else l.removeAttribute('aria-current');
    });
    if (moveIndicator && activeLink) positionIndicator(activeLink);
    updateToggleLabel(mobileMenu && mobileMenu.classList.contains('active'));
  }

  let prevOverflow = '';
  function openMobileMenu() {
    if (!mobileMenu || !mobileToggle) return;
    prevOverflow = document.body.style.overflow;
    mobileMenu.classList.add('active');
    mobileMenu.setAttribute('aria-hidden', 'false');
    mobileMenu.inert = false;
    mobileToggle.setAttribute('aria-expanded', 'true');
    updateToggleLabel(true);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => mobileClose && mobileClose.focus({ preventScroll: true }));
  }
  function closeMobileMenu({ restoreFocus = true } = {}) {
    if (!mobileMenu || !mobileMenu.classList.contains('active')) return;
    mobileMenu.classList.remove('active');
    mobileMenu.setAttribute('aria-hidden', 'true');
    mobileMenu.inert = true;
    mobileToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = prevOverflow;
    updateToggleLabel(false);
    if (restoreFocus) mobileToggle.focus({ preventScroll: true });
  }

  function jumpTo(e, link) {
    e.preventDefault();
    const id = link.dataset.section;
    const target = document.getElementById(id);
    if (!target) return;
    setActive(id);
    closeMobileMenu({ restoreFocus: false });
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    if (history.pushState && location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
  }
  [...desktopLinks, ...mobileLinks].forEach((l) => l.addEventListener('click', (e) => jumpTo(e, l)));

  mobileToggle && mobileToggle.addEventListener('click', () => {
    mobileMenu.classList.contains('active') ? closeMobileMenu() : openMobileMenu();
  });
  mobileClose && mobileClose.addEventListener('click', () => closeMobileMenu());
  mobileBackdrop && mobileBackdrop.addEventListener('click', () => closeMobileMenu());

  navBrowser && navBrowser.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = desktopLinks.indexOf(document.activeElement);
    if (i === -1) return;
    e.preventDefault();
    const n = e.key === 'ArrowRight' ? (i + 1) % desktopLinks.length : (i - 1 + desktopLinks.length) % desktopLinks.length;
    desktopLinks[n].focus();
  });

  window.addEventListener('popstate', () => {
    const id = sectionIds.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'hero';
    setActive(id);
    requestAnimationFrame(() => {
      const t = document.getElementById(id);
      t && t.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });

  setActive(activeSection, false);

  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: '-18% 0px -55% 0px', threshold: 0 });
    sectionIds.map((id) => document.getElementById(id)).filter(Boolean).forEach((s) => spy.observe(s));

    // Visibility flags for the hero field and ticker (skip work when off-screen)
    const vis = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.target === hero) state.heroActive = en.isIntersecting;
        if (en.target === $('#ticker')) { state.tickerActive = en.isIntersecting; en.target.classList.toggle('is-off', !en.isIntersecting); }
      });
    }, { threshold: 0 });
    hero && vis.observe(hero);
    $('#ticker') && vis.observe($('#ticker'));
  }

  window.addEventListener('scroll', () => {
    state.dirty = true;
    const y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight - 20;
    if (y < 120 && activeSection !== 'hero') setActive('hero');
    else if (y >= max && activeSection !== 'contact') setActive('contact');
  }, { passive: true });

  let resizeTimer;
  window.addEventListener('resize', () => {
    updateLayoutFlags();
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      field.resize();
      ticker.rebuild();
      if (state.vw > 880) {
        if (mobileMenu && mobileMenu.classList.contains('active')) closeMobileMenu({ restoreFocus: false });
        positionIndicator(desktopLinks.find((l) => l.dataset.section === activeSection), true);
      } else if (indicator) indicator.style.opacity = '0';
    }, 120);
  }, { passive: true });

  // ------------------------------------------------------------------------
  // 7. COPY EMAIL
  // ------------------------------------------------------------------------
  const copyBtn = $('#copyEmailBtn');
  const copyText = $('#copyEmailText');
  if (copyBtn) {
    const EMAIL = 'mail6arjun478@gmail.com';
    copyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const done = () => {
        if (!copyText) return;
        copyText.textContent = 'Email Copied ✓';
        setTimeout(() => { copyText.textContent = 'Copy Email Address'; }, 2400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(EMAIL).then(done).catch(() => { window.location.href = `mailto:${EMAIL}`; });
      } else {
        window.location.href = `mailto:${EMAIL}`;
      }
    });
  }

  // ------------------------------------------------------------------------
  // 8. LIGHTBOX (focus-managed, keyboard + pointer-pan zoom)
  // ------------------------------------------------------------------------
  const modal = $('#imageModal');
  const modalBox = $('#modalChassis');
  const mImg = $('#modalImage');
  const mFrame = $('#modalImageFrame');
  const mTitle = $('#modalTitle');
  const mSub = $('#modalSubtitle');
  const mDesc = $('#modalDesc');
  const mSpecs = $('#modalSpecs');
  const mIndex = $('#modalIndexPill');
  const mRepo = $('#modalRepoBtn');
  const mClose = $('#modalCloseBtn');
  const mPrev = $('#modalPrevBtn');
  const mNext = $('#modalNextBtn');
  const mNext2 = $('#modalFooterNextBtn');
  const mZoom = $('#modalZoomBtn');
  const zoomBadge = $('#zoomBadge');

  const triggers = $$('[data-modal-img]');
  const projectsData = triggers.map((t, idx) => {
    let specs = [];
    try { specs = JSON.parse(t.getAttribute('data-modal-specs') || '[]'); } catch (_) { /* ignore */ }
    return {
      index: idx,
      img: t.getAttribute('data-modal-img'),
      title: t.getAttribute('data-modal-title'),
      subtitle: t.getAttribute('data-modal-subtitle'),
      desc: t.getAttribute('data-modal-desc'),
      repo: t.getAttribute('data-modal-repo') || 'https://github.com/wdymarjun',
      specs,
    };
  });

  let current = 0, zoomed = false, lastFocus = null;

  function setZoom(on) {
    zoomed = on;
    mFrame.classList.toggle('zoomed', on);
    mZoom.classList.toggle('on', on);
    zoomBadge.textContent = on ? 'Click to Reset' : 'Click to Zoom';
  }

  function renderModal(idx) {
    const d = projectsData[idx];
    if (!d) return;
    current = idx;
    if (zoomed) setZoom(false);
    mIndex.textContent = `SYSTEM_SPEC // ${String(idx + 1).padStart(2, '0')} OF ${String(projectsData.length).padStart(2, '0')}`;
    mImg.src = d.img; mImg.alt = d.title;
    mTitle.textContent = d.title; mSub.textContent = d.subtitle; mDesc.textContent = d.desc;
    mRepo.href = d.repo;
    mSpecs.replaceChildren(...d.specs.map((s) => {
      const cell = document.createElement('div'); cell.className = 'spec';
      const k = document.createElement('span'); k.className = 'spec-label'; k.textContent = s.label;
      const v = document.createElement('span'); v.className = 'spec-val'; v.textContent = s.val;
      cell.append(k, v);
      return cell;
    }));
  }

  function openModal(idx, opener) {
    lastFocus = opener || document.activeElement;
    renderModal(idx);
    document.body.classList.add('modal-open');
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    // wait a beat: the panel is still visibility:hidden on the first frame
    setTimeout(() => mClose.focus({ preventScroll: true }), 90);
  }
  function closeModal() {
    if (zoomed) setZoom(false);
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
  }
  const step = (d) => renderModal((current + d + projectsData.length) % projectsData.length);

  triggers.forEach((t, idx) => {
    t.addEventListener('click', (e) => { e.preventDefault(); openModal(idx, t); });
    t.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(idx, t); }
    });
  });
  mNext.addEventListener('click', () => step(1));
  mNext2.addEventListener('click', () => step(1));
  mPrev.addEventListener('click', () => step(-1));
  mClose.addEventListener('click', closeModal);
  mZoom.addEventListener('click', () => setZoom(!zoomed));
  mFrame.addEventListener('click', () => setZoom(!zoomed));
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  mFrame.addEventListener('pointermove', (e) => {
    if (!zoomed) return;
    const r = mFrame.getBoundingClientRect();
    mFrame.style.setProperty('--zx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    mFrame.style.setProperty('--zy', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
  }, { passive: true });

  // Touch swipe support for mobile and tablet modal browsing
  let touchStartX = 0, touchStartY = 0;
  mFrame.addEventListener('touchstart', (e) => {
    if (zoomed || e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  mFrame.addEventListener('touchend', (e) => {
    if (zoomed || !touchStartX || e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    touchStartX = 0; touchStartY = 0;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      step(dx < 0 ? 1 : -1);
    }
  }, { passive: true });

  window.addEventListener('keydown', (e) => {
    if (modal.classList.contains('active')) {
      if (e.key === 'Escape') closeModal();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'z' || e.key === 'Z') setZoom(!zoomed);
      else if (e.key === 'Tab') { // keep focus inside the dialog
        const f = $$('a[href], button:not([disabled])', modalBox).filter((n) => n.getClientRects().length);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      return;
    }
    if (mobileMenu && mobileMenu.classList.contains('active')) {
      if (e.key === 'Escape') { e.preventDefault(); closeMobileMenu(); return; }
      if (e.key === 'Tab') {
        const f = $$('a[href], button:not([disabled])', mobileMenu).filter((n) => n.getClientRects().length);
        const first = f[0], last = f[f.length - 1];
        if (!first || !last) { e.preventDefault(); return; }
        if (e.shiftKey && (document.activeElement === first || !mobileMenu.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (document.activeElement === last || !mobileMenu.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
      }
    }
  });

  // Multi-angle gallery switchers inside project cards
  function setupGallery(stripId, wrapId, imgId) {
    const strip = $(`#${stripId}`), wrap = $(`#${wrapId}`), img = $(`#${imgId}`);
    if (!strip || !wrap || !img) return;
    const thumbs = $$('.thumb', strip);
    thumbs.forEach((th) => th.addEventListener('click', () => {
      thumbs.forEach((t) => t.classList.toggle('active', t === th));
      const src = th.dataset.img, title = th.dataset.title, desc = th.dataset.desc;
      img.style.opacity = '0.2';
      setTimeout(() => { img.src = src; img.alt = title || img.alt; img.style.opacity = '1'; }, 160);
      wrap.setAttribute('data-modal-img', src);
      wrap.setAttribute('data-modal-title', title);
      wrap.setAttribute('data-modal-desc', desc);
      const i = triggers.indexOf(wrap);
      if (i !== -1) Object.assign(projectsData[i], { img: src, title, desc });
    }));
  }
  setupGallery('ascGalleryStrip', 'ascMediaMain', 'ascMainImg');
  setupGallery('inboxGalleryStrip', 'inboxQuestBentoMedia', 'inboxQuestBentoImg');

  // ------------------------------------------------------------------------
  // 9. BOOT: intro (once per session) → start site
  // ------------------------------------------------------------------------
  function startSite() {
    if (state.ready) return;
    state.ready = true;
    html.classList.add('ready');
    initReveals();
    measureCards();
    field.resize();
    ticker.rebuild();
    positionIndicator(desktopLinks.find((l) => l.dataset.section === activeSection), true);
    state.dirty = true;
  }
  window.addEventListener('load', measureCards, { once: true });

  // Wordmark & Logo Interactive Glow (Touch & Pointer)
  if (wordmark) {
    let wordmarkTimer = null;
    const triggerWordmarkGlow = () => {
      wordmark.classList.add('is-glowing');
      clearTimeout(wordmarkTimer);
      wordmarkTimer = setTimeout(() => {
        wordmark.classList.remove('is-glowing');
      }, 1600);
    };
    wordmark.addEventListener('touchstart', triggerWordmarkGlow, { passive: true });
    wordmark.addEventListener('pointerenter', () => wordmark.classList.add('is-glowing'));
    wordmark.addEventListener('pointerleave', () => wordmark.classList.remove('is-glowing'));
    wordmark.addEventListener('click', triggerWordmarkGlow);
  }

  $$('.footer-logo-link').forEach((link) => {
    let linkTimer = null;
    const triggerLogoGlow = () => {
      link.classList.add('is-touched');
      clearTimeout(linkTimer);
      linkTimer = setTimeout(() => {
        link.classList.remove('is-touched');
      }, 900);
    };
    link.addEventListener('touchstart', triggerLogoGlow, { passive: true });
  });

  splitWords();
  updateLayoutFlags();
  requestAnimationFrame(frame);

  const overlay = $('#introVideoOverlay');
  const video = $('#introVideo');
  const skip = $('#introSkip');

  if (overlay && video && html.classList.contains('intro-on')) {
    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      try { sessionStorage.setItem('introSeen', '1'); } catch (_) { /* ignore */ }
      overlay.classList.add('fading-out');
      html.classList.remove('intro-on');
      setTimeout(() => { try { video.pause(); } catch (_) { /* ignore */ } overlay.style.display = 'none'; }, 720);
      setTimeout(startSite, 280);
    };
    video.addEventListener('ended', dismiss);
    overlay.addEventListener('click', dismiss);
    skip && skip.addEventListener('click', (e) => { e.stopPropagation(); dismiss(); });
    window.addEventListener('keydown', (e) => { if (!dismissed && (e.key === 'Escape' || e.key === 'Enter')) dismiss(); });

    // Failsafes: blocked autoplay must never leave a black screen
    let started = false;
    video.addEventListener('playing', () => { started = true; });
    setTimeout(() => { if (!started) dismiss(); }, 3000);
    setTimeout(dismiss, 14000);
    const p = video.play();
    if (p && p.catch) p.catch(dismiss);
  } else {
    if (overlay) overlay.style.display = 'none';
    startSite();
  }
})();
