// ==========================================================================
// ARJUN SINGH — EXECUTIVE TECHNICAL PORTFOLIO INTERACTION ENGINE
// Accessible Section Browser, Coordinated Scroll Reveals, Titanium Parallax & Modal
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --------------------------------------------------------------------------
  // 1. TOP PROGRESS BAR & PARALLAX ENGINE (SCROLLING DOWN & UP - 60FPS RAF)
  // --------------------------------------------------------------------------
  const progressBar = document.getElementById('scrollProgress');
  const ambientGlow = document.querySelector('.ambient-glow');
  const appleNav = document.querySelector('.apple-nav');

  let scrollRafId = null;
  const onScrollFrame = () => {
    if (scrollRafId) return;
    scrollRafId = requestAnimationFrame(() => {
      scrollRafId = null;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

      // Scale the indicator without triggering layout.
      if (progressBar && docHeight > 0) {
        const progress = Math.min(100, Math.max(0, (scrollY / docHeight) * 100));
        progressBar.style.transform = `scaleX(${progress / 100})`;
      }

      // Parallax spatial depth on ambient glow (disabled on mobile or reduced-motion)
      if (ambientGlow && window.innerWidth > 768 && !prefersReducedMotion) {
        ambientGlow.style.transform = `translateX(-50%) translateY(${scrollY * 0.1}px)`;
      }

      // Navbar elevation styling on scroll
      appleNav?.classList.toggle('is-scrolled', scrollY > 25);
    });
  };

  window.addEventListener('scroll', onScrollFrame, { passive: true });
  window.addEventListener('resize', onScrollFrame, { passive: true });
  onScrollFrame();

  // --------------------------------------------------------------------------
  // 2. ACCESSIBLE SECTION BROWSER & SCROLLSPY ENGINE
  // (Home, Work, Podium, About, Contact)
  // --------------------------------------------------------------------------
  const sectionIds = ['hero', 'work', 'awards', 'about', 'contact'];
  const desktopLinks = Array.from(document.querySelectorAll('.nav-link[data-section]'));
  const mobileLinks = Array.from(document.querySelectorAll('.mobile-nav-link[data-section]'));
  const railDots = Array.from(document.querySelectorAll('.section-rail-dot[data-section]'));
  const pillIndicator = document.getElementById('navPillIndicator');
  const navBrowser = document.getElementById('navBrowser');
  const mobileToggle = document.getElementById('navMobileToggle');
  const mobileToggleLabel = mobileToggle?.querySelector('.nav-toggle-text');
  const mobileMenu = document.getElementById('mobileSectionMenu');
  const mobileClose = document.getElementById('mobileMenuClose');
  const mobileBackdrop = document.getElementById('mobileMenuBackdrop');

  const initialSection = location.hash.slice(1);
  let currentActiveSection = sectionIds.includes(initialSection) ? initialSection : 'hero';
  let previousBodyOverflow = '';

  // Animate the titanium sliding indicator behind desktop nav items
  function positionPill(targetLink, isImmediate = false) {
    if (!pillIndicator || !targetLink || !navBrowser) return;
    const linkRect = targetLink.getBoundingClientRect();
    const browserRect = navBrowser.getBoundingClientRect();

    const left = linkRect.left - browserRect.left;
    const width = linkRect.width;

    if (isImmediate || prefersReducedMotion) {
      pillIndicator.style.transition = 'none';
    } else {
      pillIndicator.style.transition = 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1), width 240ms cubic-bezier(0.16, 1, 0.3, 1), opacity 160ms ease';
    }

    pillIndicator.style.transform = `translateX(${left}px)`;
    pillIndicator.style.width = `${width}px`;
    pillIndicator.style.opacity = '1';
  }

  function updateMobileToggleLabel(isOpen = false) {
    if (!mobileToggle) return;
    const activeLink = mobileLinks.find(link => link.getAttribute('data-section') === currentActiveSection);
    const title = activeLink?.querySelector('.mobile-nav-title')?.textContent.trim() || 'Home';
    const index = Math.max(1, sectionIds.indexOf(currentActiveSection) + 1);
    if (mobileToggleLabel) {
      mobileToggleLabel.textContent = `${String(index).padStart(2, '0')} / ${title}`;
    }
    mobileToggle.setAttribute(
      'aria-label',
      `${isOpen ? 'Close' : 'Open'} section browser, current section ${title}`
    );
  }

  function setActiveSection(sectionId, updatePill = true) {
    if (!sectionId) return;
    currentActiveSection = sectionId;

    // 1. Update Desktop Navigation
    let activeDesktopLink = null;
    desktopLinks.forEach(link => {
      const match = link.getAttribute('data-section') === sectionId;
      link.classList.toggle('active', match);
      if (match) {
        link.setAttribute('aria-current', 'location');
        activeDesktopLink = link;
      } else {
        link.removeAttribute('aria-current');
      }
    });

    if (updatePill && activeDesktopLink && window.innerWidth > 880) {
      positionPill(activeDesktopLink);
    }

    // 2. Update Mobile Menu
    mobileLinks.forEach(link => {
      const match = link.getAttribute('data-section') === sectionId;
      link.classList.toggle('active', match);
      if (match) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    // 3. Update Side Rail
    railDots.forEach(dot => {
      const match = dot.getAttribute('data-section') === sectionId;
      dot.classList.toggle('active', match);
      if (match) {
        dot.setAttribute('aria-current', 'location');
      } else {
        dot.removeAttribute('aria-current');
      }
    });

    updateMobileToggleLabel(mobileMenu?.classList.contains('active'));
  }

  setActiveSection(currentActiveSection, false);

  // Initial pill placement
  const initialActiveLink = desktopLinks.find(l => l.getAttribute('data-section') === currentActiveSection) || desktopLinks[0];
  if (initialActiveLink && window.innerWidth > 880) {
    setTimeout(() => positionPill(initialActiveLink, true), 80);
  }

  window.addEventListener('resize', () => {
    if (window.innerWidth > 880 && mobileMenu?.classList.contains('active')) {
      const shouldMoveFocus = mobileMenu.contains(document.activeElement) || document.activeElement === mobileToggle;
      closeMobileMenu({ restoreFocus: false });
      if (shouldMoveFocus) {
        desktopLinks.find(link => link.getAttribute('data-section') === currentActiveSection)
          ?.focus({ preventScroll: true });
      }
    }

    const activeLink = desktopLinks.find(l => l.getAttribute('data-section') === currentActiveSection);
    if (activeLink && window.innerWidth > 880) {
      positionPill(activeLink, true);
    } else if (pillIndicator && window.innerWidth <= 880) {
      pillIndicator.style.opacity = '0';
    }
  }, { passive: true });

  // Direct section jump handler
  function handleSectionJump(e, link) {
    e.preventDefault();
    const sectionId = link.getAttribute('data-section');
    const target = document.getElementById(sectionId);
    if (!target) return;

    // Immediately update active indicators
    setActiveSection(sectionId, true);

    closeMobileMenu({ restoreFocus: false });

    target.focus({ preventScroll: true });
    target.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start'
    });

    if (history.pushState && location.hash !== `#${sectionId}`) {
      history.pushState(null, '', `#${sectionId}`);
    }
  }

  desktopLinks.forEach(link => {
    link.addEventListener('click', (e) => handleSectionJump(e, link));
  });

  mobileLinks.forEach(link => {
    link.addEventListener('click', (e) => handleSectionJump(e, link));
  });

  railDots.forEach(dot => {
    dot.addEventListener('click', (e) => handleSectionJump(e, dot));
  });

  window.addEventListener('popstate', () => {
    const sectionId = sectionIds.includes(location.hash.slice(1))
      ? location.hash.slice(1)
      : 'hero';
    const target = document.getElementById(sectionId);
    setActiveSection(sectionId);
    requestAnimationFrame(() => {
      target?.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });
    });
  });

  // Keyboard navigation inside section browser (Left / Right arrow keys)
  if (navBrowser) {
    navBrowser.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const currentIndex = desktopLinks.findIndex(l => l === document.activeElement);
        if (currentIndex !== -1) {
          e.preventDefault();
          const nextIndex = e.key === 'ArrowRight'
            ? (currentIndex + 1) % desktopLinks.length
            : (currentIndex - 1 + desktopLinks.length) % desktopLinks.length;
          desktopLinks[nextIndex].focus();
        }
      }
    });
  }

  // IntersectionObserver ScrollSpy
  const observedSections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

  if ('IntersectionObserver' in window) {
    const spyOptions = {
      root: null,
      // Focus on active reading zone (top 20% to mid 65% of screen)
      rootMargin: '-18% 0px -55% 0px',
      threshold: 0
    };

    const spyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          setActiveSection(id, true);
        }
      });
    }, spyOptions);

    observedSections.forEach(sec => spyObserver.observe(sec));

    // Edge check for top and bottom of page
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight - 20;

      if (scrollY < 120 && currentActiveSection !== 'hero') {
        setActiveSection('hero', true);
      } else if (scrollY >= maxScroll && currentActiveSection !== 'contact') {
        setActiveSection('contact', true);
      }
    }, { passive: true });
  }

  // --------------------------------------------------------------------------
  // 3. MOBILE SECTION DRAWER / SHEET CONTROLLER
  // --------------------------------------------------------------------------
  function openMobileMenu() {
    if (!mobileMenu || !mobileToggle) return;
    previousBodyOverflow = document.body.style.overflow;
    mobileMenu.classList.add('active');
    mobileMenu.setAttribute('aria-hidden', 'false');
    mobileMenu.inert = false;
    mobileToggle.setAttribute('aria-expanded', 'true');
    updateMobileToggleLabel(true);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      if (mobileMenu.classList.contains('active')) {
        mobileClose?.focus({ preventScroll: true });
      }
    });
  }

  function closeMobileMenu({ restoreFocus = true } = {}) {
    if (!mobileMenu || !mobileToggle) return;
    if (!mobileMenu.classList.contains('active')) return;
    mobileMenu.classList.remove('active');
    mobileMenu.setAttribute('aria-hidden', 'true');
    mobileMenu.inert = true;
    mobileToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = previousBodyOverflow;
    updateMobileToggleLabel(false);
    if (restoreFocus) {
      mobileToggle.focus({ preventScroll: true });
    }
  }

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = mobileMenu && mobileMenu.classList.contains('active');
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
  }

  if (mobileClose) mobileClose.addEventListener('click', closeMobileMenu);
  if (mobileBackdrop) mobileBackdrop.addEventListener('click', closeMobileMenu);

  // --------------------------------------------------------------------------
  // 4. COORDINATED SCROLL REVEAL ENGINE
  // --------------------------------------------------------------------------
  const scrollElements = document.querySelectorAll(
    '.fade-in-on-scroll, .scroll-reveal, .gemini-work-row, .award-row, .about-text-col, .competencies-box, .contact-section, .footer-top-row, .footer-wordmark'
  );

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.08
    };

    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.classList.add('visible');

          const onSettled = () => {
            el.classList.add('anim-settled');
            el.removeEventListener('transitionend', onSettled);
          };
          el.addEventListener('transitionend', onSettled, { once: true });

          scrollObserver.unobserve(el);
        }
      });
    }, observerOptions);

    scrollElements.forEach(el => scrollObserver.observe(el));
  } else {
    // Immediate reveal for reduced-motion or fallback browsers
    scrollElements.forEach(el => el.classList.add('visible', 'anim-settled'));
  }

  // --------------------------------------------------------------------------
  // 5. COPY EMAIL INTERACTION
  // --------------------------------------------------------------------------
  const copyBtn = document.getElementById('copyEmailBtn');
  const copyText = document.getElementById('copyEmailText');
  if (copyBtn) {
    copyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const email = 'mail6arjun478@gmail.com';
      navigator.clipboard.writeText(email).then(() => {
        if (copyText) copyText.textContent = 'Email Copied to Clipboard ✓';
        setTimeout(() => {
          if (copyText) copyText.textContent = 'Copy Email Address';
        }, 2400);
      }).catch(() => {
        window.location.href = `mailto:${email}`;
      });
    });
  }

  // --------------------------------------------------------------------------
  // 6. HIGH-ENGINEERED APPLE-GRADE LIGHTBOX ENGINE
  // --------------------------------------------------------------------------
  const modalOverlay = document.getElementById('imageModal');
  const modalChassis = document.getElementById('modalChassis');
  const modalImg = document.getElementById('modalImage');
  const modalImageFrame = document.getElementById('modalImageFrame');
  const modalTitle = document.getElementById('modalTitle');
  const modalSubtitle = document.getElementById('modalSubtitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalSpecs = document.getElementById('modalSpecs');
  const modalIndexPill = document.getElementById('modalIndexPill');
  const modalRepoBtn = document.getElementById('modalRepoBtn');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalPrevBtn = document.getElementById('modalPrevBtn');
  const modalNextBtn = document.getElementById('modalNextBtn');
  const modalFooterNextBtn = document.getElementById('modalFooterNextBtn');
  const modalZoomBtn = document.getElementById('modalZoomBtn');
  const zoomBadge = document.getElementById('zoomBadge');

  const triggerElements = Array.from(document.querySelectorAll('[data-modal-img]'));

  // Build project registry
  const projectsData = triggerElements.map((trigger, idx) => {
    let parsedSpecs = [];
    try {
      parsedSpecs = JSON.parse(trigger.getAttribute('data-modal-specs') || '[]');
    } catch (err) { }

    return {
      index: idx,
      img: trigger.getAttribute('data-modal-img'),
      title: trigger.getAttribute('data-modal-title'),
      subtitle: trigger.getAttribute('data-modal-subtitle'),
      desc: trigger.getAttribute('data-modal-desc'),
      repo: trigger.getAttribute('data-modal-repo') || 'https://github.com/wdymarjun',
      specs: parsedSpecs
    };
  });

  let currentProjectIndex = 0;
  let isZoomed = false;

  function renderModalProject(idx) {
    if (!projectsData[idx]) return;
    currentProjectIndex = idx;
    const data = projectsData[idx];

    if (isZoomed) {
      toggleZoom(false);
    }

    if (modalIndexPill) {
      modalIndexPill.textContent = `SYSTEM_SPEC // 0${idx + 1} OF 0${projectsData.length}`;
    }

    if (modalImg) {
      modalImg.src = data.img;
      modalImg.alt = data.title;
    }
    if (modalTitle) modalTitle.textContent = data.title;
    if (modalSubtitle) modalSubtitle.textContent = data.subtitle;
    if (modalDesc) modalDesc.textContent = data.desc;
    if (modalRepoBtn) modalRepoBtn.href = data.repo;

    if (modalSpecs && data.specs) {
      modalSpecs.innerHTML = data.specs.map(item => `
        <div class="modal-spec-item">
          <span class="modal-spec-label">${item.label}</span>
          <span class="modal-spec-val">${item.val}</span>
        </div>
      `).join('');
    }
  }

  function openModal(index = 0) {
    if (!modalOverlay) return;
    renderModalProject(index);

    document.body.classList.add('modal-open');
    modalOverlay.classList.add('active');
    modalOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modalOverlay) return;
    if (isZoomed) toggleZoom(false);
    modalOverlay.classList.remove('active');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
  }

  function nextProject() {
    const nextIdx = (currentProjectIndex + 1) % projectsData.length;
    renderModalProject(nextIdx);
  }

  function prevProject() {
    const prevIdx = (currentProjectIndex - 1 + projectsData.length) % projectsData.length;
    renderModalProject(prevIdx);
  }

  function toggleZoom(forceState) {
    if (!modalImageFrame) return;
    isZoomed = forceState !== undefined ? forceState : !isZoomed;
    if (isZoomed) {
      modalImageFrame.classList.add('zoomed');
      if (zoomBadge) zoomBadge.querySelector('span').textContent = 'Click to Reset';
      if (modalZoomBtn) modalZoomBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    } else {
      modalImageFrame.classList.remove('zoomed');
      if (zoomBadge) zoomBadge.querySelector('span').textContent = 'Click to Zoom';
      if (modalZoomBtn) modalZoomBtn.style.background = '';
    }
  }

  // Trigger bindings
  triggerElements.forEach((trigger, idx) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(idx);
    });
  });

  if (modalNextBtn) modalNextBtn.addEventListener('click', nextProject);
  if (modalPrevBtn) modalPrevBtn.addEventListener('click', prevProject);
  if (modalFooterNextBtn) modalFooterNextBtn.addEventListener('click', nextProject);
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalZoomBtn) modalZoomBtn.addEventListener('click', () => toggleZoom());

  if (modalImageFrame) {
    modalImageFrame.addEventListener('click', () => toggleZoom());
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
  }

  // Keyboard navigation for modal & mobile menu
  window.addEventListener('keydown', (e) => {
    // 1. Lightbox active
    if (modalOverlay && modalOverlay.classList.contains('active')) {
      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'ArrowRight') {
        nextProject();
      } else if (e.key === 'ArrowLeft') {
        prevProject();
      } else if (e.key === 'z' || e.key === 'Z') {
        toggleZoom();
      }
      return;
    }

    // 2. Mobile Section Menu active
    if (mobileMenu && mobileMenu.classList.contains('active')) {
      if (e.key === 'Escape') {
        closeMobileMenu();
        e.preventDefault();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = Array.from(mobileMenu.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter(element => element.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (!first || !last) {
          e.preventDefault();
          mobileClose?.focus({ preventScroll: true });
        } else if (e.shiftKey && (document.activeElement === first || !mobileMenu.contains(document.activeElement))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (document.activeElement === last || !mobileMenu.contains(document.activeElement))) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  });

  // Spotlight tracker on Modal Chassis
  if (modalChassis) {
    modalChassis.addEventListener('mousemove', (e) => {
      const rect = modalChassis.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      modalChassis.style.setProperty('--mouse-x', `${x}px`);
      modalChassis.style.setProperty('--mouse-y', `${y}px`);
    });
  }

  // --------------------------------------------------------------------------
  // 7. RESTRAINED 3D CARD DEPTH & SPOTLIGHT ENGINE (ZERO-LAG RAF)
  // --------------------------------------------------------------------------
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !prefersReducedMotion) {
    const visualCards = document.querySelectorAll('.gemini-visual-card');

    visualCards.forEach(card => {
      let tiltRaf = null;

      card.addEventListener('mousemove', (e) => {
        if (tiltRaf) cancelAnimationFrame(tiltRaf);
        tiltRaf = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          // Normalized mouse offset (-1 to 1)
          const normX = (x / rect.width) * 2 - 1;
          const normY = (y / rect.height) * 2 - 1;

          // Subtle, restrained rotation (max 2.2 degrees)
          const rotX = -normY * 2.2;
          const rotY = normX * 2.2;

          card.style.setProperty('--card-rot-x', `${rotX.toFixed(2)}deg`);
          card.style.setProperty('--card-rot-y', `${rotY.toFixed(2)}deg`);
          card.style.setProperty('--mouse-x', `${x}px`);
          card.style.setProperty('--mouse-y', `${y}px`);
        });
      }, { passive: true });

      card.addEventListener('mouseleave', () => {
        if (tiltRaf) cancelAnimationFrame(tiltRaf);
        card.style.setProperty('--card-rot-x', '0deg');
        card.style.setProperty('--card-rot-y', '0deg');
        card.style.removeProperty('--mouse-x');
        card.style.removeProperty('--mouse-y');
      });
    });
  }

  // --------------------------------------------------------------------------
  // 8. MULTI-ANGLE GALLERY SWITCHERS FOR VISUAL CARDS
  // --------------------------------------------------------------------------
  function setupGallerySwitcher(stripId, mainWrapId, mainImgId) {
    const strip = document.getElementById(stripId);
    const mainWrap = document.getElementById(mainWrapId);
    const mainImg = document.getElementById(mainImgId);
    if (!strip || !mainWrap || !mainImg) return;

    const thumbs = strip.querySelectorAll('.gemini-thumb-pill');
    thumbs.forEach(thumb => {
      thumb.addEventListener('click', (e) => {
        e.stopPropagation();
        thumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');

        const newImg = thumb.getAttribute('data-img');
        const newTitle = thumb.getAttribute('data-title');
        const newDesc = thumb.getAttribute('data-desc');

        mainImg.style.opacity = '0.35';
        setTimeout(() => {
          mainImg.src = newImg;
          mainImg.alt = newTitle || mainImg.alt;
          mainImg.style.opacity = '1';
        }, 140);

        mainWrap.setAttribute('data-modal-img', newImg);
        mainWrap.setAttribute('data-modal-title', newTitle);
        mainWrap.setAttribute('data-modal-desc', newDesc);

        const foundIdx = triggerElements.indexOf(mainWrap);
        if (foundIdx !== -1 && projectsData && projectsData[foundIdx]) {
          projectsData[foundIdx].img = newImg;
          projectsData[foundIdx].title = newTitle;
          projectsData[foundIdx].desc = newDesc;
        }
      });
    });
  }

  setupGallerySwitcher('ascGalleryStrip', 'ascMediaMain', 'ascMainImg');
  setupGallerySwitcher('inboxGalleryStrip', 'inboxQuestBentoMedia', 'inboxQuestBentoImg');

  // --------------------------------------------------------------------------
  // 9. CINEMATIC FULLSCREEN INTRO VIDEO CONTROLLER
  // --------------------------------------------------------------------------
  const introOverlay = document.getElementById('introVideoOverlay');
  const introVideo = document.getElementById('introVideo');

  if (introOverlay && introVideo) {
    let isIntroDismissed = false;

    const dismissIntro = () => {
      if (isIntroDismissed) return;
      isIntroDismissed = true;

      introOverlay.classList.add('fading-out');
      document.body.classList.remove('intro-active');
      document.body.classList.add('intro-revealed');
      document.body.style.overflow = '';

      // Re-position desktop nav pill after intro reveal animation settles
      setTimeout(() => {
        const activeLink = desktopLinks.find(l => l.getAttribute('data-section') === currentActiveSection);
        if (activeLink && window.innerWidth > 880) {
          positionPill(activeLink);
        }
      }, 400);

      setTimeout(() => {
        try { introVideo.pause(); } catch (e) {}
        introOverlay.style.display = 'none';
      }, 700);
    };

    introVideo.addEventListener('ended', dismissIntro);
    introOverlay.addEventListener('click', dismissIntro);
    introOverlay.addEventListener('touchstart', dismissIntro, { passive: true });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !isIntroDismissed) {
        dismissIntro();
      }
    });

    if (prefersReducedMotion) {
      introVideo.pause();
      introOverlay.style.display = 'none';
      document.body.classList.add('intro-revealed');
      return;
    }

    document.body.classList.add('intro-active');
    const playPromise = introVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Intro video autoplay requires user interaction or was blocked:', err);
      });
    }
  }
});
