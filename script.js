/**
 * MMM Transport Moving - JavaScript
 * Modern, conversion-optimized moving company website
 */

'use strict';

const state = {
  currentLightboxIndex: 0,
  isBookingOpen: false,
  isMobileMenuOpen: false,
  hasAnimated: {
    stats: false
  },
  exitIntentShown: false
};

const utils = {
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  throttle(func, wait) {
    let throttled = false;
    return function(...args) {
      if (!throttled) {
        func.apply(this, args);
        throttled = true;
        setTimeout(() => throttled = false, wait);
      }
    };
  },

  isInViewport(element, offset = 0) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) - offset &&
      rect.bottom >= 0
    );
  },

  smoothScrollTo(element) {
    if (!element) return;
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  },

  formatPhoneNumber(value) {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (!match) return value;

    let formatted = '';
    if (match[1]) formatted = `(${match[1]}`;
    if (match[2]) formatted += `) ${match[2]}`;
    if (match[3]) formatted += `-${match[3]}`;
    return formatted;
  }
};

const scrollProgress = {
  init() {
    const progressBar = document.querySelector('.scroll-progress');
    if (!progressBar) return;

    window.addEventListener('scroll', utils.throttle(() => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      progressBar.style.width = scrolled + '%';
    }, 50));
  }
};

const mobileMenu = {
  init() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const menu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      this.toggle(toggle, menu);
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (state.isMobileMenuOpen) {
          this.close(toggle, menu);
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (state.isMobileMenuOpen &&
          !menu.contains(e.target) &&
          !toggle.contains(e.target)) {
        this.close(toggle, menu);
      }
    });
  },

  toggle(toggle, menu) {
    state.isMobileMenuOpen = !state.isMobileMenuOpen;
    toggle.classList.toggle('active');
    menu.classList.toggle('active');
    toggle.setAttribute('aria-expanded', state.isMobileMenuOpen);
  },

  close(toggle, menu) {
    state.isMobileMenuOpen = false;
    toggle.classList.remove('active');
    menu.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
  }
};

const navigation = {
  init() {
    const navLinks = document.querySelectorAll('.nav-link, a[href^="#"]');

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const targetId = href;
          const targetElement = document.querySelector(targetId);
          if (targetElement) {
            utils.smoothScrollTo(targetElement);
            window.trackEvent && window.trackEvent('Navigation', 'Click', targetId);
          }
        }
      });
    });

    this.setupActiveLinks();
  },

  setupActiveLinks() {
    const sections = document.querySelectorAll('.section, .hero');
    const navLinks = document.querySelectorAll('.nav-link');

    const updateActiveLink = () => {
      let currentSection = '';

      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= sectionTop - 100) {
          currentSection = section.getAttribute('id');
        }
      });

      navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === `#${currentSection}`) {
          link.classList.add('active');
        }
      });
    };

    window.addEventListener('scroll', utils.debounce(updateActiveLink, 100));
    updateActiveLink();
  }
};

const statsCounter = {
  init() {
    const statNumbers = document.querySelectorAll('.stat-number');
    if (!statNumbers.length) return;

    const animateStats = () => {
      const statsSection = document.querySelector('.stats-section');
      if (!statsSection || state.hasAnimated.stats) return;

      if (utils.isInViewport(statsSection, 100)) {
        state.hasAnimated.stats = true;
        statNumbers.forEach(stat => {
          const target = parseInt(stat.getAttribute('data-target'));
          this.animateValue(stat, 0, target, 2000);
        });
      }
    };

    window.addEventListener('scroll', utils.throttle(animateStats, 200));
    animateStats();
  },

  animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        element.textContent = end;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current);
      }
    }, 16);
  }
};

const gallery = {
  thumbnails: [],
  lightbox: null,
  lightboxImg: null,
  caption: null,

  init() {
    this.lightbox = document.getElementById('galleryLightbox');
    this.lightboxImg = document.getElementById('lightboxImg');
    this.caption = document.getElementById('caption');
    this.thumbnails = Array.from(document.querySelectorAll('.gallery-item img'));

    const galleryItems = document.querySelectorAll('.gallery-item');
    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-nav.prev');
    const nextBtn = document.querySelector('.lightbox-nav.next');

    galleryItems.forEach((item, index) => {
      item.addEventListener('click', () => {
        state.currentLightboxIndex = index;
        this.openLightbox();
        window.trackEvent && window.trackEvent('Gallery', 'Open', index);
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeLightbox());
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prevImage());
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextImage());
    }

    this.lightbox.addEventListener('click', (e) => {
      if (e.target === this.lightbox) {
        this.closeLightbox();
      }
    });

    this.setupKeyboardNav();
    this.setupSwipeNav();
  },

  openLightbox() {
    this.lightbox.style.display = 'block';
    this.updateLightboxImage();
    document.body.classList.add('no-scroll');
    this.lightbox.focus();
  },

  closeLightbox() {
    this.lightbox.style.display = 'none';
    document.body.classList.remove('no-scroll');
  },

  updateLightboxImage() {
    const currentThumb = this.thumbnails[state.currentLightboxIndex];
    if (currentThumb) {
      this.lightboxImg.src = currentThumb.src;
      this.lightboxImg.alt = currentThumb.alt;
      this.caption.textContent = currentThumb.alt;
    }
  },

  nextImage() {
    state.currentLightboxIndex = (state.currentLightboxIndex + 1) % this.thumbnails.length;
    this.updateLightboxImage();
  },

  prevImage() {
    state.currentLightboxIndex =
      (state.currentLightboxIndex - 1 + this.thumbnails.length) % this.thumbnails.length;
    this.updateLightboxImage();
  },

  setupKeyboardNav() {
    document.addEventListener('keydown', (e) => {
      if (this.lightbox.style.display === 'block') {
        switch(e.key) {
          case 'ArrowRight':
            this.nextImage();
            break;
          case 'ArrowLeft':
            this.prevImage();
            break;
          case 'Escape':
            this.closeLightbox();
            break;
        }
      }
    });
  },

  setupSwipeNav() {
    let startX = 0;
    let endX = 0;
    const swipeThreshold = 50;

    this.lightbox.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    this.lightbox.addEventListener('touchmove', (e) => {
      endX = e.touches[0].clientX;
    }, { passive: true });

    this.lightbox.addEventListener('touchend', () => {
      const swipeDistance = startX - endX;

      if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance > 0) {
          this.nextImage();
        } else {
          this.prevImage();
        }
      }
    });
  }
};

const bookingModal = {
  modal: null,
  overlay: null,
  closeBtn: null,
  form: null,

  init() {
    this.modal = document.getElementById('bookingModal');
    this.overlay = document.querySelector('.booking-modal-overlay');
    this.closeBtn = document.querySelector('.booking-modal-close');
    this.form = document.getElementById('bookingForm');

    if (!this.modal) return;

    const openButtons = document.querySelectorAll('[data-action="open-booking"]');
    openButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.open();
        window.trackEvent && window.trackEvent('Booking', 'Modal Open', btn.textContent);
      });
    });

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.close());
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.isBookingOpen) {
        this.close();
      }
    });

    if (this.form) {
      this.setupFormValidation();
    }

    this.checkSuccessMessage();
    this.setupExitIntent();
  },

  open() {
    state.isBookingOpen = true;
    this.modal.classList.add('active');
    document.body.classList.add('no-scroll');

    const firstInput = this.modal.querySelector('input');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 400);
    }
  },

  close() {
    state.isBookingOpen = false;
    this.modal.classList.remove('active');
    document.body.classList.remove('no-scroll');
  },

  setupFormValidation() {
    const dateInput = this.form.querySelector('input[type="date"]');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.setAttribute('min', today);
    }

    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        e.target.value = utils.formatPhoneNumber(e.target.value);
      });
    });

    this.form.addEventListener('submit', (e) => {
      if (!this.form.checkValidity()) {
        e.preventDefault();
        this.showValidationErrors();
      } else {
        window.trackEvent && window.trackEvent('Booking', 'Form Submit', 'Main Form');
      }
    });
  },

  showValidationErrors() {
    const inputs = this.form.querySelectorAll('input[required], select[required], textarea[required]');
    inputs.forEach(input => {
      if (!input.validity.valid) {
        input.style.borderColor = '#f44336';
        setTimeout(() => {
          input.style.borderColor = '';
        }, 3000);
      }
    });
  },

  checkSuccessMessage() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === '1') {
      this.showSuccessNotification();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  },

  showSuccessNotification() {
    const notification = document.getElementById('successNotification');
    if (!notification) return;

    notification.classList.add('show');

    setTimeout(() => {
      notification.classList.remove('show');
    }, 5000);
  },

  setupExitIntent() {
    if (window.innerWidth < 768) return;
    if (state.exitIntentShown) return;

    let hasMovedOut = false;

    document.addEventListener('mouseleave', (e) => {
      if (e.clientY < 10 && !state.exitIntentShown && !state.isBookingOpen) {
        hasMovedOut = true;
      }
    });

    document.addEventListener('mouseenter', () => {
      if (hasMovedOut && !state.exitIntentShown && !state.isBookingOpen) {
        setTimeout(() => {
          if (!state.isBookingOpen) {
            this.open();
            state.exitIntentShown = true;
            window.trackEvent && window.trackEvent('Booking', 'Exit Intent', 'Triggered');
          }
        }, 100);
      }
      hasMovedOut = false;
    });
  }
};

const contactForm = {
  init() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const phoneInput = form.querySelector('input[type="tel"]');
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        e.target.value = utils.formatPhoneNumber(e.target.value);
      });
    }

    form.addEventListener('submit', (e) => {
      if (form.checkValidity()) {
        window.trackEvent && window.trackEvent('Contact', 'Form Submit', 'Contact Form');

        const dateInput = form.querySelector('input[name="date"]');
        if (dateInput) {
          dateInput.value = new Date().toISOString().split('T')[0];
        }
      } else {
        e.preventDefault();
        this.showValidationErrors(form);
      }
    });
  },

  showValidationErrors(form) {
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    inputs.forEach(input => {
      if (!input.validity.valid) {
        input.style.borderColor = '#f44336';
        setTimeout(() => {
          input.style.borderColor = '';
        }, 3000);
      }
    });
  }
};

const entranceAnimations = {
  init() {
    const elements = document.querySelectorAll('.section');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(element => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(element);
    });
  }
};

const lazyLoading = {
  init() {
    const images = document.querySelectorAll('img[loading="lazy"]');

    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    }
  }
};

const performance = {
  init() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.style.scrollBehavior = 'auto';

      const style = document.createElement('style');
      style.textContent = '* { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }';
      document.head.appendChild(style);
    }

    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.preloadImages();
      });
    } else {
      setTimeout(() => this.preloadImages(), 1000);
    }
  },

  preloadImages() {
    const images = ['pexels-anastasia-shuraeva-7647397.jpg', 'pexels-anastasia-shuraeva-7647762.jpg'];
    images.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }
};

const analytics = {
  init() {
    window.trackEvent = (category, action, label) => {
      if (typeof gtag !== 'undefined') {
        gtag('event', action, {
          'event_category': category,
          'event_label': label
        });
      }

      console.log(`Event: ${category} - ${action} - ${label}`);
    };

    const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
    phoneLinks.forEach(link => {
      link.addEventListener('click', () => {
        window.trackEvent && window.trackEvent('Contact', 'Phone Click', link.textContent);
      });
    });

    const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
    emailLinks.forEach(link => {
      link.addEventListener('click', () => {
        window.trackEvent && window.trackEvent('Contact', 'Email Click', link.textContent);
      });
    });
  }
};

const app = {
  init() {
    document.addEventListener('DOMContentLoaded', () => {
      scrollProgress.init();
      mobileMenu.init();
      navigation.init();
      statsCounter.init();
      gallery.init();
      bookingModal.init();
      contactForm.init();
      entranceAnimations.init();
      lazyLoading.init();
      performance.init();
      analytics.init();

      document.body.classList.add('page-loaded');
    });

    if (document.readyState === 'loading') {
      return;
    } else {
      scrollProgress.init();
      mobileMenu.init();
      navigation.init();
      statsCounter.init();
      gallery.init();
      bookingModal.init();
      contactForm.init();
      entranceAnimations.init();
      lazyLoading.init();
      performance.init();
      analytics.init();

      document.body.classList.add('page-loaded');
    }
  }
};

app.init();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { app, utils };
}
