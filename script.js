// ==========================================================================
// ARJUN SINGH — APPLE KEYNOTE FLAGSHIP INTERACTION SCRIPT
// High-Engineered Pop-up Lightbox, Spring Physics, Spatial Depth & Telemetry
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. APPLE-STYLE SCROLL REVEAL (IntersectionObserver)
  const scrollElements = document.querySelectorAll('.fade-in-on-scroll');

  const checkVisibility = () => {
    scrollElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.92) {
        el.classList.add('visible');
      }
    });
  };

  checkVisibility();
  window.addEventListener('scroll', checkVisibility, { passive: true });
  window.addEventListener('resize', checkVisibility, { passive: true });

  // 2. NAVBAR BLUR & SCROLL ELEVATION
  const appleNav = document.querySelector('.apple-nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      if (appleNav) {
        appleNav.style.background = 'rgba(18, 18, 19, 0.88)';
        appleNav.style.borderColor = 'rgba(255, 255, 255, 0.14)';
      }
    } else {
      if (appleNav) {
        appleNav.style.background = 'rgba(22, 22, 23, 0.75)';
        appleNav.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      }
    }
  }, { passive: true });

  // 3. COPY EMAIL INTERACTION
  const copyBtn = document.getElementById('copyEmailBtn');
  const copyText = document.getElementById('copyEmailText');
  if (copyBtn) {
    copyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const email = 'arjunsingh.dev@outlook.com';
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

  // 4. HIGH-ENGINEERED APPLE-GRADE LIGHTBOX ENGINE
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
    } catch (err) {}

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

    // Reset zoom state on project transition
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

    // Render telemetry specs
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

  // Navigation button bindings
  if (modalNextBtn) modalNextBtn.addEventListener('click', nextProject);
  if (modalPrevBtn) modalPrevBtn.addEventListener('click', prevProject);
  if (modalFooterNextBtn) modalFooterNextBtn.addEventListener('click', nextProject);
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalZoomBtn) modalZoomBtn.addEventListener('click', () => toggleZoom());

  // Image Frame zoom click
  if (modalImageFrame) {
    modalImageFrame.addEventListener('click', () => toggleZoom());
  }

  // Backdrop click to close
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
  }

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (!modalOverlay || !modalOverlay.classList.contains('active')) return;

    if (e.key === 'Escape') {
      closeModal();
    } else if (e.key === 'ArrowRight') {
      nextProject();
    } else if (e.key === 'ArrowLeft') {
      prevProject();
    } else if (e.key === 'z' || e.key === 'Z') {
      toggleZoom();
    }
  });

  // Dynamic Specular Cursor Spotlight tracker on Modal Chassis
  if (modalChassis) {
    modalChassis.addEventListener('mousemove', (e) => {
      const rect = modalChassis.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      modalChassis.style.setProperty('--mouse-x', `${x}px`);
      modalChassis.style.setProperty('--mouse-y', `${y}px`);
    });
  }
});
