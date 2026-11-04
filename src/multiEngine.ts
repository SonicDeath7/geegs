/**
 * ============================================================================
 * [APP_NAME] // MULTI-ENGINE SYSTEM
 * Combined ASCII Dithering Engine with 5 Experimental Graphics Engines:
 * 1. SHADR STUDIO    - Generative Mathematical & Fractal ASCII Art
 * 2. AIKIZI LAB      - Procedural Simplex/Perlin Noise & Organic Textures
 * 3. MODULY          - Deep Modularity, Feedback Loops & Universal LFO Modulation
 * 4. MAKE NEUE WORLD - Experimental Dynamic Typographic Scale & Fluid Scatter
 * 5. GLCHLAB         - Hardware Analog Glitch, Datamosh & RGB Displacement
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// FAST 2D/3D SIMPLEX NOISE ALGORITHM (Zero Dependency, Sub-millisecond 60 FPS)
// ----------------------------------------------------------------------------
export class SimplexNoise {
  private p: Uint8Array = new Uint8Array(256);
  private perm: Uint8Array = new Uint8Array(512);
  private permMod12: Uint8Array = new Uint8Array(512);

  private readonly grad3: Float32Array = new Float32Array([
    1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0,
    1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1,
    0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1
  ]);

  constructor(seed = 1337) {
    for (let i = 0; i < 256; i++) {
      this.p[i] = i;
    }
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      const tmp = this.p[i];
      this.p[i] = this.p[j];
      this.p[j] = tmp;
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  noise2D(xin: number, yin: number): number {
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

    let n0 = 0, n1 = 0, n2 = 0;
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;

    let i1 = 0, j1 = 0;
    if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1.0 + 2.0 * G2;
    const y2 = y0 - 1.0 + 2.0 * G2;

    const ii = i & 255;
    const jj = j & 255;
    const gi0 = this.permMod12[ii + this.perm[jj]] * 3;
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]] * 3;
    const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]] * 3;

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 > 0) {
      t0 *= t0;
      n0 = t0 * t0 * (this.grad3[gi0] * x0 + this.grad3[gi0 + 1] * y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 > 0) {
      t1 *= t1;
      n1 = t1 * t1 * (this.grad3[gi1] * x1 + this.grad3[gi1 + 1] * y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 > 0) {
      t2 *= t2;
      n2 = t2 * t2 * (this.grad3[gi2] * x2 + this.grad3[gi2 + 1] * y2);
    }

    return 70.0 * (n0 + n1 + n2);
  }

  noise3D(x: number, y: number, z: number): number {
    const F3 = 1.0 / 3.0;
    const G3 = 1.0 / 6.0;

    let n0 = 0, n1 = 0, n2 = 0, n3 = 0;
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);
    const t = (i + j + k) * G3;
    const X0 = i - t;
    const Y0 = j - t;
    const Z0 = k - t;
    const x0 = x - X0;
    const y0 = y - Y0;
    const z0 = z - Z0;

    let i1 = 0, j1 = 0, k1 = 0;
    let i2 = 0, j2 = 0, k2 = 0;
    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }

    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2.0 * G3;
    const y2 = y0 - j2 + 2.0 * G3;
    const z2 = z0 - k2 + 2.0 * G3;
    const x3 = x0 - 1.0 + 3.0 * G3;
    const y3 = y0 - 1.0 + 3.0 * G3;
    const z3 = z0 - 1.0 + 3.0 * G3;

    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    const gi0 = this.permMod12[ii + this.perm[jj + this.perm[kk]]] * 3;
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]] * 3;
    const gi2 = this.permMod12[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]] * 3;
    const gi3 = this.permMod12[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]] * 3;

    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 > 0) {
      t0 *= t0;
      n0 = t0 * t0 * (this.grad3[gi0] * x0 + this.grad3[gi0 + 1] * y0 + this.grad3[gi0 + 2] * z0);
    }
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 > 0) {
      t1 *= t1;
      n1 = t1 * t1 * (this.grad3[gi1] * x1 + this.grad3[gi1 + 1] * y1 + this.grad3[gi1 + 2] * z1);
    }
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 > 0) {
      t2 *= t2;
      n2 = t2 * t2 * (this.grad3[gi2] * x2 + this.grad3[gi2 + 1] * y2 + this.grad3[gi2 + 2] * z2);
    }
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 > 0) {
      t3 *= t3;
      n3 = t3 * t3 * (this.grad3[gi3] * x3 + this.grad3[gi3 + 1] * y3 + this.grad3[gi3 + 2] * z3);
    }

    return 32.0 * (n0 + n1 + n2 + n3);
  }

  fbm2D(x: number, y: number, octaves = 3): number {
    let val = 0;
    let amp = 0.5;
    let freq = 1.0;
    for (let o = 0; o < octaves; o++) {
      val += this.noise2D(x * freq, y * freq) * amp;
      amp *= 0.5;
      freq *= 2.0;
    }
    return val;
  }
}

// ----------------------------------------------------------------------------
// 1. SHADR STUDIO ENGINE (Generative ASCII Graphics & Fractals)
// Generates ASCII art WITHOUT any loaded image using math formulas & fractals.
// Knobs: SINE SPEED, FREQ, FEEDBACK
// ----------------------------------------------------------------------------
export class ShadrStudioEngine {
  active = false;
  sineSpeed = 1.2;     // 0.1 .. 5.0
  freq = 4.0;          // 0.5 .. 20.0
  feedback = 0.65;     // 0.0 .. 0.98 (phosphor echo trail)
  formula: 'plasma' | 'julia' | 'moire' | 'torus' = 'plasma';

  private feedbackBuffer: Float32Array | null = null;
  private bufferCols = 0;
  private bufferRows = 0;

  resetFeedback() {
    if (this.feedbackBuffer) {
      this.feedbackBuffer.fill(0);
    }
  }

  generateFrame(
    cols: number,
    rows: number,
    timeSec: number,
    targetImageData: ImageData
  ): void {
    const totalPixels = cols * rows;
    if (!this.feedbackBuffer || this.bufferCols !== cols || this.bufferRows !== rows) {
      this.feedbackBuffer = new Float32Array(totalPixels);
      this.bufferCols = cols;
      this.bufferRows = rows;
    }

    const data = targetImageData.data;
    const fb = this.feedbackBuffer;
    const fbWeight = Math.min(0.98, Math.max(0.0, this.feedback));
    const invFb = 1.0 - fbWeight;
    const t = timeSec * this.sineSpeed;
    const f = this.freq * 0.08;
    const cx = cols / 2;
    const cy = rows / 2;

    for (let y = 0; y < rows; y++) {
      const rowOffset = y * cols;
      const ny = (y - cy) / cy;

      for (let x = 0; x < cols; x++) {
        const idx = rowOffset + x;
        const nx = (x - cx) / cx;
        let v = 0;

        if (this.formula === 'plasma') {
          // Multiphase Sine Plasma with Rotational Interference
          const v1 = Math.sin(x * f + t);
          const v2 = Math.sin(y * f + t * 1.3);
          const v3 = Math.sin((x * Math.cos(t * 0.4) + y * Math.sin(t * 0.4)) * f);
          const dist = Math.sqrt(nx * nx + ny * ny) * 8.0;
          const v4 = Math.sin(dist * f * 2.0 - t * 2.5);
          v = (v1 + v2 + v3 + v4) * 0.25; // in [-1, 1]
          v = v * 0.5 + 0.5; // in [0, 1]
        } else if (this.formula === 'julia') {
          // Dynamic Complex Julia Orbit Fold
          let zx = nx * 1.5;
          let zy = ny * 1.5;
          const cRe = Math.sin(t * 0.7) * 0.7885;
          const cIm = Math.cos(t * 0.5) * 0.7885;
          let iter = 0;
          const maxIter = 18;
          while (zx * zx + zy * zy < 4.0 && iter < maxIter) {
            const xtemp = zx * zx - zy * zy + cRe;
            zy = 2.0 * zx * zy + cIm;
            zx = xtemp;
            iter++;
          }
          v = iter / maxIter;
        } else if (this.formula === 'moire') {
          // High-frequency Moire interference ripple
          const d1 = Math.sqrt((x - cx + Math.sin(t) * 20) ** 2 + (y - cy + Math.cos(t) * 20) ** 2);
          const d2 = Math.sqrt((x - cx - Math.sin(t) * 20) ** 2 + (y - cy - Math.cos(t) * 20) ** 2);
          v = (Math.sin(d1 * f) + Math.sin(d2 * f)) * 0.5 * 0.5 + 0.5;
        } else {
          // Hyper-Torus harmonic projection
          const angle = Math.atan2(ny, nx);
          const r = Math.sqrt(nx * nx + ny * ny);
          v = (Math.sin(r * f * 10 - t * 3) * Math.cos(angle * 6 + t * 2)) * 0.5 + 0.5;
        }

        // Apply Phosphor Feedback Buffer (Temporal Echo Trail)
        const blended = fb[idx] * fbWeight + v * invFb;
        fb[idx] = blended;

        // Color mapping: generate vibrant analog signal colors
        const pixelIdx = idx * 4;
        const rVal = Math.floor(Math.sin(blended * Math.PI * 2 + 0.0) * 127 + 128);
        const gVal = Math.floor(Math.sin(blended * Math.PI * 2 + 2.0) * 127 + 128);
        const bVal = Math.floor(Math.sin(blended * Math.PI * 2 + 4.0) * 127 + 128);

        data[pixelIdx] = rVal;
        data[pixelIdx + 1] = gVal;
        data[pixelIdx + 2] = bVal;
        data[pixelIdx + 3] = 255;
      }
    }
  }
}

// ----------------------------------------------------------------------------
// 2. AIKIZI LAB ENGINE (Procedural Textures & Noise)
// Overlays organic Simplex noise before ASCII conversion for grime, grain, smoke.
// Knobs: NOISE SCALE, EVOLUTION
// ----------------------------------------------------------------------------
export class AikiziNoiseEngine {
  active = false;
  noiseScale = 14.0;    // 1.0 .. 50.0 (grain size)
  evolution = 1.0;      // 0.1 .. 5.0 (temporal change speed)
  intensity = 0.55;     // 0.0 .. 1.0
  mode: 'overlay' | 'add' | 'displace' | 'smoke' = 'overlay';

  private simplex: SimplexNoise = new SimplexNoise(4242);

  apply(imageData: ImageData, cols: number, rows: number, timeSec: number): void {
    if (!this.active || this.intensity <= 0.001) return;

    const data = imageData.data;
    const invScale = 1.0 / Math.max(1.0, this.noiseScale);
    const zCoord = timeSec * this.evolution * 0.35;
    const amount = this.intensity;

    for (let y = 0; y < rows; y++) {
      const rowOffset = y * cols;
      for (let x = 0; x < cols; x++) {
        const idx = (rowOffset + x) * 4;
        const rawNoise = this.simplex.noise3D(x * invScale, y * invScale, zCoord); // [-1, 1]
        const nNorm = rawNoise * 0.5 + 0.5; // [0, 1]

        let r = data[idx];
        let g = data[idx + 1];
        let b = data[idx + 2];

        if (this.mode === 'overlay') {
          // Authentic Film Grain / Organic Grime
          const factor = (nNorm - 0.5) * 2.0 * amount * 120;
          r = Math.min(255, Math.max(0, r + factor));
          g = Math.min(255, Math.max(0, g + factor));
          b = Math.min(255, Math.max(0, b + factor));
        } else if (this.mode === 'smoke') {
          // Billowing organic smoke tendrils
          const smokeVal = Math.pow(nNorm, 1.8) * amount * 255;
          r = Math.min(255, r * (1.0 - amount * 0.5) + smokeVal);
          g = Math.min(255, g * (1.0 - amount * 0.5) + smokeVal * 0.95);
          b = Math.min(255, b * (1.0 - amount * 0.5) + smokeVal * 1.1);
        } else if (this.mode === 'add') {
          // Luminescent noise dusting
          const addVal = nNorm * amount * 160;
          r = Math.min(255, r + addVal);
          g = Math.min(255, g + addVal);
          b = Math.min(255, b + addVal);
        } else {
          // Spatial displacement distortion
          const shift = Math.floor(rawNoise * amount * 12);
          const sampleX = Math.min(cols - 1, Math.max(0, x + shift));
          const sampleIdx = (rowOffset + sampleX) * 4;
          r = data[sampleIdx];
          g = data[sampleIdx + 1];
          b = data[sampleIdx + 2];
        }

        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
      }
    }
  }
}

// ----------------------------------------------------------------------------
// 3. MODULY ENGINE (Deep Modularity, Universal Modulation & Feedback Loops)
// Allows routing LFO patch cables to ANY rotary knob of any node.
// ----------------------------------------------------------------------------
export interface ModulationTarget {
  id: string;
  nodeId: string;
  paramKey: string;
  nameRu: string;
  nameEn: string;
  min: number;
  max: number;
  step: number;
}

export class LfoModulatorNode {
  id: string;
  name: string;
  waveform: 'sine' | 'triangle' | 'square' | 'saw' | 'saw_down' | 'random_glitch' | 'lorenz' = 'sine';
  rate = 1.0;       // 0.1 .. 10.0 Hz
  depth = 0.5;      // 0.0 .. 1.0
  offset = 0.0;     // -1.0 .. 1.0
  targetId: string | null = null; // Target parameter ID
  currentValue = 0; // Current modulated output value in [-1, 1]

  // Chaos Lorenz attractor state
  private lx = 0.1;
  private ly = 0.0;
  private lz = 0.0;

  constructor(id: string, name = 'LFO-1') {
    this.id = id;
    this.name = name;
  }

  evaluate(timeSec: number, deltaSec: number): number {
    const phase = (timeSec * this.rate) % 1.0;
    let wave = 0;

    switch (this.waveform) {
      case 'sine':
        wave = Math.sin(phase * Math.PI * 2);
        break;
      case 'triangle':
        wave = phase < 0.5 ? 4.0 * phase - 1.0 : 3.0 - 4.0 * phase;
        break;
      case 'square':
        wave = phase < 0.5 ? 1.0 : -1.0;
        break;
      case 'saw':
        wave = 2.0 * phase - 1.0;
        break;
      case 'saw_down':
        wave = 1.0 - 2.0 * phase;
        break;
      case 'random_glitch':
        // Sample & Hold stepped pseudo-random
        const stepNum = Math.floor(timeSec * this.rate * 4);
        wave = Math.sin(stepNum * 997.3) * 0.9;
        break;
      case 'lorenz':
        const sigma = 10;
        const rho = 28;
        const beta = 8 / 3;
        const dt = Math.min(0.05, deltaSec * this.rate * 2);
        const dx = sigma * (this.ly - this.lx) * dt;
        const dy = (this.lx * (rho - this.lz) - this.ly) * dt;
        const dz = (this.lx * this.ly - beta * this.lz) * dt;
        this.lx += dx;
        this.ly += dy;
        this.lz += dz;
        wave = Math.min(1.0, Math.max(-1.0, this.lx * 0.06));
        break;
    }

    // Apply depth and offset
    this.currentValue = Math.min(1.0, Math.max(-1.0, wave * this.depth + this.offset));
    return this.currentValue;
  }
}

// ----------------------------------------------------------------------------
// 4. MAKE NEUE WORLD ENGINE (Experimental Typography & Variable Glyphs)
// Dynamic font-size based on pixel luminance + scattered/liquid fluid typography.
// ----------------------------------------------------------------------------
export class MakeNeueWorldEngine {
  active = false;
  scaleDyn = 1.0;     // 0.0 .. 2.0 (luminance to font size factor)
  scatter = 6.0;      // 0.0 .. 30.0 px (horizontal/vertical displacement)
  fluidDrift = 0.3;   // 0.0 .. 1.0 (temporal liquid drift)

  getDynamicCharMetrics(
    lum: number,
    baseCellW: number,
    baseCellH: number,
    x: number,
    y: number,
    timeSec: number
  ): { fontSize: number; offsetX: number; offsetY: number; fontWeight: string } {
    if (!this.active) {
      return {
        fontSize: Math.max(3, Math.round(baseCellH * 0.95)),
        offsetX: 0,
        offsetY: 0,
        fontWeight: 'bold'
      };
    }

    // Dynamic Font-Size: Brighter zones = significantly larger, bolder glyphs
    const lumFactor = 0.35 + Math.pow(lum, 1.2) * (this.scaleDyn * 1.6);
    const fontSize = Math.max(2, Math.round(baseCellH * lumFactor));
    const fontWeight = lum > 0.6 ? '900' : lum > 0.3 ? '700' : '400';

    // Fluid Scatter & Drift: Characters scatter dynamically creating explosion/liquid drift
    let offsetX = 0;
    let offsetY = 0;
    if (this.scatter > 0.05) {
      const angle = lum * Math.PI * 4.0 + (x * 0.15) + (y * 0.15) + (timeSec * this.fluidDrift * 3.0);
      const dist = (1.0 - lum) * this.scatter * (0.5 + 0.5 * Math.sin(timeSec * 2.0 + x));
      offsetX = Math.cos(angle) * dist;
      offsetY = Math.sin(angle) * dist;
    }

    return { fontSize, offsetX, offsetY, fontWeight };
  }
}

// ----------------------------------------------------------------------------
// 5. GLCHLAB ENGINE (Hardware Analog Glitch & Signal Destruction)
// VHS tape corruption, Datamosh block displacement, row dropouts & RGB shift.
// Knobs: DATAMOSH, SCAN-CORRUPTION, RGB SHIFT
// ----------------------------------------------------------------------------
export class GlchLabEngine {
  active = false;
  datamosh = 0.25;          // 0.0 .. 1.0 (block shift persistence)
  scanCorruption = 0.15;    // 0.0 .. 1.0 (row dropouts & sync tearing)
  rgbShift = 4.0;           // 0.0 .. 20.0 px (chromatic aberration)

  private moshOffsetArray: Int16Array | null = null;
  private moshHeight = 0;

  apply(imageData: ImageData, cols: number, rows: number, timeSec: number): void {
    if (!this.active) return;

    const data = imageData.data;
    const totalPixels = cols * rows;

    if (!this.moshOffsetArray || this.moshHeight !== rows) {
      this.moshOffsetArray = new Int16Array(rows);
      this.moshHeight = rows;
    }

    // 1. DATAMOSH: Horizontal slice shifts with persistence and random jumps
    if (this.datamosh > 0.01) {
      const chance = this.datamosh * 0.18;
      const maxShift = Math.floor(cols * 0.45 * this.datamosh);
      for (let y = 0; y < rows; y++) {
        if (Math.random() < chance) {
          // Trigger new slice displacement
          const shift = (Math.random() - 0.5) * 2.0 * maxShift;
          this.moshOffsetArray[y] = Math.round(shift);
        } else {
          // Persistent decay
          this.moshOffsetArray[y] = Math.round(this.moshOffsetArray[y] * 0.94);
        }
      }

      // Apply row displacement
      const tempRow = new Uint8ClampedArray(cols * 4);
      for (let y = 0; y < rows; y++) {
        const shift = this.moshOffsetArray[y];
        if (shift === 0) continue;

        const rowStart = y * cols * 4;
        tempRow.set(data.subarray(rowStart, rowStart + cols * 4));

        for (let x = 0; x < cols; x++) {
          let srcX = x - shift;
          if (srcX < 0) srcX = (srcX % cols) + cols;
          else if (srcX >= cols) srcX = srcX % cols;

          const dstIdx = rowStart + x * 4;
          const srcIdx = srcX * 4;
          data[dstIdx] = tempRow[srcIdx];
          data[dstIdx + 1] = tempRow[srcIdx + 1];
          data[dstIdx + 2] = tempRow[srcIdx + 2];
        }
      }
    }

    // 2. SCAN-CORRUPTION: Random dropped text rows and VHS sync tearing
    if (this.scanCorruption > 0.01) {
      const dropCount = Math.floor(rows * this.scanCorruption * 0.25);
      const tearPhase = Math.sin(timeSec * 15.0);

      for (let k = 0; k < dropCount; k++) {
        const targetRow = Math.floor((Math.sin(timeSec * 7.0 + k * 1.7) * 0.5 + 0.5) * rows);
        const rowStart = targetRow * cols * 4;
        const isBlackout = k % 2 === 0;

        for (let x = 0; x < cols; x++) {
          const idx = rowStart + x * 4;
          if (isBlackout) {
            data[idx] = 0;
            data[idx + 1] = 0;
            data[idx + 2] = 0;
          } else {
            // Signal inversion / static burst
            data[idx] = 255 - data[idx];
            data[idx + 1] = 255 - data[idx + 1];
            data[idx + 2] = 255 - data[idx + 2];
          }
        }
      }

      // VHS rolling sync wave
      if (Math.abs(tearPhase) > 0.75) {
        const tearRow = Math.floor((timeSec * 35.0) % rows);
        const bandH = Math.min(12, rows - tearRow);
        for (let y = tearRow; y < tearRow + bandH; y++) {
          const rowStart = y * cols * 4;
          for (let x = 0; x < cols; x++) {
            const idx = rowStart + x * 4;
            data[idx] = Math.min(255, data[idx] + 120);
            data[idx + 1] = Math.min(255, data[idx + 1] + 120);
            data[idx + 2] = Math.min(255, data[idx + 2] + 120);
          }
        }
      }
    }

    // 3. RGB SHIFT: Chromatic Aberration (Splits Red and Blue channels)
    const shiftPx = Math.round(this.rgbShift);
    if (shiftPx > 0) {
      const copy = new Uint8ClampedArray(data);
      for (let y = 0; y < rows; y++) {
        const rowOffset = y * cols;
        for (let x = 0; x < cols; x++) {
          const idx = (rowOffset + x) * 4;

          // Red channel shifted left
          const rx = Math.max(0, x - shiftPx);
          const rIdx = (rowOffset + rx) * 4;
          data[idx] = copy[rIdx]; // Red

          // Blue channel shifted right
          const bx = Math.min(cols - 1, x + shiftPx);
          const bIdx = (rowOffset + bx) * 4;
          data[idx + 2] = copy[bIdx + 2]; // Blue
        }
      }
    }
  }
}

// ----------------------------------------------------------------------------
// MODULAR NODE BAY UI & WIRING MANAGER
// Controls draggable nodes, authentic rotary knobs ("крутилки"), and curved patch cables
// ----------------------------------------------------------------------------
export interface NodePort {
  id: string;
  nodeId: string;
  name: string;
  type: 'signal_in' | 'signal_out' | 'mod_in' | 'mod_out';
  x: number;
  y: number;
}

export interface PatchCable {
  id: string;
  fromPortId: string;
  toPortId: string;
  type: 'signal' | 'modulation';
  color: string;
}

export interface RotaryKnobConfig {
  id: string;
  nodeId: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit: string;
  hasModJack: boolean;
}

export class MultiEngineWorkstation {
  shadr = new ShadrStudioEngine();
  aikizi = new AikiziNoiseEngine();
  glch = new GlchLabEngine();
  neueTypo = new MakeNeueWorldEngine();
  lfoNodes: LfoModulatorNode[] = [
    new LfoModulatorNode('lfo-1', 'LFO MOD 1'),
    new LfoModulatorNode('lfo-2', 'LFO MOD 2')
  ];

  cables: PatchCable[] = [];
  knobs: Map<string, RotaryKnobConfig> = new Map();
  nodePositions: Map<string, { x: number; y: number }> = new Map();

  // Active dragged cable state
  draggingCable: { fromPortId: string; curX: number; curY: number; type: 'signal' | 'modulation' } | null = null;

  // View mode: 'crt_rack' | 'split' | 'node_bay'
  viewMode: 'crt_rack' | 'split' | 'node_bay' = 'split';

  constructor() {
    this.initDefaultGraph();
  }

  private initDefaultGraph() {
    // Default Node Coordinates
    this.nodePositions.set('node-source', { x: 20, y: 20 });
    this.nodePositions.set('node-shadr', { x: 20, y: 170 });
    this.nodePositions.set('node-aikizi', { x: 260, y: 20 });
    this.nodePositions.set('node-glch', { x: 260, y: 220 });
    this.nodePositions.set('node-typo', { x: 500, y: 20 });
    this.nodePositions.set('node-lfo1', { x: 500, y: 220 });
    this.nodePositions.set('node-sink', { x: 740, y: 120 });

    // Register Default Knobs
    this.registerKnob({ id: 'shadr-speed', nodeId: 'node-shadr', label: 'SINE SPEED', min: 0.1, max: 5.0, step: 0.1, value: 1.2, unit: 'x', hasModJack: true });
    this.registerKnob({ id: 'shadr-freq', nodeId: 'node-shadr', label: 'FREQ', min: 0.5, max: 20.0, step: 0.5, value: 4.0, unit: 'Hz', hasModJack: true });
    this.registerKnob({ id: 'shadr-fb', nodeId: 'node-shadr', label: 'FEEDBACK', min: 0.0, max: 0.98, step: 0.02, value: 0.65, unit: '%', hasModJack: true });

    this.registerKnob({ id: 'aikizi-scale', nodeId: 'node-aikizi', label: 'NOISE SCALE', min: 1.0, max: 50.0, step: 1.0, value: 14.0, unit: 'px', hasModJack: true });
    this.registerKnob({ id: 'aikizi-evol', nodeId: 'node-aikizi', label: 'EVOLUTION', min: 0.1, max: 5.0, step: 0.1, value: 1.0, unit: 'spd', hasModJack: true });

    this.registerKnob({ id: 'glch-mosh', nodeId: 'node-glch', label: 'DATAMOSH', min: 0.0, max: 1.0, step: 0.02, value: 0.25, unit: '%', hasModJack: true });
    this.registerKnob({ id: 'glch-corrupt', nodeId: 'node-glch', label: 'SCAN-CORRUPT', min: 0.0, max: 1.0, step: 0.02, value: 0.15, unit: '%', hasModJack: true });
    this.registerKnob({ id: 'glch-rgb', nodeId: 'node-glch', label: 'RGB SHIFT', min: 0.0, max: 20.0, step: 1.0, value: 4.0, unit: 'px', hasModJack: true });

    this.registerKnob({ id: 'typo-scale', nodeId: 'node-typo', label: 'SCALE DYN', min: 0.0, max: 2.0, step: 0.05, value: 1.0, unit: 'x', hasModJack: true });
    this.registerKnob({ id: 'typo-scatter', nodeId: 'node-typo', label: 'X/Y SCATTER', min: 0.0, max: 30.0, step: 1.0, value: 6.0, unit: 'px', hasModJack: true });

    this.registerKnob({ id: 'lfo1-rate', nodeId: 'node-lfo1', label: 'RATE', min: 0.1, max: 10.0, step: 0.1, value: 1.2, unit: 'Hz', hasModJack: false });
    this.registerKnob({ id: 'lfo1-depth', nodeId: 'node-lfo1', label: 'DEPTH', min: 0.0, max: 1.0, step: 0.05, value: 0.6, unit: '%', hasModJack: false });

    // Default Signal Cables & Modulation Loop
    this.cables = [
      { id: 'c1', fromPortId: 'port-source-out', toPortId: 'port-aikizi-in', type: 'signal', color: '#ffaa00' },
      { id: 'c2', fromPortId: 'port-aikizi-out', toPortId: 'port-glch-in', type: 'signal', color: '#33ff77' },
      { id: 'c3', fromPortId: 'port-glch-out', toPortId: 'port-sink-in', type: 'signal', color: '#33ff77' },
      // Moduly LFO Modulation Wire plugged to Shadr Freq Knob!
      { id: 'c-mod1', fromPortId: 'port-lfo1-out', toPortId: 'modjack-glch-rgb', type: 'modulation', color: '#00e5ff' }
    ];

    this.lfoNodes[0].targetId = 'glch-rgb';
  }

  registerKnob(cfg: RotaryKnobConfig) {
    this.knobs.set(cfg.id, cfg);
  }

  updateKnobValue(id: string, val: number) {
    const k = this.knobs.get(id);
    if (!k) return;
    const clamped = Math.min(k.max, Math.max(k.min, Math.round(val / k.step) * k.step));
    k.value = clamped;

    // Synchronize to engine
    switch (id) {
      case 'shadr-speed': this.shadr.sineSpeed = clamped; break;
      case 'shadr-freq': this.shadr.freq = clamped; break;
      case 'shadr-fb': this.shadr.feedback = clamped; break;
      case 'aikizi-scale': this.aikizi.noiseScale = clamped; break;
      case 'aikizi-evol': this.aikizi.evolution = clamped; break;
      case 'glch-mosh': this.glch.datamosh = clamped; break;
      case 'glch-corrupt': this.glch.scanCorruption = clamped; break;
      case 'glch-rgb': this.glch.rgbShift = clamped; break;
      case 'typo-scale': this.neueTypo.scaleDyn = clamped; break;
      case 'typo-scatter': this.neueTypo.scatter = clamped; break;
      case 'lfo1-rate': this.lfoNodes[0].rate = clamped; break;
      case 'lfo1-depth': this.lfoNodes[0].depth = clamped; break;
    }
  }

  // Evaluate all LFO Modulators and modulate target parameters
  evaluateModulation(timeSec: number, deltaSec: number) {
    for (const lfo of this.lfoNodes) {
      const mod = lfo.evaluate(timeSec, deltaSec);
      if (lfo.targetId && this.knobs.has(lfo.targetId)) {
        const targetKnob = this.knobs.get(lfo.targetId)!;
        const range = targetKnob.max - targetKnob.min;
        const offset = mod * (range * 0.45);
        const modulatedVal = Math.min(targetKnob.max, Math.max(targetKnob.min, targetKnob.value + offset));

        // Inject modulated parameter into active engines
        switch (lfo.targetId) {
          case 'shadr-speed': this.shadr.sineSpeed = modulatedVal; break;
          case 'shadr-freq': this.shadr.freq = modulatedVal; break;
          case 'shadr-fb': this.shadr.feedback = modulatedVal; break;
          case 'aikizi-scale': this.aikizi.noiseScale = modulatedVal; break;
          case 'aikizi-evol': this.aikizi.evolution = modulatedVal; break;
          case 'glch-mosh': this.glch.datamosh = modulatedVal; break;
          case 'glch-corrupt': this.glch.scanCorruption = modulatedVal; break;
          case 'glch-rgb': this.glch.rgbShift = modulatedVal; break;
          case 'typo-scale': this.neueTypo.scaleDyn = modulatedVal; break;
          case 'typo-scatter': this.neueTypo.scatter = modulatedVal; break;
        }
      }
    }
  }
}
