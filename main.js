const BREAKPOINTS = {
  desktop: 1200,
  tablet: 768,
  compact: 920,
};

const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

function debounce(callback, delay = 120) {
  let timeoutId = 0;

  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), delay);
  };
}

function rafThrottle(callback) {
  let isQueued = false;

  return (...args) => {
    if (isQueued) {
      return;
    }

    isQueued = true;
    window.requestAnimationFrame(() => {
      callback(...args);
      isQueued = false;
    });
  };
}

function getViewportWidth() {
  return Math.round(
    window.visualViewport?.width ||
      document.documentElement.clientWidth ||
      window.innerWidth
  );
}

function getViewportScale() {
  return window.visualViewport?.scale || 1;
}

function prefersReducedMotion() {
  return reduceMotionQuery.matches;
}

function initViewportState() {
  const syncViewport = () => {
    const width = getViewportWidth();
    const scale = getViewportScale();

    document.body.classList.toggle(
      'is-compact',
      width <= BREAKPOINTS.compact || scale > 1.05
    );
    document.body.classList.toggle('is-zoomed', scale > 1.05);
  };

  const onViewportChange = debounce(syncViewport, 50);

  syncViewport();
  window.addEventListener('resize', onViewportChange);
  window.visualViewport?.addEventListener('resize', onViewportChange);
}

function initMenu() {
  const menu = document.querySelector('[data-menu]');
  const toggle = document.querySelector('[data-menu-toggle]');
  const panel = document.querySelector('[data-menu-panel]');

  if (!menu || !toggle || !panel) {
    return;
  }

  const setOpen = (isOpen) => {
    const allowDrawer = document.body.classList.contains('is-compact');
    const shouldOpen = allowDrawer && isOpen;

    menu.classList.toggle('is-open', shouldOpen);
    menu.setAttribute('aria-expanded', String(shouldOpen));
    toggle.setAttribute('aria-expanded', String(shouldOpen));
    toggle.setAttribute('aria-label', shouldOpen ? 'Закрыть меню' : 'Открыть меню');
  };

  setOpen(false);

  toggle.addEventListener('click', () => {
    setOpen(!menu.classList.contains('is-open'));
  });

  document.addEventListener('click', (event) => {
    if (menu.contains(event.target)) {
      return;
    }

    setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
    }
  });

  panel.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  window.addEventListener(
    'resize',
    debounce(() => {
      if (!document.body.classList.contains('is-compact')) {
        setOpen(false);
      }
    })
  );
}

function initSlider() {
  const track = document.querySelector('[data-slider-track]');
  const prevButton = document.querySelector('[data-slider-prev]');
  const nextButton = document.querySelector('[data-slider-next]');
  const status = document.querySelector('[data-slider-status] .empty-description');

  if (!track || !prevButton || !nextButton || !status) {
    return;
  }

  const slides = Array.from(track.children);

  const getSlidesPerView = () => {
    const width = getViewportWidth();

    if (document.body.classList.contains('is-zoomed') || width <= BREAKPOINTS.tablet) {
      return 1;
    }

    if (width <= BREAKPOINTS.desktop) {
      return 2;
    }

    return 4;
  };

  const getStepWidth = () => {
    const firstSlide = slides[0];

    if (!firstSlide) {
      return 0;
    }

    const gap = Number.parseFloat(window.getComputedStyle(track).gap || '24');
    return firstSlide.getBoundingClientRect().width + gap;
  };

  const updateSliderState = () => {
    const stepWidth = getStepWidth();
    const slidesPerView = getSlidesPerView();
    const totalPages = Math.max(1, Math.ceil(slides.length / slidesPerView));

    if (!stepWidth) {
      status.textContent = `1/${totalPages}`;
      prevButton.disabled = true;
      nextButton.disabled = totalPages <= 1;
      return;
    }

    const currentPage = Math.max(
      1,
      Math.min(totalPages, Math.round(track.scrollLeft / stepWidth) + 1)
    );

    status.textContent = `${currentPage}/${totalPages}`;
    prevButton.disabled = currentPage <= 1;
    nextButton.disabled = currentPage >= totalPages;
  };

  const scrollByPage = (direction) => {
    const stepWidth = getStepWidth();
    const slidesPerView = getSlidesPerView();

    track.scrollBy({
      left: direction * stepWidth * slidesPerView,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  prevButton.addEventListener('click', () => scrollByPage(-1));
  nextButton.addEventListener('click', () => scrollByPage(1));

  track.addEventListener(
    'wheel',
    (event) => {
      if (getSlidesPerView() <= 1 || prefersReducedMotion()) {
        return;
      }

      const horizontalIntent = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      const delta = horizontalIntent ? event.deltaX : event.deltaY;

      if (Math.abs(delta) < 8) {
        return;
      }

      event.preventDefault();
      track.scrollLeft += delta;
    },
    { passive: false }
  );

  track.addEventListener('scroll', debounce(updateSliderState, 40), { passive: true });

  const refreshSlider = debounce(updateSliderState, 80);
  window.addEventListener('resize', refreshSlider);
  window.visualViewport?.addEventListener('resize', refreshSlider);

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(refreshSlider);
    observer.observe(track);
    slides.forEach((slide) => observer.observe(slide));
  }

  slides.flatMap((slide) => Array.from(slide.querySelectorAll('img'))).forEach((image) => {
    if (!image.complete) {
      image.addEventListener('load', refreshSlider, { once: true });
    }
  });

  updateSliderState();
}

function initCheckboxes() {
  const inputs = Array.from(document.querySelectorAll('.checkbox-input'));
  const stepItems = Array.from(document.querySelectorAll('.parent2 i, .parent2 .wrapper2'));
  const dots = Array.from(document.querySelectorAll('.nav-dots, .nav-dots2, .nav-dots3'));
  const submitButton = document.querySelector('.frame-button');

  const syncCheckboxes = () => {
    const checkedCount = inputs.filter((input) => input.checked).length;

    inputs.forEach((input) => {
      input.closest('.checkbox')?.classList.toggle('is-checked', input.checked);
    });

    stepItems.forEach((item, index) => {
      item.classList.toggle('step-active', index === 0 || (index === 1 && checkedCount > 0));
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle('dot-active', index === 0 || (index === 1 && checkedCount > 0));
    });

    if (submitButton) {
      submitButton.disabled = checkedCount === 0;
    }
  };

  syncCheckboxes();
  inputs.forEach((input) => input.addEventListener('change', syncCheckboxes));
}

function initColorSwatches() {
  document.querySelectorAll('.color').forEach((group) => {
    const items = Array.from(
      group.querySelectorAll('.image-22-icon, .image-22-icon2, .image-35-parent')
    );

    items.forEach((item, index) => {
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.setAttribute('aria-label', `Выбрать вариант ${index + 1}`);

      if (index === 0) {
        item.classList.add('is-active');
      }

      const activate = () => {
        items.forEach((entry) => entry.classList.remove('is-active'));
        item.classList.add('is-active');
      };

      item.addEventListener('click', activate);
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      });
    });
  });
}

function initSmartNavigation() {
  const navLinks = Array.from(document.querySelectorAll('.container a[href^="#"]'));

  if (!navLinks.length || !('IntersectionObserver' in window)) {
    return;
  }

  const sectionMap = new Map(
    navLinks
      .map((link) => [link, document.querySelector(link.getAttribute('href'))])
      .filter(([, section]) => section)
  );

  const setActiveLink = (activeSection) => {
    navLinks.forEach((link) => {
      link.classList.toggle('menu-link-active', sectionMap.get(link) === activeSection);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visibleEntry) {
        setActiveLink(visibleEntry.target);
      }
    },
    {
      rootMargin: '-18% 0px -52% 0px',
      threshold: [0.2, 0.45, 0.7],
    }
  );

  sectionMap.forEach((section) => observer.observe(section));
}

function initReveal() {
  const sections = Array.from(
    document.querySelectorAll(
      '.product-module-parent, .offer-wrapper-wrapper, .selection-support, .commerce-content-wrapper, .promo-wrapper, .frame-parent4, .footer'
    )
  );
  const revealGroups = [
    '.product-module-parent',
    '.offer-wrapper',
    '.helper-01',
    '.designer',
    '.commerce',
    '.promo-content',
    '.offer-set',
    '.image-samples-parent',
    '.frame-wrapper3',
    '.frame-parent5',
    '.copyright-container',
  ];

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    document.body.classList.add('is-ui-ready');
    sections.forEach((section) => section.classList.add('reveal-in'));
    revealGroups.forEach((selector) => {
      document.querySelectorAll(selector).forEach((node) => {
        node.classList.add('reveal-in', 'is-visible');
      });
    });
    requestAnimationFrame(() => {
      sections.forEach((section) => section.classList.add('is-visible'));
    });
    return;
  }

  sections.forEach((section) => section.classList.add('reveal-in'));
  revealGroups.forEach((selector, groupIndex) => {
    document.querySelectorAll(selector).forEach((node, itemIndex) => {
      node.classList.add('reveal-in');
      node.style.setProperty('--reveal-delay', `${Math.min(320, (groupIndex + itemIndex) * 55)}ms`);
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: '0px 0px -8% 0px',
    }
  );

  sections.forEach((section) => observer.observe(section));
  revealGroups.forEach((selector) => {
    document.querySelectorAll(selector).forEach((node) => observer.observe(node));
  });

  requestAnimationFrame(() => {
    document.body.classList.add('is-ui-ready');
  });
}

function initCardFX() {
  if (prefersReducedMotion()) {
    return;
  }

  const cards = document.querySelectorAll(
    '.cart, .cart2, .cart3, .designer, .commerce, .offer-set, .parent6, .image-samples-parent'
  );

  cards.forEach((card) => {
    const onMove = rafThrottle((event) => {
      if (document.body.classList.contains('is-zoomed') || document.body.classList.contains('is-compact')) {
        return;
      }

      const bounds = card.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const rotateY = ((x / bounds.width) - 0.5) * 6;
      const rotateX = (0.5 - (y / bounds.height)) * 6;

      card.style.setProperty('--tilt-x', `${rotateX.toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${rotateY.toFixed(2)}deg`);
      card.style.setProperty('--glow-x', `${(x / bounds.width) * 100}%`);
      card.style.setProperty('--glow-y', `${(y / bounds.height) * 100}%`);
      card.classList.add('is-tilting');
    });

    const reset = () => {
      card.classList.remove('is-tilting');
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
    };

    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', reset);
    card.addEventListener('blur', reset, true);
  });
}

function initSmartButtons() {
  if (prefersReducedMotion()) {
    return;
  }

  document.querySelectorAll('.button, .button2, .component-1, .frame-button, .wrapper5, .button4').forEach((button) => {
    button.addEventListener('pointerenter', () => {
      button.classList.add('is-glow-active');
    });

    button.addEventListener('pointerleave', () => {
      button.classList.remove('is-glow-active');
      button.style.removeProperty('--glow-x');
      button.style.removeProperty('--glow-y');
    });

    button.addEventListener(
      'pointermove',
      rafThrottle((event) => {
        const bounds = button.getBoundingClientRect();
        button.style.setProperty('--glow-x', `${event.clientX - bounds.left}px`);
        button.style.setProperty('--glow-y', `${event.clientY - bounds.top}px`);
      })
    );
  });
}

function initHeroScroll() {
  const trigger = document.querySelector('.hero-scroll-button');

  trigger?.addEventListener('click', () => {
    document.querySelector('#popular')?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
  });
}

function initAssetHints() {
  document.querySelectorAll('img:not(.slider-child)').forEach((image) => {
    if (!image.hasAttribute('loading')) {
      image.setAttribute('loading', 'lazy');
    }

    image.setAttribute('decoding', 'async');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initViewportState();
  initMenu();
  initSlider();
  initCheckboxes();
  initColorSwatches();
  initSmartNavigation();
  initReveal();
  initCardFX();
  initSmartButtons();
  initHeroScroll();
  initAssetHints();
});
