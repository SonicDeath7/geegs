import './cs-denisa.css';

// -------------------------------------------------------------
// SACRED GLYPH BRAND ANIMATION
// Gothic Blackletter Typography with Interactive Crumble & Reconstitution Physics
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
  color: string;    // CSS color
  rune?: string;    // Occasional sacred symbol (e.g. †, ‡, ✦, ·, ᛟ)
  isRune: boolean;
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
}

export class SacredGlyphBrand {
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private shards: Shard[] = [];
  private embers: Ember[] = [];
  private isHovered: boolean = false;
  private mouseX: number = -999;
  private mouseY: number = -999;
  private animFrameId: number | null = null;
  private isResting: boolean = true;
  private width: number = 620;
  private height: number = 72;
  private fontSize: number = 54;
  private dpr: number = 1;
  private titleText: string = 'Sacred Glyph';
  private themeObserver: MutationObserver | null = null;

  constructor(containerId: string = 'start-menu-brand', options?: { width?: number; height?: number; fontSize?: number }) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    if (options?.width) this.width = options.width;
    if (options?.height) this.height = options.height;
    if (options?.fontSize) this.fontSize = options.fontSize;

    this.canvas = this.container.querySelector('canvas') ||
      document.getElementById('start-menu-brand-canvas') as HTMLCanvasElement ||
      document.getElementById('brand-canvas') as HTMLCanvasElement;
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'start-menu-brand-canvas';
      this.container.appendChild(this.canvas);
    }

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) return;

    this.setupSizing();
    this.bindEvents();
    this.observeTheme();

    // Ensure gothic and pixel font is loaded before initial rasterization
    this.ensureFontsAndInit();
  }

  public setTitle(text: string) {
    if (text && text !== this.titleText) {
      this.titleText = text;
      this.rasterizeText();
      this.drawIntact();
    }
  }

  public refresh() {
    this.setupSizing();
    this.rasterizeText();
    if (this.isResting) {
      this.drawIntact();
    }
  }

  private setupSizing() {
    if (!this.canvas) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const availableWidth = this.container ? (this.container.clientWidth || 620) : 620;
    this.width = Math.max(340, Math.min(availableWidth, 640));
    this.height = 72;
    this.fontSize = this.width < 500 ? 44 : 54;

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
        this.drawIntact();
      }).catch(() => {
        this.rasterizeText();
        this.drawIntact();
      });

      // Also listen on document.fonts.ready for late font resolution
      (document as any).fonts.ready.then(() => {
        this.rasterizeText();
        if (this.isResting) {
          this.drawIntact();
        }
      });
    } else {
      setTimeout(() => {
        this.rasterizeText();
        this.drawIntact();
      }, 150);
    }
  }

  private observeTheme() {
    this.themeObserver = new MutationObserver(() => {
      this.rasterizeText();
      if (this.isResting) {
        this.drawIntact();
      }
    });

    this.themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    });
  }

  private getThemeColor(): { primary: string; accent: string; glow: string } {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    if (isDark) {
      return {
        primary: '#f0f3e8',
        accent: '#00ff66',
        glow: 'rgba(0, 255, 102, 0.45)'
      };
    } else {
      return {
        primary: '#161714',
        accent: '#008833',
        glow: 'rgba(0, 136, 51, 0.3)'
      };
    }
  }

  private rasterizeText() {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = this.width;
    offCanvas.height = this.height;
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    if (!offCtx) return;

    const colors = this.getThemeColor();

    // Render Gothic and pixel text to offscreen canvas
    offCtx.clearRect(0, 0, this.width, this.height);
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.font = `400 ${this.fontSize}px "CS Denisa Halfpixel Top Demo", "UnifrakturCook", "UnifrakturMaguntia", serif`;
    offCtx.fillStyle = colors.primary;

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    offCtx.fillText(this.titleText, centerX, centerY);

    const imgData = offCtx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;

    const sacredRunes = ['†', '‡', '✦', '·', '✧', 'ᛟ', 'ᚱ', '𐍈', '░'];
    const newShards: Shard[] = [];

    // Sample the text pixels at a fine 2.5px step to generate interactive shards
    const step = 2.5;
    for (let y = 1; y < this.height - 1; y += step) {
      for (let x = 1; x < this.width - 1; x += step) {
        const px = Math.floor(x);
        const py = Math.floor(y);
        const idx = (py * this.width + px) * 4;
        const alpha = data[idx + 3];

        if (alpha > 45) {
          const isSpecialRune = Math.random() < 0.08;
          const isAccent = Math.random() < 0.12;

          let shardColor = colors.primary;
          if (isAccent) {
            shardColor = colors.accent;
          }

          newShards.push({
            ox: x,
            oy: y,
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            angle: 0,
            vAngle: 0,
            size: isSpecialRune ? 3.6 : 2.2 + Math.random() * 1.3,
            alpha: alpha / 255,
            color: shardColor,
            rune: isSpecialRune ? sacredRunes[Math.floor(Math.random() * sacredRunes.length)] : undefined,
            isRune: isSpecialRune,
            mass: 0.8 + Math.random() * 0.6
          });
        }
      }
    }

    this.shards = newShards;
  }

  private drawIntact() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    const colors = this.getThemeColor();
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    this.ctx.save();
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.font = `400 ${this.fontSize}px "CS Denisa Halfpixel Top Demo", "UnifrakturCook", "UnifrakturMaguntia", serif`;

    // Subtle atmospheric shadow
    this.ctx.shadowColor = colors.glow;
    this.ctx.shadowBlur = 4;
    this.ctx.fillStyle = colors.primary;
    this.ctx.fillText(this.titleText, centerX, centerY);

    // Subtle ornate flank cross marks
    this.ctx.font = '18px "UnifrakturCook", "UnifrakturMaguntia", serif';
    this.ctx.fillStyle = colors.accent;
    this.ctx.shadowBlur = 2;
    this.ctx.fillText('†', 22, centerY);
    this.ctx.fillText('†', this.width - 22, centerY);

    this.ctx.restore();
    this.isResting = true;
  }

  private triggerCrumble(mx: number, my: number) {
    this.isResting = false;
    const colors = this.getThemeColor();

    // Give each shard a shatter impulse away from the entry point
    for (const s of this.shards) {
      const dx = s.x - mx;
      const dy = s.y - my;
      const dist = Math.hypot(dx, dy) || 1;

      // Blast force drops off slightly with distance
      const blastPower = (3.5 + Math.random() * 4.5) / s.mass;
      const blastAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.9;

      s.vx = Math.cos(blastAngle) * blastPower + (Math.random() - 0.5) * 3;
      s.vy = Math.sin(blastAngle) * blastPower + (Math.random() - 0.5) * 3 - Math.random() * 1.5;
      s.vAngle = (Math.random() - 0.5) * 0.45;
    }

    // Spawn sacred floating embers / sparks
    for (let i = 0; i < 22; i++) {
      this.embers.push({
        x: mx + (Math.random() - 0.5) * 40,
        y: my + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 3.5,
        vy: -Math.random() * 2.5 - 0.8,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.03,
        size: 1.5 + Math.random() * 2,
        color: Math.random() < 0.6 ? colors.accent : colors.primary
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
        this.drawIntact();
      }
    };
    this.animFrameId = requestAnimationFrame(update);
  }

  private step() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    const colors = this.getThemeColor();
    let totalDisplacement = 0;
    let maxVelocity = 0;

    const mx = this.mouseX;
    const my = this.mouseY;

    // 1. Update and draw shards
    this.ctx.save();

    for (let i = 0; i < this.shards.length; i++) {
      const s = this.shards[i];

      if (this.isHovered) {
        // --- HOVER STATE: CRUMBLE, RADIAL REPULSION & TURBULENCE ---
        const dx = s.x - mx;
        const dy = s.y - my;
        const dist = Math.hypot(dx, dy);

        // Repel from moving cursor
        if (dist < 55) {
          const force = (1 - dist / 55) * (3.5 / s.mass);
          const angle = Math.atan2(dy, dx);
          s.vx += Math.cos(angle) * force;
          s.vy += Math.sin(angle) * force;
        }

        // Ambient mystical jitter & slight downward/upward dust drift
        s.vx += (Math.random() - 0.5) * 0.25;
        s.vy += (Math.random() - 0.5) * 0.25 + 0.02;

        // Friction / drag
        s.vx *= 0.93;
        s.vy *= 0.93;
        s.vAngle *= 0.92;

        s.x += s.vx;
        s.y += s.vy;
        s.angle += s.vAngle;

        // Soft containment bounce near canvas boundary
        if (s.x < 4) { s.x = 4; s.vx *= -0.5; }
        if (s.x > this.width - 4) { s.x = this.width - 4; s.vx *= -0.5; }
        if (s.y < 2) { s.y = 2; s.vy *= -0.5; }
        if (s.y > this.height - 2) { s.y = this.height - 2; s.vy *= -0.5; }

      } else {
        // --- RESTORATION STATE: RETURN & SNAP BACK HOME (SPRING PHYSICS) ---
        const dx = s.ox - s.x;
        const dy = s.oy - s.y;
        const dist = Math.hypot(dx, dy);

        totalDisplacement += dist;

        // Harmonic spring attraction to home coordinate
        const spring = 0.14;
        const damping = 0.76;

        s.vx = (s.vx + dx * spring) * damping;
        s.vy = (s.vy + dy * spring) * damping;
        s.vAngle = (s.vAngle - s.angle * spring) * damping;

        s.x += s.vx;
        s.y += s.vy;
        s.angle += s.vAngle;

        const vel = Math.hypot(s.vx, s.vy);
        if (vel > maxVelocity) maxVelocity = vel;

        // Snap when close enough
        if (dist < 0.35 && vel < 0.08) {
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

      if (s.isRune && s.rune) {
        // Render sacred rune particle
        this.ctx.fillStyle = s.color;
        this.ctx.font = '10px "UnifrakturMaguntia", serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(s.rune, 0, 0);
      } else {
        // Render gothic pixel shard / fragment
        this.ctx.fillStyle = s.color;
        const half = s.size / 2;
        this.ctx.fillRect(-half, -half, s.size, s.size);
      }

      this.ctx.restore();
    }

    this.ctx.restore();

    // 2. Update and draw floating sacred embers
    for (let j = this.embers.length - 1; j >= 0; j--) {
      const e = this.embers[j];
      e.x += e.vx;
      e.y += e.vy;
      e.vx *= 0.96;
      e.vy -= 0.04; // float upward
      e.alpha -= e.decay;

      if (e.alpha <= 0 || e.y < 0) {
        this.embers.splice(j, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = e.alpha;
      this.ctx.fillStyle = e.color;
      this.ctx.shadowColor = colors.glow;
      this.ctx.shadowBlur = 4;
      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // Check if fully restored to intact state
    if (!this.isHovered) {
      if (totalDisplacement < 0.5 && maxVelocity < 0.05 && this.embers.length === 0) {
        this.isResting = true;
      }
    }
  }

  private bindEvents() {
    if (!this.container) return;

    this.container.addEventListener('mouseenter', (e: MouseEvent) => {
      this.isHovered = true;
      const rect = this.container!.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
      this.triggerCrumble(this.mouseX, this.mouseY);
    });

    this.container.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = this.container!.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
      if (!this.isHovered) {
        this.isHovered = true;
        this.triggerCrumble(this.mouseX, this.mouseY);
      }
    });

    this.container.addEventListener('mouseleave', () => {
      this.isHovered = false;
      this.mouseX = -999;
      this.mouseY = -999;
      // Start spring return loop if not running
      this.startLoop();
    });

    // Touch support for mobile / tablets
    this.container.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length > 0) {
        this.isHovered = true;
        const rect = this.container!.getBoundingClientRect();
        this.mouseX = e.touches[0].clientX - rect.left;
        this.mouseY = e.touches[0].clientY - rect.top;
        this.triggerCrumble(this.mouseX, this.mouseY);
      }
    }, { passive: true });

    this.container.addEventListener('touchend', () => {
      this.isHovered = false;
      this.mouseX = -999;
      this.mouseY = -999;
      this.startLoop();
    });

    // Resize handling
    window.addEventListener('resize', () => {
      this.setupSizing();
      this.rasterizeText();
      if (this.isResting) {
        this.drawIntact();
      }
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

export function initSacredGlyphBrand(
  containerId: string = 'start-menu-brand',
  options?: { width?: number; height?: number; fontSize?: number }
): SacredGlyphBrand {
  return new SacredGlyphBrand(containerId, options);
}
