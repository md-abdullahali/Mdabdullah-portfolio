/* ================================================================
   3D PORTFOLIO JS — Md Abdullah Ali
   Three.js Galaxy Background + Full 3D Interactions
================================================================ */

'use strict';

// ==================== THREE.JS 3D BACKGROUND SCENE ====================
class ThreeBackground {
  constructor() {
    this.canvas = document.getElementById('bg-canvas');
    if (!this.canvas || !window.THREE) return;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
    this.mouse = { x: 0, y: 0 };
    this.clock = new THREE.Clock();
    this.init();
  }

  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.camera.position.z = 5;

    this.createGalaxy();
    this.createNebula();
    this.createFloatingCubes();
    this.bindEvents();
    this.animate();
  }

  createGalaxy() {
    const count = 6000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const palette = [
      new THREE.Color(0x7c5cfc),
      new THREE.Color(0x00f5d4),
      new THREE.Color(0xff6bcb),
      new THREE.Color(0xa29bfe),
    ];
    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 12 + 1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      sizes[i] = Math.random() * 3 + 0.5;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float time;
        void main() {
          vColor = color;
          vec3 pos = position;
          pos.y += sin(time * 0.5 + position.x) * 0.05;
          pos.x += cos(time * 0.3 + position.z) * 0.05;
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (200.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.3, 0.5, d);
          gl_FragColor = vec4(vColor, alpha * 0.8);
        }
      `,
      transparent: true, vertexColors: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.stars = new THREE.Points(geo, mat);
    this.scene.add(this.stars);
    this.starMat = mat;
  }

  createNebula() {
    const geo = new THREE.SphereGeometry(8, 32, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x7c5cfc, transparent: true, opacity: 0.03,
      wireframe: true, blending: THREE.AdditiveBlending,
    });
    this.nebula = new THREE.Mesh(geo, mat);
    this.scene.add(this.nebula);
  }

  createFloatingCubes() {
    this.cubes = [];
    const colors = [0x7c5cfc, 0x00f5d4, 0xff6bcb];
    for (let i = 0; i < 8; i++) {
      const size = Math.random() * 0.3 + 0.1;
      const geo = new THREE.BoxGeometry(size, size, size);
      const mat = new THREE.MeshBasicMaterial({
        color: colors[i % 3], wireframe: true, transparent: true, opacity: 0.6,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 5
      );
      mesh.userData.speedX = (Math.random() - 0.5) * 0.01;
      mesh.userData.speedY = (Math.random() - 0.5) * 0.01;
      mesh.userData.speedR = (Math.random() - 0.5) * 0.02;
      this.cubes.push(mesh);
      this.scene.add(mesh);
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const elapsed = this.clock.getElapsedTime();
    if (this.starMat) this.starMat.uniforms.time.value = elapsed;
    if (this.stars) {
      this.stars.rotation.y = elapsed * 0.02;
      this.stars.rotation.x = elapsed * 0.01;
    }
    if (this.nebula) {
      this.nebula.rotation.y = elapsed * 0.03;
      this.nebula.rotation.x = elapsed * 0.015;
    }
    this.camera.position.x += (this.mouse.x * 0.5 - this.camera.position.x) * 0.05;
    this.camera.position.y += (this.mouse.y * 0.5 - this.camera.position.y) * 0.05;
    this.camera.lookAt(this.scene.position);
    this.cubes.forEach(c => {
      c.rotation.x += c.userData.speedR;
      c.rotation.y += c.userData.speedR * 0.7;
      c.position.y += Math.sin(elapsed + c.position.x) * 0.002;
    });
    this.renderer.render(this.scene, this.camera);
  }
}

// ==================== CURSOR GLOW ====================
class CursorGlow {
  constructor() {
    this.el = document.getElementById('cursorGlow');
    if (!this.el) return;
    this.x = 0; this.y = 0;
    this.cx = 0; this.cy = 0;
    window.addEventListener('mousemove', e => { this.x = e.clientX; this.y = e.clientY; });
    this.loop();
  }
  loop() {
    this.cx += (this.x - this.cx) * 0.08;
    this.cy += (this.y - this.cy) * 0.08;
    this.el.style.left = this.cx + 'px';
    this.el.style.top = this.cy + 'px';
    requestAnimationFrame(() => this.loop());
  }
}

// ==================== NAVBAR ====================
class Navbar {
  constructor() {
    this.nav = document.getElementById('navbar');
    this.toggle = document.getElementById('navToggle');
    this.menu = document.getElementById('navMenu');
    this.links = document.querySelectorAll('.nav-link');
    this.init();
  }
  init() {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) this.nav.classList.add('scrolled');
      else this.nav.classList.remove('scrolled');
      this.updateActive();
    });
    this.toggle?.addEventListener('click', () => {
      this.toggle.classList.toggle('active');
      this.menu.classList.toggle('open');
    });
    this.links.forEach(link => link.addEventListener('click', () => {
      this.toggle?.classList.remove('active');
      this.menu?.classList.remove('open');
    }));
  }
  updateActive() {
    const sections = document.querySelectorAll('section[id]');
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 200) current = s.id;
    });
    this.links.forEach(l => {
      l.classList.remove('active');
      if (l.dataset.section === current) l.classList.add('active');
    });
  }
}

// ==================== TYPING EFFECT ====================
class TypeWriter {
  constructor() {
    this.el = document.getElementById('heroRole');
    if (!this.el) return;
    this.texts = ['Full Stack Developer', 'Data Analyst', 'ML Engineer', 'Problem Solver', 'YouTuber'];
    this.idx = 0; this.charIdx = 0; this.deleting = false;
    this.type();
  }
  type() {
    const cur = this.texts[this.idx];
    this.el.textContent = this.deleting
      ? cur.substring(0, this.charIdx--)
      : cur.substring(0, this.charIdx++);
    let delay = this.deleting ? 60 : 100;
    if (!this.deleting && this.charIdx === cur.length + 1) { delay = 2000; this.deleting = true; }
    else if (this.deleting && this.charIdx === 0) { this.deleting = false; this.idx = (this.idx + 1) % this.texts.length; delay = 300; }
    setTimeout(() => this.type(), delay);
  }
}

// ==================== SCROLL ANIMATIONS ====================
class ScrollAnimator {
  constructor() {
    this.els = document.querySelectorAll('[data-animate]');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('animated'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    this.els.forEach(el => obs.observe(el));
  }
}

// ==================== COUNTER ANIMATION ====================
class Counter {
  constructor() {
    this.els = document.querySelectorAll('.counter-number, .stat-number, .count-number');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { this.animate(e.target); obs.unobserve(e.target); } });
    }, { threshold: 0.5 });
    this.els.forEach(el => obs.observe(el));
  }
  animate(el) {
    const target = parseInt(el.dataset.target);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current);
      if (current >= target) clearInterval(timer);
    }, 16);
  }
}

// ==================== SKILL BARS ====================
class SkillBars {
  constructor() {
    const bars = document.querySelectorAll('.skill-progress');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.width = e.target.dataset.width + '%';
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    bars.forEach(b => obs.observe(b));
  }
}

// ==================== 3D CARD TILT ====================
class CardTilt {
  constructor() {
    const cards = document.querySelectorAll('.project-card, .contact-card, .timeline-content, .counter-item');
    cards.forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        card.style.transform = `
          perspective(600px)
          rotateX(${-dy * 12}deg)
          rotateY(${dx * 12}deg)
          translateZ(20px)
          scale(1.02)
        `;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)';
      });
    });
  }
}

// ==================== ABOUT IMAGE 3D TILT ====================
class AboutTilt {
  constructor() {
    const card = document.querySelector('.about-image-card');
    if (!card) return;
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      card.style.transform = `rotateY(${dx * 18}deg) rotateX(${-dy * 12}deg) translateZ(40px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.7s cubic-bezier(0.34,1.56,0.64,1)';
    });
  }
}

// ==================== BACK TO TOP ====================
class BackToTop {
  constructor() {
    this.btn = document.getElementById('backToTop');
    if (!this.btn) return;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) this.btn.classList.add('visible');
      else this.btn.classList.remove('visible');
    });
  }
}

// ==================== 3D SECTION PARALLAX ====================
class Parallax3D {
  constructor() {
    this.sections = document.querySelectorAll('.section');
    window.addEventListener('scroll', () => this.update());
    window.addEventListener('mousemove', e => {
      const mx = (e.clientX / window.innerWidth - 0.5);
      const my = (e.clientY / window.innerHeight - 0.5);
      document.querySelectorAll('.floating-card').forEach((c, i) => {
        const depth = (i + 1) * 8;
        c.style.transform = `translate(${mx * depth}px, ${my * depth}px) rotateX(${-my * 15}deg) rotateY(${mx * 15}deg)`;
      });
    });
  }
  update() {
    const scrollY = window.scrollY;
    this.sections.forEach(s => {
      const top = s.getBoundingClientRect().top;
      const parallaxFactor = top * 0.1;
      const sectionHeader = s.querySelector('.section-header');
      if (sectionHeader) sectionHeader.style.transform = `translateZ(${parallaxFactor * 0.5}px)`;
    });
  }
}

// ==================== GLITCH EFFECT ON NAME ====================
class GlitchEffect {
  constructor() {
    const name = document.querySelector('.hero-name');
    if (!name) return;
    setInterval(() => {
      name.style.animation = 'none';
      name.style.filter = `drop-shadow(0 0 20px rgba(124,92,252,0.8)) drop-shadow(2px 0 rgba(255,107,203,0.6))`;
      setTimeout(() => {
        name.style.filter = 'drop-shadow(0 0 20px rgba(124,92,252,0.5))';
        name.style.animation = '';
      }, 150);
    }, 5000);
  }
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  // Three.js requires CDN
  if (window.THREE) new ThreeBackground();
  else {
    // Fallback: animated starfield on canvas
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
      canvas.style.opacity = '0.7';
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const stars = Array.from({ length: 200 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.2,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        color: ['#7c5cfc','#00f5d4','#ff6bcb','#a29bfe'][Math.floor(Math.random()*4)],
        alpha: Math.random(),
      }));
      const drawStars = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stars.forEach(s => {
          s.x = (s.x + s.dx + canvas.width) % canvas.width;
          s.y = (s.y + s.dy + canvas.height) % canvas.height;
          s.alpha = 0.3 + Math.sin(Date.now() * 0.001 + s.x) * 0.3;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          const hexAlpha = Math.floor(s.alpha * 255).toString(16).padStart(2, '0');
          ctx.fillStyle = s.color + hexAlpha;
          ctx.fill();
        });
        requestAnimationFrame(drawStars);
      };
      drawStars();
      window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      });
    }
  }

  new CursorGlow();
  new Navbar();
  new TypeWriter();
  new ScrollAnimator();
  new Counter();
  new SkillBars();
  new CardTilt();
  new AboutTilt();
  new BackToTop();
  new Parallax3D();
  new GlitchEffect();

  console.log('%c🚀 3D Portfolio Loaded — Md Abdullah Ali', 'color:#7c5cfc;font-size:16px;font-weight:bold;');
});
