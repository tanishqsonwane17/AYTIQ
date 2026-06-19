/* ════════════════════════════════════════════════════
   AYTIQ LABS — script.js
   GSAP + Lenis + Three.js + All Interactions
════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────
   LENIS SMOOTH SCROLL
───────────────────────────────────────────────── */
let lenis;

function initLenis() {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    smoothTouch: false,
    touchMultiplier: 2,
  });

  // Integrate with GSAP ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

/* ─────────────────────────────────────────────────
   THREE.JS HERO SCENE
───────────────────────────────────────────────── */
function initHeroScene() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.z = 5.5;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setClearColor(0x000000, 0);

  // ── Icosahedron wireframe (the signature element) ──
  const geoIco = new THREE.IcosahedronGeometry(1.6, 1);
  const matIco = new THREE.MeshBasicMaterial({
    color: 0x2563EB,
    wireframe: true,
    transparent: true,
    opacity: 0.25,
  });
  const ico = new THREE.Mesh(geoIco, matIco);
  scene.add(ico);

  // ── Inner solid icosahedron ──
  const geoInner = new THREE.IcosahedronGeometry(0.9, 0);
  const matInner = new THREE.MeshBasicMaterial({
    color: 0x1a1a2e,
    transparent: true,
    opacity: 0.9,
  });
  const innerIco = new THREE.Mesh(geoInner, matInner);
  scene.add(innerIco);

  // ── Inner wireframe ──
  const geoInnerWire = new THREE.IcosahedronGeometry(0.9, 0);
  const matInnerWire = new THREE.MeshBasicMaterial({
    color: 0x3B82F6,
    wireframe: true,
    transparent: true,
    opacity: 0.6,
  });
  const innerWire = new THREE.Mesh(geoInnerWire, matInnerWire);
  scene.add(innerWire);

  // ── Particle system ──
  const particleCount = 180;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 2.4 + Math.random() * 1.2;
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0x3B82F6,
    size: 0.025,
    transparent: true,
    opacity: 0.5,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ── Mouse interaction ──
  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ── Resize handler ──
  function onResize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  // ── Intro animation ──
  gsap.from(ico.scale, {
    x: 0, y: 0, z: 0,
    duration: 1.8,
    ease: 'expo.out',
    delay: 0.3,
  });
  gsap.from(matIco, { opacity: 0, duration: 1.8, delay: 0.3 });

  // ── Render loop ──
  let animId;
  function animate() {
    animId = requestAnimationFrame(animate);

    const clock = Date.now() * 0.001;

    // Lerp mouse
    targetX += (mouseX - targetX) * 0.05;
    targetY += (mouseY - targetY) * 0.05;

    ico.rotation.y = clock * 0.18 + targetX * 0.4;
    ico.rotation.x = clock * 0.08 + targetY * 0.25;
    innerIco.rotation.y = -clock * 0.22 - targetX * 0.3;
    innerIco.rotation.x = clock * 0.14 - targetY * 0.2;
    innerWire.rotation.copy(innerIco.rotation);
    particles.rotation.y = clock * 0.06;
    particles.rotation.x = clock * 0.03;

    renderer.render(scene, camera);
  }
  animate();

  // Pause when not on home page to save resources
  document.addEventListener('pageChange', (e) => {
    if (e.detail === 'home') {
      animate();
    } else {
      cancelAnimationFrame(animId);
    }
  });
}

/* ─────────────────────────────────────────────────
   SINGLE PAGE NAVIGATION
───────────────────────────────────────────────── */
function initNavigation() {
  const pages    = document.querySelectorAll('.page');
  const navLinks = document.querySelectorAll('.nav__link, .mobile-menu__link');
  const allLinks = document.querySelectorAll('a[href^="#"]');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  function showPage(pageId) {
    if (!pageId) return;
    const target = document.getElementById(pageId);
    if (!target) return;

    pages.forEach(p => p.classList.remove('active'));
    target.classList.add('active');

    // Update active nav link
    navLinks.forEach(l => {
      l.classList.toggle('active', l.dataset.page === pageId);
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (lenis) lenis.scrollTo(0, { immediate: true });

    // Reset & re-trigger reveal animations
    setTimeout(() => {
      initRevealAnimations();
      if (pageId === 'about') initCounters();
      ScrollTrigger.refresh();
    }, 50);

    // Notify hero canvas
    document.dispatchEvent(new CustomEvent('pageChange', { detail: pageId }));

    // Close mobile menu
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('open');
  }

  allLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href.startsWith('#')) return;
      e.preventDefault();
      const pageId = href.slice(1);
      showPage(pageId);
    });
  });

  // Hamburger
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });

  // Initial page load
  showPage('home');
}

/* ─────────────────────────────────────────────────
   NAVBAR SCROLL BEHAVIOR
───────────────────────────────────────────────── */
function initNavbar() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

/* ─────────────────────────────────────────────────
   CUSTOM CURSOR
───────────────────────────────────────────────── */
function initCursor() {
  const cursor   = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');
  if (!cursor || !follower) return;
  if (window.matchMedia('(max-width: 768px)').matches) return;

  let fX = 0, fY = 0;

  document.addEventListener('mousemove', (e) => {
    gsap.set(cursor, { x: e.clientX, y: e.clientY });
    gsap.to(follower, { x: e.clientX, y: e.clientY, duration: 0.15, ease: 'power2.out' });
  });

  document.addEventListener('mouseenter', (e) => {
    if (e.target.matches('a, button, .magnetic, [role="button"]')) {
      cursor.classList.add('cursor--hover');
      follower.classList.add('cursor--hover');
    }
  }, true);

  document.addEventListener('mouseleave', (e) => {
    if (e.target.matches('a, button, .magnetic, [role="button"]')) {
      cursor.classList.remove('cursor--hover');
      follower.classList.remove('cursor--hover');
    }
  }, true);
}

/* ─────────────────────────────────────────────────
   MAGNETIC BUTTONS
───────────────────────────────────────────────── */
function initMagneticButtons() {
  const magnetics = document.querySelectorAll('.magnetic');
  if (window.matchMedia('(max-width: 768px)').matches) return;

  magnetics.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const cx   = rect.left + rect.width / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) * 0.35;
      const dy   = (e.clientY - cy) * 0.35;
      gsap.to(el, { x: dx, y: dy, duration: 0.4, ease: 'power2.out' });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

/* ─────────────────────────────────────────────────
   HERO HEADLINE ANIMATION
───────────────────────────────────────────────── */
function initHeroAnimation() {
  const lines = document.querySelectorAll('.hero__headline .split-line');
  if (!lines.length) return;

  gsap.fromTo(lines,
    { yPercent: 105, opacity: 0 },
    {
      yPercent: 0,
      opacity: 1,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.1,
      delay: 0.4,
    }
  );
}

/* ─────────────────────────────────────────────────
   SCROLL REVEAL ANIMATIONS
───────────────────────────────────────────────── */
function initRevealAnimations() {
  // Use IntersectionObserver for lightweight reveals
  const revealEls = document.querySelectorAll('.reveal-fade:not(.in-view), .reveal-up:not(.in-view)');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  });

  revealEls.forEach(el => observer.observe(el));
}

/* ─────────────────────────────────────────────────
   COUNTER ANIMATION
───────────────────────────────────────────────── */
function initCounters() {
  const counters = document.querySelectorAll('.counter');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el     = entry.target;
        const target = +el.dataset.target;
        const dur    = 1800;
        const start  = performance.now();
        observer.unobserve(el);

        function update(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / dur, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
          el.textContent = Math.round(eased * target);
          if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

/* ─────────────────────────────────────────────────
   MARQUEE PAUSE ON HOVER
───────────────────────────────────────────────── */
function initMarquee() {
  const track = document.querySelector('.marquee__track');
  if (!track) return;
  track.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
  track.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');
}

/* ─────────────────────────────────────────────────
   PORTFOLIO FILTER
───────────────────────────────────────────────── */
function initPortfolioFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const items      = document.querySelectorAll('.portfolio-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      items.forEach(item => {
        const cats = item.dataset.category || '';
        const show = filter === 'all' || cats.includes(filter);

        if (show) {
          item.classList.remove('hidden');
          gsap.fromTo(item, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
        } else {
          gsap.to(item, {
            opacity: 0, y: 16, duration: 0.25, ease: 'power2.in',
            onComplete: () => item.classList.add('hidden'),
          });
        }
      });
    });
  });
}

/* ─────────────────────────────────────────────────
   PROJECT MODAL
───────────────────────────────────────────────── */
const PROJECT_DATA = {
  helios: {
    title: 'Helios Analytics',
    tags: ['AI', 'Web App', 'Dashboard', 'Data Visualization'],
    color: '#0f172a',
    description: `Helios Analytics needed to transform petabytes of raw business data into actionable intelligence — in real time. We designed and engineered a complete AI-powered BI dashboard from the ground up, integrating custom ML models for anomaly detection, predictive forecasting, and automated insight generation.`,
    description2: `The platform processes over 50M data events per day with sub-100ms query response times, and the AI insight engine surfaces business-critical patterns that would take human analysts weeks to discover.`,
    stats: [{ val: '50M+', label: 'Daily Events' }, { val: '<100ms', label: 'Query Time' }, { val: '40hr', label: 'Saved Weekly' }],
  },
  novapay: {
    title: 'NovaPay Platform',
    tags: ['Mobile', 'Fintech', 'SaaS', 'React Native'],
    color: '#111827',
    description: `NovaPay required a cross-platform mobile application capable of handling high-volume financial transactions with bank-grade security and a consumer-grade experience. We built the complete product across iOS and Android using React Native, with a Go microservices backend on AWS.`,
    description2: `The app launched to 50K users in the first month and now processes over $2M in daily transaction volume, maintaining 99.97% uptime and passing SOC 2 Type II certification.`,
    stats: [{ val: '$2M+', label: 'Daily Volume' }, { val: '99.97%', label: 'Uptime' }, { val: '200K+', label: 'Active Users' }],
  },
  luxe: {
    title: 'Luxe Commerce',
    tags: ['E-Commerce', 'UI/UX', 'AI Recommendations', 'Next.js'],
    color: '#1a1a2e',
    description: `Luxe Commerce required a premium digital retail experience that matched the sophistication of their physical brand. We crafted a bespoke e-commerce platform with AI-powered personalization, frictionless checkout, and a visual identity that elevated the product as much as the products themselves.`,
    description2: `The AI recommendation engine increased average order value by 38%, and the redesigned checkout flow reduced abandonment by 52%.`,
    stats: [{ val: '+38%', label: 'AOV Increase' }, { val: '-52%', label: 'Cart Abandonment' }, { val: '4.9★', label: 'App Store Rating' }],
  },
  synapse: {
    title: 'Synapse CRM',
    tags: ['AI', 'SaaS', 'CRM', 'Automation'],
    color: '#18181b',
    description: `Synapse needed a CRM that didn't just store contact data — it needed to think. We built an intelligent CRM platform with LLM-powered lead scoring, automated workflow triggers, and a conversational interface that lets sales reps query their pipeline in plain language.`,
    description2: `The AI qualification engine reduced time-to-close by 30% and automated 70% of routine follow-up tasks, freeing sales teams to focus on relationships rather than administration.`,
    stats: [{ val: '-30%', label: 'Time to Close' }, { val: '70%', label: 'Tasks Automated' }, { val: '3x', label: 'Pipeline Visibility' }],
  },
  pulse: {
    title: 'Pulse Health',
    tags: ['Mobile', 'Health', 'Real-Time', 'Flutter'],
    color: '#1c1917',
    description: `Pulse Health is a consumer health monitoring platform that turns wearable data into clear, actionable health insights. We built native-performance cross-platform apps in Flutter with real-time data sync, HIPAA-compliant storage, and a clean, calming interface designed for daily use.`,
    description2: `The app scaled to 200K+ active users within 8 months of launch, maintaining 4.8 star ratings on both App Store and Google Play.`,
    stats: [{ val: '200K+', label: 'Active Users' }, { val: '4.8★', label: 'Store Rating' }, { val: 'HIPAA', label: 'Compliant' }],
  },
  quantum: {
    title: 'Quantum DevOps',
    tags: ['SaaS', 'Web', 'DevOps', 'Cloud'],
    color: '#14162c',
    description: `Quantum DevOps is a SaaS platform that unifies deployment pipelines, infrastructure monitoring, and incident management in a single workspace. We architected the complete platform from infrastructure to interface, with real-time websocket feeds and a CLI tool for power users.`,
    description2: `Customers report an average 70% reduction in deployment time and 85% faster incident resolution after adopting the platform.`,
    stats: [{ val: '-70%', label: 'Deploy Time' }, { val: '-85%', label: 'Incident MTTR' }, { val: '500+', label: 'Companies' }],
  },
};

function initModal() {
  const modal      = document.getElementById('projectModal');
  const modalBody  = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');
  const overlay    = document.getElementById('modalOverlay');

  document.querySelectorAll('.portfolio-item__open').forEach(btn => {
    btn.addEventListener('click', () => {
      const key  = btn.dataset.project;
      const data = PROJECT_DATA[key];
      if (!data) return;

      modalBody.innerHTML = `
        <h2>${data.title}</h2>
        <div class="modal-tags">${data.tags.map(t => `<span>${t}</span>`).join('')}</div>
        <div class="modal-thumb" style="background:${data.color}"></div>
        <p>${data.description}</p>
        <p>${data.description2}</p>
        <div class="modal__stats">
          ${data.stats.map(s => `<div class="modal__stat"><strong>${s.val}</strong><span>${s.label}</span></div>`).join('')}
        </div>
      `;
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
  modalClose.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

/* ─────────────────────────────────────────────────
   CONTACT FORM
───────────────────────────────────────────────── */
function initContactForm() {
  const form    = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const btn      = form.querySelector('.form-submit');
    const btnText  = btn.querySelector('.btn-text');
    const btnLoad  = btn.querySelector('.btn-loader');

    // Simple validation
    let valid = true;
    form.querySelectorAll('[required]').forEach(field => {
      if (!field.value.trim()) {
        valid = false;
        gsap.fromTo(field,
          { borderColor: '#ef4444' },
          { borderColor: 'var(--border)', duration: 2 }
        );
        gsap.fromTo(field, { x: -6 }, { x: 6, duration: 0.08, repeat: 4, yoyo: true, ease: 'none' });
      }
    });
    if (!valid) return;

    // Simulate submission
    btnText.style.display = 'none';
    btnLoad.style.display = 'inline';
    btn.disabled = true;

    setTimeout(() => {
      gsap.to(form, {
        opacity: 0, y: -12, duration: 0.4,
        onComplete: () => {
          form.style.display = 'none';
          success.style.display = 'block';
          gsap.fromTo(success, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
        }
      });
    }, 1600);
  });
}

/* ─────────────────────────────────────────────────
   SERVICE CARDS — GSAP HOVER GLOW
───────────────────────────────────────────────── */
function initServiceCardHover() {
  document.querySelectorAll('.svc-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card, { scale: 1.01, duration: 0.3, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { scale: 1, duration: 0.4, ease: 'power2.out' });
    });
  });
}

/* ─────────────────────────────────────────────────
   GSAP SCROLLTRIGGER — SECTION TRANSITIONS
───────────────────────────────────────────────── */
function initScrollTriggers() {
  // Marquee speed based on scroll
  const marqueeTrack = document.querySelector('.marquee__track');
  if (marqueeTrack) {
    ScrollTrigger.create({
      trigger: '.trusted',
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => gsap.to(marqueeTrack, { animationDuration: '18s' }),
      onLeave: () => gsap.to(marqueeTrack, { animationDuration: '24s' }),
    });
  }

  // Works grid stagger on scroll
  ScrollTrigger.batch('.work-item', {
    onEnter: batch => gsap.fromTo(batch,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, stagger: 0.12, duration: 0.7, ease: 'power2.out', overwrite: true }
    ),
    start: 'top 88%',
  });

  // Service cards stagger
  ScrollTrigger.batch('.service-card', {
    onEnter: batch => gsap.fromTo(batch,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.6, ease: 'power2.out', overwrite: true }
    ),
    start: 'top 90%',
  });

  // Pillar items
  ScrollTrigger.batch('.pillar', {
    onEnter: batch => gsap.fromTo(batch,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.55, ease: 'power2.out', overwrite: true }
    ),
    start: 'top 88%',
  });
}

/* ─────────────────────────────────────────────────
   INIT ALL
───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Register GSAP plugins
  gsap.registerPlugin(ScrollTrigger);

  // Core
  initLenis();
  initNavbar();
  initNavigation();
  initCursor();

  // Hero
  initHeroScene();
  initHeroAnimation();

  // Interactions
  initMagneticButtons();
  initMarquee();
  initRevealAnimations();
  initScrollTriggers();
  initPortfolioFilter();
  initModal();
  initContactForm();
  initServiceCardHover();

  // Re-init magnetic on page changes
  document.addEventListener('pageChange', () => {
    setTimeout(() => {
      initMagneticButtons();
      initRevealAnimations();
      initPortfolioFilter();
    }, 100);
  });
});