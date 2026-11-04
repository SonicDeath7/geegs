import './cs-denisa.css';

// -------------------------------------------------------------
// SACRED GLYPH BRAND ANIMATION
// Gothic Blackletter Typography with Interactive ASCII & Pixel Crumble Physics
// -------------------------------------------------------------

interface Shard {
  ox: number;       // Original Home X
  oy: number;       // Original Home Y
  x: number;        // Current X
  y: number;        // Current Y
  vx: number;       // Velocity X
  vy: number;       // Velocity Y
  angle: number;    // Rotation
  vAngle: number;   // Angular velocity
  size: number;     // Particle size
  alpha: number;    // Opacity
  color: string;    // CSS color sampled from text gradient
  char?: string;    // ASCII character (e.g. ':', '·', '✦', '+', '░', '▒', '*', '#', '†', '‡')
  isChar: boolean;
  mass: number;     // Physical mass for varied inertia
}

interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  size: number;
  color: string;
  char: string;
}

const ASCII_GLYPHS = [':', '·', '✦', '+', '░', '▒', '*', '#', '†', '‡', '✧', '%', 'x', '▪', '▫'];

export class SacredGlyphBrand {
  private container: HTMLElement | null = null;
  private h1Element: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private shards: Shard[] = [];
  private embers: Ember[] = [];
  private isHovered: boolean = false;
  private mouseX: number = -999;
  private mouseY: number = -999;
  private animFrameId: number | null = null;
  private isResting: boolean = true;
  private width: number = 660;
  private height: number = 130;
  private fontSize: number = 76;
  private dpr: number = 1;
  private titleText: string = '[APP_NAME] // MULTI-ENGINE SYSTEM';
  private themeObserver: MutationObserver | null = null;

  constructor(containerId: string = 'welcome-brand-anim-box') {
    this.container = document.getElementById(containerId) || document.getElementById('welcome-brand-wrap');
    if (!this.container) return;

    this.h1Element = this.container.querySelector('h1') || document.getElementById('welcome-brand-title');

    this.canvas = this.container.querySelector('canvas') ||
      document.getElementById('welcome-brand-canvas') as HTMLCanvasElement;
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'welcome-brand-canvas';
      this.canvas.className = 'welcome-brand-canvas';
      this.container.appendChild(this.canvas);
    }

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) return;

    this.setupSizing();
    this.bindEvents();
    this.observeTheme();

    // Ensure gothic & pixel font is loaded before initial rasterization
    this.ensureFontsAndInit();
  }

  public refresh() {
    this.setupSizing();
    this.rasterizeText();
  }

  private setupSizing() {
    if (!this.canvas || !this.container) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    const rect = this.h1Element ? this.h1Element.getBoundingClientRect() : this.container.getBoundingClientRect();
    const targetW = Math.max(600, Math.min(rect.width + 160, 920));
    const targetH = Math.max(100, Math.min(rect.height + 60, 150));

    this.width = Math.round(targetW);
    this.height = Math.round(targetH);
    this.fontSize = Math.min(44, Math.floor(targetW / 21));

    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    if (this.ctx) {
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
  }

  private ensureFontsAndInit() {
    if ('fonts' in document) {
      Promise.all([
        (document as any).fonts.load(`${this.fontSize}px "CS Denisa Halfpixel Top Demo"`),
        (document as any).fonts.load(`400 ${this.fontSize}px "CS Denisa Halfpixel Top Demo"`),
        (document as any).fonts.load(`700 ${this.fontSize}px UnifrakturCook`),
        (document as any).fonts.load(`${this.fontSize}px UnifrakturMaguntia`)
      ]).then(() => {
        this.rasterizeText();
      }).catch(() => {
        this.rasterizeText();
      });

      (document as any).fonts.ready.then(() => {
        this.rasterizeText();
      });
    } else {
      setTimeout(() => {
        this.rasterizeText();
      }, 150);
    }
  }

  private observeTheme() {
    this.themeObserver = new MutationObserver(() => {
      this.rasterizeText();
    });

    this.themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    });
  }

  private rasterizeText() {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = this.width;
    offCanvas.height = this.height;
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    if (!offCtx) return;

    const isDark = document.body.getAttribute('data-theme') === 'dark';

    offCtx.clearRect(0, 0, this.width, this.height);
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.font = `400 ${this.fontSize}px "CS Denisa Halfpixel Top Demo", "UnifrakturCook", monospace, serif`;

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // Create vertical gradient matching theme
    const grad = offCtx.createLinearGradient(0, centerY - this.fontSize * 0.45, 0, centerY + this.fontSize * 0.45);
    if (isDark) {
      grad.addColorStop(0, '#cfcefe');
      grad.addColorStop(0.45, '#8f8eec');
      grad.addColorStop(1, '#5956cb');
    } else {
      grad.addColorStop(0, '#ecc3f4');
      grad.addColorStop(0.45, '#be75c8');
      grad.addColorStop(1, '#8f4699');
    }
    offCtx.fillStyle = grad;

    offCtx.fillText(this.titleText, centerX, centerY);

    const imgData = offCtx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;

    const newShards: Shard[] = [];

    // Sample the text pixels at a fine 2.8px grid step to generate ASCII & pixel particles
    const step = 2.8;
    for (let y = 1; y < this.height - 1; y += step) {
      for (let x = 1; x < this.width - 1; x += step) {
        const px = Math.floor(x);
        const py = Math.floor(y);
        const idx = (py * this.width + px) * 4;
        const alpha = data[idx + 3];

        if (alpha > 45) {
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const colorStr = `rgb(${r}, ${g}, ${b})`;

          // 55% ASCII characters, 45% square pixel blocks
          const isChar = Math.random() < 0.55;
          const char = isChar ? ASCII_GLYPHS[Math.floor(Math.random() * ASCII_GLYPHS.length)] : undefined;

          newShards.push({
            ox: x,
            oy: y,
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            angle: 0,
            vAngle: 0,
            size: isChar ? 3.4 : 2.5 + Math.random() * 1.5,
            alpha: alpha / 255,
            color: colorStr,
            char: char,
            isChar: isChar,
            mass: 0.8 + Math.random() * 0.7
          });
        }
      }
    }

    this.shards = newShards;
  }

  private triggerCrumble(mx: number, my: number, burstPower: number = 1.0) {
    this.isResting = false;

    // Show canvas overlay and hide static h1 text
    if (this.canvas) this.canvas.style.opacity = '1';
    if (this.h1Element) this.h1Element.style.opacity = '0';

    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const accentColor = isDark ? '#8f8eec' : '#be75c8';

    // Disintegrate each shard with radial impulse away from cursor
    for (const s of this.shards) {
      const dx = s.x - mx;
      const dy = s.y - my;
      const dist = Math.hypot(dx, dy) || 1;

      const blastPower = ((4.0 + Math.random() * 4.5) * burstPower) / s.mass;
      const blastAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.8;

      s.vx = Math.cos(blastAngle) * blastPower + (Math.random() - 0.5) * 3;
      s.vy = Math.sin(blastAngle) * blastPower + (Math.random() - 0.5) * 3 - Math.random() * 2.0;
      s.vAngle = (Math.random() - 0.5) * 0.5;
    }

    // Spawn floating ASCII spark embers
    for (let i = 0; i < 28; i++) {
      this.embers.push({
        x: mx + (Math.random() - 0.5) * 50,
        y: my + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 4.0,
        vy: -Math.random() * 3.0 - 1.0,
        alpha: 1,
        decay: 0.025 + Math.random() * 0.035,
        size: 2.0 + Math.random() * 2.5,
        color: Math.random() < 0.6 ? accentColor : '#ffffff',
        char: ASCII_GLYPHS[Math.floor(Math.random() * ASCII_GLYPHS.length)]
      });
    }

    this.startLoop();
  }

  private startLoop() {
    if (this.animFrameId !== null) return;
    const update = () => {
      this.step();
      if (!this.isResting) {
        this.animFrameId = requestAnimationFrame(update);
      } else {
        this.animFrameId = null;
        this.onRest();
      }
    };
    this.animFrameId = requestAnimationFrame(update);
  }

  private onRest() {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
    // Return to static pristine HTML text
    if (this.canvas) this.canvas.style.opacity = '0';
    if (this.h1Element) this.h1Element.style.opacity = '1';
  }

  private step() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    let totalDisplacement = 0;
    let maxVelocity = 0;

    const mx = this.mouseX;
    const my = this.mouseY;

    this.ctx.save();

    for (let i = 0; i < this.shards.length; i++) {
      const s = this.shards[i];

      if (this.isHovered) {
        // --- HOVER STATE: CRUMBLE, RADIAL CURSOR REPULSION & TURBULENCE ---
        const dx = s.x - mx;
        const dy = s.y - my;
        const dist = Math.hypot(dx, dy);

        // Repel from moving cursor
        if (dist < 85) {
          const force = (1 - dist / 85) * (4.5 / s.mass);
          const angle = Math.atan2(dy, dx);
          s.vx += Math.cos(angle) * force;
          s.vy += Math.sin(angle) * force;
        }

        // Ambient mystical jitter & slight downward/upward dust drift
        s.vx += (Math.random() - 0.5) * 0.28;
        s.vy += (Math.random() - 0.5) * 0.28 + 0.03;

        // Friction / drag
        s.vx *= 0.92;
        s.vy *= 0.92;
        s.vAngle *= 0.94;

        s.x += s.vx;
        s.y += s.vy;
        s.angle += s.vAngle;

        const vel = Math.hypot(s.vx, s.vy);
        if (vel > maxVelocity) maxVelocity = vel;
      } else {
        // --- RESTORATION STATE: RETURN & SNAP BACK HOME (SPRING PHYSICS) ---
        const dx = s.ox - s.x;
        const dy = s.oy - s.y;
        const dist = Math.hypot(dx, dy);

        totalDisplacement += dist;

        // Harmonic spring attraction to home coordinate
        const spring = 0.16;
        const damping = 0.78;

        s.vx = (s.vx + dx * spring) * damping;
        s.vy = (s.vy + dy * spring) * damping;
        s.vAngle = (s.vAngle - s.angle * spring) * damping;

        s.x += s.vx;
        s.y += s.vy;
        s.angle += s.vAngle;

        const vel = Math.hypot(s.vx, s.vy);
        if (vel > maxVelocity) maxVelocity = vel;

        // Snap when close enough
        if (dist < 0.4 && vel < 0.1) {
          s.x = s.ox;
          s.y = s.oy;
          s.vx = 0;
          s.vy = 0;
          s.angle = 0;
          s.vAngle = 0;
        }
      }

      // Render the shard
      this.ctx.save();
      this.ctx.translate(s.x, s.y);
      if (s.angle !== 0) {
        this.ctx.rotate(s.angle);
      }

      this.ctx.globalAlpha = Math.max(0.2, s.alpha);

      if (s.isChar && s.char) {
        // Render ASCII glyph particle
        this.ctx.fillStyle = s.color;
        this.ctx.font = 'bold 11px "Share Tech Mono", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(s.char, 0, 0);
      } else {
        // Render square pixel fragment
        this.ctx.fillStyle = s.color;
        const half = s.size / 2;
        this.ctx.fillRect(-half, -half, s.size, s.size);
      }

      this.ctx.restore();
    }

    this.ctx.restore();

    // 2. Update and draw floating ASCII spark embers
    for (let j = this.embers.length - 1; j >= 0; j--) {
      const e = this.embers[j];
      e.x += e.vx;
      e.y += e.vy;
      e.vx *= 0.95;
      e.vy -= 0.05; // float upward
      e.alpha -= e.decay;

      if (e.alpha <= 0) {
        this.embers.splice(j, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, e.alpha);
      this.ctx.fillStyle = e.color;
      this.ctx.font = '9px "Share Tech Mono", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(e.char, e.x, e.y);
      this.ctx.restore();
    }

    // Check if fully reconstituted and at rest
    if (!this.isHovered && totalDisplacement < 4 && maxVelocity < 0.15 && this.embers.length === 0) {
      this.isResting = true;
    }
  }

  private bindEvents() {
    if (!this.container) return;

    const triggerFromEvent = (e: MouseEvent, burstMultiplier: number = 1.0) => {
      const rect = this.canvas ? this.canvas.getBoundingClientRect() : this.container!.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;

      if (!this.isHovered) {
        this.isHovered = true;
        this.triggerCrumble(this.mouseX, this.mouseY, burstMultiplier);
      }
    };

    this.container.addEventListener('mouseenter', (e: MouseEvent) => {
      triggerFromEvent(e, 1.0);
    });

    this.container.addEventListener('mousemove', (e: MouseEvent) => {
      triggerFromEvent(e, 0.4);
    });

    this.container.addEventListener('click', (e: MouseEvent) => {
      const rect = this.canvas ? this.canvas.getBoundingClientRect() : this.container!.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
      this.triggerCrumble(this.mouseX, this.mouseY, 1.8);
    });

    this.container.addEventListener('mouseleave', () => {
      this.isHovered = false;
      this.mouseX = -999;
      this.mouseY = -999;
      this.startLoop();
    });

    // Touch support for tablets / touch displays
    this.container.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length > 0) {
        this.isHovered = true;
        const rect = this.canvas ? this.canvas.getBoundingClientRect() : this.container!.getBoundingClientRect();
        this.mouseX = e.touches[0].clientX - rect.left;
        this.mouseY = e.touches[0].clientY - rect.top;
        this.triggerCrumble(this.mouseX, this.mouseY, 1.3);
      }
    }, { passive: true });

    this.container.addEventListener('touchmove', (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = this.canvas ? this.canvas.getBoundingClientRect() : this.container!.getBoundingClientRect();
        this.mouseX = e.touches[0].clientX - rect.left;
        this.mouseY = e.touches[0].clientY - rect.top;
      }
    }, { passive: true });

    this.container.addEventListener('touchend', () => {
      this.isHovered = false;
      this.mouseX = -999;
      this.mouseY = -999;
      this.startLoop();
    });

    // Window resize
    window.addEventListener('resize', () => {
      this.setupSizing();
      this.rasterizeText();
    });
  }

  public destroy() {
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
  }
}

export function initSacredGlyphBrand(containerId: string = 'welcome-brand-anim-box'): SacredGlyphBrand {
  return new SacredGlyphBrand(containerId);
}
