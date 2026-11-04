import './cs-denisa.css';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { GifReader } from 'omggif';
import { initSacredGlyphBrand } from './brandAnimation';

export interface GlyphCategory {
  id: string;
  nameRu: string;
  nameEn: string;
}

export interface GlyphSet {
  id: string;
  categoryId: string;
  name: string;
  nameRu?: string;
  nameEn?: string;
  glyphs: string;
}

export interface ColorPalette {
  id: string;
  name: string;
  nameRu?: string;
  nameEn?: string;
  colors: string[];
}

export interface MasterPreset {
  id: string;
  name: string;
  nameRu?: string;
  nameEn?: string;
  sectionCategory?:
    | 'error_diffusion'
    | 'ordered_patterns'
    | 'glitch_cyberpunk'
    | 'special_effects'
    | 'gemstone_medieval'
    | 'autumn_halloween'
    | 'glitch'
    | 'dither'
    | 'make_neue'
    | 'moduly'
    | 'abstract'
    | 'master';
  glyphSetId: string;
  cellSize: number;
  depth: number;
  offset: number;
  aspect: number;
  invert: boolean;
  ditherAlgo: string;
  contrast: number;
  brightness: number;
  sharpness: number;
  gamma: number;
  blur: number;
  posterize: number;
  colorMode: string;
  paletteId: string;
  singleColor: string;
  bgTransparent: boolean;
  bgColor: string;
  lfoEnabled: boolean;
  lfoTarget: string;
  lfoWaveform: string;
  lfoSpeed: number;
  lfoDepth: number;

  // Glitch Effects (JPEG Glitch & Script Slayer Unicode Corruption)
  glitchActive?: boolean;
  glitchDatamosh?: number;
  glitchScanCorruption?: number;
  glitchRgbShift?: number;
  glitchJpeg?: number;
  glitchScriptSlayer?: number;

  // Special Effects (CMYK, Epsilon Glow, Paper Texture, Modulation Lines, ASCII Reveal)
  specialCmyk?: boolean;
  specialEpsilonGlow?: number;
  specialPaperTexture?: number;
  specialModulationLines?: number;
  specialAsciiReveal?: number;

  // Section 1: Wave Generation params
  shadrActive?: boolean;
  shadrSineSpeed?: number;
  shadrFreq?: number;
  shadrFeedback?: number;
  shadrWaveType?: 'harmonic' | 'mandelbrot' | 'plasma' | 'lissajous';

  // Section 2: Procedural Noise params
  aikiziActive?: boolean;
  aikiziNoiseScale?: number;
  aikiziEvolution?: number;
  aikiziNoiseType?: 'dust' | 'smoke' | 'dirt' | 'perlin';
  aikiziIntensity?: number;

  // Section 5: Typography params
  customInjectionActive?: boolean;
  customInjectionText?: string;
  typoScale?: number;
  jitter?: number;

  // Section 6: LFO Automation Bindings
  lfoBindCellSize?: boolean;
  lfoBindDatamosh?: boolean;
  lfoBindScanCorruption?: boolean;
  lfoBindRgbShift?: boolean;
  lfoBindNoiseScale?: boolean;
  lfoBindTypoScale?: boolean;
  lfoBindJitter?: boolean;
  lfoBindSineSpeed?: boolean;
  lfoBindBrightness?: boolean;
  lfoBindContrast?: boolean;

  // Section 7: Abstract Studio
  abstractActive?: boolean;
  abstractWarpSwirl?: number;
  abstractKaleidoscope?: number;
  abstractRecursiveEcho?: number;
  abstractPixelSort?: number;
  abstractSpectrumDrift?: number;
}

export interface DecodedGifFrame {
  canvas: HTMLCanvasElement;
  delay: number; // in milliseconds
}

export interface WorkstationLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number; // 0.0 to 1.0
  blendMode: GlobalCompositeOperation; // 'source-over' | 'screen' | 'multiply' | 'overlay' etc.
  mediaType: 'none' | 'demo' | 'image' | 'gif' | 'video';
  activeDemoMedia?: 'hermetic_sigil' | 'abyssal_flame';
  sourceImage: HTMLImageElement | null;
  videoElement: HTMLVideoElement | null;
  gifFrames: DecodedGifFrame[];
  gifCurrentFrameIndex: number;
  gifLastFrameTime: number;
  gifIsPlaying: boolean;
  fitMode: 'fit' | 'cover' | 'stretch';

  glyphSetId: string;
  manualGlyphsText?: string;
  isManualActive?: boolean;
  cellSize: number;
  depth: number;
  offset: number;
  aspect: number;
  invert: boolean;
  ditherAlgo: string;
  contrast: number;
  brightness: number;
  sharpness: number;
  gamma: number;
  blur: number;
  posterize: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  scanlines: boolean;

  colorMode: string;
  paletteId: string;
  singleColor: string;
  bgTransparent: boolean;
  bgColor: string;

  temperature: number;
  tint: number;
  saturation: number;
  hueRotate: number;
  liftLevel: number;
  gammaLevel: number;
  gainLevel: number;
  masterLevel: number;
  liftX: number;
  liftY: number;
  gammaX: number;
  gammaY: number;
  gainX: number;
  gainY: number;
  masterX: number;
  masterY: number;

  shadrActive?: boolean;
  aikiziActive?: boolean;
  glitchActive?: boolean;
  jitter?: number;
  typoScale?: number;

  layerCanvas?: HTMLCanvasElement;
  layerCtx?: CanvasRenderingContext2D | null;
}

// -------------------------------------------------------------
// 1. CURATED GLYPH CATEGORIES & STRICTLY UNIQUE SETS
// (Fewer glyphs per set, each glyph completely distinct & unique!)
// -------------------------------------------------------------
export const GLYPH_CATEGORIES: GlyphCategory[] = [
  { id: 'classic', nameRu: 'Классика ASCII', nameEn: 'Classic ASCII' },
  { id: 'runes', nameRu: 'Древние руны', nameEn: 'Ancient Runes' },
  { id: 'medieval', nameRu: 'Готика и алхимия', nameEn: 'Gothic & Alchemy' },
  { id: 'japanese', nameRu: 'Японские знаки', nameEn: 'Japanese Scripts' },
  { id: 'cyber', nameRu: 'Киберпанк и глитч', nameEn: 'Cyber & Glitch' },
  { id: 'blocks', nameRu: 'Блоки и тени', nameEn: 'Blocks & Shades' },
  { id: 'braille', nameRu: 'Шрифт Брайля', nameEn: 'Braille Gradients' },
  { id: 'geometry', nameRu: 'Геометрия', nameEn: 'Geometric Shapes' },
  { id: 'minimal', nameRu: 'Минимализм', nameEn: 'Minimal & Lines' }
];

export const GLYPH_SETS: GlyphSet[] = [
  // 1. Classic ASCII (concise, high-contrast, strictly unique characters)
  {
    id: 'classic_standard',
    categoryId: 'classic',
    name: 'Standard ASCII (10)',
    nameRu: 'Стандартный ASCII (10)',
    nameEn: 'Standard ASCII (10)',
    glyphs: " .:-=+*#%@█"
  },
  {
    id: 'classic_clean',
    categoryId: 'classic',
    name: 'Clean Contrast (8)',
    nameRu: 'Чистый контраст (8)',
    nameEn: 'Clean Contrast (8)',
    glyphs: " .:+*#%@"
  },
  {
    id: 'classic_micro',
    categoryId: 'classic',
    name: 'Micro Step (5)',
    nameRu: 'Микро-шаг (5)',
    nameEn: 'Micro Step (5)',
    glyphs: " .:#█"
  },
  {
    id: 'classic_dos',
    categoryId: 'classic',
    name: 'DOS Prompt (9)',
    nameRu: 'Терминал DOS (9)',
    nameEn: 'DOS Prompt (9)',
    glyphs: " _.:!/X#█"
  },

  // 2. Ancient Runes (Elder Futhark, strictly unique runes ordered by stroke density)
  {
    id: 'runic_futhark',
    categoryId: 'runes',
    name: 'Elder Futhark (10)',
    nameRu: 'Старший Футарк (10)',
    nameEn: 'Elder Futhark (10)',
    glyphs: " ᛫ᚠᚦᚱᚲᚷᚹᛊᛟᛞ"
  },
  {
    id: 'runic_anglo',
    categoryId: 'runes',
    name: 'Anglo-Saxon (9)',
    nameRu: 'Англосаксонские (9)',
    nameEn: 'Anglo-Saxon (9)',
    glyphs: " ·ᚩᚳᚪᛖᛗᛚᛜᛠ"
  },
  {
    id: 'runic_sigil_bind',
    categoryId: 'runes',
    name: 'Warding Sigils (8)',
    nameRu: 'Обережные сигилы (8)',
    nameEn: 'Warding Sigils (8)',
    glyphs: " ᛉᛏᛒᛈᛇᚺᚾᛁ"
  },

  // 3. Gothic & Alchemy (distinct sacred and heraldic marks)
  {
    id: 'medieval_crosses',
    categoryId: 'medieval',
    name: 'Gothic Crosses (8)',
    nameRu: 'Готические кресты (8)',
    nameEn: 'Gothic Crosses (8)',
    glyphs: " ·†‡☨☩♰♱✠"
  },
  {
    id: 'medieval_alchemy',
    categoryId: 'medieval',
    name: 'Hermetic Elements (8)',
    nameRu: 'Герметические элементы (8)',
    nameEn: 'Hermetic Elements (8)',
    glyphs: " ·🜂🜁🜃🜄🝆🝈🝊"
  },
  {
    id: 'medieval_armory',
    categoryId: 'medieval',
    name: 'Heraldic Crests (7)',
    nameRu: 'Геральдические эмблемы (7)',
    nameEn: 'Heraldic Crests (7)',
    glyphs: " ·⚔⚖⚜✦✧★"
  },

  // 4. Japanese Scripts (clean Katakana and progressive Kanji)
  {
    id: 'jp_katakana_clean',
    categoryId: 'japanese',
    name: 'Cyber Katakana (8)',
    nameRu: 'Кибер-катакана (8)',
    nameEn: 'Cyber Katakana (8)',
    glyphs: " ｰｶｼﾂﾓﾘｦ日"
  },
  {
    id: 'jp_kanji_density',
    categoryId: 'japanese',
    name: 'Stroke Density (7)',
    nameRu: 'Плотность кандзи (7)',
    nameEn: 'Stroke Density (7)',
    glyphs: " 一十木森龍鬱"
  },
  {
    id: 'jp_tokyo_rain',
    categoryId: 'japanese',
    name: 'Matrix Console (7)',
    nameRu: 'Консоль Токио (7)',
    nameEn: 'Matrix Console (7)',
    glyphs: " ｡･ﾊﾐﾋｳﾅ"
  },

  // 5. Cyber & Glitch (matrix, digital telemetry, glitch)
  {
    id: 'cyber_digital',
    categoryId: 'cyber',
    name: 'Binary Digital (6)',
    nameRu: 'Двоичный цифровой (6)',
    nameEn: 'Binary Digital (6)',
    glyphs: " 01/X#█"
  },
  {
    id: 'cyber_glitch_sys',
    categoryId: 'cyber',
    name: 'Buffer Glitch (7)',
    nameRu: 'Системный глитч (7)',
    nameEn: 'Buffer Glitch (7)',
    glyphs: " ¬|§µØЖ█"
  },
  {
    id: 'cyber_radar_scope',
    categoryId: 'cyber',
    name: 'Radar Telemetry (6)',
    nameRu: 'Телеметрия радара (6)',
    nameEn: 'Radar Telemetry (6)',
    glyphs: " ·⌖⌗⌸⍥⍟"
  },

  // 6. Blocks & Shades (standard IBM DOS raster shades)
  {
    id: 'block_shades',
    categoryId: 'blocks',
    name: 'IBM DOS Shades (5)',
    nameRu: 'Штриховки DOS IBM (5)',
    nameEn: 'IBM DOS Shades (5)',
    glyphs: " ░▒▓█"
  },
  {
    id: 'block_quadrants',
    categoryId: 'blocks',
    name: 'Quadrant Blocks (5)',
    nameRu: 'Квадранты блоков (5)',
    nameEn: 'Quadrant Blocks (5)',
    glyphs: "  ▄▌▀█"
  },
  {
    id: 'block_matrix_bits',
    categoryId: 'blocks',
    name: 'Pixel Bits (5)',
    nameRu: 'Пиксельные биты (5)',
    nameEn: 'Pixel Bits (5)',
    glyphs: " ·▖▚▜█"
  },

  // 7. Braille Gradients (strictly progressive dot density)
  {
    id: 'braille_progressive',
    categoryId: 'braille',
    name: 'Dot Steps 1-6 (7)',
    nameRu: 'Брайль 1-6 точек (7)',
    nameEn: 'Dot Steps 1-6 (7)',
    glyphs: " ⠂⠅⠖⠦⠯⠿"
  },
  {
    id: 'braille_vertical',
    categoryId: 'braille',
    name: 'Vertical Ladder (6)',
    nameRu: 'Вертикальная лестница (6)',
    nameEn: 'Vertical Ladder (6)',
    glyphs: " ⠁⠃⠇⠏⠟⠿"
  },

  // 8. Geometric Shapes (circles, squares, triangles)
  {
    id: 'geo_squares_steps',
    categoryId: 'geometry',
    name: 'Concentric Squares (7)',
    nameRu: 'Концентрические квадраты (7)',
    nameEn: 'Concentric Squares (7)',
    glyphs: " ·▫◻◽◼◾⬛"
  },
  {
    id: 'geo_circles_phase',
    categoryId: 'geometry',
    name: 'Lunar Phases (7)',
    nameRu: 'Лунные фазы (7)',
    nameEn: 'Lunar Phases (7)',
    glyphs: " ·◦○◔◑◕●"
  },
  {
    id: 'geo_pointers',
    categoryId: 'geometry',
    name: 'Angle Pointers (6)',
    nameRu: 'Угловые стрелки (6)',
    nameEn: 'Angle Pointers (6)',
    glyphs: " ·▿▹▵▴▲"
  },

  // 9. Minimal & Lines (pure wireframe and math)
  {
    id: 'minimal_wires',
    categoryId: 'minimal',
    name: 'Circuit Wires (5)',
    nameRu: 'Провода схем (5)',
    nameEn: 'Circuit Wires (5)',
    glyphs: " ─┼╫╬█"
  },
  {
    id: 'minimal_stipple',
    categoryId: 'minimal',
    name: 'Clean Dots (4)',
    nameRu: 'Четкие точки (4)',
    nameEn: 'Clean Dots (4)',
    glyphs: " ·•●█"
  },
  {
    id: 'minimal_math_ops',
    categoryId: 'minimal',
    name: 'Logic Gates (6)',
    nameRu: 'Логические вентили (6)',
    nameEn: 'Logic Gates (6)',
    glyphs: " ·¬±×≠≈"
  }
];

// -------------------------------------------------------------
// 2. THEMATIC COLOR PALETTES (Gemstone, Medieval, Matrix, Autumn, Cyberpunk)
// -------------------------------------------------------------
export const MEDIEVAL_PALETTES: ColorPalette[] = [
  // --- GEMSTONE PALETTES ---
  {
    id: 'gem_emerald',
    name: 'Emerald Matrix Crystal',
    nameRu: 'Изумрудный кристалл (Gemstone)',
    nameEn: 'Emerald Matrix Crystal',
    colors: ['#021206', '#063012', '#0c5c24', '#15963b', '#26db5b', '#7eff9f', '#d4ffe0']
  },
  {
    id: 'gem_ruby',
    name: 'Ruby Velvet Lustre',
    nameRu: 'Рубиновый бархат (Gemstone)',
    nameEn: 'Ruby Velvet Lustre',
    colors: ['#150307', '#360913', '#661224', '#a81e3b', '#e62e54', '#ff708f', '#ffd6e0']
  },
  {
    id: 'gem_sapphire',
    name: 'Deep Oceanic Sapphire',
    nameRu: 'Глубокий сапфир (Gemstone)',
    nameEn: 'Deep Oceanic Sapphire',
    colors: ['#030718', '#081742', '#102b78', '#1b48b8', '#336ef5', '#7aa3ff', '#d6e4ff']
  },
  {
    id: 'gem_amethyst',
    name: 'Imperial Amethyst Geode',
    nameRu: 'Императорский аметист (Gemstone)',
    nameEn: 'Imperial Amethyst Geode',
    colors: ['#0d0417', '#250c3d', '#481973', '#772ab8', '#ab47f5', '#d18fff', '#f3d9ff']
  },
  {
    id: 'gem_amber',
    name: 'Baltic Amber Resin',
    nameRu: 'Балтийский янтарь (Gemstone)',
    nameEn: 'Baltic Amber Resin',
    colors: ['#120800', '#301802', '#5e3206', '#99560e', '#de841b', '#ffb04a', '#ffe4b3']
  },
  {
    id: 'gem_opal',
    name: 'Shimmering White Opal',
    nameRu: 'Мерцающий белый опал (Gemstone)',
    nameEn: 'Shimmering White Opal',
    colors: ['#081215', '#162e36', '#2b5663', '#578e99', '#8fc7cc', '#cbf0eb', '#ffffff']
  },

  // --- MEDIEVAL PALETTES ---
  {
    id: 'illuminated_gold',
    name: 'Illuminated Gold Manuscript',
    nameRu: 'Иллюминированный манускрипт',
    nameEn: 'Illuminated Gold Manuscript',
    colors: ['#120d04', '#2e1f0b', '#573d12', '#8c641c', '#c79228', '#f0b83c', '#fae19c']
  },
  {
    id: 'gothic_blood',
    name: 'Gothic Blood & Gold',
    nameRu: 'Готическая кровь и золото',
    nameEn: 'Gothic Blood & Gold',
    colors: ['#0f0507', '#2e0b12', '#57131e', '#8a1c27', '#c23232', '#d97706', '#fde68a']
  },
  {
    id: 'parchment_sepia',
    name: 'Monastic Vellum Parchment',
    nameRu: 'Монастырский пергамент (Сепия)',
    nameEn: 'Monastic Vellum Parchment',
    colors: ['#1a140d', '#3b2f21', '#66533c', '#998061', '#c7ab88', '#ebd8be', '#faf2e6']
  },
  {
    id: 'medieval_lapis',
    name: 'Royal Lapis & Silver',
    nameRu: 'Королевский лазурит и серебро',
    nameEn: 'Royal Lapis & Silver',
    colors: ['#050816', '#0d1838', '#162e69', '#244aa6', '#547ee0', '#a8c2f8', '#e8f0fe']
  },
  {
    id: 'medieval_rust',
    name: 'Iron & Rust Armour',
    nameRu: 'Рыцарское железо и ржавчина',
    nameEn: 'Iron & Rust Armour',
    colors: ['#120e0d', '#2b1f1c', '#4a332d', '#784e3d', '#ad694b', '#d99071', '#f5cebe']
  },

  // --- MOODY MATRIX ---
  {
    id: 'phosphor_matrix',
    name: 'Phosphor Green CRT Matrix',
    nameRu: 'Фосфорный зеленый CRT',
    nameEn: 'Phosphor Green CRT Matrix',
    colors: ['#040a04', '#0d2b0d', '#145214', '#1f8a1f', '#2bd12b', '#4dff4d', '#b3ffb3']
  },
  {
    id: 'matrix_abyssal',
    name: 'Stealth Carbon Void',
    nameRu: 'Стелс-карбон матрицы (Moody)',
    nameEn: 'Stealth Carbon Void',
    colors: ['#050607', '#0f1214', '#1c2226', '#2d373d', '#495761', '#728594', '#b5c4d0']
  },
  {
    id: 'matrix_deep_emerald',
    name: 'Deep Emerald Shadow',
    nameRu: 'Теневой изумруд (Moody Matrix)',
    nameEn: 'Deep Emerald Shadow',
    colors: ['#010905', '#041d10', '#0a3820', '#136137', '#1f9655', '#38d97e', '#9effcb']
  },
  {
    id: 'matrix_cyber_cyan',
    name: 'Terminal Radar Cyan',
    nameRu: 'Кибернетический циан',
    nameEn: 'Terminal Radar Cyan',
    colors: ['#020b0d', '#072026', '#0f3f4a', '#1a6f82', '#2db0cc', '#5ce1fc', '#c7f6ff']
  },

  // --- AUTUMN & HALLOWEEN ---
  {
    id: 'autumn_pumpkin',
    name: 'Pumpkin & Bone Halloween',
    nameRu: 'Тыква и кость (Halloween)',
    nameEn: 'Pumpkin & Bone Halloween',
    colors: ['#140700', '#3b1802', '#6e2f05', '#b0500a', '#eb751c', '#f5b562', '#faedd9']
  },
  {
    id: 'autumn_ochre',
    name: 'Crimson Autumn Ochre',
    nameRu: 'Багряная осенняя охра',
    nameEn: 'Crimson Autumn Ochre',
    colors: ['#140304', '#38090d', '#691519', '#a32b24', '#d6512b', '#f59147', '#fcd288']
  },
  {
    id: 'halloween_coven',
    name: 'Coven Violet & Slime',
    nameRu: 'Ведьмин ковен и слизь',
    nameEn: 'Coven Violet & Slime',
    colors: ['#0f0517', '#270e3d', '#4f1a78', '#7b2bb8', '#38c958', '#7fff70', '#eaffd9']
  },
  {
    id: 'halloween_twilight',
    name: 'Twilight Blood Moon',
    nameRu: 'Сумеречная кровавая луна',
    nameEn: 'Twilight Blood Moon',
    colors: ['#0a0208', '#24081c', '#470f36', '#7a195b', '#b82772', '#f04f7b', '#ffb0c7']
  },

  // --- CYBERPUNK & RETRO HARDWARE ---
  {
    id: 'spectral_neon',
    name: 'Spectral Ditherpunk',
    nameRu: 'Спектральный дизерпанк',
    nameEn: 'Spectral Ditherpunk',
    colors: ['#0d0417', '#2d0c4d', '#58168f', '#9624db', '#d936e6', '#ff66c4', '#ffe0f0']
  },
  {
    id: 'cyber_glitch_string',
    name: 'Cyber Glitch String Neon',
    nameRu: 'Кибернетический глитч-шнур',
    nameEn: 'Cyber Glitch String Neon',
    colors: ['#030514', '#0d1645', '#192b80', '#ff0055', '#00ffcc', '#ffffff']
  },
  {
    id: 'synthwave_sunset',
    name: 'Synthwave Magenta Sunset',
    nameRu: 'Синтвейв закат (Маджента)',
    nameEn: 'Synthwave Magenta Sunset',
    colors: ['#0d0317', '#280838', '#540f5a', '#941775', '#d9326e', '#ff7a59', '#ffdd73']
  },
  {
    id: 'sgi_cyber',
    name: 'SGI Indigo Workstation',
    nameRu: 'Индиго-станция SGI',
    nameEn: 'SGI Indigo Workstation',
    colors: ['#080a14', '#141d3d', '#20336b', '#33549e', '#4b7cd1', '#72a6ff', '#bdd7ff']
  },
  {
    id: 'acid_radiation',
    name: 'Acid Geiger Yellow',
    nameRu: 'Кислотный счетчик Гейгера',
    nameEn: 'Acid Geiger Yellow',
    colors: ['#090a03', '#202408', '#3e4510', '#6f7a1c', '#acc22d', '#d9f538', '#f4ff9e']
  },
  {
    id: 'monochrome_high',
    name: '1-Bit Monochrome High-Contrast',
    nameRu: '1-Bit Монохром высокая контрастность',
    nameEn: '1-Bit Monochrome High-Contrast',
    colors: ['#000000', '#222222', '#444444', '#777777', '#aaaaaa', '#dddddd', '#ffffff']
  },
  {
    id: 'gameboy_classic',
    name: 'Game Boy Classic (DMG 4-Tone)',
    nameRu: 'Game Boy DMG (4 тона оливы)',
    nameEn: 'Game Boy Classic (DMG 4-Tone)',
    colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f']
  }
];

// -------------------------------------------------------------
// 3. MASTER PRESETS (Categorized studio preset library)
// -------------------------------------------------------------
export const MASTER_PRESETS: MasterPreset[] = [
  // ==========================================
  // 1. ДИФФУЗИЯ ОШИБКИ (ERROR DIFFUSION)
  // ==========================================
  {
    id: 'preset_ed_floyd_mono',
    name: 'Floyd-Steinberg 1-Bit Моно // Floyd-Steinberg 1-Bit Mono',
    nameRu: 'Floyd-Steinberg 1-Bit Моно',
    nameEn: 'Floyd-Steinberg 1-Bit Mono',
    sectionCategory: 'error_diffusion',
    ditherAlgo: 'floyd',
    paletteId: 'monochrome_high',
    cellSize: 2,
    depth: 6,
    offset: 0,
    contrast: 1.65,
    brightness: 0,
    sharpness: 45,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#ffffff',
    bgTransparent: false,
    bgColor: '#000000',
    glyphSetId: 'classic_standard',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },
  {
    id: 'preset_ed_atkinson_mac',
    name: 'Atkinson Macintosh Классика // Atkinson Macintosh Classic',
    nameRu: 'Atkinson Macintosh Классика',
    nameEn: 'Atkinson Macintosh Classic',
    sectionCategory: 'error_diffusion',
    ditherAlgo: 'atkinson',
    paletteId: 'monochrome_high',
    cellSize: 6,
    depth: 4,
    offset: 0,
    contrast: 1.55,
    brightness: -4,
    sharpness: 60,
    gamma: 0.95,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#ffffff',
    bgTransparent: false,
    bgColor: '#050505',
    glyphSetId: 'block_shades',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },
  {
    id: 'preset_ed_jarvis_detail',
    name: 'Jarvis-Judice-Ninke Детализация // Jarvis High Detail',
    nameRu: 'Jarvis-Judice-Ninke Детализация',
    nameEn: 'Jarvis High Detail',
    sectionCategory: 'error_diffusion',
    ditherAlgo: 'jarvis',
    paletteId: 'phosphor_matrix',
    cellSize: 4,
    depth: 8,
    offset: 0,
    contrast: 1.45,
    brightness: 2,
    sharpness: 50,
    gamma: 1.05,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#00ff66',
    bgTransparent: false,
    bgColor: '#040a04',
    glyphSetId: 'cyber_digital',
    aspect: 0.55,
    invert: false,
    lfoEnabled: true,
    lfoTarget: 'offset',
    lfoWaveform: 'triangle',
    lfoSpeed: 0.8,
    lfoDepth: 25
  },
  {
    id: 'preset_ed_stucki_crisp',
    name: 'Stucki Четкая гравюра // Stucki Crisp Engraving',
    nameRu: 'Stucki Четкая гравюра',
    nameEn: 'Stucki Crisp Engraving',
    sectionCategory: 'error_diffusion',
    ditherAlgo: 'stucki',
    paletteId: 'matrix_abyssal',
    cellSize: 1,
    depth: 10,
    offset: 0,
    contrast: 1.7,
    brightness: 0,
    sharpness: 75,
    gamma: 1.1,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#ffffff',
    bgTransparent: false,
    bgColor: '#050607',
    glyphSetId: 'classic_clean',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },
  {
    id: 'preset_ed_burkes_diffusion',
    name: 'Burkes Быстрая диффузия // Burkes Fast Engraving',
    nameRu: 'Burkes Быстрая диффузия',
    nameEn: 'Burkes Fast Engraving',
    sectionCategory: 'error_diffusion',
    ditherAlgo: 'burkes',
    paletteId: 'amber_terminal',
    cellSize: 8,
    depth: 7,
    offset: 0,
    contrast: 1.35,
    brightness: 0,
    sharpness: 35,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#ffaa2b',
    bgTransparent: false,
    bgColor: '#0e0902',
    glyphSetId: 'classic_dos',
    aspect: 0.55,
    invert: false,
    lfoEnabled: true,
    lfoTarget: 'depth',
    lfoWaveform: 'sine',
    lfoSpeed: 0.9,
    lfoDepth: 30
  },
  {
    id: 'preset_ed_sierra3_tonal',
    name: 'Sierra Тройной растр // Sierra 3-Line Rich Tonal',
    nameRu: 'Sierra Тройной растр',
    nameEn: 'Sierra 3-Line Rich Tonal',
    sectionCategory: 'error_diffusion',
    ditherAlgo: 'sierra3',
    paletteId: 'gem_sapphire',
    cellSize: 5,
    depth: 9,
    offset: 0,
    contrast: 1.4,
    brightness: 4,
    sharpness: 40,
    gamma: 1.05,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#7aa3ff',
    bgTransparent: false,
    bgColor: '#020512',
    glyphSetId: 'braille_progressive',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },
  {
    id: 'preset_ed_serpentine_floyd',
    name: 'Змеевидный Floyd (Без полос) // Serpentine Floyd Anti-Worm',
    nameRu: 'Змеевидный Floyd (Без полос)',
    nameEn: 'Serpentine Floyd Anti-Worm',
    sectionCategory: 'error_diffusion',
    ditherAlgo: 'serpentine_floyd',
    paletteId: 'illuminated_gold',
    cellSize: 7,
    depth: 8,
    offset: 0,
    contrast: 1.5,
    brightness: 0,
    sharpness: 50,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#f0b83c',
    bgTransparent: false,
    bgColor: '#100b03',
    glyphSetId: 'gothic_alchemical',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },

  // ==========================================
  // 2. УПОРЯДОЧЕННЫЙ И ПАТТЕРНЫ (ORDERED & PATTERNS)
  // ==========================================
  {
    id: 'preset_ord_bayer2_micro',
    name: 'Bayer 2×2 Микро-сетка // Bayer 2x2 Micro Grid',
    nameRu: 'Bayer 2×2 Микро-сетка',
    nameEn: 'Bayer 2x2 Micro Grid',
    sectionCategory: 'ordered_patterns',
    ditherAlgo: 'bayer2',
    paletteId: 'monochrome_high',
    cellSize: 1,
    depth: 6,
    offset: 0,
    contrast: 1.6,
    brightness: 0,
    sharpness: 70,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#ffffff',
    bgTransparent: false,
    bgColor: '#000000',
    glyphSetId: 'classic_clean',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },
  {
    id: 'preset_ord_bayer4_dos',
    name: 'Bayer 4×4 Ретро DOS // Bayer 4x4 Retro DOS',
    nameRu: 'Bayer 4×4 Ретро DOS',
    nameEn: 'Bayer 4x4 Retro DOS',
    sectionCategory: 'ordered_patterns',
    ditherAlgo: 'bayer4',
    paletteId: 'phosphor_matrix',
    cellSize: 9,
    depth: 8,
    offset: 0,
    contrast: 1.35,
    brightness: 0,
    sharpness: 35,
    gamma: 1.05,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#00ff66',
    bgTransparent: false,
    bgColor: '#030803',
    glyphSetId: 'classic_standard',
    aspect: 0.55,
    invert: false,
    lfoEnabled: true,
    lfoTarget: 'offset',
    lfoWaveform: 'sawtooth_up',
    lfoSpeed: 1.2,
    lfoDepth: 35
  },
  {
    id: 'preset_ord_bayer8_newspaper',
    name: 'Bayer 8×8 Газетный растр // Bayer 8x8 Newspaper',
    nameRu: 'Bayer 8×8 Газетный растр',
    nameEn: 'Bayer 8x8 Newspaper',
    sectionCategory: 'ordered_patterns',
    ditherAlgo: 'bayer8',
    paletteId: 'parchment_sepia',
    cellSize: 8,
    depth: 7,
    offset: 0,
    contrast: 1.4,
    brightness: -5,
    sharpness: 45,
    gamma: 0.95,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#3b2f21',
    bgTransparent: false,
    bgColor: '#f5ebdc',
    glyphSetId: 'minimal_wires',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },
  {
    id: 'preset_ord_bayer16_ultra',
    name: 'Bayer 16×16 Ультра-матрица // Bayer 16x16 Ultra Matrix',
    nameRu: 'Bayer 16×16 Ультра-матрица',
    nameEn: 'Bayer 16x16 Ultra Matrix',
    sectionCategory: 'ordered_patterns',
    ditherAlgo: 'bayer16',
    paletteId: 'sgi_cyber',
    cellSize: 4,
    depth: 12,
    offset: 0,
    contrast: 1.5,
    brightness: 0,
    sharpness: 55,
    gamma: 1.1,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#4b7cd1',
    bgTransparent: false,
    bgColor: '#060814',
    glyphSetId: 'cyber_digital',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },
  {
    id: 'preset_ord_cluster_dot',
    name: 'Кластерная растровая точка // Clustered Dot Engraving',
    nameRu: 'Кластерная растровая точка',
    nameEn: 'Clustered Dot Engraving',
    sectionCategory: 'ordered_patterns',
    ditherAlgo: 'cluster_dot',
    paletteId: 'medieval_rust',
    cellSize: 7,
    depth: 6,
    offset: 0,
    contrast: 1.45,
    brightness: 0,
    sharpness: 40,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#ad694b',
    bgTransparent: false,
    bgColor: '#100b0a',
    glyphSetId: 'minimal_stipple',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },
  {
    id: 'preset_pat_halftone_dot',
    name: 'Радиальный полутоновый растр // Radial Halftone Dot',
    nameRu: 'Радиальный полутоновый растр',
    nameEn: 'Radial Halftone Dot',
    sectionCategory: 'ordered_patterns',
    ditherAlgo: 'halftone',
    paletteId: 'spectral_neon',
    cellSize: 8,
    depth: 6,
    offset: 0,
    contrast: 1.55,
    brightness: 5,
    sharpness: 50,
    gamma: 1.1,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#d936e6',
    bgTransparent: false,
    bgColor: '#0b0414',
    glyphSetId: 'geo_circles_phase',
    aspect: 0.55,
    invert: false,
    lfoEnabled: true,
    lfoTarget: 'cell',
    lfoWaveform: 'sine',
    lfoSpeed: 0.6,
    lfoDepth: 35
  },
  {
    id: 'preset_pat_horizontal_lines',
    name: 'Горизонтальная штриховка // Horizontal Line Screen',
    nameRu: 'Горизонтальная штриховка',
    nameEn: 'Horizontal Line Screen',
    sectionCategory: 'ordered_patterns',
    ditherAlgo: 'lines_horizontal',
    paletteId: 'matrix_cyber_cyan',
    cellSize: 6,
    depth: 7,
    offset: 0,
    contrast: 1.4,
    brightness: 0,
    sharpness: 40,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#2db0cc',
    bgTransparent: false,
    bgColor: '#02090b',
    glyphSetId: 'minimal_wires',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },
  {
    id: 'preset_pat_crosshatch',
    name: 'Диагональная гравюра // Diagonal Crosshatch Hatching',
    nameRu: 'Диагональная гравюра',
    nameEn: 'Diagonal Crosshatch Hatching',
    sectionCategory: 'ordered_patterns',
    ditherAlgo: 'crosshatch',
    paletteId: 'gothic_blood',
    cellSize: 8,
    depth: 8,
    offset: 0,
    contrast: 1.6,
    brightness: 0,
    sharpness: 55,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#c23232',
    bgTransparent: false,
    bgColor: '#0d0407',
    glyphSetId: 'runic_futhark',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },
  {
    id: 'preset_pat_hexagonal',
    name: 'Шестигранные соты // Hexagonal Honeycomb',
    nameRu: 'Шестигранные соты',
    nameEn: 'Hexagonal Honeycomb',
    sectionCategory: 'ordered_patterns',
    ditherAlgo: 'hexagonal',
    paletteId: 'acid_radiation',
    cellSize: 9,
    depth: 6,
    offset: 0,
    contrast: 1.45,
    brightness: 0,
    sharpness: 45,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#d9f538',
    bgTransparent: false,
    bgColor: '#070802',
    glyphSetId: 'geo_pointers',
    aspect: 0.55,
    invert: false,
    lfoEnabled: true,
    lfoTarget: 'depth',
    lfoWaveform: 'triangle',
    lfoSpeed: 1.1,
    lfoDepth: 40
  },

  // ==========================================
  // 3. ГЛИТЧ И КИБЕРПАНК (GLITCH & CYBERPUNK)
  // ==========================================
  {
    id: 'preset_glitch_cyber_string',
    name: 'Неоновый глитч-шнур // Cyberpunk Glitch String',
    nameRu: 'Неоновый глитч-шнур',
    nameEn: 'Cyberpunk Glitch String',
    sectionCategory: 'glitch_cyberpunk',
    glitchActive: true,
    glitchDatamosh: 40,
    glitchScanCorruption: 30,
    glitchRgbShift: 24,
    glitchJpeg: 0,
    glitchScriptSlayer: 25,
    ditherAlgo: 'bayer4',
    paletteId: 'cyber_glitch_string',
    cellSize: 8,
    depth: 8,
    offset: 0,
    contrast: 1.5,
    brightness: 5,
    sharpness: 60,
    gamma: 1.1,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#00ffcc',
    bgTransparent: false,
    bgColor: '#030514',
    glyphSetId: 'cyber_glitch_sys',
    aspect: 0.52,
    invert: false,
    lfoEnabled: true,
    lfoTarget: 'offset',
    lfoWaveform: 'sawtooth_down',
    lfoSpeed: 2.0,
    lfoDepth: 45
  },
  {
    id: 'preset_glitch_jpeg_artifacts',
    name: 'JPEG Glitch & Блочный сбой // JPEG Block Artifacts',
    nameRu: 'JPEG Glitch & Блочный сбой',
    nameEn: 'JPEG Block Artifacts',
    sectionCategory: 'glitch_cyberpunk',
    glitchActive: true,
    glitchDatamosh: 20,
    glitchScanCorruption: 15,
    glitchRgbShift: 10,
    glitchJpeg: 65,
    glitchScriptSlayer: 0,
    ditherAlgo: 'floyd',
    paletteId: 'spectral_neon',
    cellSize: 7,
    depth: 7,
    offset: 0,
    contrast: 1.6,
    brightness: 0,
    sharpness: 65,
    gamma: 1.0,
    blur: 0,
    posterize: 4,
    colorMode: 'palette',
    singleColor: '#ff66c4',
    bgTransparent: false,
    bgColor: '#090312',
    glyphSetId: 'cyber_digital',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },
  {
    id: 'preset_glitch_script_slayer',
    name: 'Script Slayer // Символьная коррозия // Script Slayer Corruption',
    nameRu: 'Script Slayer // Символьная коррозия',
    nameEn: 'Script Slayer Corruption',
    sectionCategory: 'glitch_cyberpunk',
    glitchActive: true,
    glitchDatamosh: 30,
    glitchScanCorruption: 50,
    glitchRgbShift: 16,
    glitchJpeg: 0,
    glitchScriptSlayer: 75,
    ditherAlgo: 'atkinson',
    paletteId: 'gothic_blood',
    cellSize: 10,
    depth: 8,
    offset: 0,
    contrast: 1.7,
    brightness: 0,
    sharpness: 70,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#dc2626',
    bgTransparent: false,
    bgColor: '#0b0406',
    glyphSetId: 'runic_futhark',
    aspect: 0.55,
    invert: true,
    lfoEnabled: true,
    lfoTarget: 'offset',
    lfoWaveform: 'sample_hold',
    lfoSpeed: 1.5,
    lfoDepth: 60
  },
  {
    id: 'preset_glitch_datamosh_analog',
    name: 'Аналоговый датамош // Analog Datamosh Breakdown',
    nameRu: 'Аналоговый датамош',
    nameEn: 'Analog Datamosh Breakdown',
    sectionCategory: 'glitch_cyberpunk',
    glitchActive: true,
    glitchDatamosh: 80,
    glitchScanCorruption: 35,
    glitchRgbShift: 20,
    glitchJpeg: 0,
    glitchScriptSlayer: 0,
    ditherAlgo: 'bayer8',
    paletteId: 'sgi_cyber',
    cellSize: 9,
    depth: 6,
    offset: 0,
    contrast: 1.45,
    brightness: 5,
    sharpness: 50,
    gamma: 1.1,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#72a6ff',
    bgTransparent: false,
    bgColor: '#060814',
    glyphSetId: 'classic_clean',
    aspect: 0.52,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 25
  },
  {
    id: 'preset_glitch_scanline_dropout',
    name: 'Выпадение строк развертки // Scanline Dropout Fault',
    nameRu: 'Выпадение строк развертки',
    nameEn: 'Scanline Dropout Fault',
    sectionCategory: 'glitch_cyberpunk',
    glitchActive: true,
    glitchDatamosh: 15,
    glitchScanCorruption: 85,
    glitchRgbShift: 8,
    glitchJpeg: 0,
    glitchScriptSlayer: 0,
    ditherAlgo: 'atkinson',
    paletteId: 'phosphor_matrix',
    cellSize: 8,
    depth: 6,
    offset: 0,
    contrast: 1.55,
    brightness: 0,
    sharpness: 60,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#00ff66',
    bgTransparent: false,
    bgColor: '#040804',
    glyphSetId: 'cyber_digital',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 25
  },
  {
    id: 'preset_glitch_rgb_anaglyph',
    name: 'Хроматический сдвиг RGB // Chromatic RGB Anaglyph Split',
    nameRu: 'Хроматический сдвиг RGB',
    nameEn: 'Chromatic RGB Anaglyph Split',
    sectionCategory: 'glitch_cyberpunk',
    glitchActive: true,
    glitchDatamosh: 0,
    glitchScanCorruption: 10,
    glitchRgbShift: 40,
    glitchJpeg: 0,
    glitchScriptSlayer: 0,
    ditherAlgo: 'floyd',
    paletteId: 'spectral_neon',
    cellSize: 6,
    depth: 8,
    offset: 0,
    contrast: 1.4,
    brightness: 0,
    sharpness: 45,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'rgb',
    singleColor: '#00ff66',
    bgTransparent: false,
    bgColor: '#000000',
    glyphSetId: 'classic_standard',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 25
  },

  // ==========================================
  // 4. СПЕЦЭФФЕКТЫ И ТЕКСТУРЫ (SPECIAL EFFECTS & TEXTURES)
  // ==========================================
  {
    id: 'preset_fx_cmyk_halftone',
    name: 'CMYK Растровый полутон // CMYK Halftone Rosette',
    nameRu: 'CMYK Растровый полутон',
    nameEn: 'CMYK Halftone Rosette',
    sectionCategory: 'special_effects',
    specialCmyk: true,
    ditherAlgo: 'halftone',
    paletteId: 'monochrome_high',
    cellSize: 6,
    depth: 8,
    offset: 0,
    contrast: 1.45,
    brightness: 0,
    sharpness: 50,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'rgb',
    singleColor: '#ffffff',
    bgTransparent: false,
    bgColor: '#080808',
    glyphSetId: 'minimal_stipple',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },
  {
    id: 'preset_fx_epsilon_glow',
    name: 'Epsilon Фосфорное свечение // Epsilon Phosphor CRT Glow',
    nameRu: 'Epsilon Фосфорное свечение',
    nameEn: 'Epsilon Phosphor CRT Glow',
    sectionCategory: 'special_effects',
    specialEpsilonGlow: 80,
    ditherAlgo: 'bayer4',
    paletteId: 'phosphor_matrix',
    cellSize: 8,
    depth: 8,
    offset: 0,
    contrast: 1.5,
    brightness: 8,
    sharpness: 40,
    gamma: 1.15,
    blur: 1,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#4dff4d',
    bgTransparent: false,
    bgColor: '#020502',
    glyphSetId: 'cyber_digital',
    aspect: 0.55,
    invert: false,
    lfoEnabled: true,
    lfoTarget: 'brightness',
    lfoWaveform: 'sine',
    lfoSpeed: 0.8,
    lfoDepth: 25
  },
  {
    id: 'preset_fx_paper_texture',
    name: 'Старинная бумага и тушь // Paper Texture & Ink',
    nameRu: 'Старинная бумага и тушь',
    nameEn: 'Paper Texture & Ink',
    sectionCategory: 'special_effects',
    specialPaperTexture: 65,
    ditherAlgo: 'stucki',
    paletteId: 'parchment_sepia',
    cellSize: 7,
    depth: 7,
    offset: 0,
    contrast: 1.55,
    brightness: -4,
    sharpness: 55,
    gamma: 0.95,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#3b2f21',
    bgTransparent: false,
    bgColor: '#faf2e6',
    glyphSetId: 'gothic_alchemical',
    aspect: 0.55,
    invert: true,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },
  {
    id: 'preset_fx_shape_shifter',
    name: 'Shape Shifter Динамическая ячейка // Shape Shifter Morph',
    nameRu: 'Shape Shifter Динамическая ячейка',
    nameEn: 'Shape Shifter Morph',
    sectionCategory: 'special_effects',
    ditherAlgo: 'bayer8',
    paletteId: 'gem_amethyst',
    cellSize: 9,
    depth: 8,
    offset: 0,
    contrast: 1.35,
    brightness: 0,
    sharpness: 35,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#ab47f5',
    bgTransparent: false,
    bgColor: '#08020f',
    glyphSetId: 'geo_circles_phase',
    aspect: 0.6,
    invert: false,
    lfoEnabled: true,
    lfoTarget: 'cell',
    lfoWaveform: 'harmonic_combo',
    lfoSpeed: 1.2,
    lfoDepth: 50
  },
  {
    id: 'preset_fx_modulation_lines',
    name: 'Модуляционные линии ЭЛТ // CRT Modulation Lines',
    nameRu: 'Модуляционные линии ЭЛТ',
    nameEn: 'CRT Modulation Lines',
    sectionCategory: 'special_effects',
    specialModulationLines: 70,
    ditherAlgo: 'lines_horizontal',
    paletteId: 'matrix_cyber_cyan',
    cellSize: 5,
    depth: 6,
    offset: 0,
    contrast: 1.6,
    brightness: 0,
    sharpness: 60,
    gamma: 1.05,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#5ce1fc',
    bgTransparent: false,
    bgColor: '#020a0d',
    glyphSetId: 'minimal_wires',
    aspect: 0.55,
    invert: false,
    lfoEnabled: true,
    lfoTarget: 'offset',
    lfoWaveform: 'sawtooth_up',
    lfoSpeed: 1.6,
    lfoDepth: 40
  },
  {
    id: 'preset_fx_ascii_reveal',
    name: 'ASCII Reveal Контур // ASCII Edge Reveal',
    nameRu: 'ASCII Reveal Контур',
    nameEn: 'ASCII Edge Reveal',
    sectionCategory: 'special_effects',
    specialAsciiReveal: 75,
    ditherAlgo: 'atkinson',
    paletteId: 'monochrome_high',
    cellSize: 3,
    depth: 8,
    offset: 0,
    contrast: 2.2,
    brightness: -10,
    sharpness: 95,
    gamma: 0.85,
    blur: 0,
    posterize: 0,
    colorMode: 'single',
    singleColor: '#ffffff',
    bgTransparent: false,
    bgColor: '#000000',
    glyphSetId: 'block_shades',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },

  // ==========================================
  // 5. ДРАГОЦЕННЫЕ КАМНИ И СРЕДНЕВЕКОВЬЕ (GEMSTONES & MEDIEVAL)
  // ==========================================
  {
    id: 'preset_gem_emerald_crystal',
    name: 'Изумрудный кристалл // Emerald Matrix Crystal',
    nameRu: 'Изумрудный кристалл',
    nameEn: 'Emerald Matrix Crystal',
    sectionCategory: 'gemstone_medieval',
    ditherAlgo: 'stucki',
    paletteId: 'gem_emerald',
    cellSize: 4,
    depth: 8,
    offset: 0,
    contrast: 1.5,
    brightness: 4,
    sharpness: 55,
    gamma: 1.1,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#26db5b',
    bgTransparent: false,
    bgColor: '#020e05',
    glyphSetId: 'classic_clean',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },
  {
    id: 'preset_gem_ruby_velvet',
    name: 'Рубиновый бархат // Ruby Velvet Lustre',
    nameRu: 'Рубиновый бархат',
    nameEn: 'Ruby Velvet Lustre',
    sectionCategory: 'gemstone_medieval',
    ditherAlgo: 'floyd',
    paletteId: 'gem_ruby',
    cellSize: 7,
    depth: 7,
    offset: 0,
    contrast: 1.45,
    brightness: 0,
    sharpness: 45,
    gamma: 1.05,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#e62e54',
    bgTransparent: false,
    bgColor: '#120206',
    glyphSetId: 'geo_squares_steps',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },
  {
    id: 'preset_gem_sapphire_deep',
    name: 'Глубокий сапфир // Deep Oceanic Sapphire',
    nameRu: 'Глубокий сапфир',
    nameEn: 'Deep Oceanic Sapphire',
    sectionCategory: 'gemstone_medieval',
    ditherAlgo: 'burkes',
    paletteId: 'gem_sapphire',
    cellSize: 6,
    depth: 8,
    offset: 0,
    contrast: 1.4,
    brightness: 2,
    sharpness: 40,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#336ef5',
    bgTransparent: false,
    bgColor: '#020514',
    glyphSetId: 'braille_progressive',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },
  {
    id: 'preset_gem_amethyst_geode',
    name: 'Королевский аметист // Imperial Amethyst Geode',
    nameRu: 'Королевский аметист',
    nameEn: 'Imperial Amethyst Geode',
    sectionCategory: 'gemstone_medieval',
    ditherAlgo: 'bayer8',
    paletteId: 'gem_amethyst',
    cellSize: 8,
    depth: 7,
    offset: 0,
    contrast: 1.4,
    brightness: 0,
    sharpness: 35,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#ab47f5',
    bgTransparent: false,
    bgColor: '#0a0312',
    glyphSetId: 'cyber_digital',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },
  {
    id: 'preset_gem_opal_shimmer',
    name: 'Мерцающий опал // Shimmering White Opal',
    nameRu: 'Мерцающий опал',
    nameEn: 'Shimmering White Opal',
    sectionCategory: 'gemstone_medieval',
    ditherAlgo: 'halftone',
    paletteId: 'gem_opal',
    cellSize: 5,
    depth: 8,
    offset: 0,
    contrast: 1.35,
    brightness: 8,
    sharpness: 40,
    gamma: 1.1,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#ffffff',
    bgTransparent: false,
    bgColor: '#060e10',
    glyphSetId: 'minimal_stipple',
    aspect: 0.55,
    invert: false,
    lfoEnabled: true,
    lfoTarget: 'depth',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 35
  },
  {
    id: 'preset_med_illuminated_gold',
    name: 'Иллюминированный манускрипт // Illuminated Gold Manuscript',
    nameRu: 'Иллюминированный манускрипт',
    nameEn: 'Illuminated Gold Manuscript',
    sectionCategory: 'gemstone_medieval',
    ditherAlgo: 'serpentine_floyd',
    paletteId: 'illuminated_gold',
    cellSize: 6,
    depth: 8,
    offset: 0,
    contrast: 1.5,
    brightness: 0,
    sharpness: 50,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#f0b83c',
    bgTransparent: false,
    bgColor: '#100b03',
    glyphSetId: 'gothic_alchemical',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },
  {
    id: 'preset_med_gothic_blood',
    name: 'Готическая кровь и золото // Gothic Blood & Gold',
    nameRu: 'Готическая кровь и золото',
    nameEn: 'Gothic Blood & Gold',
    sectionCategory: 'gemstone_medieval',
    ditherAlgo: 'atkinson',
    paletteId: 'gothic_blood',
    cellSize: 9,
    depth: 8,
    offset: 0,
    contrast: 1.6,
    brightness: 0,
    sharpness: 60,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#c23232',
    bgTransparent: false,
    bgColor: '#0c0406',
    glyphSetId: 'runic_futhark',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },
  {
    id: 'preset_med_royal_lapis',
    name: 'Королевский лазурит // Royal Lapis Lazuli & Silver',
    nameRu: 'Королевский лазурит',
    nameEn: 'Royal Lapis Lazuli & Silver',
    sectionCategory: 'gemstone_medieval',
    ditherAlgo: 'jarvis',
    paletteId: 'medieval_lapis',
    cellSize: 5,
    depth: 8,
    offset: 0,
    contrast: 1.45,
    brightness: 2,
    sharpness: 45,
    gamma: 1.05,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#547ee0',
    bgTransparent: false,
    bgColor: '#040714',
    glyphSetId: 'classic_clean',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },

  // ==========================================
  // 6. ОСЕНЬ, ХЭЛЛОУИН И МАТРИЦА (AUTUMN & MOODY MATRIX)
  // ==========================================
  {
    id: 'preset_aut_pumpkin_halloween',
    name: 'Тыква и кость // Pumpkin & Bone Halloween',
    nameRu: 'Тыква и кость',
    nameEn: 'Pumpkin & Bone Halloween',
    sectionCategory: 'autumn_halloween',
    ditherAlgo: 'floyd',
    paletteId: 'autumn_pumpkin',
    cellSize: 8,
    depth: 7,
    offset: 0,
    contrast: 1.5,
    brightness: 0,
    sharpness: 50,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#eb751c',
    bgTransparent: false,
    bgColor: '#100500',
    glyphSetId: 'classic_standard',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },
  {
    id: 'preset_aut_crimson_leaves',
    name: 'Багряная осенняя охра // Crimson Autumn Ochre',
    nameRu: 'Багряная осенняя охра',
    nameEn: 'Crimson Autumn Ochre',
    sectionCategory: 'autumn_halloween',
    ditherAlgo: 'stucki',
    paletteId: 'autumn_ochre',
    cellSize: 6,
    depth: 8,
    offset: 0,
    contrast: 1.45,
    brightness: 0,
    sharpness: 45,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#d6512b',
    bgTransparent: false,
    bgColor: '#100203',
    glyphSetId: 'block_shades',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },
  {
    id: 'preset_aut_coven_violet',
    name: 'Ведьмин ковен // Coven Violet & Ghostly Slime',
    nameRu: 'Ведьмин ковен',
    nameEn: 'Coven Violet & Ghostly Slime',
    sectionCategory: 'autumn_halloween',
    ditherAlgo: 'atkinson',
    paletteId: 'halloween_coven',
    cellSize: 9,
    depth: 8,
    offset: 0,
    contrast: 1.6,
    brightness: 5,
    sharpness: 60,
    gamma: 1.1,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#38c958',
    bgTransparent: false,
    bgColor: '#0c0412',
    glyphSetId: 'runic_futhark',
    aspect: 0.55,
    invert: false,
    lfoEnabled: true,
    lfoTarget: 'offset',
    lfoWaveform: 'triangle',
    lfoSpeed: 1.3,
    lfoDepth: 40
  },
  {
    id: 'preset_aut_twilight_blood_moon',
    name: 'Сумеречная кровавая луна // Twilight Blood Moon',
    nameRu: 'Сумеречная кровавая луна',
    nameEn: 'Twilight Blood Moon',
    sectionCategory: 'autumn_halloween',
    ditherAlgo: 'bayer8',
    paletteId: 'halloween_twilight',
    cellSize: 7,
    depth: 7,
    offset: 0,
    contrast: 1.5,
    brightness: 0,
    sharpness: 50,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#b82772',
    bgTransparent: false,
    bgColor: '#080106',
    glyphSetId: 'geo_squares_steps',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },
  {
    id: 'preset_mat_stealth_carbon',
    name: 'Стелс-карбон матрицы // Moody Stealth Carbon Void',
    nameRu: 'Стелс-карбон матрицы',
    nameEn: 'Moody Stealth Carbon Void',
    sectionCategory: 'autumn_halloween',
    ditherAlgo: 'bayer16',
    paletteId: 'matrix_abyssal',
    cellSize: 2,
    depth: 8,
    offset: 0,
    contrast: 1.6,
    brightness: -5,
    sharpness: 70,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#728594',
    bgTransparent: false,
    bgColor: '#030405',
    glyphSetId: 'classic_clean',
    aspect: 0.55,
    invert: false,
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },
  {
    id: 'preset_mat_deep_emerald_void',
    name: 'Теневой изумруд пустоты // Deep Void Emerald Shadow',
    nameRu: 'Теневой изумруд пустоты',
    nameEn: 'Deep Void Emerald Shadow',
    sectionCategory: 'autumn_halloween',
    ditherAlgo: 'jarvis',
    paletteId: 'matrix_deep_emerald',
    cellSize: 4,
    depth: 9,
    offset: 0,
    contrast: 1.5,
    brightness: 0,
    sharpness: 55,
    gamma: 1.05,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    singleColor: '#1f9655',
    bgTransparent: false,
    bgColor: '#010603',
    glyphSetId: 'cyber_digital',
    aspect: 0.55,
    invert: false,
    lfoEnabled: true,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 0.9,
    lfoDepth: 30
  }
];

// Bayer Dithering & Cluster Matrices
export const BAYER_2X2: number[][] = [
  [0, 2],
  [3, 1]
];

export const BAYER_4X4: number[][] = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
];

export const BAYER_8X8: number[][] = [
  [ 0, 32,  8, 40,  2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44,  4, 36, 14, 46,  6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [ 3, 35, 11, 43,  1, 33,  9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47,  7, 39, 13, 45,  5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21]
];

export const BAYER_16X16: number[][] = (() => {
  const m: number[][] = Array.from({ length: 16 }, () => new Array(16).fill(0));
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const b8 = BAYER_8X8[y % 8][x % 8];
      const qx = Math.floor(x / 8);
      const qy = Math.floor(y / 8);
      const qVal = BAYER_2X2[qy][qx];
      m[y][x] = b8 * 4 + qVal;
    }
  }
  return m;
})();

export const CLUSTER_DOT_8X8: number[][] = [
  [24, 10, 12, 26, 35, 47, 49, 37],
  [ 8,  0,  2, 14, 45, 59, 61, 51],
  [22,  6,  4, 16, 43, 57, 63, 53],
  [30, 20, 18, 28, 33, 41, 55, 39],
  [34, 46, 48, 36, 25, 11, 13, 27],
  [44, 58, 60, 50,  9,  1,  3, 15],
  [42, 56, 62, 52, 23,  7,  5, 17],
  [32, 40, 54, 38, 31, 21, 19, 29]
];

// -------------------------------------------------------------
// BILINGUAL DICTIONARY (RU / EN)
// -------------------------------------------------------------
export const I18N = {
  ru: {
    brandTitle: 'Sacred Glyph Workstation',
    brandTooltip: 'Sacred Glyph Workstation — CS Denisa Halfpixel Top Demo — Наведите курсор для анимации рассыпания',
    welcomeMenuBtn: '⏏ МЕНЮ',
    welcomeMenuTooltip: 'Открыть окно загрузки GIF или картинки',
    welcomeTermTitle: 'SACRED GLYPH // ВХОД В СИСТЕМУ // INGEST BAY',
    welcomeSub: 'Графический ASCII редактор',
    welcomeUploadBtn: 'ЗАГРУЗИТЬ GIF ИЛИ КАРТИНКУ',
    welcomeDropHint: 'или перетащите файл (.GIF, .PNG, .JPG, .WEBP) прямо в это окно',
    welcomeSkipBtn: '▶ ВОЙТИ В СТУДИЮ С ОБРАЗЦОМ',
    presetLbl: 'ПРЕСЕТ:',
    savePreset: 'СОХРАНИТЬ',
    resetAllBtn: '↺ СБРОС НАСТРОЕК',
    saveApp: 'СКАЧАТЬ (.HTML)',
    exportBtn: 'ЭКСПОРТ',
    themeLight: '◐ ТЕМА: СВЕТЛАЯ',
    themeDark: '◑ ТЕМА: ТЕМНАЯ',
    mon1: '[МОНИТОР-1: ОСНОВНОЙ РАСТРОВЫЙ ДИСПЛЕЙ CRT // 8-BIT DAC]',
    fitLbl: 'МАСШТАБ (FIT):',
    fitModeTooltip: 'Режим масштабирования изображения',
    crtUploadBtn: 'ИМПОРТ',
    hudGrid: 'СЕТКА:',
    hudCells: 'ЯЧЕЙКИ:',
    hudZoom: 'МАСШТАБ:',
    hudLfoActive: 'LFO: АКТИВЕН',
    hudLfoOff: 'LFO: ВЫКЛ',
    dropPrompt: 'ЗАГРУЗИТЕ GIF ИЛИ ИЗОБРАЖЕНИЕ (DRAG & DROP)',
    dropSub: 'ПОДДЕРЖКА АНИМИРОВАННЫХ GIF, PNG, JPG, WEBP, MP4',
    mon2: '[МОНИТОР-2: МОДУЛЯЦИЯ СИГНАЛА LFO]',
    scopePhase: 'ФАЗА: 0°..360°',
    scopeSweep: 'РАЗВЕРТКА: 1ms/DIV',
    targetLbl: 'ЦЕЛЬ LFO 1:',
    waveLbl: 'ФОРМА ВОЛНЫ:',
    speedLbl: 'СКОРОСТЬ LFO 1',
    ampLbl: 'ГЛУБИНА LFO 1',
    chainTitle: 'ЦЕПЬ МОДУЛЯЦИИ // LFO 2',
    chainModeLbl: 'РЕЖИМ СВЯЗИ:',
    lfo2WaveLbl: 'ФОРМА LFO 2:',
    lfo2TargetLbl: 'ВТОРАЯ ЦЕЛЬ (TARGET 2):',
    speed2Lbl: 'СКОРОСТЬ 2',
    amp2Lbl: 'ГЛУБИНА 2',
    cellLbl: 'РАЗМЕР ЯЧЕЙКИ (CELL)',
    depthLbl: 'ГЛУБИНА (DEPTH)',
    offsetLbl: 'СМЕЩЕНИЕ (OFFSET)',
    aspectLbl: 'ПРОПОРЦИЯ',
    invertLbl: 'ИНВЕРСИЯ',
    sharpLbl: 'РЕЗКОСТЬ (КОНТУР)',
    gammaLbl: 'ГАММА-КРИВАЯ',
    blurLbl: 'СГЛАЖИВАНИЕ',
    posterLbl: 'ПОСТЕРИЗАЦИЯ',
    ditherLbl: 'АЛГОРИТМ:',
    contrastLbl: 'КОНТРАСТ',
    brightLbl: 'ЯРКОСТЬ',
    colorLbl: 'РЕЖИМ ОКРАСКИ:',
    transLbl: 'ПРОЗРАЧНЫЙ ФОН:',
    glyphColorLbl: 'ЦВЕТ ГЛИФОВ:',
    bgColorLbl: 'ЦВЕТ ФОНА:',
    gradeTitle: '[КОЛОР-ГРЕЙДИНГ: ЦВЕТОВЫЕ КРУГИ RGB]',
    liftWheelLbl: 'ТЕНИ (LIFT RGB)',
    gammaWheelLbl: 'ТОНА (GAMMA RGB)',
    gainWheelLbl: 'СВЕТА (GAIN RGB)',
    masterWheelLbl: 'ОБЩИЙ (MASTER RGB)',
    resetRackBtn: '↺ СБРОСИТЬ ВСЕ НАСТРОЙКИ',
    wheelLevelLbl: 'УРОВЕНЬ',
    tempLbl: 'ТЕМПЕРАТУРА',
    tintLbl: 'ОТТЕНОК (TINT)',
    satLbl: 'НАСЫЩЕННОСТЬ',
    hueLbl: 'СДВИГ ТОНА',
    deck1Title: '[БАЗА ГЛИФОВ & ТАЙМЛАЙН ЗАПИСИ АНИМАЦИИ]',
    activeLbl: 'АКТИВНО:',
    timelineTitle: '[ТАЙМЛАЙН ЗАПИСИ АНИМАЦИИ // LIVE REC]',
    timelineReady: 'ГОТОВ К ЗАПИСИ',
    timelineRecording: '● ИДЕТ ЗАПИСЬ...',
    timelinePlaying: '▶ ВОСПРОИЗВЕДЕНИЕ',
    timelineRecBtn: 'REC (ЗАПИСЬ)',
    timelineRecStopBtn: '■ СТОП REC',
    timelinePlayBtn: '▶ PLAY',
    timelinePauseBtn: '⏸ ПАУЗА',
    timelineExportGifBtn: 'СКАЧАТЬ GIF',
    timelineExportWebmBtn: 'СКАЧАТЬ WEBM',
    timelineHint: 'Нажмите REC, затем меняйте любые ползунки (яркость, cell size, контраст, цвет) — все действия запишутся в анимацию!',
    timelineLoopLbl: 'ЦИКЛ',
    timelineFpsLbl: 'FPS:',
    manualTitle: 'РУЧНОЙ ВВОД СИМВОЛОВ (ПРОИЗВОЛЬНЫЙ АЛФАВИТ):',
    manualLive: '● ЖИВОЙ ВВОД',
    btnReverse: 'РЕВЕРС ⇄',
    btnResetSet: 'ИЗ НАБОРА ↺',
    btnClear: 'ОЧИСТИТЬ ✕',
    btnCopy: 'КОПИРОВАТЬ 📋',
    deck3Title: '[ОТСЕК ЗАГРУЗКИ GIF & ИЗОБРАЖЕНИЙ]',
    slotPrompt: '▼ ЗАГРУЗИТЬ GIF ИЛИ КАРТИНКУ ▼',
    slotSub: 'DRAG & DROP / КЛИК ДЛЯ ОБЗОРА',
    animPanelTitle: '[УПРАВЛЕНИЕ АНИМАЦИЕЙ & КАДРЫ]',
    playBtn: 'СТАРТ / ПАУЗА',
    loopBtn: 'ПОВТОР',
    speedAnimLbl: 'СКОРОСТЬ:',
    quickGifBtn: 'ЗАПИСЬ GIF',
    scanlinesLbl: 'ЛИНИИ ЭЛТ:',
    rotateLbl: 'ПОВОРОТ 90°',
    flipHLbl: 'ОТРАЗИТЬ H',
    flipVLbl: 'ОТРАЗИТЬ V',
    modalExportTitle: 'СТУДИЯ ЭКСПОРТА // EXPORT STUDIO',
    exportDesc: 'Выберите формат для сохранения артворка (всего 3 формата):',
    gifBoxTitle: '1. АНИМИРОВАННЫЙ GIF (.GIF)',
    gifBoxDesc: 'Запись текущей анимации в оптимизированный зацикленный файл GIF89a.',
    gifDownloadBtn: 'СКАЧАТЬ GIF',
    gifResLbl: 'РАЗРЕШЕНИЕ GIF:',
    gifQualLbl: 'КАЧЕСТВО ЦВЕТА:',
    gifFpsLbl: 'ЧАСТОТА КАДРОВ:',
    imageBoxTitle: '2. ИЗОБРАЖЕНИЕ (PNG / JPEG)',
    imageBoxDesc: 'Экспорт текущего растрового кадра в высоком разрешении.',
    imageFormatLbl: 'ФОРМАТ:',
    imageScaleLbl: 'МАСШТАБ / РАЗРЕШЕНИЕ:',
    imageQualLbl: 'КАЧЕСТВО СЖАТИЯ:',
    imageDownloadBtn: 'СКАЧАТЬ PNG / JPEG',
    webmBoxTitle: '3. ВИДЕОЗАПИСЬ (.WEBM)',
    webmBoxDesc: 'Запись 5-секундного видеоролика анимации в формате WebM.',
    webmRecordBtn: 'СКАЧАТЬ WEBM',
    gifEncodingLbl: '● КОДИРОВАНИЕ GIF...',
    recordingStatusLbl: '● ЗАПИСЬ:',
    closeBtn: 'ЗАКРЫТЬ',
    savePresetTitle: 'СОХРАНИТЬ ПРЕСЕТ В ПАМЯТЬ',
    presetNameLbl: 'ИМЯ ПРЕСЕТА:',
    saveBtn: 'СОХРАНИТЬ',
    cancelBtn: 'ОТМЕНА',
    inspectTitle: 'ИНСПЕКТОР СИМВОЛА',
    copyGlyphBtn: 'СКОПИРОВАТЬ СИМВОЛ',
    customGlyphsPlaceholder: 'Введите любые символы (напр.  .:-=+*#%@█ или руны)...',
    presetNamePlaceholder: 'например, КИБЕР-ГРАФИТ-01',
    levelsSuffix: 'ур.',
    charsSuffix: 'симв.',
    activeCountPrefix: 'АКТИВНО:',
    savePresetTooltip: 'Сохранить текущие параметры в новый пресет',
    toggleThemeTooltip: 'Переключить тему (Светлая / Темная)',
    exportTooltip: 'Открыть экспорт',
    rotateTooltip: 'Повернуть на 90 градусов',
    flipHTooltip: 'Отразить по горизонтали',
    flipVTooltip: 'Отразить по вертикали',
    playTooltip: 'Старт / Пауза',
    loopTooltip: 'Зациклить воспроизведение',
    stepPrevTooltip: 'Предыдущий кадр',
    stepNextTooltip: 'Следующий кадр',
    gridTooltip: 'Включить/выключить сетку растра',
    resetGradingTooltip: 'Сбросить все настройки грейдинга',
    resetLiftTooltip: 'Сбросить тени',
    resetGammaTooltip: 'Сбросить полутона',
    resetGainTooltip: 'Сбросить света',
    resetMasterTooltip: 'Сбросить общий баланс (Master)',
    resetRackTooltip: 'Сбросить все параметры и модуляцию к начальным значениям',
    btnReverseTooltip: 'Инвертировать порядок глифов (от светлого к темному / наоборот)',
    btnResetSetTooltip: 'Загрузить символы из выбранного набора',
    btnClearTooltip: 'Очистить строку ввода',
    btnCopyTooltip: 'Скопировать строку символов в буфер',
    uploadSlotTooltip: 'Нажмите для загрузки GIF или картинки',
    resetGradingBtn: 'СБРОС ↺',
    zoomInTooltip: 'Приблизить (+)',
    zoomOutTooltip: 'Отдалить (-)',
    zoomResetTooltip: 'Сбросить масштаб (1:1)',
    toggleLangTooltip: 'Переключить язык (RU / EN)'
  },
  en: {
    brandTitle: 'Sacred Glyph Workstation',
    brandTooltip: 'Sacred Glyph Workstation — CS Denisa Halfpixel Top Demo — Hover to crumble and reconstitute',
    welcomeMenuBtn: '⏏ MENU',
    welcomeMenuTooltip: 'Open GIF or image upload menu window',
    welcomeTermTitle: 'SACRED GLYPH // INITIALIZATION INGEST BAY',
    welcomeSub: 'Graphical ASCII Editor',
    welcomeUploadBtn: 'UPLOAD GIF OR IMAGE',
    welcomeDropHint: 'or drag & drop a file (.GIF, .PNG, .JPG, .WEBP) into this window',
    welcomeSkipBtn: '▶ ENTER STUDIO WITH SAMPLE',
    presetLbl: 'PRESET:',
    savePreset: 'SAVE',
    resetAllBtn: '↺ RESET SETTINGS',
    saveApp: 'DOWNLOAD (.HTML)',
    exportBtn: 'EXPORT',
    themeLight: '◐ THEME: LIGHT',
    themeDark: '◑ THEME: DARK',
    mon1: '[MONITOR-1: PRIMARY RASTER CRT DISPLAY // 8-BIT DAC]',
    fitLbl: 'FIT MODE:',
    fitModeTooltip: 'Image scaling mode',
    crtUploadBtn: 'IMPORT',
    hudGrid: 'GRID:',
    hudCells: 'CELLS:',
    hudZoom: 'ZOOM:',
    hudLfoActive: 'LFO: ACTIVE',
    hudLfoOff: 'LFO: OFF',
    dropPrompt: 'UPLOAD GIF OR IMAGE (DRAG & DROP)',
    dropSub: 'SUPPORTS ANIMATED GIF, PNG, JPG, WEBP, MP4',
    mon2: '[MONITOR-2: LFO SIGNAL MODULATION]',
    scopePhase: 'PHASE: 0°..360°',
    scopeSweep: 'SWEEP: 1ms/DIV',
    targetLbl: 'LFO 1 TARGET:',
    waveLbl: 'WAVEFORM:',
    speedLbl: 'LFO 1 SPEED',
    ampLbl: 'LFO 1 DEPTH',
    chainTitle: 'MODULATION CHAIN // LFO 2',
    chainModeLbl: 'LINK MODE:',
    lfo2WaveLbl: 'LFO 2 WAVE:',
    lfo2TargetLbl: 'TARGET 2:',
    speed2Lbl: 'SPEED 2',
    amp2Lbl: 'DEPTH 2',
    cellLbl: 'CELL SIZE',
    depthLbl: 'DEPTH (LEVELS)',
    offsetLbl: 'OFFSET',
    aspectLbl: 'ASPECT RATIO',
    invertLbl: 'INVERT',
    sharpLbl: 'SHARPNESS (EDGE)',
    gammaLbl: 'GAMMA CURVE',
    blurLbl: 'SMOOTH / BLUR',
    posterLbl: 'POSTERIZE',
    ditherLbl: 'ALGORITHM:',
    contrastLbl: 'CONTRAST',
    brightLbl: 'BRIGHTNESS',
    colorLbl: 'COLOR MODE:',
    transLbl: 'TRANSPARENT BG:',
    glyphColorLbl: 'GLYPH COLOR:',
    bgColorLbl: 'BG COLOR:',
    gradeTitle: '[COLOR GRADING: 4-WAY RGB WHEELS]',
    liftWheelLbl: 'SHADOWS (LIFT RGB)',
    gammaWheelLbl: 'MIDTONES (GAMMA RGB)',
    gainWheelLbl: 'HIGHLIGHTS (GAIN RGB)',
    masterWheelLbl: 'MASTER (GLOBAL RGB)',
    resetRackBtn: '↺ RESET ALL SETTINGS',
    wheelLevelLbl: 'LEVEL',
    tempLbl: 'TEMPERATURE',
    tintLbl: 'TINT',
    satLbl: 'SATURATION',
    hueLbl: 'HUE SHIFT',
    deck1Title: '[GLYPH DATABASE & TIMELINE RECORDER]',
    activeLbl: 'ACTIVE:',
    timelineTitle: '[ANIMATION TIMELINE // LIVE REC]',
    timelineReady: 'READY TO RECORD',
    timelineRecording: '● RECORDING...',
    timelinePlaying: '▶ PLAYING',
    timelineRecBtn: 'REC (RECORD)',
    timelineRecStopBtn: '■ STOP REC',
    timelinePlayBtn: '▶ PLAY',
    timelinePauseBtn: '⏸ PAUSE',
    timelineExportGifBtn: 'DOWNLOAD GIF',
    timelineExportWebmBtn: 'DOWNLOAD WEBM',
    timelineHint: 'Press REC, then adjust any sliders (brightness, cell size, contrast, color) — all actions will be recorded into the animation!',
    timelineLoopLbl: 'LOOP',
    timelineFpsLbl: 'FPS:',
    manualTitle: 'MANUAL SYMBOL INPUT (CUSTOM ALPHABET):',
    manualLive: '● LIVE INPUT',
    btnReverse: 'REVERSE ⇄',
    btnResetSet: 'FROM SET ↺',
    btnClear: 'CLEAR ✕',
    btnCopy: 'COPY 📋',
    deck3Title: '[GIF & IMAGE INGEST MODULE]',
    slotPrompt: '▼ UPLOAD GIF OR IMAGE ▼',
    slotSub: 'DRAG & DROP / CLICK TO BROWSE',
    animPanelTitle: '[ANIMATION CONTROL & FRAMES]',
    playBtn: 'PLAY / PAUSE',
    loopBtn: 'LOOP',
    speedAnimLbl: 'SPEED:',
    quickGifBtn: 'REC GIF',
    scanlinesLbl: 'CRT SCANLINES:',
    rotateLbl: 'ROTATE 90°',
    flipHLbl: 'FLIP H',
    flipVLbl: 'FLIP V',
    modalExportTitle: 'EXPORT STUDIO // EXPORT STUDIO',
    exportDesc: 'Select format to export artwork (3 formats total):',
    gifBoxTitle: '1. ANIMATED GIF (.GIF)',
    gifBoxDesc: 'Record current animation into optimized looping GIF89a file.',
    gifDownloadBtn: 'DOWNLOAD GIF',
    gifResLbl: 'GIF RESOLUTION:',
    gifQualLbl: 'COLOR QUALITY:',
    gifFpsLbl: 'FRAME RATE:',
    imageBoxTitle: '2. STILL IMAGE (PNG / JPEG)',
    imageBoxDesc: 'Export current raster frame in high resolution.',
    imageFormatLbl: 'FORMAT:',
    imageScaleLbl: 'SCALE / RESOLUTION:',
    imageQualLbl: 'COMPRESSION QUALITY:',
    imageDownloadBtn: 'DOWNLOAD PNG / JPEG',
    webmBoxTitle: '3. VIDEO RECORDING (.WEBM)',
    webmBoxDesc: 'Record 5-second video clip of animation in WebM format.',
    webmRecordBtn: 'DOWNLOAD WEBM',
    gifEncodingLbl: '● ENCODING GIF...',
    recordingStatusLbl: '● RECORDING:',
    closeBtn: 'CLOSE',
    savePresetTitle: 'SAVE PRESET TO STORAGE',
    presetNameLbl: 'PRESET NAME:',
    saveBtn: 'SAVE',
    cancelBtn: 'CANCEL',
    inspectTitle: 'GLYPH INSPECTOR',
    copyGlyphBtn: 'COPY GLYPH',
    customGlyphsPlaceholder: 'Enter any characters (e.g.  .:-=+*#%@█ or runes)...',
    presetNamePlaceholder: 'e.g. CYBER-GRAPHITE-01',
    levelsSuffix: 'levels',
    charsSuffix: 'chars',
    activeCountPrefix: 'ACTIVE:',
    savePresetTooltip: 'Save current parameters to new preset',
    toggleThemeTooltip: 'Toggle theme (Light / Dark)',
    exportTooltip: 'Open export studio',
    rotateTooltip: 'Rotate 90 degrees',
    flipHTooltip: 'Flip horizontally',
    flipVTooltip: 'Flip vertically',
    playTooltip: 'Play / Pause',
    loopTooltip: 'Toggle loop playback',
    stepPrevTooltip: 'Previous frame',
    stepNextTooltip: 'Next frame',
    gridTooltip: 'Toggle raster gridlines',
    resetGradingTooltip: 'Reset all grading settings',
    resetLiftTooltip: 'Reset shadows',
    resetGammaTooltip: 'Reset midtones',
    resetGainTooltip: 'Reset highlights',
    resetMasterTooltip: 'Reset master balance',
    resetRackTooltip: 'Reset all settings and modulation to defaults',
    btnReverseTooltip: 'Invert glyph order (light to dark / dark to light)',
    btnResetSetTooltip: 'Load characters from active preset set',
    btnClearTooltip: 'Clear input field',
    btnCopyTooltip: 'Copy characters to clipboard',
    uploadSlotTooltip: 'Click to upload GIF or image',
    resetGradingBtn: 'RESET ↺',
    zoomInTooltip: 'Zoom In (+)',
    zoomOutTooltip: 'Zoom Out (-)',
    zoomResetTooltip: 'Reset View (1:1)',
    toggleLangTooltip: 'Switch Language (RU / EN)'
  }
};

// -------------------------------------------------------------
// MAIN WORKSTATION ENGINE CLASS
// -------------------------------------------------------------
export class SacredGlyphEngine {
  mainCanvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tempCanvas: HTMLCanvasElement;
  tempCtx: CanvasRenderingContext2D;
  oscilloCanvas: HTMLCanvasElement;
  oscilloCtx: CanvasRenderingContext2D;

  // Media Source (starts at 'none' until user uploads file)
  mediaType: 'none' | 'demo' | 'image' | 'gif' | 'video' = 'none';
  activeDemoMedia: 'hermetic_sigil' | 'abyssal_flame' = 'hermetic_sigil';
  sourceImage: HTMLImageElement | null = null;
  videoElement: HTMLVideoElement | null = null;
  webcamStream: MediaStream | null = null;

  // GIF Decoded Frames
  gifFrames: DecodedGifFrame[] = [];
  gifCurrentFrameIndex: number = 0;
  gifLastFrameTime: number = 0;
  gifIsPlaying: boolean = true;
  isLooping: boolean = true;
  playbackSpeed: number = 1.0;

  // Media Fitting Mode (Fix for image squishing/distortion)
  fitMode: 'fit' | 'cover' | 'stretch' = 'fit';

  // Rendering & Dithering Parameters
  cellSize: number = 9;
  depth: number = 8;
  offset: number = 0;
  aspect: number = 0.55;
  invert: boolean = false;
  ditherAlgo: string = 'bayer4';
  contrast: number = 1.25;
  brightness: number = 0;

  // New Image & Animation Parameters
  sharpness: number = 25; // 0 to 100%
  gamma: number = 1.0; // 0.5 to 2.5
  blur: number = 0; // 0 to 6 px
  posterize: number = 0; // 0 (off) or 2 to 32 levels
  rotation: number = 0; // 0, 90, 180, 270 degrees
  flipH: boolean = false;
  flipV: boolean = false;
  scanlines: boolean = false;

  // Color Parameters & Basic Modes
  colorMode: string = 'palette';
  paletteId: string = 'phosphor_matrix';
  singleColor: string = '#00ff66';
  bgTransparent: boolean = false;
  bgColor: string = '#040904';

  // Advanced 4-Way RGB Color Grading (Lift, Gamma, Gain, Master Color Wheels & Temp/Tint/Sat/Hue)
  liftX: number = 0;
  liftY: number = 0;
  liftLevel: number = 0; // -50 to +50%
  gammaX: number = 0;
  gammaY: number = 0;
  gammaLevel: number = 0; // -50 to +50%
  gainX: number = 0;
  gainY: number = 0;
  gainLevel: number = 0; // -50 to +50%
  masterX: number = 0;
  masterY: number = 0;
  masterLevel: number = 0; // -50 to +50%

  activePresetId: string = 'preset_cyber_green';

  temperature: number = 0; // -100 to +100
  tint: number = 0; // -100 to +100
  saturation: number = 100; // 0 to 200%
  hueRotate: number = 0; // 0 to 360 deg

  // LFO 1 Primary Modulator Parameters (11 Waveforms, 12 Targets)
  lfoEnabled: boolean = true;
  lfoTarget: string = 'offset';
  lfoWaveform: string = 'sine';
  lfoSpeed: number = 1.0;
  lfoDepth: number = 25;

  // LFO 2 Modulation Chain & Cross-Modulation (8 Circuits: FM, AM, SUM, RING, PM, GATE, FB, DUAL)
  lfo2Enabled: boolean = false;
  lfo2Mode: 'fm_rate' | 'am_depth' | 'sum_additive' | 'ring_mod' | 'phase_mod' | 'sample_track' | 'chaos_feedback' | 'cross_target' = 'fm_rate';
  lfo2Target: string = 'hue';
  lfo2Waveform: string = 'triangle';
  lfo2Speed: number = 0.5;
  lfo2Depth: number = 30;

  // Phase, Feedback, and Sample & Hold / Smooth Noise States
  lfo1Phase: number = 0;
  lfo2Phase: number = 0;
  lfoFeedbackVal: number = 0;
  trackHoldVal: number = 0;
  shValue1: number = 0;
  shValue2: number = 0;
  shNext1: number = 0;
  shNext2: number = 0;
  lastShCycle1: number = -1;
  lastShCycle2: number = -1;

  // Glyph Base & Manual Input (Request 2 & 6)
  activeCategory: string = 'classic';
  activeGlyphSetId: string = 'classic_clean';
  manualGlyphsText: string = " .:+*#%@";
  isManualActive: boolean = false;

  // Multi-Layer Workstation Compositor Stack
  layers: WorkstationLayer[] = [];
  activeLayerId: string = 'layer_1';

  // Viewport & State
  zoom: number = 1.0;
  panX: number = 0;
  panY: number = 0;
  isPanning: boolean = false;
  startX: number = 0;
  startY: number = 0;
  showGrid: boolean = false;
  lang: 'ru' | 'en' = 'ru';
  theme: 'light' | 'dark' = 'light';

  // Performance Telemetry & Optimization State
  lastTime: number = 0;
  frameCount: number = 0;
  currentFps: number = 60;
  fpsUpdateTimer: number = 0;
  lastOscilloTime: number = 0;

  isDirty: boolean = true;
  sourceDirty: boolean = true;
  containerW: number = 800;
  containerH: number = 560;
  cachedFontSize: number = -1;

  // Reusable Offscreen Canvas & Typed Buffers (prevents 60FPS GC pauses)
  sampleCanvas: HTMLCanvasElement;
  sampleCtx: CanvasRenderingContext2D;
  lumBufferA: Float32Array = new Float32Array(0);
  lumBufferB: Float32Array = new Float32Array(0);
  lumBufferC: Float32Array = new Float32Array(0);
  lumsWorkBuffer: Float32Array = new Float32Array(0);
  pixelImageData: ImageData | null = null;

  // Recorders
  isRecordingVideo: boolean = false;
  mediaRecorder: MediaRecorder | null = null;
  recordedVideoChunks: Blob[] = [];
  isEncodingGif: boolean = false;

  // Animation Timeline & Live Parameter Recorder
  timelineFrames: { canvas: HTMLCanvasElement; delay: number }[] = [];
  isTimelineRecording: boolean = false;
  timelineRecordTimer: any = null;
  timelineCaptureW: number = 0;
  timelineCaptureH: number = 0;
  timelineFps: number = 25;
  timelineMaxFrames: number = 250;
  isTimelinePlaying: boolean = false;
  timelineCurrentIndex: number = 0;
  timelinePlayRafId: number = 0;
  timelineLastPlayTime: number = 0;
  timelineLoop: boolean = true;
  isTimelineScrubbing: boolean = false;

  // Particles for Abyssal Flame Demo
  flameParticles: Array<{ x: number; y: number; vx: number; vy: number; life: number; decay: number; size: number }> = [];

  // -------------------------------------------------------------
  // 7 STUDIO SECTIONS PARAMETERS & HARDWARE BUFFERS
  // -------------------------------------------------------------
  // Section 1: SHADR STUDIO (Input & Fractal Waves)
  shadrActive: boolean = false;
  shadrSineSpeed: number = 1.0;
  shadrFreq: number = 2.0;
  shadrFeedback: number = 0.0;
  shadrWaveType: 'harmonic' | 'mandelbrot' | 'plasma' | 'lissajous' = 'harmonic';
  shadrCanvas: HTMLCanvasElement;
  shadrCtx: CanvasRenderingContext2D;
  shadrFeedbackCanvas: HTMLCanvasElement;
  shadrFeedbackCtx: CanvasRenderingContext2D;
  shadrTime: number = 0;

  // Section 2: AIKIZI LAB (Procedural Noise)
  aikiziActive: boolean = false;
  aikiziNoiseScale: number = 12;
  aikiziEvolution: number = 1.0;
  aikiziNoiseType: 'dust' | 'smoke' | 'dirt' | 'perlin' = 'perlin';
  aikiziIntensity: number = 40;
  aikiziNoiseCanvas: HTMLCanvasElement;
  aikiziNoiseCtx: CanvasRenderingContext2D;

  // Section 3: GLCHLAB (Glitch & Degradation)
  glitchActive: boolean = false;
  glitchDatamosh: number = 0;
  glitchScanCorruption: number = 0;
  glitchRgbShift: number = 0;
  glitchJpeg: number = 0; // 0 to 100% block artifacting
  glitchScriptSlayer: number = 0; // 0 to 100% unicode corruption

  // Special Effects (CMYK, Epsilon Glow, Paper Texture, Modulation Lines, ASCII Reveal)
  specialCmyk: boolean = false;
  specialEpsilonGlow: number = 0;
  specialPaperTexture: number = 0;
  specialModulationLines: number = 0;
  specialAsciiReveal: number = 0;

  // Section 5: MAKE NEUE WORLD (Experimental Typography)
  customInjectionActive: boolean = false;
  customInjectionText: string = '';
  typoScale: number = 0; // 0 to 100% dynamic font size scaling based on brightness
  jitter: number = 0; // 0 to 50px chaotic X/Y letter displacement

  // Section 6: MODULY (Parameter Automation)
  lfoRate: number = 1.0;
  lfoBindCellSize: boolean = false;
  lfoBindDatamosh: boolean = false;
  lfoBindScanCorruption: boolean = false;
  lfoBindRgbShift: boolean = false;
  lfoBindNoiseScale: boolean = false;
  lfoBindTypoScale: boolean = false;
  lfoBindJitter: boolean = false;
  lfoBindSineSpeed: boolean = false;
  lfoBindBrightness: boolean = false;
  lfoBindContrast: boolean = false;

  // Section 7: ABSTRACT STUDIO (Abstract Image Generation)
  abstractActive: boolean = false;
  abstractWarpSwirl: number = 0; // 0 to 100
  abstractKaleidoscope: number = 0; // 0 (off), 2, 4, 6, 8
  abstractRecursiveEcho: number = 0; // 0 to 100
  abstractPixelSort: number = 0; // 0 to 100
  abstractSpectrumDrift: number = 0; // 0 to 100
  abstractWorkCanvas: HTMLCanvasElement;
  abstractWorkCtx: CanvasRenderingContext2D;

  constructor() {
    this.mainCanvas = document.getElementById('ascii-canvas') as HTMLCanvasElement;
    this.ctx = this.mainCanvas.getContext('2d', { willReadFrequently: true })!;

    this.tempCanvas = document.createElement('canvas');
    this.tempCtx = this.tempCanvas.getContext('2d', { willReadFrequently: true })!;

    this.sampleCanvas = document.createElement('canvas');
    this.sampleCtx = this.sampleCanvas.getContext('2d', { willReadFrequently: true })!;

    this.oscilloCanvas = document.getElementById('oscillo-canvas') as HTMLCanvasElement;
    this.oscilloCtx = this.oscilloCanvas.getContext('2d')!;

    // Initialize 7 Studio Sections Offscreen Canvases
    this.shadrCanvas = document.createElement('canvas');
    this.shadrCanvas.width = 640;
    this.shadrCanvas.height = 480;
    this.shadrCtx = this.shadrCanvas.getContext('2d', { willReadFrequently: true })!;

    this.shadrFeedbackCanvas = document.createElement('canvas');
    this.shadrFeedbackCanvas.width = 640;
    this.shadrFeedbackCanvas.height = 480;
    this.shadrFeedbackCtx = this.shadrFeedbackCanvas.getContext('2d', { willReadFrequently: true })!;

    this.aikiziNoiseCanvas = document.createElement('canvas');
    this.aikiziNoiseCanvas.width = 320;
    this.aikiziNoiseCanvas.height = 240;
    this.aikiziNoiseCtx = this.aikiziNoiseCanvas.getContext('2d', { willReadFrequently: true })!;

    this.abstractWorkCanvas = document.createElement('canvas');
    this.abstractWorkCanvas.width = 640;
    this.abstractWorkCanvas.height = 480;
    this.abstractWorkCtx = this.abstractWorkCanvas.getContext('2d', { willReadFrequently: true })!;

    // Initialize 70 flame particles for abyssal flame demo
    for (let i = 0; i < 70; i++) {
      this.flameParticles.push({
        x: 320,
        y: 360,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -1.5 - Math.random() * 2.5,
        life: Math.random(),
        decay: 0.012 + Math.random() * 0.015,
        size: 15 + Math.random() * 25
      });
    }

    this.loadSavedState();
    this.init();
  }

  loadSavedState() {
    try {
      const savedLang = localStorage.getItem('ss_lang');
      if (savedLang === 'en' || savedLang === 'ru') this.lang = savedLang;

      const savedTheme = localStorage.getItem('ss_theme');
      if (savedTheme === 'dark' || savedTheme === 'light') this.theme = savedTheme;
    } catch (e) {}
  }

  saveState() {
    try {
      localStorage.setItem('ss_lang', this.lang);
      localStorage.setItem('ss_theme', this.theme);
    } catch (e) {}

    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.load('76px "CS Denisa Halfpixel Top Demo"').catch(() => {});
    }
  }

  updateContainerDimensions() {
    const container = document.getElementById('canvas-container');
    if (container) {
      this.containerW = Math.max(320, container.clientWidth);
      this.containerH = Math.max(240, container.clientHeight);
    }
  }

  markDirty(sourceChanged: boolean = false) {
    this.isDirty = true;
    if (sourceChanged) this.sourceDirty = true;
    if (this.layers && this.layers.length > 0) {
      this.saveActiveLayerState();
    }
  }

  init() {
    this.updateContainerDimensions();
    window.addEventListener('resize', () => {
      this.updateContainerDimensions();
      this.markDirty(true);
    });

    this.applyTheme(this.theme);
    this.initPresetsSelector();
    this.initCategoryTabs();
    this.initPalettesGrid();
    this.initColorWheels();
    this.setupEventListeners();
    this.applyPreset('preset_cyber_green');
    this.setLanguage(this.lang);
    this.initLayers();
    this.updateCanvasTransform();
    this.updateTimelineUI();
    this.drawTimelineTrack();

    requestAnimationFrame(this.renderLoop.bind(this));
  }

  // -------------------------------------------------------------
  // VIEWPORT ZOOM & PAN TRANSFORM
  // -------------------------------------------------------------
  updateCanvasTransform() {
    if (!this.mainCanvas) return;
    this.mainCanvas.style.transition = this.isPanning ? 'none' : 'transform 0.08s cubic-bezier(0.2, 0.9, 0.3, 1)';
    this.mainCanvas.style.transformOrigin = 'center center';
    this.mainCanvas.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;

    const zoomEl = document.getElementById('hud-zoom');
    if (zoomEl) zoomEl.textContent = `${Math.round(this.zoom * 100)}%`;

    const container = document.getElementById('canvas-container');
    if (container) {
      if (this.zoom > 1.01) {
        container.style.cursor = this.isPanning ? 'grabbing' : 'grab';
      } else {
        container.style.cursor = 'default';
      }
    }
  }

  // -------------------------------------------------------------
  // ANIMATION & CANVAS RENDER LOOP (Optimized Dirty-Checked Pipeline)
  // -------------------------------------------------------------
  renderLoop(timestamp: number) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this.frameCount++;
    this.fpsUpdateTimer += dt;
    if (this.fpsUpdateTimer >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / this.fpsUpdateTimer);
      this.frameCount = 0;
      this.fpsUpdateTimer = 0;
      const fpsEl = document.getElementById('hud-fps');
      if (fpsEl) fpsEl.textContent = this.currentFps.toString();
    }

    // Step animated GIF frames for all layers
    if (this.layers && this.layers.length > 0) {
      for (const lyr of this.layers) {
        if (lyr.visible && lyr.mediaType === 'gif' && lyr.gifFrames && lyr.gifFrames.length > 0 && lyr.gifIsPlaying) {
          const frameIdx = Math.min(lyr.gifFrames.length - 1, Math.max(0, lyr.gifCurrentFrameIndex || 0));
          const currentFrame = lyr.gifFrames[frameIdx];
          const effectiveDelay = (currentFrame?.delay || 100) / Math.max(0.1, this.playbackSpeed);
          if (timestamp - (lyr.gifLastFrameTime || 0) >= effectiveDelay) {
            lyr.gifLastFrameTime = timestamp;
            if (lyr.gifCurrentFrameIndex < lyr.gifFrames.length - 1) {
              lyr.gifCurrentFrameIndex++;
            } else if (this.isLooping) {
              lyr.gifCurrentFrameIndex = 0;
            }
            if (lyr.id === this.activeLayerId) {
              this.gifCurrentFrameIndex = lyr.gifCurrentFrameIndex;
              this.updateTimecode();
            }
            this.sourceDirty = true;
            this.isDirty = true;
          }
        }
      }
    } else if (this.mediaType === 'gif' && this.gifFrames.length > 0 && this.gifIsPlaying) {
      const currentFrame = this.gifFrames[this.gifCurrentFrameIndex];
      const effectiveDelay = currentFrame.delay / Math.max(0.1, this.playbackSpeed);
      if (timestamp - this.gifLastFrameTime >= effectiveDelay) {
        this.gifLastFrameTime = timestamp;
        if (this.gifCurrentFrameIndex < this.gifFrames.length - 1) {
          this.gifCurrentFrameIndex++;
        } else if (this.isLooping) {
          this.gifCurrentFrameIndex = 0;
        }
        this.sourceDirty = true;
        this.isDirty = true;
        this.updateTimecode();
      }
    }

    // Advance LFO phases and calculate modulation values
    let lfo1Val = 0;
    let lfo2Val = 0;

    let effCellSize = this.cellSize;
    let effDepth = this.depth;
    let effOffset = this.offset;
    let effContrast = this.contrast;
    let effBrightness = this.brightness;
    let effGamma = this.gamma;
    let effHueRotate = this.hueRotate;
    let effTemp = this.temperature;
    let effSat = this.saturation;
    let effLiftLevel = this.liftLevel;
    let effGammaLevel = this.gammaLevel;
    let effGainLevel = this.gainLevel;
    let effRotation = this.rotation;
    let effAspect = this.aspect;
    let effSharpness = this.sharpness;
    let effBlur = this.blur;

    if (this.lfoEnabled && this.gifIsPlaying) {
      const dtSec = Math.max(0.001, Math.min(0.1, dt * 0.001));

      // LFO 2 calculation
      let lfo2Freq = this.lfo2Speed * this.playbackSpeed;
      this.lfo2Phase += lfo2Freq * Math.PI * 2 * dtSec;
      const cycle2 = Math.floor(this.lfo2Phase / (Math.PI * 2));
      lfo2Val = this.evalWaveform(this.lfo2Waveform, this.lfo2Phase, cycle2, 2);

      // LFO 1 calculation with modulation circuits
      let lfo1Freq = this.lfoSpeed * this.playbackSpeed;
      let effLfo1Depth = this.lfoDepth;

      if (this.lfo2Enabled) {
        const lfo2Amt = (this.lfo2Depth / 100) * lfo2Val;
        if (this.lfo2Mode === 'fm_rate') {
          // FM: LFO 2 modulates frequency of LFO 1
          lfo1Freq *= Math.max(0.05, 1 + lfo2Amt * 2.0);
        } else if (this.lfo2Mode === 'am_depth') {
          // AM: LFO 2 modulates depth of LFO 1
          effLfo1Depth = Math.max(0, Math.min(100, this.lfoDepth * (1 + lfo2Amt)));
        } else if (this.lfo2Mode === 'phase_mod') {
          // PM: LFO 2 modulates phase of LFO 1
          this.lfo1Phase += lfo2Amt * Math.PI * 0.15;
        } else if (this.lfo2Mode === 'chaos_feedback') {
          // Chaos Feedback
          lfo1Freq *= Math.max(0.05, 1 + this.lfoFeedbackVal * (this.lfo2Depth / 100) * 1.5);
        }
      }

      this.lfo1Phase += lfo1Freq * Math.PI * 2 * dtSec;
      const cycle1 = Math.floor(this.lfo1Phase / (Math.PI * 2));
      lfo1Val = this.evalWaveform(this.lfoWaveform, this.lfo1Phase, cycle1, 1);
      this.lfoFeedbackVal = lfo1Val;

      if (this.lfo2Enabled) {
        if (this.lfo2Mode === 'sum_additive') {
          lfo1Val = lfo1Val * 0.6 + lfo2Val * 0.4;
        } else if (this.lfo2Mode === 'ring_mod') {
          lfo1Val = lfo1Val * lfo2Val;
        } else if (this.lfo2Mode === 'sample_track') {
          if (lfo2Val > 0) this.trackHoldVal = lfo1Val;
          lfo1Val = this.trackHoldVal;
        }
      }

      const applyMod = (target: string, val: number, depth: number) => {
        const factor = (depth / 100) * val;
        switch (target) {
          case 'offset': effOffset += Math.round(factor * 14); break;
          case 'cell': effCellSize = Math.max(1, Math.round(this.cellSize + factor * 8)); break;
          case 'depth': effDepth = Math.max(2, Math.round(this.depth + factor * 12)); break;
          case 'both':
            effOffset += Math.round(factor * 10);
            effDepth = Math.max(2, Math.round(this.depth + factor * 8));
            break;
          case 'contrast': effContrast = Math.max(0.2, this.contrast * (1 + factor * 0.8)); break;
          case 'brightness': effBrightness = Math.max(-100, Math.min(100, this.brightness + factor * 40)); break;
          case 'gamma': effGamma = Math.max(0.2, this.gamma * (1 + factor * 0.7)); break;
          case 'hue': effHueRotate = (this.hueRotate + factor * 180 + 360) % 360; break;
          case 'temperature': effTemp = Math.max(-100, Math.min(100, this.temperature + factor * 60)); break;
          case 'saturation': effSat = Math.max(0, Math.min(200, this.saturation * (1 + factor * 0.9))); break;
          case 'lift': effLiftLevel = Math.max(-50, Math.min(50, this.liftLevel + factor * 40)); break;
          case 'gain': effGainLevel = Math.max(-50, Math.min(50, this.gainLevel + factor * 40)); break;
          case 'rotation': effRotation = (this.rotation + factor * 45 + 360) % 360; break;
          case 'aspect': effAspect = Math.max(0.2, Math.min(2.0, this.aspect * (1 + factor * 0.5))); break;
          case 'sharpness': effSharpness = Math.max(0, Math.min(100, this.sharpness + factor * 50)); break;
          case 'blur': effBlur = Math.max(0, Math.min(6, this.blur + Math.abs(factor) * 5)); break;
        }
      };

      applyMod(this.lfoTarget, lfo1Val, effLfo1Depth);
      if (this.lfo2Enabled && this.lfo2Mode === 'cross_target') {
        applyMod(this.lfo2Target, lfo2Val, this.lfo2Depth);
      }

      // Section 6: MODULY Automation Routing Toggles
      const lfoFactor = (effLfo1Depth / 100) * lfo1Val;
      if (this.lfoBindCellSize) effCellSize = Math.max(1, Math.round(this.cellSize + lfoFactor * 10));
      if (this.lfoBindDatamosh) this.glitchDatamosh = Math.max(0, Math.min(100, Math.round(50 + lfoFactor * 50)));
      if (this.lfoBindScanCorruption) this.glitchScanCorruption = Math.max(0, Math.min(100, Math.round(40 + lfoFactor * 40)));
      if (this.lfoBindRgbShift) this.glitchRgbShift = Math.max(0, Math.min(50, Math.round(20 + lfoFactor * 20)));
      if (this.lfoBindNoiseScale) this.aikiziNoiseScale = Math.max(1, Math.min(50, Math.round(15 + lfoFactor * 15)));
      if (this.lfoBindTypoScale) this.typoScale = Math.max(0, Math.min(100, Math.round(45 + lfoFactor * 45)));
      if (this.lfoBindJitter) this.jitter = Math.max(0, Math.min(50, Math.round(15 + lfoFactor * 15)));
      if (this.lfoBindSineSpeed) this.shadrSineSpeed = Math.max(0.1, Math.min(5.0, +(1.5 + lfoFactor * 1.2).toFixed(2)));
      if (this.lfoBindBrightness) effBrightness = Math.max(-100, Math.min(100, Math.round(this.brightness + lfoFactor * 45)));
      if (this.lfoBindContrast) effContrast = Math.max(0.2, +(this.contrast * (1 + lfoFactor * 0.7)).toFixed(2));

      this.isDirty = true;
    }

    // Procedural demo sources, videos, or Shadr wave generator continuously animate
    const hasAnimatedLayer = this.layers && this.layers.some(l => l.visible && (l.mediaType === 'demo' || l.mediaType === 'video' || l.shadrActive));
    if (this.mediaType === 'demo' || this.mediaType === 'video' || this.shadrActive || hasAnimatedLayer) {
      this.sourceDirty = true;
      this.isDirty = true;
    }

    // Draw Source Image or Demo into temp canvas if source is dirty
    if (this.sourceDirty) {
      this.drawSourceMedia(timestamp);
    }

    // If playing timeline animation, step through recorded frames
    if (this.isTimelinePlaying && this.timelineFrames.length > 0) {
      const targetDelay = 1000 / this.timelineFps;
      if (timestamp - this.timelineLastPlayTime >= targetDelay) {
        this.timelineLastPlayTime = timestamp;
        this.timelineCurrentIndex++;
        if (this.timelineCurrentIndex >= this.timelineFrames.length) {
          if (this.timelineLoop) {
            this.timelineCurrentIndex = 0;
          } else {
            this.stopTimelinePlayback();
          }
        }
        if (this.isTimelinePlaying) {
          this.displayTimelineFrame(this.timelineCurrentIndex);
        }
      }
    } else if (this.isDirty) {
      // Render ASCII Art on Main Canvas only when state/frame is dirty
      this.renderAsciiFrame(
        effCellSize,
        effDepth,
        effOffset,
        effContrast,
        effBrightness,
        effGamma,
        effHueRotate,
        effTemp,
        effSat,
        effLiftLevel,
        effGammaLevel,
        effGainLevel,
        effRotation,
        effAspect,
        effSharpness,
        effBlur
      );
      this.isDirty = false;
    }

    // Draw Secondary Oscilloscope Canvas (throttled to ~30 FPS for optimal UI responsiveness)
    if (timestamp - this.lastOscilloTime >= 33) {
      this.lastOscilloTime = timestamp;
      this.drawOscilloscope(timestamp);
    }

    requestAnimationFrame(this.renderLoop.bind(this));
  }

  // -------------------------------------------------------------
  // DRAW SOURCE MEDIA INTO TEMP CANVAS
  // (Request 4: Demo sources limited ONLY to hermetic_sigil & abyssal_flame)
  // -------------------------------------------------------------
  drawSourceMedia(timestamp: number) {
    const w = 640;
    const h = 480;
    if (this.tempCanvas.width !== w || this.tempCanvas.height !== h) {
      this.tempCanvas.width = w;
      this.tempCanvas.height = h;
    }

    const ctx = this.tempCtx;
    ctx.save();

    if (this.mediaType === 'image' && this.sourceImage) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);
      this.drawImageFit(ctx, this.sourceImage, w, h);
      this.sourceDirty = false;
    } else if (this.mediaType === 'gif' && this.gifFrames.length > 0) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);
      const frame = this.gifFrames[this.gifCurrentFrameIndex];
      this.drawImageFit(ctx, frame.canvas, w, h);
      this.sourceDirty = false;
    } else if (this.mediaType === 'demo') {
      this.drawDemoMedia(ctx, w, h, timestamp * this.playbackSpeed);
    } else {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);
      this.sourceDirty = false;
    }

    ctx.restore();
  }

  drawImageFit(ctx: CanvasRenderingContext2D, img: HTMLImageElement | HTMLCanvasElement, targetW: number, targetH: number) {
    const imgW = img.width || (img as HTMLImageElement).naturalWidth;
    const imgH = img.height || (img as HTMLImageElement).naturalHeight;
    if (!imgW || !imgH) return;

    const scale = Math.min(targetW / imgW, targetH / imgH);
    const sw = imgW * scale;
    const sh = imgH * scale;
    const sx = (targetW - sw) / 2;
    const sy = (targetH - sh) / 2;

    ctx.drawImage(img, sx, sy, sw, sh);
  }

  // -------------------------------------------------------------
  // DEMO MEDIA PROCEDURAL GENERATORS (Hermetic Sigil & Abyssal Flame ONLY)
  // -------------------------------------------------------------
  drawDemoMedia(ctx: CanvasRenderingContext2D, w: number, h: number, timestamp: number) {
    const type = this.activeDemoMedia;

    if (type === 'hermetic_sigil') {
      ctx.fillStyle = '#060508';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const angle = timestamp * 0.0008;

      ctx.save();
      ctx.translate(cx, cy);

      // Outer occult ring
      ctx.strokeStyle = '#c49619';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 180, 0, Math.PI * 2);
      ctx.stroke();

      // Rotating radial rays
      ctx.rotate(angle);
      ctx.strokeStyle = '#f5d061';
      ctx.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 168, Math.sin(a) * 168);
        ctx.lineTo(Math.cos(a) * 192, Math.sin(a) * 192);
        ctx.stroke();
      }

      // Counter-rotating double hexagram triangles
      ctx.rotate(-angle * 2.2);
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      for (let t = 0; t < 2; t++) {
        ctx.beginPath();
        const offsetAngle = t * Math.PI;
        for (let i = 0; i < 3; i++) {
          const a = offsetAngle + (i / 3) * Math.PI * 2;
          const x = Math.cos(a) * 130;
          const y = Math.sin(a) * 130;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Center pentagram
      ctx.rotate(angle * 1.5);
      ctx.strokeStyle = '#f5d061';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const x = Math.cos(a) * 85;
        const y = Math.sin(a) * 85;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      // Inner glowing core
      ctx.fillStyle = 'rgba(255, 230, 120, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    } else if (type === 'abyssal_flame') {
      // Atmospheric dark flame trail
      ctx.fillStyle = 'rgba(6, 5, 8, 0.35)';
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < this.flameParticles.length; i++) {
        const p = this.flameParticles[i];
        p.x += p.vx + Math.sin(timestamp * 0.003 + p.y * 0.02) * 1.2;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.life <= 0 || p.y < 30) {
          p.x = w / 2 + (Math.random() - 0.5) * 120;
          p.y = h - 20 + Math.random() * 20;
          p.life = 1;
          p.size = 15 + Math.random() * 25;
        }

        const r = Math.floor(255 * p.life);
        const g = Math.floor(180 * Math.pow(p.life, 2));
        const b = Math.floor(40 * Math.pow(p.life, 4));
        const alpha = Math.min(1, p.life * 1.5);

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // -------------------------------------------------------------
  // SECTION 1: SHADR STUDIO WAVE GENERATOR (Harmonic, Mandelbrot, Plasma, Lissajous + Feedback)
  // -------------------------------------------------------------
  generateShadrWave(timestamp: number, w: number, h: number) {
    if (this.shadrCanvas.width !== w || this.shadrCanvas.height !== h) {
      this.shadrCanvas.width = w;
      this.shadrCanvas.height = h;
      this.shadrFeedbackCanvas.width = w;
      this.shadrFeedbackCanvas.height = h;
    }
    const ctx = this.shadrCtx;
    const fbCtx = this.shadrFeedbackCtx;

    // Apply feedback frame if feedback > 0
    if (this.shadrFeedback > 0) {
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = this.shadrFeedback / 100;
      ctx.drawImage(this.shadrFeedbackCanvas, 0, 0);
      ctx.globalAlpha = 1.0;
    } else {
      ctx.fillStyle = '#020402';
      ctx.fillRect(0, 0, w, h);
    }

    const t = (timestamp * 0.001) * this.shadrSineSpeed;
    const freq = Math.max(0.2, this.shadrFreq);

    if (this.shadrWaveType === 'harmonic') {
      ctx.save();
      const numWaves = 14;
      for (let i = 0; i < numWaves; i++) {
        const p = i / numWaves;
        const phase = t * 2.0 + p * Math.PI * 3;
        const amp = (h * 0.32) * Math.sin(t * 0.8 + i);
        ctx.strokeStyle = `hsl(${(p * 180 + t * 40) % 360}, 90%, 65%)`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 6) {
          const nx = (x / w) * freq * Math.PI * 2;
          const y = h / 2 + Math.sin(nx + phase) * amp + Math.cos(nx * 0.5 - t) * (amp * 0.4);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
    } else if (this.shadrWaveType === 'mandelbrot') {
      const imgData = ctx.createImageData(w, h);
      const data32 = new Uint32Array(imgData.data.buffer);
      const zoom = 1.2 + Math.sin(t * 0.5) * 0.6;
      const panX = -0.7 + Math.cos(t * 0.3) * 0.15;
      const panY = 0.0 + Math.sin(t * 0.4) * 0.15;
      const maxIter = 24;
      const step = 2;

      for (let y = 0; y < h; y += step) {
        const zy0 = ((y - h / 2) / (0.5 * zoom * h)) * freq + panY;
        for (let x = 0; x < w; x += step) {
          const zx0 = ((x - w / 2) / (0.5 * zoom * h)) * freq + panX;
          let zx = zx0;
          let zy = zy0;
          let iter = 0;
          while (zx * zx + zy * zy < 4 && iter < maxIter) {
            const xtemp = zx * zx - zy * zy + zx0;
            zy = 2 * zx * zy + zy0;
            zx = xtemp;
            iter++;
          }
          const v = Math.floor((iter / maxIter) * 255);
          const color32 = (255 << 24) | ((v * 2 % 255) << 16) | (v << 8) | ((v * 3) % 255);
          const idx = y * w + x;
          data32[idx] = color32;
          if (x + 1 < w) data32[idx + 1] = color32;
          if (y + 1 < h) {
            data32[idx + w] = color32;
            if (x + 1 < w) data32[idx + w + 1] = color32;
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
    } else if (this.shadrWaveType === 'plasma') {
      const imgData = ctx.createImageData(w, h);
      const data = imgData.data;
      const step = 2;
      for (let y = 0; y < h; y += step) {
        const rowOff = y * w;
        for (let x = 0; x < w; x += step) {
          const v1 = Math.sin((x / 30) * freq + t);
          const v2 = Math.sin((y / 25) * freq + t * 1.3);
          const v3 = Math.sin(((x + y) / 35) * freq + t * 0.7);
          const cx = x - w / 2;
          const cy = y - h / 2;
          const dist = Math.sqrt(cx * cx + cy * cy);
          const v4 = Math.sin((dist / 20) * freq - t * 2.2);
          const val = (v1 + v2 + v3 + v4) * 0.25;
          const r = Math.floor(Math.sin(val * Math.PI) * 127 + 128);
          const g = Math.floor(Math.cos(val * Math.PI) * 127 + 128);
          const b = Math.floor(Math.sin(val * Math.PI + 2.0) * 127 + 128);

          const idx = (rowOff + x) * 4;
          data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 255;
          if (x + 1 < w) {
            const idx2 = (rowOff + x + 1) * 4;
            data[idx2] = r; data[idx2 + 1] = g; data[idx2 + 2] = b; data[idx2 + 3] = 255;
          }
          if (y + 1 < h) {
            const idx3 = ((y + 1) * w + x) * 4;
            data[idx3] = r; data[idx3 + 1] = g; data[idx3 + 2] = b; data[idx3 + 3] = 255;
            if (x + 1 < w) {
              const idx4 = ((y + 1) * w + x + 1) * 4;
              data[idx4] = r; data[idx4 + 1] = g; data[idx4 + 2] = b; data[idx4 + 3] = 255;
            }
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
    } else if (this.shadrWaveType === 'lissajous') {
      ctx.save();
      ctx.translate(w / 2, h / 2);
      const points = 360;
      const a = 3 * freq;
      const b = 4 * freq;
      const delta = t * 1.5;
      const rx = w * 0.38;
      const ry = h * 0.38;

      ctx.strokeStyle = '#00ffaa';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const theta = (i / points) * Math.PI * 2;
        const x = rx * Math.sin(a * theta + delta);
        const y = ry * Math.sin(b * theta);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Secondary nested orbit
      ctx.strokeStyle = '#ff66c4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const theta = (i / points) * Math.PI * 2;
        const x = (rx * 0.65) * Math.sin((a + 1) * theta - delta * 1.2);
        const y = (ry * 0.65) * Math.sin((b + 1) * theta);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Save to feedback buffer
    fbCtx.clearRect(0, 0, w, h);
    fbCtx.drawImage(this.shadrCanvas, 0, 0);
  }

  // -------------------------------------------------------------
  // SECTION 2: AIKIZI LAB PROCEDURAL NOISE OVERLAY
  // -------------------------------------------------------------
  applyAikiziNoise(ctx: CanvasRenderingContext2D, w: number, h: number, timestamp: number) {
    const intensity = (this.aikiziIntensity / 100);
    if (intensity <= 0) return;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const scale = Math.max(1, this.aikiziNoiseScale);
    const t = (timestamp * 0.001) * this.aikiziEvolution;

    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        let n = 0;
        if (this.aikiziNoiseType === 'dust') {
          // High-grain stochastic dust
          const r = Math.random();
          n = r > 0.88 ? (r - 0.88) * 8.0 : 0;
        } else if (this.aikiziNoiseType === 'smoke') {
          // Turbulent fluid smoke
          const sx = x / (scale * 2.5);
          const sy = y / (scale * 2.5);
          const n1 = Math.sin(sx + t) * Math.cos(sy - t * 0.8);
          const n2 = Math.sin(sx * 2.1 - t * 1.2 + sy * 0.5) * 0.5;
          n = (n1 + n2) * 0.5;
        } else if (this.aikiziNoiseType === 'dirt') {
          // Organic grunge speckles
          const sx = Math.floor(x / scale);
          const sy = Math.floor(y / scale);
          const hash = Math.sin(sx * 12.9898 + sy * 78.233 + t * 0.2) * 43758.5453;
          const r = hash - Math.floor(hash);
          n = r < 0.25 ? -0.8 : (r > 0.85 ? 0.6 : 0);
        } else {
          // Perlin / Simplex harmonic approximation
          const sx = (x / (scale * 3));
          const sy = (y / (scale * 3));
          n = Math.sin(sx + Math.cos(sy + t)) * Math.cos(sy + Math.sin(sx - t));
        }

        const idx = (row + x) * 4;
        const add = n * intensity * 255;
        data[idx] = Math.max(0, Math.min(255, data[idx] + add));
        data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + add));
        data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] + add));
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // -------------------------------------------------------------
  // SECTION 3: GLCHLAB SIGNAL BREAKDOWN & GLITCH
  // -------------------------------------------------------------
  applyGlitchTransforms(ctx: CanvasRenderingContext2D, w: number, h: number, timestamp: number) {
    const t = timestamp * 0.001;

    // 1. Datamosh: horizontal block displacements
    if (this.glitchDatamosh > 0) {
      const numBlocks = Math.floor(1 + (this.glitchDatamosh / 15));
      const maxShift = Math.floor((this.glitchDatamosh / 100) * (w * 0.45));
      for (let b = 0; b < numBlocks; b++) {
        const blockY = Math.floor(((Math.sin(t * 3.5 + b * 2) * 0.5 + 0.5)) * h);
        const blockH = Math.max(2, Math.floor(((Math.cos(t * 2.1 + b) * 0.5 + 0.5)) * (h * 0.2)));
        const shiftX = Math.floor((Math.sin(t * 8.0 + b * 4.5)) * maxShift);
        if (shiftX !== 0 && blockY < h) {
          const sliceH = Math.min(h - blockY, blockH);
          ctx.drawImage(ctx.canvas, 0, blockY, w, sliceH, shiftX, blockY, w, sliceH);
        }
      }
    }

    // 2. Scan-Corruption: random scanline dropouts & signal noise bands
    if (this.glitchScanCorruption > 0) {
      const dropoutCount = Math.floor((this.glitchScanCorruption / 100) * (h * 0.35));
      ctx.fillStyle = '#000000';
      for (let i = 0; i < dropoutCount; i++) {
        const sy = (Math.floor(t * 60 + i * 17)) % h;
        const sHeight = i % 4 === 0 ? 3 : 1;
        ctx.fillRect(0, sy, w, sHeight);
      }
    }

    // 3. RGB Shift: Chromatic channel separation
    if (this.glitchRgbShift > 0) {
      const shift = Math.round(this.glitchRgbShift * (w / 120));
      if (shift > 0) {
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        const copy = new Uint8ClampedArray(data);

        for (let y = 0; y < h; y++) {
          const row = y * w;
          for (let x = 0; x < w; x++) {
            const idx = (row + x) * 4;
            const rX = Math.min(w - 1, Math.max(0, x + shift));
            const bX = Math.min(w - 1, Math.max(0, x - shift));
            data[idx] = copy[(row + rX) * 4];       // Red shifted
            data[idx + 2] = copy[(row + bX) * 4 + 2]; // Blue shifted
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }
    }

    // 4. JPEG Glitch: 8x8 block quantization artifacts & chroma ringing
    if (this.glitchJpeg > 0) {
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      const qStep = Math.max(2, Math.round((this.glitchJpeg / 100) * 48));
      const blockSize = 8;
      const numBlocksX = Math.ceil(w / blockSize);
      const numBlocksY = Math.ceil(h / blockSize);

      for (let by = 0; by < numBlocksY; by++) {
        for (let bx = 0; bx < numBlocksX; bx++) {
          const startX = bx * blockSize;
          const startY = by * blockSize;
          let sumR = 0, sumG = 0, sumB = 0, count = 0;

          for (let dy = 0; dy < blockSize && startY + dy < h; dy++) {
            const row = (startY + dy) * w;
            for (let dx = 0; dx < blockSize && startX + dx < w; dx++) {
              const idx = (row + startX + dx) * 4;
              sumR += data[idx];
              sumG += data[idx + 1];
              sumB += data[idx + 2];
              count++;
            }
          }

          if (count > 0) {
            let avgR = Math.round((sumR / count) / qStep) * qStep;
            let avgG = Math.round((sumG / count) / qStep) * qStep;
            let avgB = Math.round((sumB / count) / qStep) * qStep;
            avgR = Math.max(0, Math.min(255, avgR));
            avgG = Math.max(0, Math.min(255, avgG));
            avgB = Math.max(0, Math.min(255, avgB));

            const blend = Math.min(1.0, (this.glitchJpeg / 100) * 0.85);

            for (let dy = 0; dy < blockSize && startY + dy < h; dy++) {
              const row = (startY + dy) * w;
              for (let dx = 0; dx < blockSize && startX + dx < w; dx++) {
                const idx = (row + startX + dx) * 4;
                data[idx] = Math.round(data[idx] * (1 - blend) + avgR * blend);
                data[idx + 1] = Math.round(data[idx + 1] * (1 - blend) + avgG * blend);
                data[idx + 2] = Math.round(data[idx + 2] * (1 - blend) + avgB * blend);
              }
            }
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }
  }

  // -------------------------------------------------------------
  // SECTION 7: ABSTRACT STUDIO TRANSFORMS
  // (Fluid Swirl, Sacred Kaleidoscope, Echo Tunnel, Pixel Sort, Spectrum Drift)
  // -------------------------------------------------------------
  applyAbstractTransforms(ctx: CanvasRenderingContext2D, w: number, h: number, timestamp: number) {
    const t = timestamp * 0.001;
    const cx = w / 2;
    const cy = h / 2;

    // 1. Recursive Echo / Mirror Tunnel
    if (this.abstractRecursiveEcho > 0) {
      const echoAmt = this.abstractRecursiveEcho / 100;
      const numEchos = 3;
      for (let e = 1; e <= numEchos; e++) {
        const factor = 1 - e * (0.12 * echoAmt);
        const ew = w * factor;
        const eh = h * factor;
        const ex = (w - ew) / 2;
        const ey = (h - eh) / 2;
        ctx.save();
        ctx.globalAlpha = 0.35 * echoAmt;
        ctx.drawImage(ctx.canvas, 0, 0, w, h, ex, ey, ew, eh);
        ctx.restore();
      }
    }

    // 2. Fluid Swirl Warp & Sacred Kaleidoscope & Pixel Sort
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const src = new Uint8ClampedArray(data);

    const hasSwirl = this.abstractWarpSwirl > 0;
    const kaleidoSlices = this.abstractKaleidoscope;
    const hasKaleido = kaleidoSlices >= 2;
    const hasDrift = this.abstractSpectrumDrift > 0;
    const hasSort = this.abstractPixelSort > 0;

    if (hasSwirl || hasKaleido || hasDrift) {
      const maxRadius = Math.hypot(cx, cy);
      const swirlFactor = (this.abstractWarpSwirl / 100) * 8.0;
      const sliceAngle = hasKaleido ? (Math.PI * 2) / kaleidoSlices : 0;
      const driftRad = (this.abstractSpectrumDrift / 100) * Math.PI * 2 + t;

      for (let y = 0; y < h; y++) {
        const dy = y - cy;
        const row = y * w;
        for (let x = 0; x < w; x++) {
          const dx = x - cx;
          let r = Math.hypot(dx, dy);
          let theta = Math.atan2(dy, dx);

          // Fluid Swirl
          if (hasSwirl) {
            const twist = (1 - Math.min(1, r / maxRadius)) * swirlFactor;
            theta += twist;
          }

          // Kaleidoscope Symmetry Fold
          if (hasKaleido) {
            theta = ((theta % sliceAngle) + sliceAngle) % sliceAngle;
            if (theta > sliceAngle / 2) {
              theta = sliceAngle - theta;
            }
          }

          // Compute sampled source coordinates
          let sx = Math.round(cx + r * Math.cos(theta));
          let sy = Math.round(cy + r * Math.sin(theta));
          sx = Math.max(0, Math.min(w - 1, sx));
          sy = Math.max(0, Math.min(h - 1, sy));

          const sIdx = (sy * w + sx) * 4;
          const dIdx = (row + x) * 4;

          let red = src[sIdx];
          let green = src[sIdx + 1];
          let blue = src[sIdx + 2];

          // Spectrum Drift chromatic wave
          if (hasDrift) {
            const shift = Math.sin(driftRad + (r / maxRadius) * 4);
            red = Math.max(0, Math.min(255, red + Math.round(shift * 50)));
            green = Math.max(0, Math.min(255, green + Math.round(Math.cos(driftRad) * 40)));
            blue = Math.max(0, Math.min(255, blue - Math.round(shift * 45)));
          }

          data[dIdx] = red;
          data[dIdx + 1] = green;
          data[dIdx + 2] = blue;
          data[dIdx + 3] = src[sIdx + 3];
        }
      }
    }

    // 3. Pixel Sorting: sort horizontal streaks above brightness threshold
    if (hasSort) {
      const threshold = 255 * (1 - (this.abstractPixelSort / 100) * 0.75);
      for (let y = 0; y < h; y++) {
        const row = y * w;
        let spanStart = -1;

        for (let x = 0; x <= w; x++) {
          let lum = 0;
          if (x < w) {
            const idx = (row + x) * 4;
            lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          }

          if (x < w && lum > threshold) {
            if (spanStart === -1) spanStart = x;
          } else {
            if (spanStart !== -1) {
              const spanEnd = x;
              const len = spanEnd - spanStart;
              if (len > 3) {
                // Collect and sort pixels in this span by luminance
                const spanPixels: { r: number; g: number; b: number; a: number; lum: number }[] = [];
                for (let px = spanStart; px < spanEnd; px++) {
                  const idx = (row + px) * 4;
                  const pLum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
                  spanPixels.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2], a: data[idx + 3], lum: pLum });
                }
                spanPixels.sort((a, b) => a.lum - b.lum);
                for (let px = spanStart; px < spanEnd; px++) {
                  const idx = (row + px) * 4;
                  const p = spanPixels[px - spanStart];
                  data[idx] = p.r;
                  data[idx + 1] = p.g;
                  data[idx + 2] = p.b;
                  data[idx + 3] = p.a;
                }
              }
              spanStart = -1;
            }
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  // -------------------------------------------------------------
  // ADVANCED WAVEFORM EVALUATION (16 Waveforms: Sine, Tri, Saw, Pulse, S&H, Lorenz, Perlin, Burst, Parabolic, Harmonic, Cardioid, etc.)
  // -------------------------------------------------------------
  evalWaveform(type: string, phase: number, cycle: number, channel: 1 | 2): number {
    const twoPi = Math.PI * 2;
    const normPhase = ((phase % twoPi) + twoPi) % twoPi;

    switch (type) {
      case 'sine':
        return Math.sin(normPhase);
      case 'triangle':
        return Math.asin(Math.sin(normPhase)) / (Math.PI / 2);
      case 'sawtooth_up':
        return (normPhase / Math.PI) - 1;
      case 'sawtooth_down':
        return 1 - (normPhase / Math.PI);
      case 'square':
        return Math.sin(normPhase) >= 0 ? 1 : -1;
      case 'pulse_narrow':
        return normPhase < twoPi * 0.2 ? 1 : -1;
      case 'sample_hold': {
        if (channel === 1) {
          if (cycle !== this.lastShCycle1) {
            this.lastShCycle1 = cycle;
            this.shValue1 = Math.random() * 2 - 1;
          }
          return this.shValue1;
        } else {
          if (cycle !== this.lastShCycle2) {
            this.lastShCycle2 = cycle;
            this.shValue2 = Math.random() * 2 - 1;
          }
          return this.shValue2;
        }
      }
      case 'smooth_random': {
        if (channel === 1) {
          if (cycle !== this.lastShCycle1) {
            this.lastShCycle1 = cycle;
            this.shValue1 = this.shNext1 || (Math.random() * 2 - 1);
            this.shNext1 = Math.random() * 2 - 1;
          }
          const t = normPhase / twoPi;
          const smooth = t * t * (3 - 2 * t);
          return this.shValue1 * (1 - smooth) + this.shNext1 * smooth;
        } else {
          if (cycle !== this.lastShCycle2) {
            this.lastShCycle2 = cycle;
            this.shValue2 = this.shNext2 || (Math.random() * 2 - 1);
            this.shNext2 = Math.random() * 2 - 1;
          }
          const t = normPhase / twoPi;
          const smooth = t * t * (3 - 2 * t);
          return this.shValue2 * (1 - smooth) + this.shNext2 * smooth;
        }
      }
      case 'staircase': {
        const steps = 5;
        const s = Math.sin(normPhase) * 0.5 + 0.5;
        return (Math.floor(s * steps) / (steps - 1)) * 2 - 1;
      }
      case 'exponential': {
        const s = Math.sin(normPhase);
        const sign = s >= 0 ? 1 : -1;
        return sign * (Math.exp(2.2 * Math.abs(s)) - 1) / (Math.exp(2.2) - 1);
      }
      case 'chaos_lorenz': {
        return Math.sin(1.1 * phase) * Math.cos(0.7 * phase) + 0.3 * Math.sin(2.3 * phase);
      }
      case 'noise_perlin': {
        const n1 = Math.sin(phase * 1.0) * 0.5;
        const n2 = Math.sin(phase * 2.3 + 1.2) * 0.3;
        const n3 = Math.cos(phase * 4.7 + 2.4) * 0.2;
        return n1 + n2 + n3;
      }
      case 'bipolar_burst': {
        if (normPhase < twoPi * 0.4) {
          return Math.sin(normPhase * 10);
        }
        return 0;
      }
      case 'parabolic': {
        const tri = Math.asin(Math.sin(normPhase)) / (Math.PI / 2);
        return 1 - 2 * (tri * tri);
      }
      case 'harmonic_combo': {
        return 0.6 * Math.sin(normPhase) + 0.25 * Math.sin(3 * normPhase) + 0.15 * Math.sin(5 * normPhase);
      }
      case 'cardioid': {
        const c = (1 - Math.cos(normPhase)) * Math.cos(normPhase);
        return c * 2;
      }
      default:
        return Math.sin(normPhase);
    }
  }

  // -------------------------------------------------------------
  // LUMA / RASTER SCAN OSCILLOSCOPE MONITOR (Real-Time Compound Trace)
  // -------------------------------------------------------------
  drawOscilloscope(time: number) {
    if (!this.oscilloCtx) return;
    const w = this.oscilloCanvas.width;
    const h = this.oscilloCanvas.height;
    const ctx = this.oscilloCtx;

    ctx.fillStyle = '#050a06';
    ctx.fillRect(0, 0, w, h);

    // Reticle Grid
    ctx.strokeStyle = '#0e2412';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 38) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 18) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Glowing Wave Trace (Theme Accent)
    const traceColor = this.theme === 'dark' ? '#8f8eec' : '#d79bdf';
    ctx.strokeStyle = traceColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = traceColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();

    const amp = (this.lfoDepth / 100) * (h / 3.0);
    const midY = h / 2;

    for (let x = 0; x < w; x++) {
      const phaseOffset = (x / w) * Math.PI * 4;
      const p1 = this.lfo1Phase + phaseOffset;
      const cycle1 = Math.floor(p1 / (Math.PI * 2));
      let waveVal = this.evalWaveform(this.lfoWaveform, p1, cycle1, 1);

      if (this.lfo2Enabled) {
        const p2 = this.lfo2Phase + phaseOffset * (this.lfo2Speed / Math.max(0.1, this.lfoSpeed));
        const cycle2 = Math.floor(p2 / (Math.PI * 2));
        const waveVal2 = this.evalWaveform(this.lfo2Waveform, p2, cycle2, 2);

        if (this.lfo2Mode === 'fm_rate') {
          waveVal = this.evalWaveform(this.lfoWaveform, p1 + waveVal2 * 2.0, cycle1, 1);
        } else if (this.lfo2Mode === 'am_depth') {
          waveVal = waveVal * (1 + waveVal2 * 0.5);
        } else if (this.lfo2Mode === 'sum_additive') {
          waveVal = waveVal * 0.6 + waveVal2 * 0.4;
        } else if (this.lfo2Mode === 'ring_mod') {
          waveVal = waveVal * waveVal2;
        } else if (this.lfo2Mode === 'phase_mod') {
          waveVal = this.evalWaveform(this.lfoWaveform, p1 + waveVal2 * Math.PI * 0.3, cycle1, 1);
        }
      }

      const y = midY - waveVal * amp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // -------------------------------------------------------------
  // PROFESSIONAL 3-WAY COLOR WHEELS & COLOR GRADING
  // -------------------------------------------------------------
  initColorWheels() {
    const wheels = [
      { id: 'wheel-lift', getPos: () => ({ x: this.liftX, y: this.liftY }), setPos: (x: number, y: number) => { this.liftX = x; this.liftY = y; } },
      { id: 'wheel-gamma', getPos: () => ({ x: this.gammaX, y: this.gammaY }), setPos: (x: number, y: number) => { this.gammaX = x; this.gammaY = y; } },
      { id: 'wheel-gain', getPos: () => ({ x: this.gainX, y: this.gainY }), setPos: (x: number, y: number) => { this.gainX = x; this.gainY = y; } },
      { id: 'wheel-master', getPos: () => ({ x: this.masterX, y: this.masterY }), setPos: (x: number, y: number) => { this.masterX = x; this.masterY = y; } },
    ];

    wheels.forEach(w => {
      const canvas = document.getElementById(w.id) as HTMLCanvasElement;
      if (!canvas) return;

      this.drawColorWheelCanvas(canvas, w.getPos().x, w.getPos().y);

      let isDragging = false;
      const handlePointer = (e: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const radius = Math.min(cx, cy) - 4;
        let dx = (e.clientX - rect.left - cx) / radius;
        let dy = (e.clientY - rect.top - cy) / radius;
        const dist = Math.hypot(dx, dy);
        if (dist > 1.0) {
          dx /= dist;
          dy /= dist;
        }
        w.setPos(dx, dy);
        this.drawColorWheelCanvas(canvas, dx, dy);
        this.markDirty();
      };

      canvas.onpointerdown = e => {
        isDragging = true;
        canvas.setPointerCapture(e.pointerId);
        handlePointer(e);
      };
      canvas.onpointermove = e => {
        if (isDragging) handlePointer(e);
      };
      canvas.onpointerup = e => {
        if (isDragging) {
          isDragging = false;
          try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
        }
      };
      canvas.ondblclick = () => {
        w.setPos(0, 0);
        this.drawColorWheelCanvas(canvas, 0, 0);
        this.markDirty();
      };
    });

    // Reset Wheel Buttons
    const btnResetLift = document.getElementById('btn-reset-lift');
    if (btnResetLift) {
      btnResetLift.onclick = () => {
        this.liftX = 0;
        this.liftY = 0;
        this.liftLevel = 0;
        const c = document.getElementById('wheel-lift') as HTMLCanvasElement;
        if (c) this.drawColorWheelCanvas(c, 0, 0);
        const s = document.getElementById('slider-lift-level') as HTMLInputElement;
        if (s) s.value = '0';
        const v = document.getElementById('val-lift-level');
        if (v) v.textContent = '0%';
        this.markDirty();
      };
    }

    const btnResetGamma = document.getElementById('btn-reset-gamma');
    if (btnResetGamma) {
      btnResetGamma.onclick = () => {
        this.gammaX = 0;
        this.gammaY = 0;
        this.gammaLevel = 0;
        const c = document.getElementById('wheel-gamma') as HTMLCanvasElement;
        if (c) this.drawColorWheelCanvas(c, 0, 0);
        const s = document.getElementById('slider-gamma-level') as HTMLInputElement;
        if (s) s.value = '0';
        const v = document.getElementById('val-gamma-level');
        if (v) v.textContent = '0%';
        this.markDirty();
      };
    }

    const btnResetGain = document.getElementById('btn-reset-gain');
    if (btnResetGain) {
      btnResetGain.onclick = () => {
        this.gainX = 0;
        this.gainY = 0;
        this.gainLevel = 0;
        const c = document.getElementById('wheel-gain') as HTMLCanvasElement;
        if (c) this.drawColorWheelCanvas(c, 0, 0);
        const s = document.getElementById('slider-gain-level') as HTMLInputElement;
        if (s) s.value = '0';
        const v = document.getElementById('val-gain-level');
        if (v) v.textContent = '0%';
        this.markDirty();
      };
    }

    const btnResetMaster = document.getElementById('btn-reset-master');
    if (btnResetMaster) {
      btnResetMaster.onclick = () => {
        this.masterX = 0;
        this.masterY = 0;
        this.masterLevel = 0;
        const c = document.getElementById('wheel-master') as HTMLCanvasElement;
        if (c) this.drawColorWheelCanvas(c, 0, 0);
        const s = document.getElementById('slider-master-level') as HTMLInputElement;
        if (s) s.value = '0';
        const v = document.getElementById('val-master-level');
        if (v) v.textContent = '0%';
        this.markDirty();
      };
    }

    const btnResetAll = document.getElementById('btn-reset-all-grading');
    if (btnResetAll) {
      btnResetAll.onclick = () => {
        this.liftX = 0; this.liftY = 0; this.liftLevel = 0;
        this.gammaX = 0; this.gammaY = 0; this.gammaLevel = 0;
        this.gainX = 0; this.gainY = 0; this.gainLevel = 0;
        this.masterX = 0; this.masterY = 0; this.masterLevel = 0;
        this.temperature = 0; this.tint = 0; this.saturation = 100; this.hueRotate = 0;
        this.syncControlsToState();
        this.redrawAllColorWheels();
        this.markDirty();
        this.showToast(this.lang === 'ru' ? 'Все настройки грейдинга сброшены' : 'Color grading reset');
      };
    }

    // Quick Color Mode Switchers in Grading Header
    const btnModeRgb = document.getElementById('btn-grade-mode-rgb');
    if (btnModeRgb) {
      btnModeRgb.onclick = () => {
        this.colorMode = 'rgb';
        const sel = document.getElementById('select-color-mode') as HTMLSelectElement;
        if (sel) sel.value = 'rgb';
        this.markDirty(true);
        this.showToast(this.lang === 'ru' ? 'Включен полноцветный режим RGB' : 'RGB Color Mode active');
      };
    }

    const btnModePal = document.getElementById('btn-grade-mode-pal');
    if (btnModePal) {
      btnModePal.onclick = () => {
        this.colorMode = 'palette';
        const sel = document.getElementById('select-color-mode') as HTMLSelectElement;
        if (sel) sel.value = 'palette';
        this.markDirty(true);
        this.showToast(this.lang === 'ru' ? 'Включен режим палитры' : 'Palette Mode active');
      };
    }
  }

  redrawAllColorWheels() {
    const cLift = document.getElementById('wheel-lift') as HTMLCanvasElement;
    if (cLift) this.drawColorWheelCanvas(cLift, this.liftX, this.liftY);
    const cGamma = document.getElementById('wheel-gamma') as HTMLCanvasElement;
    if (cGamma) this.drawColorWheelCanvas(cGamma, this.gammaX, this.gammaY);
    const cGain = document.getElementById('wheel-gain') as HTMLCanvasElement;
    if (cGain) this.drawColorWheelCanvas(cGain, this.gainX, this.gainY);
    const cMaster = document.getElementById('wheel-master') as HTMLCanvasElement;
    if (cMaster) this.drawColorWheelCanvas(cMaster, this.masterX, this.masterY);
  }

  drawColorWheelCanvas(canvas: HTMLCanvasElement, puckX: number, puckY: number) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(cx, cy) - 4;

    ctx.clearRect(0, 0, w, h);

    // Dark chassis well background
    ctx.fillStyle = '#0a0d0a';
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
    ctx.fill();

    // Render smooth chromatic disk
    const imgData = ctx.createImageData(w, h);
    const d = imgData.data;
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.hypot(dx, dy);
        if (dist <= radius) {
          const angle = Math.atan2(dy, dx);
          const hue = ((angle * 180 / Math.PI) + 360) % 360;
          const sat = dist / radius;
          const c = (1 - Math.abs(2 * 0.5 - 1)) * sat;
          const xVal = c * (1 - Math.abs(((hue / 60) % 2) - 1));
          const m = 0.5 - c / 2;
          let r = 0, g = 0, b = 0;
          if (hue < 60) { r = c; g = xVal; }
          else if (hue < 120) { r = xVal; g = c; }
          else if (hue < 180) { g = c; b = xVal; }
          else if (hue < 240) { g = xVal; b = c; }
          else if (hue < 300) { r = xVal; b = c; }
          else { r = c; b = xVal; }

          const pIdx = (py * w + px) * 4;
          d[pIdx] = Math.round((r + m) * 255);
          d[pIdx + 1] = Math.round((g + m) * 255);
          d[pIdx + 2] = Math.round((b + m) * 255);
          d[pIdx + 3] = 255;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Subtle inner grid rings & crosshair
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx, cy + radius);
    ctx.stroke();

    // Outer bezel ring
    ctx.strokeStyle = '#3a423a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Cardinal RGB markings on wheel perimeter
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 3;
    // R (Red at 0 rad, right)
    ctx.fillText('R', cx + radius - 7, cy);
    // G (Green at 2.094 rad / 120 deg, bottom-left)
    ctx.fillText('G', cx + Math.cos(2.094395) * (radius - 7), cy + Math.sin(2.094395) * (radius - 7));
    // B (Blue at -2.094 rad / 240 deg, top-left)
    ctx.fillText('B', cx + Math.cos(-2.094395) * (radius - 7), cy + Math.sin(-2.094395) * (radius - 7));
    ctx.shadowBlur = 0;

    // Center crosshair
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 1, cy - 1, 2, 2);

    // Vector line to current puck
    const px = cx + puckX * radius;
    const py = cy + puckY * radius;
    if (Math.hypot(puckX, puckY) > 0.05) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();
    }

    // Interactive puck / reticle
    const puckColor = this.theme === 'dark' ? '#8f8eec' : '#d79bdf';
    ctx.shadowColor = puckColor;
    ctx.shadowBlur = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.fillStyle = puckColor;
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // -------------------------------------------------------------
  // DEEP RGB COLOR GRADING PIPELINE (4-Way Lift/Gamma/Gain/Master + Sat/Temp/Tint/Hue)
  // Pure chromatic shifts preserving perceived luminance to prevent contrast/brightness distortion
  // -------------------------------------------------------------
  getWheelRgbShift(x: number, y: number) {
    const dist = Math.min(1.0, Math.hypot(x, y));
    if (dist < 0.001) {
      return { r: 0, g: 0, b: 0 };
    }
    const angle = Math.atan2(y, x);
    // Standard RGB Color Wheel:
    // 0 rad (right): Red (+R, -G, -B)
    // 2.094 rad / 120° (bottom-left): Green (+G, -R, -B)
    // -2.094 rad / 240° (top-left): Blue (+B, -R, -G)
    // 60°: Yellow (+R, +G, -B)
    // 180°: Cyan (+G, +B, -R)
    // 300°: Magenta (+R, +B, -G)
    const rawR = Math.cos(angle);
    const rawG = Math.cos(angle - 2.094395);
    const rawB = Math.cos(angle + 2.094395);

    const factor = dist * 0.9;
    return {
      r: rawR * factor,
      g: rawG * factor,
      b: rawB * factor
    };
  }

  gradeColorRgb(
    r255: number,
    g255: number,
    b255: number,
    liftShift: { r: number; g: number; b: number },
    gammaShift: { r: number; g: number; b: number },
    gainShift: { r: number; g: number; b: number },
    masterShift: { r: number; g: number; b: number },
    tempR: number,
    tempB: number,
    tintR: number,
    tintG: number,
    tintB: number,
    satMult: number,
    effHue: number,
    m00: number, m01: number, m02: number,
    m10: number, m11: number, m12: number,
    m20: number, m21: number, m22: number,
    effLiftLvl: number = 0,
    effGammaLvl: number = 0,
    effGainLvl: number = 0,
    effMasterLvl: number = 0
  ): [number, number, number] {
    let r = r255 / 255;
    let g = g255 / 255;
    let b = b255 / 255;

    // 1. Saturation adjustment
    const yOrig = 0.299 * r + 0.587 * g + 0.114 * b;
    if (satMult !== 1.0) {
      r = yOrig + (r - yOrig) * satMult;
      g = yOrig + (g - yOrig) * satMult;
      b = yOrig + (b - yOrig) * satMult;
    }

    // 2. Hue Rotation Matrix
    if (effHue !== 0) {
      const nr = r * m00 + g * m01 + b * m02;
      const ng = r * m10 + g * m11 + b * m12;
      const nb = r * m20 + g * m21 + b * m22;
      r = nr; g = ng; b = nb;
    }

    const yMid = 0.299 * r + 0.587 * g + 0.114 * b;

    // 3. 4-Way Range Weights (Lift = Shadows, Gamma = Midtones, Gain = Highlights, Master = Uniform)
    const wLift = Math.max(0, 1.0 - yMid * 1.5);
    const wGamma = Math.sin(Math.max(0, Math.min(1, yMid)) * Math.PI);
    const wGain = Math.max(0, yMid * 1.5 - 0.5);
    const wMaster = 1.0;

    // Level adjustment from level sliders only
    const deltaLvl = (effLiftLvl * wLift + effGammaLvl * wGamma + effGainLvl * wGain + effMasterLvl * wMaster) * 0.005;

    // Chromatic RGB shifts
    const dR = liftShift.r * wLift + gammaShift.r * wGamma + gainShift.r * wGain + masterShift.r * wMaster + tempR + tintR;
    const dG = liftShift.g * wLift + gammaShift.g * wGamma + gainShift.g * wGain + masterShift.g * wMaster + tintG;
    const dB = liftShift.b * wLift + gammaShift.b * wGamma + gainShift.b * wGain + masterShift.b * wMaster + tempB + tintB;

    let nr = r + dR;
    let ng = g + dG;
    let nb = b + dB;

    // 4. Pure chromatic luminance preservation:
    // Moving the color wheel puck modifies the chromatic balance (R, G, B tone) WITHOUT altering the perceived brightness!
    const yShifted = 0.299 * nr + 0.587 * ng + 0.114 * nb;
    const targetLuma = Math.max(0, Math.min(1, yMid + deltaLvl));
    const lumaCorrection = yShifted - targetLuma;

    nr = Math.max(0, Math.min(1, nr - lumaCorrection));
    ng = Math.max(0, Math.min(1, ng - lumaCorrection));
    nb = Math.max(0, Math.min(1, nb - lumaCorrection));

    return [Math.round(nr * 255), Math.round(ng * 255), Math.round(nb * 255)];
  }

  applyColorGrading(
    data: Uint8ClampedArray,
    cols: number,
    rows: number,
    effTemp: number,
    effTint: number,
    effSat: number,
    effHue: number,
    effLiftLvl: number,
    effGammaLvl: number,
    effGainLvl: number,
    effMasterLvl: number = 0
  ) {
    const totalPixels = cols * rows;

    const liftShift = this.getWheelRgbShift(this.liftX, this.liftY);
    const gammaShift = this.getWheelRgbShift(this.gammaX, this.gammaY);
    const gainShift = this.getWheelRgbShift(this.gainX, this.gainY);
    const masterShift = this.getWheelRgbShift(this.masterX, this.masterY);

    const tempR = effTemp * 0.003;
    const tempB = -effTemp * 0.003;
    const tintG = -effTint * 0.003;
    const tintR = effTint * 0.0015;
    const tintB = effTint * 0.0015;

    const satMult = effSat / 100;
    const radHue = (effHue * Math.PI) / 180;
    const cosH = Math.cos(radHue);
    const sinH = Math.sin(radHue);

    const m00 = 0.299 + 0.701 * cosH + 0.168 * sinH;
    const m01 = 0.587 - 0.587 * cosH + 0.330 * sinH;
    const m02 = 0.114 - 0.114 * cosH - 0.497 * sinH;

    const m10 = 0.299 - 0.299 * cosH - 0.328 * sinH;
    const m11 = 0.587 + 0.413 * cosH + 0.035 * sinH;
    const m12 = 0.114 - 0.114 * cosH + 0.292 * sinH;

    const m20 = 0.299 - 0.300 * cosH + 1.250 * sinH;
    const m21 = 0.587 - 0.588 * cosH - 1.050 * sinH;
    const m22 = 0.114 + 0.886 * cosH - 0.203 * sinH;

    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 4;
      const [gr, gg, gb] = this.gradeColorRgb(
        data[idx], data[idx + 1], data[idx + 2],
        liftShift, gammaShift, gainShift, masterShift,
        tempR, tempB, tintR, tintG, tintB,
        satMult, effHue,
        m00, m01, m02, m10, m11, m12, m20, m21, m22,
        effLiftLvl, effGammaLvl, effGainLvl, effMasterLvl
      );
      data[idx] = gr;
      data[idx + 1] = gg;
      data[idx + 2] = gb;
    }
  }

  // -------------------------------------------------------------
  // DECODE ANIMATED GIF (Optimized streaming & hardware-accelerated compositing)
  // -------------------------------------------------------------
  async decodeGifFrames(buffer: ArrayBuffer): Promise<DecodedGifFrame[]> {
    const uint8 = new Uint8Array(buffer);
    const reader = new GifReader(uint8 as any);
    const numFrames = reader.numFrames();
    const width = reader.width;
    const height = reader.height;

    // Bound max frame dimension to 720 to protect against massive memory allocations on large GIFs
    const maxDim = 720;
    let scale = 1.0;
    if (width > maxDim || height > maxDim) {
      scale = maxDim / Math.max(width, height);
    }
    const optW = Math.max(1, Math.round(width * scale));
    const optH = Math.max(1, Math.round(height * scale));

    const decodedFrames: DecodedGifFrame[] = [];

    // Single allocated buffer and ImageData for raw frame blit
    const rgba = new Uint8ClampedArray(width * height * 4);
    const rawImgData = new ImageData(rgba, width, height);

    // Temporary scratch canvas for single frame blit
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })!;

    // Persistent hardware composite canvas (replaces slow synchronous getImageData stalls)
    const compCanvas = document.createElement('canvas');
    compCanvas.width = width;
    compCanvas.height = height;
    const compCtx = compCanvas.getContext('2d', { willReadFrequently: true })!;

    for (let i = 0; i < numFrames; i++) {
      if (i > 0 && i % 15 === 0) {
        await new Promise(r => setTimeout(r, 0));
      }

      const frameInfo = reader.frameInfo(i);
      tempCtx.clearRect(0, 0, width, height);
      reader.decodeAndBlitFrameRGBA(i, rgba);
      tempCtx.putImageData(rawImgData, 0, 0);

      // Composite frame onto canvas
      compCtx.drawImage(tempCanvas, 0, 0);

      // Store optimized, scaled frame canvas
      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = optW;
      frameCanvas.height = optH;
      const fCtx = frameCanvas.getContext('2d')!;
      if (scale < 1.0) {
        fCtx.imageSmoothingEnabled = true;
        fCtx.imageSmoothingQuality = 'medium';
      }
      fCtx.drawImage(compCanvas, 0, 0, optW, optH);

      // Handle disposal method for next frame
      if (frameInfo.disposal === 2) {
        compCtx.clearRect(frameInfo.x, frameInfo.y, frameInfo.width, frameInfo.height);
      }

      const delay = frameInfo.delay ? frameInfo.delay * 10 : 100;
      decodedFrames.push({
        canvas: frameCanvas,
        delay: Math.max(20, delay)
      });
    }

    return decodedFrames;
  }

  async loadGifArrayBuffer(buffer: ArrayBuffer) {
    try {
      this.showToast(this.lang === 'ru' ? 'Декодирование GIF...' : 'Decoding GIF...');
      const decodedFrames = await this.decodeGifFrames(buffer);

      this.gifFrames = decodedFrames;
      this.gifCurrentFrameIndex = 0;
      this.gifLastFrameTime = performance.now();
      this.gifIsPlaying = true;
      this.mediaType = 'gif';

      const activeLayer = this.getActiveLayer();
      if (activeLayer) {
        activeLayer.mediaType = 'gif';
        activeLayer.gifFrames = decodedFrames;
        activeLayer.gifCurrentFrameIndex = 0;
        activeLayer.gifLastFrameTime = performance.now();
        activeLayer.gifIsPlaying = true;
        activeLayer.sourceImage = null;
        activeLayer.videoElement = null;
      }

      const dropOverlay = document.getElementById('drop-zone-overlay');
      if (dropOverlay) dropOverlay.classList.add('hidden');
      this.markDirty(true);
      this.updateLayerStackUI();

      this.updateTimecode();
      this.showToast(
        this.lang === 'ru'
          ? `GIF загружен: ${decodedFrames.length} кадров`
          : `GIF loaded: ${decodedFrames.length} frames`
      );
    } catch (err: any) {
      console.error('GIF Decode Error:', err);
      this.showToast('GIF Error: ' + (err.message || 'Corrupted file'));
    }
  }

  // -------------------------------------------------------------
  // ENCODE ANIMATED GIF (gifenc)
  // -------------------------------------------------------------
  captureAndSaveGif() {
    if (this.isEncodingGif) return;
    this.isEncodingGif = true;

    const statusEl = document.getElementById('gif-encoding-status');
    const percentEl = document.getElementById('gif-progress-percent');
    if (statusEl) statusEl.style.display = 'inline-block';
    this.showToast(this.lang === 'ru' ? 'Захват кадров для GIF...' : 'Capturing GIF frames...');

    const resSelect = document.getElementById('select-gif-resolution') as HTMLSelectElement;
    const fpsSelect = document.getElementById('select-gif-fps') as HTMLSelectElement;
    const qualSelect = document.getElementById('select-gif-quality') as HTMLSelectElement;

    const resVal = resSelect ? resSelect.value : '720';
    const fps = fpsSelect ? parseInt(fpsSelect.value) || 25 : 25;
    const colorCount = qualSelect ? parseInt(qualSelect.value) || 256 : 256;

    const capturedFrames: ImageData[] = [];
    const captureDelay = Math.max(20, Math.round(1000 / fps));
    const totalFrames = Math.min(45, Math.max(18, Math.round(fps * 1.2))); // ~1.2s seamless loop

    let frameIdx = 0;
    const targetW = this.mainCanvas.width;
    const targetH = this.mainCanvas.height;

    let gifW = targetW;
    let gifH = targetH;

    if (resVal === 'native') {
      gifW = targetW;
      gifH = targetH;
    } else {
      const targetRes = parseInt(resVal) || 720;
      // Scale so that height (or width if portrait) accurately reaches the selected standard resolution
      const scale = targetW >= targetH ? (targetRes / targetH) : (targetRes / targetW);
      const boundedScale = Math.min(scale, 2560 / Math.max(targetW, targetH));
      gifW = Math.max(120, Math.round(targetW * boundedScale));
      gifH = Math.max(120, Math.round(targetH * boundedScale));
    }

    const gifTempCanvas = document.createElement('canvas');
    gifTempCanvas.width = gifW;
    gifTempCanvas.height = gifH;
    const gifTempCtx = gifTempCanvas.getContext('2d', { willReadFrequently: true })!;
    gifTempCtx.imageSmoothingEnabled = false;

    const interval = setInterval(() => {
      gifTempCtx.drawImage(this.mainCanvas, 0, 0, gifW, gifH);
      capturedFrames.push(gifTempCtx.getImageData(0, 0, gifW, gifH));
      frameIdx++;

      const pct = Math.round((frameIdx / totalFrames) * 100);
      if (percentEl) percentEl.textContent = `${pct}%`;

      if (frameIdx >= totalFrames) {
        clearInterval(interval);
        if (percentEl) percentEl.textContent = '100% (Writing GIF...)';

        setTimeout(() => {
          try {
            const gif = GIFEncoder();
            for (let f = 0; f < capturedFrames.length; f++) {
              const frameData = capturedFrames[f].data;
              const palette = quantize(frameData, colorCount);
              const index = applyPalette(frameData, palette);
              gif.writeFrame(index, gifW, gifH, {
                palette,
                delay: captureDelay
              });
            }
            gif.finish();

            const buffer = gif.bytes();
            const blob = new Blob([buffer as any], { type: 'image/gif' });
            this.downloadBlob(blob, `sacred_glyph_${gifW}x${gifH}.gif`);
            this.showToast(this.lang === 'ru' ? `GIF (${gifW}×${gifH}px, ${colorCount} цв.) сохранен!` : `GIF (${gifW}×${gifH}px, ${colorCount} colors) saved!`);
          } catch (err: any) {
            console.error('GIF Encode Error:', err);
            this.showToast('GIF Error: ' + err.message);
          } finally {
            this.isEncodingGif = false;
            if (statusEl) statusEl.style.display = 'none';
          }
        }, 30);
      }
    }, captureDelay);
  }

  // -------------------------------------------------------------
  // MULTI-LAYER WORKSTATION COMPOSITOR ENGINE
  // -------------------------------------------------------------
  initLayers() {
    const defaultLayer: WorkstationLayer = {
      id: 'layer_1',
      name: this.lang === 'ru' ? 'Основной слой' : 'Base Layer',
      visible: true,
      opacity: 1.0,
      blendMode: 'source-over',
      mediaType: this.mediaType,
      activeDemoMedia: this.activeDemoMedia,
      sourceImage: this.sourceImage,
      videoElement: this.videoElement,
      gifFrames: this.gifFrames,
      gifCurrentFrameIndex: this.gifCurrentFrameIndex,
      gifLastFrameTime: this.gifLastFrameTime,
      gifIsPlaying: this.gifIsPlaying,
      fitMode: this.fitMode,
      glyphSetId: this.activeGlyphSetId,
      manualGlyphsText: this.manualGlyphsText,
      isManualActive: this.isManualActive,
      cellSize: this.cellSize,
      depth: this.depth,
      offset: this.offset,
      aspect: this.aspect,
      invert: this.invert,
      ditherAlgo: this.ditherAlgo,
      contrast: this.contrast,
      brightness: this.brightness,
      sharpness: this.sharpness,
      gamma: this.gamma,
      blur: this.blur,
      posterize: this.posterize,
      rotation: this.rotation,
      flipH: this.flipH,
      flipV: this.flipV,
      scanlines: this.scanlines,
      colorMode: this.colorMode,
      paletteId: this.paletteId,
      singleColor: this.singleColor,
      bgTransparent: this.bgTransparent,
      bgColor: this.bgColor,
      temperature: this.temperature,
      tint: this.tint,
      saturation: this.saturation,
      hueRotate: this.hueRotate,
      liftLevel: this.liftLevel,
      gammaLevel: this.gammaLevel,
      gainLevel: this.gainLevel,
      masterLevel: this.masterLevel,
      liftX: this.liftX,
      liftY: this.liftY,
      gammaX: this.gammaX,
      gammaY: this.gammaY,
      gainX: this.gainX,
      gainY: this.gainY,
      masterX: this.masterX,
      masterY: this.masterY,
      shadrActive: this.shadrActive,
      aikiziActive: this.aikiziActive,
      glitchActive: this.glitchActive,
      jitter: this.jitter,
      typoScale: this.typoScale
    };
    this.layers = [defaultLayer];
    this.activeLayerId = defaultLayer.id;
    this.updateLayerStackUI();
  }

  getActiveLayer(): WorkstationLayer {
    let lyr = this.layers.find(l => l.id === this.activeLayerId);
    if (!lyr) {
      if (this.layers.length === 0) {
        this.initLayers();
      }
      lyr = this.layers[0];
      this.activeLayerId = lyr.id;
    }
    return lyr;
  }

  saveActiveLayerState() {
    if (!this.layers || this.layers.length === 0) return;
    const lyr = this.layers.find(l => l.id === this.activeLayerId) || this.layers[0];
    if (!lyr) return;
    lyr.mediaType = this.mediaType;
    lyr.activeDemoMedia = this.activeDemoMedia;
    lyr.sourceImage = this.sourceImage;
    lyr.videoElement = this.videoElement;
    lyr.gifFrames = this.gifFrames;
    lyr.gifCurrentFrameIndex = this.gifCurrentFrameIndex;
    lyr.gifLastFrameTime = this.gifLastFrameTime;
    lyr.gifIsPlaying = this.gifIsPlaying;
    lyr.fitMode = this.fitMode;
    lyr.glyphSetId = this.activeGlyphSetId;
    lyr.manualGlyphsText = this.manualGlyphsText;
    lyr.isManualActive = this.isManualActive;
    lyr.cellSize = this.cellSize;
    lyr.depth = this.depth;
    lyr.offset = this.offset;
    lyr.aspect = this.aspect;
    lyr.invert = this.invert;
    lyr.ditherAlgo = this.ditherAlgo;
    lyr.contrast = this.contrast;
    lyr.brightness = this.brightness;
    lyr.sharpness = this.sharpness;
    lyr.gamma = this.gamma;
    lyr.blur = this.blur;
    lyr.posterize = this.posterize;
    lyr.rotation = this.rotation;
    lyr.flipH = this.flipH;
    lyr.flipV = this.flipV;
    lyr.scanlines = this.scanlines;
    lyr.colorMode = this.colorMode;
    lyr.paletteId = this.paletteId;
    lyr.singleColor = this.singleColor;
    lyr.bgTransparent = this.bgTransparent;
    lyr.bgColor = this.bgColor;
    lyr.temperature = this.temperature;
    lyr.tint = this.tint;
    lyr.saturation = this.saturation;
    lyr.hueRotate = this.hueRotate;
    lyr.liftLevel = this.liftLevel;
    lyr.gammaLevel = this.gammaLevel;
    lyr.gainLevel = this.gainLevel;
    lyr.masterLevel = this.masterLevel;
    lyr.liftX = this.liftX;
    lyr.liftY = this.liftY;
    lyr.gammaX = this.gammaX;
    lyr.gammaY = this.gammaY;
    lyr.gainX = this.gainX;
    lyr.gainY = this.gainY;
    lyr.masterX = this.masterX;
    lyr.masterY = this.masterY;
    lyr.shadrActive = this.shadrActive;
    lyr.aikiziActive = this.aikiziActive;
    lyr.glitchActive = this.glitchActive;
    lyr.jitter = this.jitter;
    lyr.typoScale = this.typoScale;
  }

  loadLayerState(lyr: WorkstationLayer) {
    this.mediaType = lyr.mediaType;
    this.activeDemoMedia = lyr.activeDemoMedia || 'hermetic_sigil';
    this.sourceImage = lyr.sourceImage;
    this.videoElement = lyr.videoElement;
    this.gifFrames = lyr.gifFrames || [];
    this.gifCurrentFrameIndex = lyr.gifCurrentFrameIndex || 0;
    this.gifLastFrameTime = lyr.gifLastFrameTime || 0;
    this.gifIsPlaying = lyr.gifIsPlaying !== undefined ? lyr.gifIsPlaying : true;
    this.fitMode = lyr.fitMode || 'fit';
    this.activeGlyphSetId = lyr.glyphSetId || 'classic_clean';
    this.manualGlyphsText = lyr.manualGlyphsText || " .:+*#%@";
    this.isManualActive = lyr.isManualActive || false;
    this.cellSize = lyr.cellSize ?? 9;
    this.depth = lyr.depth ?? 8;
    this.offset = lyr.offset ?? 0;
    this.aspect = lyr.aspect ?? 0.55;
    this.invert = lyr.invert || false;
    this.ditherAlgo = lyr.ditherAlgo || 'bayer4';
    this.contrast = lyr.contrast ?? 1.25;
    this.brightness = lyr.brightness ?? 0;
    this.sharpness = lyr.sharpness ?? 25;
    this.gamma = lyr.gamma ?? 1.0;
    this.blur = lyr.blur ?? 0;
    this.posterize = lyr.posterize ?? 0;
    this.rotation = lyr.rotation ?? 0;
    this.flipH = lyr.flipH || false;
    this.flipV = lyr.flipV || false;
    this.scanlines = lyr.scanlines || false;
    this.colorMode = lyr.colorMode || 'palette';
    this.paletteId = lyr.paletteId || 'phosphor_matrix';
    this.singleColor = lyr.singleColor || '#00ff66';
    this.bgTransparent = lyr.bgTransparent || false;
    this.bgColor = lyr.bgColor || '#040904';
    this.temperature = lyr.temperature ?? 0;
    this.tint = lyr.tint ?? 0;
    this.saturation = lyr.saturation ?? 100;
    this.hueRotate = lyr.hueRotate ?? 0;
    this.liftLevel = lyr.liftLevel ?? 0;
    this.gammaLevel = lyr.gammaLevel ?? 0;
    this.gainLevel = lyr.gainLevel ?? 0;
    this.masterLevel = lyr.masterLevel ?? 0;
    this.liftX = lyr.liftX ?? 0;
    this.liftY = lyr.liftY ?? 0;
    this.gammaX = lyr.gammaX ?? 0;
    this.gammaY = lyr.gammaY ?? 0;
    this.gainX = lyr.gainX ?? 0;
    this.gainY = lyr.gainY ?? 0;
    this.masterX = lyr.masterX ?? 0;
    this.masterY = lyr.masterY ?? 0;
    this.shadrActive = lyr.shadrActive || false;
    this.aikiziActive = lyr.aikiziActive || false;
    this.glitchActive = lyr.glitchActive || false;
    this.jitter = lyr.jitter ?? 0;
    this.typoScale = lyr.typoScale ?? 0;

    this.syncControlsToState();
    const manualInput = document.getElementById('manual-glyph-input') as HTMLInputElement;
    if (manualInput) manualInput.value = this.manualGlyphsText;
    this.populateGlyphSets();
    this.initPalettesGrid();
    this.redrawAllColorWheels();
    this.updateLayerStackUI();
    this.markDirty(true);
  }

  setActiveLayer(id: string) {
    if (this.activeLayerId === id) return;
    this.saveActiveLayerState();
    const nextLayer = this.layers.find(l => l.id === id);
    if (!nextLayer) return;
    this.activeLayerId = id;
    this.loadLayerState(nextLayer);
    this.updateLayerStackUI();
    this.showToast((this.lang === 'ru' ? 'Выбран слой: ' : 'Selected layer: ') + nextLayer.name);
  }

  async addNewLayerFromFile(file: File) {
    const name = file.name.toLowerCase();
    this.showToast((this.lang === 'ru' ? 'Загрузка слоя: ' : 'Loading layer: ') + file.name);

    try {
      let mediaType: 'image' | 'gif' | 'video' = 'image';
      let img: HTMLImageElement | null = null;
      let vid: HTMLVideoElement | null = null;
      let frames: DecodedGifFrame[] = [];

      if (name.endsWith('.gif') || file.type === 'image/gif') {
        const buf = await file.arrayBuffer();
        frames = await this.decodeGifFrames(buf);
        mediaType = 'gif';
      } else if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        vid = document.createElement('video');
        vid.autoplay = true;
        vid.loop = true;
        vid.muted = true;
        vid.playsInline = true;
        vid.src = url;
        await vid.play().catch(() => {});
        mediaType = 'video';
      } else {
        await new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => {
            const image = new Image();
            image.onload = () => {
              img = image;
              resolve();
            };
            image.onerror = reject;
            image.src = e.target?.result as string;
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        mediaType = 'image';
      }

      this.saveActiveLayerState();

      const newId = 'layer_' + Date.now();
      const newLayer: WorkstationLayer = {
        id: newId,
        name: file.name.length > 20 ? file.name.slice(0, 18) + '…' : file.name,
        visible: true,
        opacity: 1.0,
        blendMode: this.layers.length > 0 ? 'screen' : 'source-over',
        mediaType: mediaType,
        sourceImage: img,
        videoElement: vid,
        gifFrames: frames,
        gifCurrentFrameIndex: 0,
        gifLastFrameTime: performance.now(),
        gifIsPlaying: true,
        fitMode: 'fit',

        glyphSetId: this.activeGlyphSetId,
        manualGlyphsText: this.manualGlyphsText,
        isManualActive: this.isManualActive,
        cellSize: this.cellSize,
        depth: this.depth,
        offset: this.offset,
        aspect: this.aspect,
        invert: this.invert,
        ditherAlgo: this.ditherAlgo,
        contrast: this.contrast,
        brightness: this.brightness,
        sharpness: this.sharpness,
        gamma: this.gamma,
        blur: this.blur,
        posterize: this.posterize,
        rotation: 0,
        flipH: false,
        flipV: false,
        scanlines: false,

        colorMode: this.colorMode,
        paletteId: this.paletteId,
        singleColor: this.singleColor,
        bgTransparent: true,
        bgColor: '#000000',

        temperature: 0,
        tint: 0,
        saturation: 100,
        hueRotate: 0,
        liftLevel: 0,
        gammaLevel: 0,
        gainLevel: 0,
        masterLevel: 0,
        liftX: 0,
        liftY: 0,
        gammaX: 0,
        gammaY: 0,
        gainX: 0,
        gainY: 0,
        masterX: 0,
        masterY: 0
      };

      this.layers.push(newLayer);
      this.setActiveLayer(newLayer.id);
      this.updateLayerStackUI();

      const dropOverlay = document.getElementById('drop-zone-overlay');
      if (dropOverlay) dropOverlay.classList.add('hidden');
      this.markDirty(true);
      this.showToast((this.lang === 'ru' ? 'Слой добавлен: ' : 'Layer added: ') + file.name);
    } catch (err: any) {
      console.error('Error adding layer from file:', err);
      this.showToast('Error: ' + (err.message || 'Could not load file'));
    }
  }

  duplicateLayer(id: string) {
    this.saveActiveLayerState();
    const source = this.layers.find(l => l.id === id);
    if (!source) return;
    const newId = 'layer_' + Date.now();
    const copyName = `${source.name} ${this.lang === 'ru' ? '(Копия)' : '(Copy)'}`;
    const copy: WorkstationLayer = {
      ...source,
      id: newId,
      name: copyName,
      layerCanvas: undefined,
      layerCtx: undefined
    };
    const idx = this.layers.findIndex(l => l.id === id);
    this.layers.splice(idx + 1, 0, copy);
    this.setActiveLayer(newId);
    this.updateLayerStackUI();
    this.markDirty(true);
    this.showToast((this.lang === 'ru' ? 'Дублирован: ' : 'Duplicated: ') + copyName);
  }

  deleteLayer(id: string) {
    if (this.layers.length <= 1) {
      this.showToast(this.lang === 'ru' ? 'Нельзя удалить единственный слой' : 'Cannot delete the only layer');
      return;
    }
    const idx = this.layers.findIndex(l => l.id === id);
    if (idx === -1) return;
    const deletedName = this.layers[idx].name;
    this.layers.splice(idx, 1);
    if (this.activeLayerId === id) {
      const nextIdx = Math.max(0, idx - 1);
      this.activeLayerId = this.layers[nextIdx].id;
      this.loadLayerState(this.layers[nextIdx]);
    }
    this.updateLayerStackUI();
    this.markDirty(true);
    this.showToast((this.lang === 'ru' ? 'Удален слой: ' : 'Deleted layer: ') + deletedName);
  }

  moveLayer(id: string, dir: 'up' | 'down') {
    const idx = this.layers.findIndex(l => l.id === id);
    if (idx === -1) return;
    if (dir === 'up' && idx < this.layers.length - 1) {
      const temp = this.layers[idx];
      this.layers[idx] = this.layers[idx + 1];
      this.layers[idx + 1] = temp;
    } else if (dir === 'down' && idx > 0) {
      const temp = this.layers[idx];
      this.layers[idx] = this.layers[idx - 1];
      this.layers[idx - 1] = temp;
    }
    this.updateLayerStackUI();
    this.markDirty(true);
  }

  setLayerBlendMode(id: string, mode: GlobalCompositeOperation) {
    const lyr = this.layers.find(l => l.id === id);
    if (!lyr) return;
    lyr.blendMode = mode;
    this.markDirty();
    this.updateLayerStackUI();
  }

  setLayerOpacity(id: string, opacity: number) {
    const lyr = this.layers.find(l => l.id === id);
    if (!lyr) return;
    lyr.opacity = Math.max(0, Math.min(1, opacity));
    const valEl = document.getElementById('val-layer-opacity');
    if (valEl) valEl.textContent = `${Math.round(lyr.opacity * 100)}%`;
    this.markDirty();
    this.updateLayerStackUI();
  }

  toggleLayerVisibility(id: string) {
    const lyr = this.layers.find(l => l.id === id);
    if (!lyr) return;
    lyr.visible = !lyr.visible;
    this.markDirty();
    this.updateLayerStackUI();
  }

  updateLayerStackUI() {
    const container = document.getElementById('layer-list-container');
    const activeLyr = this.getActiveLayer();
    if (container) {
      container.innerHTML = '';
      const reversed = [...this.layers].map((layer, origIdx) => ({ layer, origIdx })).reverse();
      reversed.forEach(({ layer, origIdx }) => {
        const isActive = layer.id === this.activeLayerId;
        const card = document.createElement('div');
        card.className = `layer-item-card ${isActive ? 'active' : ''} ${!layer.visible ? 'is-hidden' : ''}`;
        card.setAttribute('data-layer-id', layer.id);

        const typeBadge = layer.mediaType === 'gif' ? 'GIF' : layer.mediaType === 'video' ? 'VID' : layer.mediaType === 'image' ? 'IMG' : 'GEN';
        const shortBlend = (layer.blendMode || 'source-over').toUpperCase().replace('SOURCE-OVER', 'NORM');

        card.innerHTML = `
          <div class="layer-item-left">
            <button type="button" class="layer-vis-btn" title="${this.lang === 'ru' ? 'Видимость слоя' : 'Toggle visibility'}">
              ${layer.visible ? '👁' : '🚫'}
            </button>
            <span class="layer-type-tag" style="font-size: 9px; padding: 1px 4px; background: rgba(255,255,255,0.08); border: 1px solid var(--chassis-dark); border-radius: 2px; font-family: var(--font-mono); font-weight: 800;">
              ${typeBadge}
            </span>
            <span class="layer-name-label" style="font-size: 11px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 130px;">
              ${layer.name || `Слой ${origIdx + 1}`}
            </span>
          </div>
          <div class="layer-item-right" style="display: flex; align-items: center; gap: 5px;">
            <span class="layer-blend-badge" style="font-size: 9px; padding: 1px 4px; border: 1px solid var(--chassis-dark); font-family: var(--font-mono); color: var(--text-dim);">
              ${shortBlend}
            </span>
            <span class="layer-opacity-badge" style="font-size: 10px; color: var(--vfd-green); font-family: var(--font-mono); font-weight: 800; min-width: 32px; text-align: right;">
              ${Math.round((layer.opacity ?? 1) * 100)}%
            </span>
          </div>
        `;

        card.onclick = () => {
          this.setActiveLayer(layer.id);
        };

        const visBtn = card.querySelector('.layer-vis-btn') as HTMLElement;
        if (visBtn) {
          visBtn.onclick = (e) => {
            e.stopPropagation();
            this.toggleLayerVisibility(layer.id);
          };
        }

        container.appendChild(card);
      });
    }

    const hudName = document.getElementById('hud-active-layer-name');
    if (hudName && activeLyr) {
      hudName.textContent = activeLyr.name;
    }

    const countBadge = document.getElementById('layer-count-badge');
    if (countBadge) {
      const c = this.layers.length;
      countBadge.textContent = this.lang === 'ru'
        ? `${c} ${c === 1 ? 'СЛОЙ' : c < 5 ? 'СЛОЯ' : 'СЛОЕВ'}`
        : `${c} ${c === 1 ? 'LAYER' : 'LAYERS'}`;
    }

    const blendSelect = document.getElementById('select-layer-blend-mode') as HTMLSelectElement;
    if (blendSelect && activeLyr) {
      blendSelect.value = activeLyr.blendMode || 'source-over';
    }

    const opacitySlider = document.getElementById('slider-layer-opacity') as HTMLInputElement;
    const opacityVal = document.getElementById('val-layer-opacity');
    if (opacitySlider && activeLyr) {
      opacitySlider.value = String(Math.round((activeLyr.opacity ?? 1) * 100));
    }
    if (opacityVal && activeLyr) {
      opacityVal.textContent = `${Math.round((activeLyr.opacity ?? 1) * 100)}%`;
    }
  }

  // -------------------------------------------------------------
  // ACTIVE GLYPH RAMP BUILDER (Curated sets, Custom Injection, or Manual input)
  // -------------------------------------------------------------
  getActiveGlyphArray(): string[] {
    let chars: string[];

    if (this.customInjectionActive && this.customInjectionText && this.customInjectionText.trim().length > 0) {
      chars = Array.from(this.customInjectionText.slice(0, 10));
    } else if (this.isManualActive && this.manualGlyphsText.trim().length > 0) {
      chars = Array.from(this.manualGlyphsText);
    } else {
      const baseSet = GLYPH_SETS.find(s => s.id === this.activeGlyphSetId) || GLYPH_SETS[0];
      chars = Array.from(baseSet.glyphs);
    }

    if (this.invert) {
      chars = chars.slice().reverse();
    }

    // Depth quantization (ensuring at least 2 glyphs)
    const effectiveDepth = Math.max(2, Math.min(chars.length, this.depth));
    const quantized: string[] = [];
    for (let i = 0; i < effectiveDepth; i++) {
      const srcIdx = Math.floor((i / (effectiveDepth - 1)) * (chars.length - 1));
      quantized.push(chars[srcIdx]);
    }

    return quantized;
  }

  // -------------------------------------------------------------
  // ADVANCED IMAGE PROCESSING & DITHERING PIPELINE (Zero-Allocation Buffers)
  // (Sharpness edge enhancement, Gamma curve, Posterization, Blur)
  // -------------------------------------------------------------
  applyDithering(
    imageData: ImageData,
    cols: number,
    rows: number,
    algo: string,
    depth: number,
    customContrast?: number,
    customBrightness?: number,
    customGamma?: number,
    customSharpness?: number,
    customBlur?: number
  ): Float32Array {
    const data = imageData.data;
    const brightnessOffset = customBrightness !== undefined ? customBrightness : this.brightness;
    const contrastMult = customContrast !== undefined ? customContrast : this.contrast;
    const gamma = Math.max(0.1, customGamma !== undefined ? customGamma : this.gamma);
    const sharpnessVal = customSharpness !== undefined ? customSharpness : this.sharpness;
    const blurVal = customBlur !== undefined ? customBlur : this.blur;
    const totalPixels = cols * rows;

    // Ensure preallocated buffers are large enough
    if (this.lumBufferA.length < totalPixels) {
      this.lumBufferA = new Float32Array(totalPixels);
      this.lumBufferB = new Float32Array(totalPixels);
      this.lumBufferC = new Float32Array(totalPixels);
      this.lumsWorkBuffer = new Float32Array(totalPixels);
    }

    const rawLums = this.lumBufferA;
    const bVal = brightnessOffset * 2.55;
    const invGamma = gamma !== 1.0 ? 1.0 / gamma : 1.0;
    const hasColorAdjust = contrastMult !== 1.0 || brightnessOffset !== 0;

    // Pass 1: Contrast, Brightness, and Luminance extraction
    for (let y = 0; y < rows; y++) {
      const rowOffset = y * cols;
      for (let x = 0; x < cols; x++) {
        const idx = (rowOffset + x) * 4;
        let r = data[idx];
        let g = data[idx + 1];
        let b = data[idx + 2];

        if (hasColorAdjust) {
          r = (r - 128) * contrastMult + 128 + bVal;
          g = (g - 128) * contrastMult + 128 + bVal;
          b = (b - 128) * contrastMult + 128 + bVal;

          if (r < 0) r = 0; else if (r > 255) r = 255;
          if (g < 0) g = 0; else if (g > 255) g = 255;
          if (b < 0) b = 0; else if (b > 255) b = 255;

          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
        }

        // Perceptual standard luminance
        let lum = (0.299 * r + 0.587 * g + 0.114 * b) * 0.003921568627; // 1 / 255

        // Gamma correction
        if (gamma !== 1.0) {
          lum = Math.pow(lum, invGamma);
        }

        rawLums[rowOffset + x] = lum < 0 ? 0 : lum > 1 ? 1 : lum;
      }
    }

    // Pass 2: Optional Blur (softening)
    let processedLums = rawLums;
    if (blurVal > 0) {
      const blurred = this.lumBufferB;
      const bRad = Math.min(4, Math.round(blurVal));
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          let sum = 0;
          let count = 0;
          for (let dy = -bRad; dy <= bRad; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= rows) continue;
            const nRow = ny * cols;
            for (let dx = -bRad; dx <= bRad; dx++) {
              const nx = x + dx;
              if (nx >= 0 && nx < cols) {
                sum += rawLums[nRow + nx];
                count++;
              }
            }
          }
          blurred[y * cols + x] = sum / count;
        }
      }
      processedLums = blurred;
    }

    // Pass 3: Optional Sharpness / Edge Enhancement (Laplacian edge boost)
    if (sharpnessVal > 0) {
      const sharpened = this.lumBufferC;
      const sharpAmount = (sharpnessVal / 100) * 1.5;
      for (let y = 0; y < rows; y++) {
        const row = y * cols;
        for (let x = 0; x < cols; x++) {
          const idx = row + x;
          const c = processedLums[idx];
          const left = x > 0 ? processedLums[idx - 1] : c;
          const right = x < cols - 1 ? processedLums[idx + 1] : c;
          const up = y > 0 ? processedLums[(y - 1) * cols + x] : c;
          const down = y < rows - 1 ? processedLums[(y + 1) * cols + x] : c;

          const laplacian = 4 * c - (left + right + up + down);
          const enhanced = c + laplacian * sharpAmount;
          sharpened[idx] = enhanced < 0 ? 0 : enhanced > 1 ? 1 : enhanced;
        }
      }
      processedLums = sharpened;
    }

    // Pass 4: Optional Posterization (stepped banding)
    if (this.posterize > 1) {
      const pSteps = this.posterize - 1;
      for (let i = 0; i < totalPixels; i++) {
        processedLums[i] = Math.round(processedLums[i] * pSteps) / pSteps;
      }
    }

    // Copy to preallocated working buffer for error diffusion
    const lums = this.lumsWorkBuffer;
    for (let i = 0; i < totalPixels; i++) {
      lums[i] = processedLums[i];
    }
    const qLevels = Math.max(2, depth);

    // Pass 5: Dithering Algorithms
    // -------------------------------------------------------------
    // CATEGORY 1: ERROR DIFFUSION (15 ALGORITHMS)
    // -------------------------------------------------------------
    if (algo === 'floyd') {
      // 1. Floyd-Steinberg: (7, 3, 5, 1) / 16
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const oldVal = lums[i];
          const newVal = Math.round(oldVal * (qLevels - 1)) / (qLevels - 1);
          lums[i] = newVal;
          const err = oldVal - newVal;

          if (x + 1 < cols) lums[i + 1] += err * (7 / 16);
          if (y + 1 < rows) {
            if (x - 1 >= 0) lums[(y + 1) * cols + (x - 1)] += err * (3 / 16);
            lums[(y + 1) * cols + x] += err * (5 / 16);
            if (x + 1 < cols) lums[(y + 1) * cols + (x + 1)] += err * (1 / 16);
          }
        }
      }
    } else if (algo === 'serpentine_floyd') {
      // 2. Serpentine Floyd-Steinberg: alternate left-to-right and right-to-left
      for (let y = 0; y < rows; y++) {
        const isLtr = y % 2 === 0;
        if (isLtr) {
          for (let x = 0; x < cols; x++) {
            const i = y * cols + x;
            const oldVal = lums[i];
            const newVal = Math.round(oldVal * (qLevels - 1)) / (qLevels - 1);
            lums[i] = newVal;
            const err = oldVal - newVal;
            if (x + 1 < cols) lums[i + 1] += err * (7 / 16);
            if (y + 1 < rows) {
              if (x - 1 >= 0) lums[(y + 1) * cols + (x - 1)] += err * (3 / 16);
              lums[(y + 1) * cols + x] += err * (5 / 16);
              if (x + 1 < cols) lums[(y + 1) * cols + (x + 1)] += err * (1 / 16);
            }
          }
        } else {
          for (let x = cols - 1; x >= 0; x--) {
            const i = y * cols + x;
            const oldVal = lums[i];
            const newVal = Math.round(oldVal * (qLevels - 1)) / (qLevels - 1);
            lums[i] = newVal;
            const err = oldVal - newVal;
            if (x - 1 >= 0) lums[i - 1] += err * (7 / 16);
            if (y + 1 < rows) {
              if (x + 1 < cols) lums[(y + 1) * cols + (x + 1)] += err * (3 / 16);
              lums[(y + 1) * cols + x] += err * (5 / 16);
              if (x - 1 >= 0) lums[(y + 1) * cols + (x - 1)] += err * (1 / 16);
            }
          }
        }
      }
    } else if (algo === 'atkinson') {
      // 3. Atkinson (Macintosh 1/8 divisor)
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const oldVal = lums[i];
          const newVal = Math.round(oldVal * (qLevels - 1)) / (qLevels - 1);
          lums[i] = newVal;
          const err = (oldVal - newVal) * 0.125;
          if (x + 1 < cols) lums[i + 1] += err;
          if (x + 2 < cols) lums[i + 2] += err;
          if (y + 1 < rows) {
            if (x - 1 >= 0) lums[(y + 1) * cols + (x - 1)] += err;
            lums[(y + 1) * cols + x] += err;
            if (x + 1 < cols) lums[(y + 1) * cols + (x + 1)] += err;
          }
          if (y + 2 < rows) lums[(y + 2) * cols + x] += err;
        }
      }
    } else if (algo === 'jarvis') {
      // 4. Jarvis, Judice, and Ninke (48 divisor)
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const oldVal = lums[i];
          const newVal = Math.round(oldVal * (qLevels - 1)) / (qLevels - 1);
          lums[i] = newVal;
          const err = (oldVal - newVal) / 48;
          if (x + 1 < cols) lums[i + 1] += err * 7;
          if (x + 2 < cols) lums[i + 2] += err * 5;
          if (y + 1 < rows) {
            const r1 = (y + 1) * cols;
            if (x - 2 >= 0) lums[r1 + (x - 2)] += err * 3;
            if (x - 1 >= 0) lums[r1 + (x - 1)] += err * 5;
            lums[r1 + x] += err * 7;
            if (x + 1 < cols) lums[r1 + (x + 1)] += err * 5;
            if (x + 2 < cols) lums[r1 + (x + 2)] += err * 3;
          }
          if (y + 2 < rows) {
            const r2 = (y + 2) * cols;
            if (x - 2 >= 0) lums[r2 + (x - 2)] += err * 1;
            if (x - 1 >= 0) lums[r2 + (x - 1)] += err * 3;
            lums[r2 + x] += err * 5;
            if (x + 1 < cols) lums[r2 + (x + 1)] += err * 3;
            if (x + 2 < cols) lums[r2 + (x + 2)] += err * 1;
          }
        }
      }
    } else if (algo === 'stucki') {
      // 5. Stucki (42 divisor)
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const oldVal = lums[i];
          const newVal = Math.round(oldVal * (qLevels - 1)) / (qLevels - 1);
          lums[i] = newVal;
          const err = (oldVal - newVal) / 42;
          if (x + 1 < cols) lums[i + 1] += err * 8;
          if (x + 2 < cols) lums[i + 2] += err * 4;
          if (y + 1 < rows) {
            const r1 = (y + 1) * cols;
            if (x - 2 >= 0) lums[r1 + (x - 2)] += err * 2;
            if (x - 1 >= 0) lums[r1 + (x - 1)] += err * 4;
            lums[r1 + x] += err * 8;
            if (x + 1 < cols) lums[r1 + (x + 1)] += err * 4;
            if (x + 2 < cols) lums[r1 + (x + 2)] += err * 2;
          }
          if (y + 2 < rows) {
            const r2 = (y + 2) * cols;
            if (x - 2 >= 0) lums[r2 + (x - 2)] += err * 1;
            if (x - 1 >= 0) lums[r2 + (x - 1)] += err * 2;
            lums[r2 + x] += err * 4;
            if (x + 1 < cols) lums[r2 + (x + 1)] += err * 2;
            if (x + 2 < cols) lums[r2 + (x + 2)] += err * 1;
          }
        }
      }
    } else if (algo === 'burkes') {
      // 6. Burkes (32 divisor)
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const oldVal = lums[i];
          const newVal = Math.round(oldVal * (qLevels - 1)) / (qLevels - 1);
          lums[i] = newVal;
          const err = (oldVal - newVal) / 32;
          if (x + 1 < cols) lums[i + 1] += err * 8;
          if (x + 2 < cols) lums[i + 2] += err * 4;
          if (y + 1 < rows) {
            const r1 = (y + 1) * cols;
            if (x - 2 >= 0) lums[r1 + (x - 2)] += err * 2;
            if (x - 1 >= 0) lums[r1 + (x - 1)] += err * 4;
            lums[r1 + x] += err * 8;
            if (x + 1 < cols) lums[r1 + (x + 1)] += err * 4;
            if (x + 2 < cols) lums[r1 + (x + 2)] += err * 2;
          }
        }
      }
    } else if (algo === 'sierra3') {
      // 7. Sierra 3-Row (32 divisor)
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const oldVal = lums[i];
          const newVal = Math.round(oldVal * (qLevels - 1)) / (qLevels - 1);
          lums[i] = newVal;
          const err = (oldVal - newVal) / 32;
          if (x + 1 < cols) lums[i + 1] += err * 5;
          if (x + 2 < cols) lums[i + 2] += err * 3;
          if (y + 1 < rows) {
            const r1 = (y + 1) * cols;
            if (x - 2 >= 0) lums[r1 + (x - 2)] += err * 2;
            if (x - 1 >= 0) lums[r1 + (x - 1)] += err * 4;
            lums[r1 + x] += err * 5;
            if (x + 1 < cols) lums[r1 + (x + 1)] += err * 4;
            if (x + 2 < cols) lums[r1 + (x + 2)] += err * 2;
          }
          if (y + 2 < rows) {
            const r2 = (y + 2) * cols;
            if (x - 1 >= 0) lums[r2 + (x - 1)] += err * 2;
            lums[r2 + x] += err * 3;
            if (x + 1 < cols) lums[r2 + (x + 1)] += err * 2;
          }
        }
      }
    } else if (algo === 'sierra2') {
      // 8. Sierra 2-Row (16 divisor)
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const oldVal = lums[i];
          const newVal = Math.round(oldVal * (qLevels - 1)) / (qLevels - 1);
          lums[i] = newVal;
          const err = (oldVal - newVal) / 16;
          if (x + 1 < cols) lums[i + 1] += err * 4;
          if (x + 2 < cols) lums[i + 2] += err * 3;
          if (y + 1 < rows) {
            const r1 = (y + 1) * cols;
            if (x - 2 >= 0) lums[r1 + (x - 2)] += err * 1;
            if (x - 1 >= 0) lums[r1 + (x - 1)] += err * 2;
            lums[r1 + x] += err * 3;
            if (x + 1 < cols) lums[r1 + (x + 1)] += err * 2;
            if (x + 2 < cols) lums[r1 + (x + 2)] += err * 1;
          }
        }
      }
    } else if (algo === 'sierra_lite') {
      // 9. Sierra Lite (4 divisor)
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const oldVal = lums[i];
          const newVal = Math.round(oldVal * (qLevels - 1)) / (qLevels - 1);
          lums[i] = newVal;
          const err = (oldVal - newVal) * 0.25;
          if (x + 1 < cols) lums[i + 1] += err * 2;
          if (y + 1 < rows) {
            if (x - 1 >= 0) lums[(y + 1) * cols + (x - 1)] += err * 1;
            lums[(y + 1) * cols + x] += err * 1;
          }
        }
      }
    } else if (algo === 'false_floyd') {
      // 10. False Floyd-Steinberg (8 divisor)
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const oldVal = lums[i];
          const newVal = Math.round(oldVal * (qLevels - 1)) / (qLevels - 1);
          lums[i] = newVal;
          const err = (oldVal - newVal) * 0.125;
          if (x + 1 < cols) lums[i + 1] += err * 3;
          if (y + 1 < rows) {
            lums[(y + 1) * cols + x] += err * 3;
            if (x + 1 < cols) lums[(y + 1) * cols + (x + 1)] += err * 2;
          }
        }
      }
    } else if (algo === 'fan') {
      // 11. Fan (1993, 16 divisor)
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const oldVal = lums[i];
          const newVal = Math.round(oldVal * (qLevels - 1)) / (qLevels - 1);
          lums[i] = newVal;
          const err = (oldVal - newVal) / 16;
          if (x + 1 < cols) lums[i + 1] += err * 7;
          if (y + 1 < rows) {
            const r1 = (y + 1) * cols;
            if (x - 1 >= 0) lums[r1 + (x - 1)] += err * 1;
            lums[r1 + x] += err * 3;
            if (x + 1 < cols) lums[r1 + (x + 1)] += err * 5;
          }
        }
      }
    } else if (algo === 'shiau_fan') {
      // 12. Shiau-Fan (16 divisor)
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const oldVal = lums[i];
          const newVal = Math.round(oldVal * (qLevels - 1)) / (qLevels - 1);
          lums[i] = newVal;
          const err = (oldVal - newVal) / 16;
          if (x + 1 < cols) lums[i + 1] += err * 8;
          if (y + 1 < rows) {
            const r1 = (y + 1) * cols;
            if (x - 2 >= 0) lums[r1 + (x - 2)] += err * 1;
            if (x - 1 >= 0) lums[r1 + (x - 1)] += err * 1;
            lums[r1 + x] += err * 2;
            if (x + 1 < cols) lums[r1 + (x + 1)] += err * 4;
          }
        }
      }
    } else if (algo === 'ostromoukhov') {
      // 13. Ostromoukhov (Intensity-adaptive weights)
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const oldVal = Math.max(0, Math.min(1, lums[i]));
          const newVal = Math.round(oldVal * (qLevels - 1)) / (qLevels - 1);
          lums[i] = newVal;
          const err = oldVal - newVal;
          const w1 = 0.5 + 0.2 * Math.sin(oldVal * Math.PI);
          const w2 = 0.2 + 0.1 * (1 - oldVal);
          const w3 = 1.0 - w1 - w2;
          if (x + 1 < cols) lums[i + 1] += err * w1;
          if (y + 1 < rows) {
            if (x - 1 >= 0) lums[(y + 1) * cols + (x - 1)] += err * w2;
            lums[(y + 1) * cols + x] += err * w3;
          }
        }
      }
    } else if (algo === 'gradient_diffusion') {
      // 14. Gradient Directional Diffusion
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const oldVal = lums[i];
          const newVal = Math.round(oldVal * (qLevels - 1)) / (qLevels - 1);
          lums[i] = newVal;
          const err = oldVal - newVal;
          const gx = (x + 1 < cols ? lums[i + 1] : oldVal) - (x > 0 ? lums[i - 1] : oldVal);
          const gy = (y + 1 < rows ? lums[(y + 1) * cols + x] : oldVal) - (y > 0 ? lums[(y - 1) * cols + x] : oldVal);
          const angle = Math.atan2(gy, gx);
          const wx = 0.5 + 0.3 * Math.cos(angle);
          const wy = 0.5 + 0.3 * Math.sin(angle);
          if (x + 1 < cols) lums[i + 1] += err * (wx * 0.6);
          if (y + 1 < rows) {
            lums[(y + 1) * cols + x] += err * (wy * 0.4);
          }
        }
      }
    } else if (algo === 'heavy_error') {
      // 15. Heavy Dispersion / High Feedback Diffusion
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const oldVal = lums[i];
          const newVal = Math.round(oldVal * (qLevels - 1)) / (qLevels - 1);
          lums[i] = newVal;
          const err = (oldVal - newVal) * 1.35;
          if (x + 1 < cols) lums[i + 1] += err * (7 / 16);
          if (y + 1 < rows) {
            if (x - 1 >= 0) lums[(y + 1) * cols + (x - 1)] += err * (3 / 16);
            lums[(y + 1) * cols + x] += err * (5 / 16);
            if (x + 1 < cols) lums[(y + 1) * cols + (x + 1)] += err * (1 / 16);
          }
        }
      }
    }

    // -------------------------------------------------------------
    // CATEGORY 2: ORDERED DITHERING (5 ALGORITHMS)
    // -------------------------------------------------------------
    else if (algo === 'bayer2') {
      const qStep = 1.0 / (qLevels - 1);
      for (let y = 0; y < rows; y++) {
        const row = y * cols;
        const by = y % 2;
        for (let x = 0; x < cols; x++) {
          const i = row + x;
          const threshold = (BAYER_2X2[by][x % 2] / 4.0) - 0.5;
          const val = lums[i] + threshold * qStep;
          lums[i] = val < 0 ? 0 : val > 1 ? 1 : val;
        }
      }
    } else if (algo === 'bayer4') {
      const qStep = 1.0 / (qLevels - 1);
      for (let y = 0; y < rows; y++) {
        const row = y * cols;
        const by = y % 4;
        for (let x = 0; x < cols; x++) {
          const i = row + x;
          const threshold = (BAYER_4X4[by][x % 4] / 16.0) - 0.5;
          const val = lums[i] + threshold * qStep;
          lums[i] = val < 0 ? 0 : val > 1 ? 1 : val;
        }
      }
    } else if (algo === 'bayer8') {
      const qStep = 1.0 / (qLevels - 1);
      for (let y = 0; y < rows; y++) {
        const row = y * cols;
        const by = y % 8;
        for (let x = 0; x < cols; x++) {
          const i = row + x;
          const threshold = (BAYER_8X8[by][x % 8] / 64.0) - 0.5;
          const val = lums[i] + threshold * qStep;
          lums[i] = val < 0 ? 0 : val > 1 ? 1 : val;
        }
      }
    } else if (algo === 'bayer16') {
      const qStep = 1.0 / (qLevels - 1);
      for (let y = 0; y < rows; y++) {
        const row = y * cols;
        const by = y % 16;
        for (let x = 0; x < cols; x++) {
          const i = row + x;
          const threshold = (BAYER_16X16[by][x % 16] / 256.0) - 0.5;
          const val = lums[i] + threshold * qStep;
          lums[i] = val < 0 ? 0 : val > 1 ? 1 : val;
        }
      }
    } else if (algo === 'cluster_dot') {
      const qStep = 1.0 / (qLevels - 1);
      for (let y = 0; y < rows; y++) {
        const row = y * cols;
        const by = y % 8;
        for (let x = 0; x < cols; x++) {
          const i = row + x;
          const threshold = (CLUSTER_DOT_8X8[by][x % 8] / 64.0) - 0.5;
          const val = lums[i] + threshold * qStep;
          lums[i] = val < 0 ? 0 : val > 1 ? 1 : val;
        }
      }
    }

    // -------------------------------------------------------------
    // CATEGORY 3: PATTERN DITHERS (8 ALGORITHMS)
    // -------------------------------------------------------------
    else if (algo === 'halftone') {
      const qStep = 1.0 / (qLevels - 1);
      for (let y = 0; y < rows; y++) {
        const row = y * cols;
        const cy = (y % 4) - 1.5;
        for (let x = 0; x < cols; x++) {
          const cx = (x % 4) - 1.5;
          const dist = Math.sqrt(cx * cx + cy * cy) / 2.12;
          const threshold = dist - 0.5;
          const val = lums[row + x] + threshold * qStep;
          lums[row + x] = val < 0 ? 0 : val > 1 ? 1 : val;
        }
      }
    } else if (algo === 'lines_horizontal') {
      const qStep = 1.0 / (qLevels - 1);
      for (let y = 0; y < rows; y++) {
        const row = y * cols;
        const threshold = ((y % 4) / 3.0) - 0.5;
        for (let x = 0; x < cols; x++) {
          const val = lums[row + x] + threshold * qStep;
          lums[row + x] = val < 0 ? 0 : val > 1 ? 1 : val;
        }
      }
    } else if (algo === 'lines_vertical') {
      const qStep = 1.0 / (qLevels - 1);
      for (let y = 0; y < rows; y++) {
        const row = y * cols;
        for (let x = 0; x < cols; x++) {
          const threshold = ((x % 4) / 3.0) - 0.5;
          const val = lums[row + x] + threshold * qStep;
          lums[row + x] = val < 0 ? 0 : val > 1 ? 1 : val;
        }
      }
    } else if (algo === 'lines_diagonal') {
      const qStep = 1.0 / (qLevels - 1);
      for (let y = 0; y < rows; y++) {
        const row = y * cols;
        for (let x = 0; x < cols; x++) {
          const threshold = (((x + y) % 4) / 3.0) - 0.5;
          const val = lums[row + x] + threshold * qStep;
          lums[row + x] = val < 0 ? 0 : val > 1 ? 1 : val;
        }
      }
    } else if (algo === 'crosshatch') {
      const qStep = 1.0 / (qLevels - 1);
      for (let y = 0; y < rows; y++) {
        const row = y * cols;
        for (let x = 0; x < cols; x++) {
          const threshold = (Math.min(x % 4, y % 4) / 3.0) - 0.5;
          const val = lums[row + x] + threshold * qStep;
          lums[row + x] = val < 0 ? 0 : val > 1 ? 1 : val;
        }
      }
    } else if (algo === 'spiral') {
      const qStep = 1.0 / (qLevels - 1);
      for (let y = 0; y < rows; y++) {
        const row = y * cols;
        const cy = (y % 8) - 3.5;
        for (let x = 0; x < cols; x++) {
          const cx = (x % 8) - 3.5;
          const r = Math.sqrt(cx * cx + cy * cy);
          const theta = Math.atan2(cy, cx);
          const spiralVal = (Math.sin(r * 2.2 + theta * 2.0) * 0.5);
          const val = lums[row + x] + spiralVal * qStep;
          lums[row + x] = val < 0 ? 0 : val > 1 ? 1 : val;
        }
      }
    } else if (algo === 'stippling') {
      const qStep = 1.0 / (qLevels - 1);
      for (let y = 0; y < rows; y++) {
        const row = y * cols;
        for (let x = 0; x < cols; x++) {
          const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
          const noise = (hash - Math.floor(hash)) - 0.5;
          const val = lums[row + x] + noise * qStep;
          lums[row + x] = val < 0 ? 0 : val > 1 ? 1 : val;
        }
      }
    } else if (algo === 'hexagonal') {
      const qStep = 1.0 / (qLevels - 1);
      for (let y = 0; y < rows; y++) {
        const row = y * cols;
        for (let x = 0; x < cols; x++) {
          const hex = Math.sin(x * 0.866 + y * 0.5) * Math.cos(x * 0.866 - y * 0.5) * 0.5;
          const val = lums[row + x] + hex * qStep;
          lums[row + x] = val < 0 ? 0 : val > 1 ? 1 : val;
        }
      }
    } else if (algo === 'random') {
      const qStep = 1.0 / (qLevels - 1);
      for (let y = 0; y < rows; y++) {
        const row = y * cols;
        for (let x = 0; x < cols; x++) {
          const threshold = Math.random() - 0.5;
          const val = lums[row + x] + threshold * qStep;
          lums[row + x] = val < 0 ? 0 : val > 1 ? 1 : val;
        }
      }
    }

    return lums;
  }

  hexOrRgbToRgb(str: string): [number, number, number] {
    if (!str) return [0, 255, 102];
    if (str.startsWith('#')) {
      let hex = str.slice(1);
      if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      const num = parseInt(hex, 16);
      return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
    }
    const match = str.match(/\d+/g);
    if (match && match.length >= 3) {
      return [+match[0], +match[1], +match[2]];
    }
    return [0, 255, 102];
  }

  // -------------------------------------------------------------
  // MULTI-LAYER RASTER CRT COMPOSITOR & RENDERER
  // -------------------------------------------------------------
  renderLayerToCanvas(
    layer: WorkstationLayer,
    totalW: number,
    totalH: number,
    isEffectModulated: boolean,
    effParams: {
      cellSize: number;
      depth: number;
      offset: number;
      contrast: number;
      brightness: number;
      gamma: number;
      hueRotate: number;
      temperature: number;
      saturation: number;
      liftLevel: number;
      gammaLevel: number;
      gainLevel: number;
      rotation: number;
      aspect: number;
      sharpness: number;
      blur: number;
    }
  ) {
    if (!layer.layerCanvas) {
      layer.layerCanvas = document.createElement('canvas');
      layer.layerCtx = layer.layerCanvas.getContext('2d', { willReadFrequently: true });
    }
    if (layer.layerCanvas.width !== totalW || layer.layerCanvas.height !== totalH) {
      layer.layerCanvas.width = totalW;
      layer.layerCanvas.height = totalH;
    }
    const ctx = layer.layerCtx;
    if (!ctx) return;

    ctx.clearRect(0, 0, totalW, totalH);
    if (!layer.bgTransparent) {
      ctx.fillStyle = layer.bgColor || '#040904';
      ctx.fillRect(0, 0, totalW, totalH);
    }

    const effCellSize = isEffectModulated ? effParams.cellSize : (layer.cellSize || 9);
    const effAspect = isEffectModulated ? effParams.aspect : (layer.aspect || 0.55);
    const effDepth = isEffectModulated ? effParams.depth : (layer.depth || 8);
    const effOffset = isEffectModulated ? effParams.offset : (layer.offset || 0);
    const effContrast = isEffectModulated ? effParams.contrast : (layer.contrast ?? 1.25);
    const effBrightness = isEffectModulated ? effParams.brightness : (layer.brightness ?? 0);
    const effGamma = isEffectModulated ? effParams.gamma : (layer.gamma ?? 1.0);
    const effHueRotate = isEffectModulated ? effParams.hueRotate : (layer.hueRotate || 0);
    const effTemp = isEffectModulated ? effParams.temperature : (layer.temperature || 0);
    const effSat = isEffectModulated ? effParams.saturation : (layer.saturation ?? 100);
    const effLiftLevel = isEffectModulated ? effParams.liftLevel : (layer.liftLevel || 0);
    const effGammaLevel = isEffectModulated ? effParams.gammaLevel : (layer.gammaLevel || 0);
    const effGainLevel = isEffectModulated ? effParams.gainLevel : (layer.gainLevel || 0);
    const effRotation = isEffectModulated ? effParams.rotation : (layer.rotation || 0);
    const effSharpness = isEffectModulated ? effParams.sharpness : (layer.sharpness ?? 25);
    const effBlur = isEffectModulated ? effParams.blur : (layer.blur || 0);

    const cellW = Math.max(1, effCellSize);
    const cellH = Math.max(1, effCellSize * (1 / Math.max(0.2, effAspect)));

    const cols = Math.max(8, Math.floor(totalW / cellW));
    const rows = Math.max(6, Math.floor(totalH / cellH));

    if (this.sampleCanvas.width !== cols || this.sampleCanvas.height !== rows) {
      this.sampleCanvas.width = cols;
      this.sampleCanvas.height = rows;
    }
    const sampleCtx = this.sampleCtx;

    let sourceMedia: CanvasImageSource | null = null;
    let imgW = 640;
    let imgH = 480;

    if (layer.shadrActive) {
      this.generateShadrWave(performance.now(), 640, 480);
      sourceMedia = this.shadrCanvas;
      imgW = 640;
      imgH = 480;
    } else if (layer.mediaType === 'image' && layer.sourceImage) {
      sourceMedia = layer.sourceImage;
      imgW = (layer.sourceImage as any).naturalWidth || (layer.sourceImage as any).width || 640;
      imgH = (layer.sourceImage as any).naturalHeight || (layer.sourceImage as any).height || 480;
    } else if (layer.mediaType === 'video' && layer.videoElement) {
      sourceMedia = layer.videoElement;
      imgW = layer.videoElement.videoWidth || 640;
      imgH = layer.videoElement.videoHeight || 480;
    } else if (layer.mediaType === 'gif' && layer.gifFrames && layer.gifFrames.length > 0) {
      const fIdx = Math.min(layer.gifFrames.length - 1, Math.max(0, layer.gifCurrentFrameIndex || 0));
      const frame = layer.gifFrames[fIdx];
      sourceMedia = frame.canvas;
      imgW = frame.canvas.width;
      imgH = frame.canvas.height;
    } else if (layer.activeDemoMedia === 'hermetic_sigil' || layer.activeDemoMedia === 'abyssal_flame' || layer.mediaType === 'demo') {
      this.drawDemoMedia(this.tempCtx, 640, 480, performance.now() * this.playbackSpeed);
      sourceMedia = this.tempCanvas;
      imgW = 640;
      imgH = 480;
    } else if (layer.id === this.activeLayerId && this.sourceImage) {
      sourceMedia = this.sourceImage;
      imgW = (this.sourceImage as any).naturalWidth || 640;
      imgH = (this.sourceImage as any).naturalHeight || 480;
    }

    if (!sourceMedia) return;

    const screenW = totalW;
    const screenH = totalH;
    let dw = screenW;
    let dh = screenH;
    let dx = 0;
    let dy = 0;

    const fitMode = layer.fitMode || 'fit';
    if (fitMode === 'fit') {
      const scale = Math.min(screenW / imgW, screenH / imgH);
      dw = imgW * scale;
      dh = imgH * scale;
      dx = (screenW - dw) / 2;
      dy = (screenH - dh) / 2;
    } else if (fitMode === 'cover') {
      const scale = Math.max(screenW / imgW, screenH / imgH);
      dw = imgW * scale;
      dh = imgH * scale;
      dx = (screenW - dw) / 2;
      dy = (screenH - dh) / 2;
    }

    const gridX = Math.round(dx / cellW);
    const gridY = Math.round(dy / cellH);
    const gridW = Math.max(1, Math.round(dw / cellW));
    const gridH = Math.max(1, Math.round(dh / cellH));

    sampleCtx.fillStyle = '#000000';
    sampleCtx.fillRect(0, 0, cols, rows);
    sampleCtx.save();
    sampleCtx.imageSmoothingEnabled = true;
    sampleCtx.imageSmoothingQuality = 'high';

    if (effRotation !== 0 || layer.flipH || layer.flipV) {
      sampleCtx.translate(cols / 2, rows / 2);
      if (effRotation !== 0) sampleCtx.rotate((effRotation * Math.PI) / 180);
      sampleCtx.scale(layer.flipH ? -1 : 1, layer.flipV ? -1 : 1);
      sampleCtx.translate(-cols / 2, -rows / 2);
    }

    if (fitMode === 'stretch') {
      sampleCtx.drawImage(sourceMedia, 0, 0, cols, rows);
    } else {
      sampleCtx.drawImage(sourceMedia, gridX, gridY, gridW, gridH);
    }
    sampleCtx.restore();

    const nowTime = performance.now();
    if (layer.aikiziActive) {
      this.applyAikiziNoise(sampleCtx, cols, rows, nowTime);
    }
    if (layer.glitchActive) {
      this.applyGlitchTransforms(sampleCtx, cols, rows, nowTime);
    }

    const rawImageData = sampleCtx.getImageData(0, 0, cols, rows);

    const ditheredLums = this.applyDithering(
      rawImageData,
      cols,
      rows,
      layer.ditherAlgo || 'bayer4',
      effDepth,
      effContrast,
      effBrightness,
      effGamma,
      effSharpness,
      effBlur
    );

    const gradedImageData = sampleCtx.createImageData(cols, rows);
    gradedImageData.data.set(rawImageData.data);

    this.applyColorGrading(
      gradedImageData.data,
      cols,
      rows,
      effTemp,
      layer.tint || 0,
      effSat,
      effHueRotate,
      effLiftLevel,
      effGammaLevel,
      effGainLevel,
      layer.masterLevel || 0
    );

    // Build Glyph Ramp
    let chars: string[];
    if (layer.isManualActive && layer.manualGlyphsText && layer.manualGlyphsText.trim().length > 0) {
      chars = Array.from(layer.manualGlyphsText);
    } else {
      const baseSet = GLYPH_SETS.find(s => s.id === layer.glyphSetId) || GLYPH_SETS[0];
      chars = Array.from(baseSet.glyphs);
    }
    if (layer.invert) {
      chars = chars.slice().reverse();
    }
    const effectiveDepth = Math.max(2, Math.min(chars.length, effDepth));
    const glyphRamp: string[] = [];
    for (let i = 0; i < effectiveDepth; i++) {
      const srcIdx = Math.floor((i / (effectiveDepth - 1)) * (chars.length - 1));
      glyphRamp.push(chars[srcIdx]);
    }
    const glyphCount = glyphRamp.length;

    const currentPalette = MEDIEVAL_PALETTES.find(p => p.id === layer.paletteId) || MEDIEVAL_PALETTES[0];
    const paletteColors = currentPalette.colors;

    const hasColorGrading = (layer.liftX || 0) !== 0 || (layer.liftY || 0) !== 0 || effLiftLevel !== 0 ||
      (layer.gammaX || 0) !== 0 || (layer.gammaY || 0) !== 0 || effGammaLevel !== 0 ||
      (layer.gainX || 0) !== 0 || (layer.gainY || 0) !== 0 || effGainLevel !== 0 ||
      (layer.masterX || 0) !== 0 || (layer.masterY || 0) !== 0 || (layer.masterLevel || 0) !== 0 ||
      effTemp !== 0 || (layer.tint || 0) !== 0 || effSat !== 100 || effHueRotate !== 0;

    const liftShift = this.getWheelRgbShift(layer.liftX || 0, layer.liftY || 0);
    const gammaShift = this.getWheelRgbShift(layer.gammaX || 0, layer.gammaY || 0);
    const gainShift = this.getWheelRgbShift(layer.gainX || 0, layer.gainY || 0);
    const masterShift = this.getWheelRgbShift(layer.masterX || 0, layer.masterY || 0);
    const tempR = effTemp * 0.003;
    const tempB = -effTemp * 0.003;
    const tintG = -(layer.tint || 0) * 0.003;
    const tintR = (layer.tint || 0) * 0.0015;
    const tintB = (layer.tint || 0) * 0.0015;
    const satMult = effSat / 100;
    const radHue = (effHueRotate * Math.PI) / 180;

    const cosH = Math.cos(radHue);
    const sinH = Math.sin(radHue);
    const m00 = 0.299 + 0.701 * cosH + 0.168 * sinH;
    const m01 = 0.587 - 0.587 * cosH + 0.330 * sinH;
    const m02 = 0.114 - 0.114 * cosH - 0.497 * sinH;
    const m10 = 0.299 - 0.299 * cosH - 0.328 * sinH;
    const m11 = 0.587 + 0.413 * cosH + 0.035 * sinH;
    const m12 = 0.114 - 0.114 * cosH + 0.292 * sinH;
    const m20 = 0.299 - 0.300 * cosH + 1.250 * sinH;
    const m21 = 0.587 - 0.588 * cosH - 1.050 * sinH;
    const m22 = 0.114 + 0.886 * cosH - 0.203 * sinH;

    let parsedPalette: [number, number, number][] = paletteColors.map(c => this.hexOrRgbToRgb(c));
    let activePaletteColors = paletteColors;
    if (hasColorGrading) {
      parsedPalette = parsedPalette.map(rgb => this.gradeColorRgb(
        rgb[0], rgb[1], rgb[2],
        liftShift, gammaShift, gainShift, masterShift,
        tempR, tempB, tintR, tintG, tintB,
        satMult, effHueRotate,
        m00, m01, m02, m10, m11, m12, m20, m21, m22,
        effLiftLevel, effGammaLevel, effGainLevel, layer.masterLevel || 0
      ));
      activePaletteColors = parsedPalette.map(rgb => `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`);
    }

    let [sR, sG, sB] = this.hexOrRgbToRgb(layer.singleColor || '#00ff66');
    let activeSingleColor = layer.singleColor || '#00ff66';
    if (hasColorGrading) {
      [sR, sG, sB] = this.gradeColorRgb(
        sR, sG, sB,
        liftShift, gammaShift, gainShift, masterShift,
        tempR, tempB, tintR, tintG, tintB,
        satMult, effHueRotate,
        m00, m01, m02, m10, m11, m12, m20, m21, m22,
        effLiftLevel, effGammaLevel, effGainLevel, layer.masterLevel || 0
      );
      activeSingleColor = `rgb(${sR},${sG},${sB})`;
    }

    if (cellW <= 2) {
      const imgData = ctx.createImageData(totalW, totalH);
      const buf32 = new Uint32Array(imgData.data.buffer);
      if (!layer.bgTransparent) {
        const [bgR, bgG, bgB] = this.hexOrRgbToRgb(layer.bgColor || '#040904');
        const bgUint32 = (255 << 24) | (bgB << 16) | (bgG << 8) | bgR;
        buf32.fill(bgUint32);
      } else {
        buf32.fill(0);
      }

      for (let y = 0; y < rows; y++) {
        const rowOffset = y * cols;
        const pyStart = Math.floor(y * cellH);
        const pyEnd = Math.min(totalH, Math.floor((y + 1) * cellH));
        if (pyStart >= totalH) break;

        for (let x = 0; x < cols; x++) {
          const i = rowOffset + x;
          const lum = ditheredLums[i];

          let glyphIdx = Math.floor(lum * glyphCount) + effOffset;
          glyphIdx = glyphIdx < 0 ? 0 : glyphIdx >= glyphCount ? glyphCount - 1 : glyphIdx;
          const char = glyphRamp[glyphIdx] || ' ';
          if (char === ' ') continue;

          let r = 0, g = 255, b = 102;
          const colorMode = layer.colorMode || 'palette';
          if (colorMode === 'rgb' || colorMode === 'original') {
            const pixelIdx = i * 4;
            r = gradedImageData.data[pixelIdx];
            g = gradedImageData.data[pixelIdx + 1];
            b = gradedImageData.data[pixelIdx + 2];
          } else if (colorMode === 'palette') {
            const palIdx = Math.floor(lum * parsedPalette.length);
            const rgb = parsedPalette[Math.min(parsedPalette.length - 1, Math.max(0, palIdx))];
            r = rgb[0]; g = rgb[1]; b = rgb[2];
          } else {
            r = sR; g = sG; b = sB;
          }

          const pixelUint32 = (255 << 24) | (b << 16) | (g << 8) | r;
          const pxStart = Math.floor(x * cellW);
          const pxEnd = Math.min(totalW, Math.floor((x + 1) * cellW));

          for (let py = pyStart; py < pyEnd; py++) {
            const rowOff32 = py * totalW;
            for (let px = pxStart; px < pxEnd; px++) {
              buf32[rowOff32 + px] = pixelUint32;
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
    } else {
      const fontSize = Math.max(3, Math.round(cellH * 0.95));
      ctx.font = `bold ${fontSize}px var(--font-mono), monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let lastFill = '';
      const colorMode = layer.colorMode || 'palette';
      if (colorMode === 'single') {
        ctx.fillStyle = activeSingleColor;
        lastFill = activeSingleColor;
      }

      for (let y = 0; y < rows; y++) {
        const rowOffset = y * cols;
        const posY = y * cellH + cellH / 2;
        for (let x = 0; x < cols; x++) {
          const i = rowOffset + x;
          const lum = ditheredLums[i];

          let glyphIdx = Math.floor(lum * glyphCount) + effOffset;
          glyphIdx = glyphIdx < 0 ? 0 : glyphIdx >= glyphCount ? glyphCount - 1 : glyphIdx;
          const char = glyphRamp[glyphIdx] || ' ';
          if (char === ' ') continue;

          if (colorMode === 'palette') {
            const palIdx = Math.floor(lum * activePaletteColors.length);
            const col = activePaletteColors[Math.min(activePaletteColors.length - 1, Math.max(0, palIdx))];
            if (col !== lastFill) {
              ctx.fillStyle = col;
              lastFill = col;
            }
          } else if (colorMode === 'rgb' || colorMode === 'original') {
            const pixelIdx = i * 4;
            const r = gradedImageData.data[pixelIdx];
            const g = gradedImageData.data[pixelIdx + 1];
            const b = gradedImageData.data[pixelIdx + 2];
            const col = `rgb(${r},${g},${b})`;
            if (col !== lastFill) {
              ctx.fillStyle = col;
              lastFill = col;
            }
          } else {
            if (activeSingleColor !== lastFill) {
              ctx.fillStyle = activeSingleColor;
              lastFill = activeSingleColor;
            }
          }

          let posX = x * cellW + cellW / 2;
          let drawY = posY;
          if (layer.jitter && layer.jitter > 0) {
            posX += (Math.random() - 0.5) * layer.jitter;
            drawY += (Math.random() - 0.5) * layer.jitter;
          }

          ctx.fillText(char, posX, drawY);
        }
      }
    }

    if (layer.scanlines) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      for (let y = 0; y < totalH; y += 3) {
        ctx.fillRect(0, y, totalW, 1.2);
      }
    }
  }

  // -------------------------------------------------------------
  // PRIMARY COMPOSITED CRT CANVAS RENDERER
  // -------------------------------------------------------------
  renderAsciiFrame(
    effCellSize: number = this.cellSize,
    effDepth: number = this.depth,
    effOffset: number = this.offset,
    effContrast: number = this.contrast,
    effBrightness: number = this.brightness,
    effGamma: number = this.gamma,
    effHueRotate: number = this.hueRotate,
    effTemp: number = this.temperature,
    effSat: number = this.saturation,
    effLiftLevel: number = this.liftLevel,
    effGammaLevel: number = this.gammaLevel,
    effGainLevel: number = this.gainLevel,
    effRotation: number = this.rotation,
    effAspect: number = this.aspect,
    effSharpness: number = this.sharpness,
    effBlur: number = this.blur
  ) {
    if (!this.mainCanvas || !this.ctx) return;

    const containerW = this.containerW;
    const containerH = this.containerH;

    const cellW = Math.max(1, effCellSize);
    const cellH = Math.max(1, effCellSize * (1 / Math.max(0.2, effAspect)));

    const cols = Math.max(8, Math.floor(containerW / cellW));
    const rows = Math.max(6, Math.floor(containerH / cellH));

    const totalW = cols * cellW;
    const totalH = rows * cellH;

    if (this.mainCanvas.width !== totalW || this.mainCanvas.height !== totalH) {
      this.mainCanvas.width = totalW;
      this.mainCanvas.height = totalH;
    }

    // Check if any layer or engine has media loaded
    const hasMedia = (this.layers && this.layers.length > 0)
      ? this.layers.some(l => l.visible && (l.mediaType !== 'none' || l.shadrActive))
      : (this.mediaType !== 'none' || this.shadrActive);

    if (!hasMedia && this.mediaType === 'none' && !this.shadrActive) {
      if (this.bgTransparent) {
        this.ctx.clearRect(0, 0, totalW, totalH);
      } else {
        this.ctx.fillStyle = this.bgColor || '#040904';
        this.ctx.fillRect(0, 0, totalW, totalH);
      }
      const dropOverlay = document.getElementById('drop-zone-overlay');
      if (dropOverlay) {
        dropOverlay.classList.remove('hidden');
      }
      const gridDim = document.getElementById('hud-grid-dim');
      if (gridDim) gridDim.textContent = '0 × 0';
      const cellTot = document.getElementById('hud-total-cells');
      if (cellTot) cellTot.textContent = '0';
      return;
    }

    // Hide upload overlay when active media is present
    const dropOverlay = document.getElementById('drop-zone-overlay');
    if (dropOverlay && !dropOverlay.classList.contains('hidden')) {
      dropOverlay.classList.add('hidden');
    }

    // Clear main canvas
    this.ctx.clearRect(0, 0, totalW, totalH);
    if (!this.bgTransparent) {
      this.ctx.fillStyle = this.bgColor || '#040904';
      this.ctx.fillRect(0, 0, totalW, totalH);
    }

    const effParams = {
      cellSize: effCellSize,
      depth: effDepth,
      offset: effOffset,
      contrast: effContrast,
      brightness: effBrightness,
      gamma: effGamma,
      hueRotate: effHueRotate,
      temperature: effTemp,
      saturation: effSat,
      liftLevel: effLiftLevel,
      gammaLevel: effGammaLevel,
      gainLevel: effGainLevel,
      rotation: effRotation,
      aspect: effAspect,
      sharpness: effSharpness,
      blur: effBlur
    };

    // Composite all visible layers in stack order
    if (this.layers && this.layers.length > 0) {
      for (const layer of this.layers) {
        if (!layer.visible || layer.opacity <= 0) continue;
        const isModulated = layer.id === this.activeLayerId;
        this.renderLayerToCanvas(layer, totalW, totalH, isModulated, effParams);
        if (layer.layerCanvas) {
          this.ctx.save();
          this.ctx.globalAlpha = Math.max(0, Math.min(1, layer.opacity ?? 1));
          this.ctx.globalCompositeOperation = layer.blendMode || 'source-over';
          this.ctx.drawImage(layer.layerCanvas, 0, 0);
          this.ctx.restore();
        }
      }
    }

    const ctx = this.ctx;

    // Optional Grid Overlay (only visible when cells are large enough to be meaningful)
    if (this.showGrid && cellW >= 4) {
      ctx.strokeStyle = this.theme === 'dark' ? 'rgba(143, 142, 236, 0.2)' : 'rgba(215, 155, 223, 0.2)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= cols; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellW, 0);
        ctx.lineTo(x * cellW, totalH);
        ctx.stroke();
      }
      for (let y = 0; y <= rows; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellH);
        ctx.lineTo(totalW, y * cellH);
        ctx.stroke();
      }
    }

    // Optional CRT Phosphor Scanlines Effect
    if (this.scanlines) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      for (let y = 0; y < totalH; y += 3) {
        ctx.fillRect(0, y, totalW, 1.2);
      }
    }

    // Special Effects:
    // 1. CMYK Halftone Rosette 4-Color separation
    if (this.specialCmyk) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(0, 255, 255, 0.22)';
      ctx.fillRect(0, 0, totalW, totalH);
      ctx.fillStyle = 'rgba(255, 0, 255, 0.18)';
      ctx.fillRect(1, 1, totalW, totalH);
      ctx.fillStyle = 'rgba(255, 255, 0, 0.14)';
      ctx.fillRect(-1, 1, totalW, totalH);
      ctx.restore();
    }

    // 2. Epsilon CRT Phosphor Glow
    if (this.specialEpsilonGlow > 0) {
      const glowAmt = this.specialEpsilonGlow / 100;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.35 * glowAmt;
      ctx.drawImage(this.mainCanvas, 0, 0);
      ctx.restore();
    }

    // 3. Paper Texture & Organic Ink
    if (this.specialPaperTexture > 0) {
      const pAmt = this.specialPaperTexture / 100;
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = `rgba(242, 230, 205, ${0.15 * pAmt})`;
      ctx.fillRect(0, 0, totalW, totalH);
      ctx.fillStyle = `rgba(0, 0, 0, ${0.06 * pAmt})`;
      for (let py = 0; py < totalH; py += 3) {
        if (py % 5 === 0) ctx.fillRect(0, py, totalW, 1);
      }
      ctx.restore();
    }

    // 4. Modulation Lines
    if (this.specialModulationLines > 0) {
      const modAmt = this.specialModulationLines / 100;
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      for (let y = 0; y < totalH; y += 4) {
        const hLine = (Math.sin(y * 0.15 + performance.now() * 0.002) * 0.5 + 0.5) * modAmt * 2.0;
        if (hLine > 0.4) {
          ctx.fillRect(0, y, totalW, hLine);
        }
      }
      ctx.restore();
    }

    // 5. ASCII Reveal Edge Contour
    if (this.specialAsciiReveal > 0) {
      const revAmt = this.specialAsciiReveal / 100;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = this.singleColor || '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.3 * revAmt;
      ctx.strokeRect(2, 2, totalW - 4, totalH - 4);
      ctx.restore();
    }

    // Update Telemetry HUD Readouts
    const dimEl = document.getElementById('hud-grid-dim');
    if (dimEl) dimEl.textContent = `${cols} × ${rows}`;

    const cellsEl = document.getElementById('hud-total-cells');
    if (cellsEl) cellsEl.textContent = (cols * rows).toLocaleString();

    const zoomEl = document.getElementById('hud-zoom');
    if (zoomEl) zoomEl.textContent = `${Math.round(this.zoom * 100)}%`;

    const lfoInd = document.getElementById('hud-lfo-indicator');
    if (lfoInd) lfoInd.style.display = this.lfoEnabled ? 'inline-block' : 'none';
  }

  updateTimecode() {
    const el = document.getElementById('video-timecode');
    if (!el) return;
    if (this.mediaType === 'gif' && this.gifFrames.length > 0) {
      el.textContent = `FRAME ${this.gifCurrentFrameIndex + 1} / ${this.gifFrames.length} [GIF]`;
    } else {
      el.textContent = `LIVE [LFO / RASTER]`;
    }
  }

  // -------------------------------------------------------------
  // PRESET MANAGEMENT (Categorized 7 Studio Sections + Master Presets)
  // -------------------------------------------------------------
  initPresetsSelector() {
    const sel = document.getElementById('preset-selector') as HTMLSelectElement;
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = '';

    const categories: { key: string; labelRu: string; labelEn: string }[] = [
      { key: 'error_diffusion', labelRu: '1. ДИФФУЗИЯ ОШИБКИ (ERROR DIFFUSION)', labelEn: '1. ERROR DIFFUSION' },
      { key: 'ordered_patterns', labelRu: '2. УПОРЯДОЧЕННЫЙ И ПАТТЕРНЫ', labelEn: '2. ORDERED & PATTERNS' },
      { key: 'glitch_cyberpunk', labelRu: '3. КИБЕРПАНК И ГЛИТЧ (GLITCH & CYBER)', labelEn: '3. CYBERPUNK & GLITCH' },
      { key: 'special_effects', labelRu: '4. СПЕЦЭФФЕКТЫ (SPECIAL EFFECTS)', labelEn: '4. SPECIAL EFFECTS' },
      { key: 'gemstone_medieval', labelRu: '5. ДРАГОЦЕННЫЕ КАМНИ И СРЕДНЕВЕКОВЬЕ', labelEn: '5. GEMSTONES & MEDIEVAL' },
      { key: 'autumn_halloween', labelRu: '6. ОСЕНЬ, ХЭЛЛОУИН И МАТРИЦА', labelEn: '6. AUTUMN, HALLOWEEN & MATRIX' },
      { key: 'abstract', labelRu: '7. АБСТРАКТНЫЕ ТРАНСФОРМАЦИИ', labelEn: '7. ABSTRACT TRANSFORMS' },
      { key: 'master', labelRu: 'КЛАССИЧЕСКИЕ ПРЕСЕТЫ', labelEn: 'CLASSIC PRESETS' }
    ];

    categories.forEach(cat => {
      const presetsInCat = MASTER_PRESETS.filter(p => (p.sectionCategory || 'master') === cat.key);
      if (presetsInCat.length === 0) return;
      const grp = document.createElement('optgroup');
      grp.label = this.lang === 'ru' ? cat.labelRu : cat.labelEn;
      presetsInCat.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        if (p.name.includes('//')) {
          const parts = p.name.split('//').map(s => s.trim());
          opt.textContent = this.lang === 'ru' ? parts[0] : (parts[1] || parts[0]);
        } else {
          opt.textContent = this.lang === 'ru' ? (p.nameRu || p.name) : (p.nameEn || p.name);
        }
        grp.appendChild(opt);
      });
      sel.appendChild(grp);
    });

    if (currentVal) sel.value = currentVal;
    sel.onchange = () => this.applyPreset(sel.value);
  }

  resetAllSettings(preservePreset: boolean = false, autoEnableLfo: boolean = false) {
    this.brightness = 0;
    this.contrast = 1.25;
    this.sharpness = 25;
    this.gamma = 1.0;
    this.blur = 0;
    this.posterize = 0;
    this.invert = false;
    this.flipH = false;
    this.flipV = false;
    this.rotation = 0;
    this.scanlines = false;

    // Reset 7 Studio Sections
    this.shadrActive = false;
    this.shadrSineSpeed = 1.0;
    this.shadrFreq = 2.0;
    this.shadrFeedback = 0;
    this.shadrWaveType = 'harmonic';

    this.aikiziActive = false;
    this.aikiziNoiseScale = 12;
    this.aikiziEvolution = 1.0;
    this.aikiziNoiseType = 'perlin';
    this.aikiziIntensity = 40;

    this.glitchActive = false;
    this.glitchDatamosh = 0;
    this.glitchScanCorruption = 0;
    this.glitchRgbShift = 0;
    this.glitchJpeg = 0;
    this.glitchScriptSlayer = 0;

    this.specialCmyk = false;
    this.specialEpsilonGlow = 0;
    this.specialPaperTexture = 0;
    this.specialModulationLines = 0;
    this.specialAsciiReveal = 0;

    this.customInjectionActive = false;
    this.customInjectionText = '';
    this.typoScale = 0;
    this.jitter = 0;

    this.lfoRate = 1.0;
    this.lfoBindCellSize = false;
    this.lfoBindDatamosh = false;
    this.lfoBindScanCorruption = false;
    this.lfoBindRgbShift = false;
    this.lfoBindNoiseScale = false;
    this.lfoBindTypoScale = false;
    this.lfoBindJitter = false;
    this.lfoBindSineSpeed = false;
    this.lfoBindBrightness = false;
    this.lfoBindContrast = false;

    this.abstractActive = false;
    this.abstractWarpSwirl = 0;
    this.abstractKaleidoscope = 0;
    this.abstractRecursiveEcho = 0;
    this.abstractPixelSort = 0;
    this.abstractSpectrumDrift = 0;

    // Reset 4-Way RGB Color Grading
    this.liftX = 0; this.liftY = 0; this.liftLevel = 0;
    this.gammaX = 0; this.gammaY = 0; this.gammaLevel = 0;
    this.gainX = 0; this.gainY = 0; this.gainLevel = 0;
    this.masterX = 0; this.masterY = 0; this.masterLevel = 0;
    this.temperature = 0;
    this.tint = 0;
    this.saturation = 100;
    this.hueRotate = 0;

    // LFO Modulation (default enabled upon file ingest, or toggleable as user wishes)
    this.lfoEnabled = autoEnableLfo;
    this.lfo2Enabled = false;
    this.lfoSpeed = 1.0;
    this.lfoDepth = 25;
    this.lfoTarget = 'offset';
    this.lfoWaveform = 'sine';

    // Viewport
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;

    if (!preservePreset) {
      this.cellSize = 9;
      this.depth = 8;
      this.offset = 0;
      this.aspect = 0.55;
      this.ditherAlgo = 'bayer4';
      this.colorMode = 'palette';
      this.paletteId = 'phosphor_matrix';
      this.singleColor = '#00ff66';
      this.bgTransparent = false;
      this.bgColor = '#040904';
      this.fitMode = 'fit';
      this.activeGlyphSetId = 'classic_clean';
      const baseSet = GLYPH_SETS.find(s => s.id === 'classic_clean') || GLYPH_SETS[0];
      this.manualGlyphsText = baseSet.glyphs;
      this.isManualActive = false;
    }

    this.syncControlsToState();
    this.redrawAllColorWheels();
    this.updateCanvasTransform();
    this.markDirty(true);
  }

  applyPreset(presetId: string) {
    this.resetAllSettings(false, false);
    this.activePresetId = presetId;
    const p = MASTER_PRESETS.find(x => x.id === presetId) || MASTER_PRESETS[0];
    this.activeGlyphSetId = p.glyphSetId;
    this.cellSize = p.cellSize;
    this.depth = p.depth;
    this.offset = p.offset;
    this.aspect = p.aspect;
    this.invert = p.invert;
    this.ditherAlgo = p.ditherAlgo;
    this.contrast = p.contrast;
    this.brightness = p.brightness;
    this.sharpness = p.sharpness || 0;
    this.gamma = p.gamma || 1.0;
    this.blur = p.blur || 0;
    this.posterize = p.posterize || 0;
    this.colorMode = p.colorMode;
    this.paletteId = p.paletteId;
    this.singleColor = p.singleColor;
    this.bgTransparent = p.bgTransparent;
    this.bgColor = p.bgColor;
    this.lfoEnabled = p.lfoEnabled;
    this.lfoTarget = p.lfoTarget;
    this.lfoWaveform = p.lfoWaveform;
    this.lfoSpeed = p.lfoSpeed;
    this.lfoDepth = p.lfoDepth;

    // Apply Section 1 (SHADR)
    if (p.shadrActive !== undefined) this.shadrActive = p.shadrActive;
    if (p.shadrSineSpeed !== undefined) this.shadrSineSpeed = p.shadrSineSpeed;
    if (p.shadrFreq !== undefined) this.shadrFreq = p.shadrFreq;
    if (p.shadrFeedback !== undefined) this.shadrFeedback = p.shadrFeedback;
    if (p.shadrWaveType !== undefined) this.shadrWaveType = p.shadrWaveType;

    // Apply Section 2 (AIKIZI)
    if (p.aikiziActive !== undefined) this.aikiziActive = p.aikiziActive;
    if (p.aikiziNoiseScale !== undefined) this.aikiziNoiseScale = p.aikiziNoiseScale;
    if (p.aikiziEvolution !== undefined) this.aikiziEvolution = p.aikiziEvolution;
    if (p.aikiziNoiseType !== undefined) this.aikiziNoiseType = p.aikiziNoiseType;
    if (p.aikiziIntensity !== undefined) this.aikiziIntensity = p.aikiziIntensity;

    // Apply Section 3 (Glitch & Corruption)
    if (p.glitchActive !== undefined) this.glitchActive = p.glitchActive;
    if (p.glitchDatamosh !== undefined) this.glitchDatamosh = p.glitchDatamosh;
    if (p.glitchScanCorruption !== undefined) this.glitchScanCorruption = p.glitchScanCorruption;
    if (p.glitchRgbShift !== undefined) this.glitchRgbShift = p.glitchRgbShift;
    if (p.glitchJpeg !== undefined) this.glitchJpeg = p.glitchJpeg;
    if (p.glitchScriptSlayer !== undefined) this.glitchScriptSlayer = p.glitchScriptSlayer;

    // Apply Special Effects
    if (p.specialCmyk !== undefined) this.specialCmyk = p.specialCmyk;
    if (p.specialEpsilonGlow !== undefined) this.specialEpsilonGlow = p.specialEpsilonGlow;
    if (p.specialPaperTexture !== undefined) this.specialPaperTexture = p.specialPaperTexture;
    if (p.specialModulationLines !== undefined) this.specialModulationLines = p.specialModulationLines;
    if (p.specialAsciiReveal !== undefined) this.specialAsciiReveal = p.specialAsciiReveal;

    // Apply Section 5 (MAKE NEUE)
    if (p.customInjectionActive !== undefined) this.customInjectionActive = p.customInjectionActive;
    if (p.customInjectionText !== undefined) this.customInjectionText = p.customInjectionText;
    if (p.typoScale !== undefined) this.typoScale = p.typoScale;
    if (p.jitter !== undefined) this.jitter = p.jitter;

    // Apply Section 6 (MODULY)
    if (p.lfoBindCellSize !== undefined) this.lfoBindCellSize = p.lfoBindCellSize;
    if (p.lfoBindDatamosh !== undefined) this.lfoBindDatamosh = p.lfoBindDatamosh;
    if (p.lfoBindScanCorruption !== undefined) this.lfoBindScanCorruption = p.lfoBindScanCorruption;
    if (p.lfoBindRgbShift !== undefined) this.lfoBindRgbShift = p.lfoBindRgbShift;
    if (p.lfoBindNoiseScale !== undefined) this.lfoBindNoiseScale = p.lfoBindNoiseScale;
    if (p.lfoBindTypoScale !== undefined) this.lfoBindTypoScale = p.lfoBindTypoScale;
    if (p.lfoBindJitter !== undefined) this.lfoBindJitter = p.lfoBindJitter;
    if (p.lfoBindSineSpeed !== undefined) this.lfoBindSineSpeed = p.lfoBindSineSpeed;
    if (p.lfoBindBrightness !== undefined) this.lfoBindBrightness = p.lfoBindBrightness;
    if (p.lfoBindContrast !== undefined) this.lfoBindContrast = p.lfoBindContrast;

    // Apply Section 7 (ABSTRACT)
    if (p.abstractActive !== undefined) this.abstractActive = p.abstractActive;
    if (p.abstractWarpSwirl !== undefined) this.abstractWarpSwirl = p.abstractWarpSwirl;
    if (p.abstractKaleidoscope !== undefined) this.abstractKaleidoscope = p.abstractKaleidoscope;
    if (p.abstractRecursiveEcho !== undefined) this.abstractRecursiveEcho = p.abstractRecursiveEcho;
    if (p.abstractPixelSort !== undefined) this.abstractPixelSort = p.abstractPixelSort;
    if (p.abstractSpectrumDrift !== undefined) this.abstractSpectrumDrift = p.abstractSpectrumDrift;

    // Reset manual input to the preset's characters
    const setObj = GLYPH_SETS.find(s => s.id === p.glyphSetId);
    if (setObj) {
      this.manualGlyphsText = setObj.glyphs;
      this.isManualActive = false;
      const inputEl = document.getElementById('manual-glyph-input') as HTMLInputElement;
      if (inputEl) inputEl.value = setObj.glyphs;
    }

    this.syncControlsToState();
    this.updateLiveGlyphRibbon();
    this.markDirty(true);
    const pName = this.lang === 'ru'
      ? (p.nameRu || (p.name.includes('//') ? p.name.split('//')[0].trim() : p.name))
      : (p.nameEn || (p.name.includes('//') ? p.name.split('//')[1].trim() : p.name));
    this.showToast((this.lang === 'ru' ? 'Применен пресет: ' : 'Applied preset: ') + pName);
  }

  syncControlsToState() {
    const setVal = (id: string, val: any) => {
      const el = document.getElementById(id) as HTMLInputElement;
      if (el) el.value = val.toString();
    };
    const setChecked = (id: string, checked: boolean) => {
      const el = document.getElementById(id) as HTMLInputElement;
      if (el) el.checked = checked;
    };
    const setText = (id: string, txt: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    setVal('preset-selector', this.activePresetId);
    setVal('slider-cell-size', this.cellSize);
    setText('val-cell-size', `${this.cellSize} px`);

    setVal('slider-depth', this.depth);
    setText('val-depth', `${this.depth} ${this.lang === 'ru' ? 'ур.' : 'levels'}`);

    setVal('slider-offset', this.offset);
    setText('val-offset', `${this.offset}`);

    setVal('slider-aspect', this.aspect);
    setText('val-aspect', `${this.aspect}`);

    setChecked('toggle-invert', this.invert);
    setVal('select-dither-algo', this.ditherAlgo);

    setVal('slider-contrast', this.contrast);
    setText('val-contrast', `${this.contrast}×`);

    setVal('slider-brightness', this.brightness);
    setText('val-brightness', `${this.brightness}%`);

    // New Image Setting Sliders
    setVal('slider-sharpness', this.sharpness);
    setText('val-sharpness', `${this.sharpness}%`);

    setVal('slider-gamma', this.gamma);
    setText('val-gamma', `${this.gamma.toFixed(2)}`);

    setVal('slider-blur', this.blur);
    setText('val-blur', `${this.blur} px`);

    setVal('slider-posterize', this.posterize);
    setText('val-posterize', this.posterize === 0 ? (this.lang === 'ru' ? 'ВЫКЛ' : 'OFF') : `${this.posterize} ${this.lang === 'ru' ? 'ур.' : 'levels'}`);

    setVal('select-color-mode', this.colorMode);
    setChecked('toggle-bg-transparent', this.bgTransparent);
    setVal('picker-single-color', this.singleColor);
    setVal('hex-single-color', this.singleColor);
    setVal('picker-bg-color', this.bgColor);
    setVal('hex-bg-color', this.bgColor);

    setVal('select-fit-mode', this.fitMode);

    // Color Grading & 4-Way Color Wheels sync
    setVal('slider-lift-level', this.liftLevel);
    setText('val-lift-level', `${this.liftLevel}%`);
    setVal('slider-gamma-level', this.gammaLevel);
    setText('val-gamma-level', `${this.gammaLevel}%`);
    setVal('slider-gain-level', this.gainLevel);
    setText('val-gain-level', `${this.gainLevel}%`);
    setVal('slider-master-level', this.masterLevel);
    setText('val-master-level', `${this.masterLevel}%`);

    setVal('slider-temp', this.temperature);
    setText('val-temp', `${this.temperature}`);
    setVal('slider-tint', this.tint);
    setText('val-tint', `${this.tint}`);
    setVal('slider-sat', this.saturation);
    setText('val-sat', `${this.saturation}%`);
    setVal('slider-hue-rot', this.hueRotate);
    setText('val-hue-rot', `${this.hueRotate}°`);
    this.redrawAllColorWheels();

    // LFO 1 Controls sync
    setChecked('toggle-lfo', this.lfoEnabled);
    setVal('select-lfo-target', this.lfoTarget);
    setVal('select-lfo-waveform', this.lfoWaveform);
    setVal('slider-lfo-speed', this.lfoSpeed);
    setText('val-lfo-speed', `${this.lfoSpeed.toFixed(1)} CYC/S`);
    setVal('slider-lfo-depth', this.lfoDepth);
    setText('val-lfo-depth', `${this.lfoDepth}%`);

    const lfoBox = document.getElementById('lfo-controls');
    if (lfoBox) {
      lfoBox.style.opacity = this.lfoEnabled ? '1' : '0.35';
      lfoBox.style.pointerEvents = this.lfoEnabled ? 'all' : 'none';
    }

    // LFO 2 Modulation Chain Controls sync
    setChecked('toggle-lfo2', this.lfo2Enabled);
    setVal('select-lfo2-mode', this.lfo2Mode);
    setVal('select-lfo2-waveform', this.lfo2Waveform);
    setVal('select-lfo2-target', this.lfo2Target);
    setVal('slider-lfo2-speed', this.lfo2Speed);
    setText('val-lfo2-speed', `${this.lfo2Speed.toFixed(2)} CYC/S`);
    setVal('slider-lfo2-depth', this.lfo2Depth);
    setText('val-lfo2-depth', `${this.lfo2Depth}%`);

    const lfo2Box = document.getElementById('lfo2-controls');
    if (lfo2Box) {
      lfo2Box.style.opacity = this.lfo2Enabled ? '1' : '0.35';
      lfo2Box.style.pointerEvents = this.lfo2Enabled ? 'all' : 'none';
    }
    const targetRow = document.getElementById('lfo2-target-row');
    if (targetRow) {
      targetRow.style.display = this.lfo2Mode === 'cross_target' ? 'flex' : 'none';
    }

    const singleBox = document.getElementById('single-color-box');
    const palBox = document.getElementById('palette-selection-box');
    if (singleBox && palBox) {
      singleBox.style.display = this.colorMode === 'single' ? 'flex' : 'none';
      palBox.style.display = this.colorMode === 'palette' ? 'flex' : 'none';
    }

    // Update active class on palette cards
    document.querySelectorAll('.palette-card').forEach(card => {
      const pid = card.getAttribute('data-palette-id');
      if (pid === this.paletteId) card.classList.add('active');
      else card.classList.remove('active');
    });

    // -------------------------------------------------------------
    // SYNC 7 STUDIO SECTIONS CONTROLS IN SETTINGS MODAL
    // -------------------------------------------------------------
    // Section 1: SHADR STUDIO
    setChecked('toggle-shadr-active', this.shadrActive);
    setVal('slider-shadr-speed', this.shadrSineSpeed);
    setText('val-shadr-speed', `${this.shadrSineSpeed.toFixed(1)}×`);
    setVal('slider-shadr-freq', this.shadrFreq);
    setText('val-shadr-freq', `${this.shadrFreq.toFixed(1)}`);
    setVal('slider-shadr-feedback', this.shadrFeedback);
    setText('val-shadr-feedback', `${this.shadrFeedback}%`);
    setVal('select-shadr-wave', this.shadrWaveType);

    // Section 2: AIKIZI LAB
    setChecked('toggle-aikizi-active', this.aikiziActive);
    setVal('select-aikizi-type', this.aikiziNoiseType);
    setVal('slider-aikizi-scale', this.aikiziNoiseScale);
    setText('val-aikizi-scale', `${this.aikiziNoiseScale} px`);
    setVal('slider-aikizi-evolution', this.aikiziEvolution);
    setText('val-aikizi-evolution', `${this.aikiziEvolution.toFixed(1)}×`);
    setVal('slider-aikizi-intensity', this.aikiziIntensity);
    setText('val-aikizi-intensity', `${this.aikiziIntensity}%`);

    // Section 3: GLCHLAB
    setChecked('toggle-glitch-active', this.glitchActive);
    setVal('slider-glitch-datamosh', this.glitchDatamosh);
    setText('val-glitch-datamosh', `${this.glitchDatamosh}%`);
    setVal('slider-glitch-scan', this.glitchScanCorruption);
    setText('val-glitch-scan', `${this.glitchScanCorruption}%`);
    setVal('slider-glitch-rgb', this.glitchRgbShift);
    setText('val-glitch-rgb', `${this.glitchRgbShift} px`);

    // Section 4: DITHER-BOY
    setVal('select-dither-algo-settings', this.ditherAlgo);
    setVal('select-palette-settings', this.paletteId);
    setVal('slider-cell-settings', this.cellSize);
    setText('val-cell-settings', `${this.cellSize} px`);
    setVal('slider-bright-settings', this.brightness);
    setText('val-bright-settings', `${this.brightness}%`);
    setVal('slider-contrast-settings', this.contrast);
    setText('val-contrast-settings', `${this.contrast.toFixed(2)}×`);

    // Section 5: MAKE NEUE WORLD
    setVal('input-custom-injection', this.customInjectionText || '');
    const injCount = document.getElementById('injection-char-count');
    if (injCount) injCount.textContent = `${(this.customInjectionText || '').length} / 10 символов`;
    setVal('slider-depth-settings', this.depth);
    setText('val-depth-settings', `${this.depth} ур.`);
    setVal('slider-offset-settings', this.offset);
    setText('val-offset-settings', `${this.offset}`);
    setVal('slider-typo-scale', this.typoScale);
    setText('val-typo-scale', `${this.typoScale}%`);
    setVal('slider-jitter', this.jitter);
    setText('val-jitter', `${this.jitter} px`);

    // Section 6: MODULY
    setChecked('toggle-lfo-settings', this.lfoEnabled);
    setVal('slider-lfo-rate-settings', this.lfoSpeed);
    setText('val-lfo-rate-settings', `${this.lfoSpeed.toFixed(1)} CYC/S`);
    setVal('slider-lfo-depth-settings', this.lfoDepth);
    setText('val-lfo-depth-settings', `${this.lfoDepth}%`);
    setVal('select-lfo-wave-settings', this.lfoWaveform);
    setChecked('toggle-bind-cell', this.lfoBindCellSize);
    setChecked('toggle-bind-datamosh', this.lfoBindDatamosh);
    setChecked('toggle-bind-scan', this.lfoBindScanCorruption);
    setChecked('toggle-bind-rgb', this.lfoBindRgbShift);
    setChecked('toggle-bind-noise', this.lfoBindNoiseScale);
    setChecked('toggle-bind-typo', this.lfoBindTypoScale);
    setChecked('toggle-bind-jitter', this.lfoBindJitter);
    setChecked('toggle-bind-speed', this.lfoBindSineSpeed);
    setChecked('toggle-bind-bright', this.lfoBindBrightness);

    // Section 7: ABSTRACT STUDIO
    setChecked('toggle-abstract-active', this.abstractActive);
    setVal('slider-abstract-warp', this.abstractWarpSwirl);
    setText('val-abstract-warp', `${this.abstractWarpSwirl}%`);
    setVal('slider-abstract-kaleido', this.abstractKaleidoscope);
    setText('val-abstract-kaleido', this.abstractKaleidoscope === 0 ? 'ВЫКЛ' : `${this.abstractKaleidoscope}X`);
    setVal('slider-abstract-echo', this.abstractRecursiveEcho);
    setText('val-abstract-echo', `${this.abstractRecursiveEcho}%`);
    setVal('slider-abstract-sort', this.abstractPixelSort);
    setText('val-abstract-sort', `${this.abstractPixelSort}%`);
    setVal('slider-abstract-drift', this.abstractSpectrumDrift);
    setText('val-abstract-drift', `${this.abstractSpectrumDrift}%`);
  }

  // -------------------------------------------------------------
  // THEME & LOCALIZATION
  // -------------------------------------------------------------
  applyTheme(theme: 'light' | 'dark') {
    this.theme = theme;
    document.body.setAttribute('data-theme', theme);
    const btn = document.getElementById('btn-toggle-theme');
    if (btn) {
      btn.textContent = theme === 'light' ? I18N[this.lang].themeLight : I18N[this.lang].themeDark;
    }
    this.saveState();
  }

  setLanguage(lang: 'ru' | 'en') {
    this.lang = lang;
    this.saveState();
    const t = I18N[lang];

    const setTxt = (id: string, text: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    // Header & Brand
    setTxt('i18n-preset-lbl', t.presetLbl);
    setTxt('btn-save-preset-dialog', t.savePreset);
    setTxt('i18n-reset-all-btn', t.resetAllBtn);
    setTxt('btn-download-app', t.saveApp);
    setTxt('btn-open-export', t.exportBtn);

    // Monitors & Scopes
    setTxt('i18n-mon1', t.mon1);
    setTxt('i18n-fit-lbl', t.fitLbl);
    setTxt('i18n-crt-upload-lbl', t.crtUploadBtn);
    setTxt('hud-grid-lbl', t.hudGrid);
    setTxt('hud-cells-lbl', t.hudCells);
    setTxt('hud-zoom-lbl', t.hudZoom);
    setTxt('scope-phase-lbl', t.scopePhase);
    setTxt('scope-sweep-lbl', t.scopeSweep);
    setTxt('i18n-drop-prompt', t.dropPrompt);
    setTxt('i18n-drop-sub', t.dropSub);

    // LFO 1 & Modulation Chain (LFO 2)
    setTxt('i18n-mon2', t.mon2);
    setTxt('i18n-target-lbl', t.targetLbl);
    setTxt('i18n-wave-lbl', t.waveLbl);
    setTxt('i18n-speed-lbl', t.speedLbl);
    setTxt('i18n-amp-lbl', t.ampLbl);
    setTxt('i18n-chain-title', t.chainTitle);
    setTxt('i18n-chain-mode-lbl', t.chainModeLbl);
    setTxt('i18n-lfo2-wave-lbl', t.lfo2WaveLbl);
    setTxt('i18n-lfo2-target-lbl', t.lfo2TargetLbl);
    setTxt('i18n-speed2-lbl', t.speed2Lbl);
    setTxt('i18n-amp2-lbl', t.amp2Lbl);

    // CRT Raster & Faders
    setTxt('i18n-cell-lbl', t.cellLbl);
    setTxt('i18n-depth-lbl', t.depthLbl);
    setTxt('i18n-offset-lbl', t.offsetLbl);
    setTxt('i18n-aspect-lbl', t.aspectLbl);
    setTxt('i18n-invert-lbl', t.invertLbl);
    setTxt('i18n-sharp-lbl', t.sharpLbl);
    setTxt('i18n-gamma-lbl', t.gammaLbl);
    setTxt('i18n-blur-lbl', t.blurLbl);
    setTxt('i18n-poster-lbl', t.posterLbl);
    setTxt('i18n-dither-lbl', t.ditherLbl);
    setTxt('i18n-contrast-lbl', t.contrastLbl);
    setTxt('i18n-bright-lbl', t.brightLbl);
    setTxt('i18n-color-lbl', t.colorLbl);
    setTxt('i18n-trans-lbl', t.transLbl);
    setTxt('i18n-glyphcolor-lbl', t.glyphColorLbl);
    setTxt('i18n-bgcolor-lbl', t.bgColorLbl);

    // 4-Way RGB Color Wheels
    setTxt('i18n-grade-title', t.gradeTitle);
    setTxt('i18n-lift-wheel-lbl', t.liftWheelLbl);
    setTxt('i18n-gamma-wheel-lbl', t.gammaWheelLbl);
    setTxt('i18n-gain-wheel-lbl', t.gainWheelLbl);
    setTxt('i18n-master-wheel-lbl', t.masterWheelLbl);
    setTxt('i18n-reset-rack-btn', t.resetRackBtn);
    setTxt('i18n-temp-lbl', t.tempLbl);
    setTxt('i18n-tint-lbl', t.tintLbl);
    setTxt('i18n-sat-lbl', t.satLbl);
    setTxt('i18n-hue-lbl', t.hueLbl);
    document.querySelectorAll('.i18n-wheel-level-lbl').forEach(el => {
      el.textContent = t.wheelLevelLbl;
    });

    // Decks 1, 2, 3
    setTxt('i18n-deck1-title', t.deck1Title);
    setTxt('i18n-active-lbl', t.activeLbl);
    setTxt('i18n-timeline-title', t.timelineTitle);
    setTxt('i18n-timeline-hint', t.timelineHint);
    setTxt('i18n-timeline-loop-lbl', t.timelineLoopLbl);
    setTxt('i18n-timeline-fps-lbl', t.timelineFpsLbl);
    setTxt('lbl-timeline-export-gif', t.timelineExportGifBtn);
    setTxt('lbl-timeline-export-webm', t.timelineExportWebmBtn);
    if (!this.isTimelineRecording) {
      setTxt('lbl-timeline-rec', t.timelineRecBtn);
    }
    if (!this.isTimelinePlaying) {
      setTxt('lbl-timeline-play', t.timelinePlayBtn);
    }
    setTxt('i18n-manual-title', t.manualTitle);
    setTxt('i18n-btn-reverse', t.btnReverse);
    setTxt('i18n-btn-reset-set', t.btnResetSet);
    setTxt('i18n-btn-clear', t.btnClear);
    setTxt('i18n-btn-copy', t.btnCopy);
    setTxt('i18n-deck3-title', t.deck3Title);
    setTxt('i18n-slot-prompt', t.slotPrompt);
    setTxt('i18n-slot-sub', t.slotSub);

    // Animation & Transport Controls
    setTxt('i18n-anim-title', t.animPanelTitle);
    setTxt('i18n-play-btn', this.gifIsPlaying ? (lang === 'ru' ? 'ПАУЗА' : 'PAUSE') : t.playBtn);
    setTxt('i18n-loop-btn', t.loopBtn);
    setTxt('i18n-speed-anim-lbl', t.speedAnimLbl);
    setTxt('i18n-quick-gif-btn', t.quickGifBtn);
    setTxt('i18n-scanlines-lbl', t.scanlinesLbl);
    setTxt('i18n-rotate-lbl', t.rotateLbl);
    setTxt('i18n-fliph-lbl', t.flipHLbl);
    setTxt('i18n-flipv-lbl', t.flipVLbl);

    // Export Modal
    setTxt('i18n-modal-export-title', t.modalExportTitle);
    setTxt('i18n-export-desc', t.exportDesc);
    setTxt('i18n-gif-box-title', t.gifBoxTitle);
    setTxt('i18n-gif-box-desc', t.gifBoxDesc);
    setTxt('i18n-gif-download-btn', t.gifDownloadBtn);
    setTxt('i18n-gif-res-lbl', t.gifResLbl);
    setTxt('i18n-gif-qual-lbl', t.gifQualLbl);
    setTxt('i18n-gif-fps-lbl', t.gifFpsLbl);
    setTxt('i18n-image-box-title', t.imageBoxTitle);
    setTxt('i18n-image-box-desc', t.imageBoxDesc);
    setTxt('i18n-image-download-btn', t.imageDownloadBtn);
    setTxt('i18n-image-format-lbl', t.imageFormatLbl);
    setTxt('i18n-image-scale-lbl', t.imageScaleLbl);
    setTxt('i18n-image-qual-lbl', t.imageQualLbl);
    setTxt('gif-encoding-lbl', t.gifEncodingLbl);
    setTxt('recording-status-lbl', t.recordingStatusLbl);
    setTxt('i18n-webm-box-title', t.webmBoxTitle);
    setTxt('i18n-webm-box-desc', t.webmBoxDesc);
    setTxt('i18n-webm-download-btn', t.webmRecordBtn);
    setTxt('btn-dismiss-export', t.closeBtn);

    // Save Preset Modal
    setTxt('i18n-savepreset-title', t.savePresetTitle);
    setTxt('i18n-preset-name-lbl', t.presetNameLbl);
    setTxt('btn-confirm-save-preset', t.saveBtn);
    setTxt('btn-cancel-preset', t.cancelBtn);

    // Inspect Glyph Modal
    setTxt('i18n-inspect-title', t.inspectTitle);
    setTxt('btn-copy-single-glyph', t.copyGlyphBtn);
    setTxt('btn-dismiss-inspect', t.closeBtn);
    setTxt('btn-reset-all-grading', t.resetGradingBtn);
    setTxt('hud-lfo-indicator', this.lfoEnabled ? t.hudLfoActive : t.hudLfoOff);

    // Welcome / Entry Menu Window
    setTxt('i18n-welcome-menu-btn', t.welcomeMenuBtn);
    setTxt('i18n-welcome-term-title', t.welcomeTermTitle);
    setTxt('i18n-welcome-sub', t.welcomeSub);
    setTxt('i18n-welcome-upload-btn', t.welcomeUploadBtn);
    setTxt('i18n-welcome-drop-hint', t.welcomeDropHint);
    setTxt('i18n-welcome-skip-btn', t.welcomeSkipBtn);

    const btnLang = document.getElementById('btn-toggle-lang');
    if (btnLang) {
      btnLang.textContent = lang === 'ru' ? 'ЯЗЫК: RU' : 'LANG: EN';
      btnLang.title = t.toggleLangTooltip;
    }

    // Tooltips (title attributes)
    const setTitle = (id: string, text: string) => {
      const el = document.getElementById(id);
      if (el) el.title = text;
    };
    setTitle('btn-open-welcome-menu', t.welcomeMenuTooltip);
    setTitle('brand-sacred-glyph', t.brandTooltip);
    setTitle('btn-save-preset-dialog', t.savePresetTooltip);
    setTitle('btn-toggle-theme', t.toggleThemeTooltip);
    setTitle('btn-toggle-lang', t.toggleLangTooltip);
    setTitle('btn-open-export', t.exportTooltip);
    setTitle('select-fit-mode', t.fitModeTooltip);
    setTitle('btn-rotate-cw', t.rotateTooltip);
    setTitle('btn-flip-h', t.flipHTooltip);
    setTitle('btn-flip-v', t.flipVTooltip);
    setTitle('btn-play-pause', t.playTooltip);
    setTitle('btn-loop-video', t.loopTooltip);
    setTitle('btn-step-prev', t.stepPrevTooltip);
    setTitle('btn-step-next', t.stepNextTooltip);
    setTitle('btn-toggle-grid', t.gridTooltip);
    setTitle('btn-zoom-in', t.zoomInTooltip);
    setTitle('btn-zoom-out', t.zoomOutTooltip);
    setTitle('btn-zoom-reset', t.zoomResetTooltip);
    setTitle('btn-reset-all-grading', t.resetGradingTooltip);
    setTitle('btn-reset-lift', t.resetLiftTooltip);
    setTitle('btn-reset-gamma', t.resetGammaTooltip);
    setTitle('btn-reset-gain', t.resetGainTooltip);
    setTitle('btn-reset-master', t.resetMasterTooltip);
    setTitle('btn-reset-rack', t.resetRackTooltip);
    setTitle('btn-reverse-glyphs', t.btnReverseTooltip);
    setTitle('btn-reset-to-set', t.btnResetSetTooltip);
    setTitle('btn-clear-glyphs', t.btnClearTooltip);
    setTitle('btn-copy-glyphs', t.btnCopyTooltip);
    setTitle('btn-upload-file', t.uploadSlotTooltip);

    // Placeholders
    const setPlaceholder = (id: string, text: string) => {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (el) el.placeholder = text;
    };
    setPlaceholder('manual-glyph-input', t.customGlyphsPlaceholder);
    setPlaceholder('input-preset-name', t.presetNamePlaceholder);

    // Dynamic Select Option Localizations
    this.updateSelectOptionsI18N();

    // Re-populate dynamic UI lists
    this.initPresetsSelector();
    this.initPalettesGrid();
    this.initCategoryTabs();
    this.updateLiveGlyphRibbon();
    this.updateLayerStackUI();

    // Update Slider readouts
    const valDepth = document.getElementById('val-depth');
    if (valDepth) valDepth.textContent = `${this.depth} ${t.levelsSuffix}`;
    const valPosterize = document.getElementById('val-posterize');
    if (valPosterize) {
      valPosterize.textContent = this.posterize === 0 ? (lang === 'ru' ? 'ВЫКЛ' : 'OFF') : `${this.posterize} ${t.levelsSuffix}`;
    }

    this.applyTheme(this.theme);
    this.showToast(lang === 'ru' ? 'Язык интерфейса: Русский' : 'Interface Language: English');
  }

  updateSelectOptionsI18N() {
    const lang = this.lang;
    const SELECT_OPTIONS_I18N: Record<string, Record<string, { ru: string; en: string }>> = {
      'select-fit-mode': {
        fit: { ru: 'ПРОПОРЦИИ 1:1 (FIT)', en: 'FIT 1:1 (ASPECT)' },
        cover: { ru: 'ЗАПОЛНИТЬ (COVER)', en: 'COVER (ZOOM)' },
        stretch: { ru: 'РАСТЯНУТЬ (STRETCH)', en: 'STRETCH TO FILL' }
      },
      'select-lfo-target': {
        offset: { ru: 'СМЕЩЕНИЕ ГЛИФОВ', en: 'GLYPH OFFSET' },
        cell: { ru: 'РАЗМЕР ЯЧЕЙКИ', en: 'CELL SIZE' },
        depth: { ru: 'ГЛУБИНА УРОВНЕЙ', en: 'DEPTH LEVELS' },
        both: { ru: 'СМЕЩЕНИЕ + ГЛУБИНА', en: 'OFFSET + DEPTH' },
        contrast: { ru: 'КОНТРАСТ', en: 'CONTRAST' },
        brightness: { ru: 'ЯРКОСТЬ', en: 'BRIGHTNESS' },
        gamma: { ru: 'ГАММА-КРИВАЯ', en: 'GAMMA CURVE' },
        hue: { ru: 'ЦВЕТОВОЙ СПЕКТР (HUE)', en: 'HUE SPECTRUM' },
        temperature: { ru: 'ТЕМПЕРАТУРА (TEMP)', en: 'TEMPERATURE' },
        saturation: { ru: 'НАСЫЩЕННОСТЬ (SAT)', en: 'SATURATION' },
        lift: { ru: 'ТЕНИ (LIFT LEVEL)', en: 'SHADOWS (LIFT)' },
        gain: { ru: 'СВЕТА (GAIN LEVEL)', en: 'HIGHLIGHTS (GAIN)' },
        rotation: { ru: 'ВРАЩЕНИЕ CRT', en: 'CRT ROTATION' },
        aspect: { ru: 'ПРОПОРЦИЯ', en: 'ASPECT RATIO' },
        sharpness: { ru: 'РЕЗКОСТЬ', en: 'SHARPNESS' },
        blur: { ru: 'РАЗМЫТИЕ', en: 'BLUR / SMOOTH' }
      },
      'select-lfo2-target': {
        hue: { ru: 'ЦВЕТОВОЙ СПЕКТР (HUE)', en: 'HUE SPECTRUM' },
        temperature: { ru: 'ТЕМПЕРАТУРА (TEMP)', en: 'TEMPERATURE' },
        saturation: { ru: 'НАСЫЩЕННОСТЬ (SAT)', en: 'SATURATION' },
        lift: { ru: 'ТЕНИ (LIFT)', en: 'SHADOWS (LIFT)' },
        gain: { ru: 'СВЕТА (GAIN)', en: 'HIGHLIGHTS (GAIN)' },
        rotation: { ru: 'ВРАЩЕНИЕ CRT', en: 'CRT ROTATION' },
        contrast: { ru: 'КОНТРАСТ', en: 'CONTRAST' },
        brightness: { ru: 'ЯРКОСТЬ', en: 'BRIGHTNESS' },
        gamma: { ru: 'ГАММА-КРИВАЯ', en: 'GAMMA CURVE' },
        aspect: { ru: 'ПРОПОРЦИЯ', en: 'ASPECT RATIO' },
        sharpness: { ru: 'РЕЗКОСТЬ', en: 'SHARPNESS' },
        blur: { ru: 'РАЗМЫТИЕ', en: 'BLUR / SMOOTH' },
        cell: { ru: 'РАЗМЕР ЯЧЕЙКИ', en: 'CELL SIZE' },
        depth: { ru: 'ГЛУБИНА', en: 'DEPTH LEVELS' },
        offset: { ru: 'СМЕЩЕНИЕ', en: 'OFFSET' }
      },
      'select-lfo-waveform': {
        sine: { ru: 'СИНУСОИДА (SINE)', en: 'SINE WAVE' },
        triangle: { ru: 'ТРЕУГОЛЬНИК (TRI)', en: 'TRIANGLE' },
        sawtooth_up: { ru: 'ПИЛА ВВЕРХ (RAMP UP)', en: 'RAMP UP (SAW)' },
        sawtooth_down: { ru: 'ПИЛА ВНИЗ (RAMP DN)', en: 'RAMP DOWN (SAW)' },
        square: { ru: 'МЕАНДР (SQUARE 50%)', en: 'SQUARE (50%)' },
        pulse_narrow: { ru: 'ИМПУЛЬС (PULSE 20%)', en: 'PULSE (20%)' },
        sample_hold: { ru: 'SAMPLE & HOLD (ГЛИТЧ)', en: 'SAMPLE & HOLD (GLITCH)' },
        smooth_random: { ru: 'ПЛАВНЫЙ ДРЕЙФ (ШУМ)', en: 'SMOOTH RANDOM NOISE' },
        staircase: { ru: 'СТУПЕНИ (STAIR 5-ST)', en: 'STAIRCASE (5 STEPS)' },
        exponential: { ru: 'ЭКСПОНЕНТА (BOUNCE)', en: 'EXPONENTIAL BOUNCE' },
        chaos_lorenz: { ru: 'ХАОС ЛОРЕНЦА (CHAOS)', en: 'LORENZ CHAOS' },
        noise_perlin: { ru: 'ПЕРЛИН-ШУМ (PERLIN NOISE)', en: 'PERLIN NOISE' },
        bipolar_burst: { ru: 'БЕРСТ-ИМПУЛЬСЫ (BURST TRAIN)', en: 'BURST TRAIN' },
        parabolic: { ru: 'ПАРАБОЛА (PARABOLIC)', en: 'PARABOLIC' },
        harmonic_combo: { ru: 'ГАРМОНИКИ (HARMONIC 3X)', en: '3X HARMONICS' },
        cardioid: { ru: 'КАРДИОИДА (HEART PULSE)', en: 'CARDIOID HEARTBEAT' }
      },
      'select-lfo2-waveform': {
        triangle: { ru: 'ТРЕУГОЛЬНИК', en: 'TRIANGLE' },
        sine: { ru: 'СИНУСОИДА', en: 'SINE' },
        sawtooth_up: { ru: 'ПИЛА ВВЕРХ', en: 'RAMP UP' },
        sawtooth_down: { ru: 'ПИЛА ВНИЗ', en: 'RAMP DOWN' },
        square: { ru: 'МЕАНДР', en: 'SQUARE' },
        pulse_narrow: { ru: 'УЗКИЙ ИМПУЛЬС', en: 'NARROW PULSE' },
        sample_hold: { ru: 'SAMPLE & HOLD', en: 'SAMPLE & HOLD' },
        smooth_random: { ru: 'ПЛАВНЫЙ ДРЕЙФ', en: 'SMOOTH RANDOM' },
        staircase: { ru: 'СТУПЕНИ', en: 'STAIRCASE' },
        exponential: { ru: 'ЭКСПОНЕНТА', en: 'EXPONENTIAL' },
        chaos_lorenz: { ru: 'ХАОС ЛОРЕНЦА', en: 'LORENZ CHAOS' },
        noise_perlin: { ru: 'ПЕРЛИН-ШУМ', en: 'PERLIN NOISE' },
        bipolar_burst: { ru: 'БЕРСТ-ИМПУЛЬСЫ', en: 'BURST TRAIN' },
        parabolic: { ru: 'ПАРАБОЛА', en: 'PARABOLIC' },
        harmonic_combo: { ru: 'ГАРМОНИКИ', en: '3X HARMONICS' },
        cardioid: { ru: 'КАРДИОИДА', en: 'CARDIOID' }
      },
      'select-lfo2-mode': {
        fm_rate: { ru: 'FM: ЧАСТОТА LFO 1', en: 'FM: RATE OF LFO 1' },
        am_depth: { ru: 'AM: ГЛУБИНА LFO 1', en: 'AM: DEPTH OF LFO 1' },
        sum_additive: { ru: 'SUM: СЛОЖЕНИЕ ВОЛН', en: 'SUM: ADDITIVE SIGNALS' },
        ring_mod: { ru: 'RING: КОЛЬЦЕВАЯ МОД.', en: 'RING: MULTIPLICATIVE' },
        phase_mod: { ru: 'PM: ФАЗОВАЯ МОД.', en: 'PM: PHASE MODULATION' },
        sample_track: { ru: 'GATE: ТРЕК & ХОЛД', en: 'GATE: TRACK & HOLD' },
        chaos_feedback: { ru: 'FB: ХАОС ФИДБЕК', en: 'FB: CHAOS FEEDBACK' },
        cross_target: { ru: 'DUAL: ВТОРАЯ ЦЕЛЬ', en: 'DUAL: INDEPENDENT TARGET 2' }
      },
      'select-dither-algo': {
        none: { ru: 'БЕЗ ДИЗЕРИНГА (КВАНТОВАНИЕ)', en: 'NO DITHER (QUANTIZE)' },
        floyd: { ru: 'FLOYD-STEINBERG (ДИФФУЗИЯ)', en: 'FLOYD-STEINBERG (DIFFUSION)' },
        serpentine_floyd: { ru: 'SERPENTINE FLOYD (ЗМЕЙКА)', en: 'SERPENTINE FLOYD-STEINBERG' },
        atkinson: { ru: 'ATKINSON (MACINTOSH)', en: 'ATKINSON (MACINTOSH)' },
        jarvis: { ru: 'JARVIS-JUDICE-NINKE (48 ДЕЛ.)', en: 'JARVIS, JUDICE & NINKE' },
        stucki: { ru: 'STUCKI (42 ДЕЛЕНИЯ)', en: 'STUCKI (CLEAN)' },
        burkes: { ru: 'BURKES (32 ДЕЛЕНИЯ)', en: 'BURKES (SOFT)' },
        sierra3: { ru: 'SIERRA 3-ROW (ТРЕХСТРОЧНЫЙ)', en: 'SIERRA 3-ROW' },
        sierra2: { ru: 'SIERRA 2-ROW (ДВУХСТРОЧНЫЙ)', en: 'SIERRA 2-ROW' },
        sierra_lite: { ru: 'SIERRA LITE (БЫСТРЫЙ)', en: 'SIERRA LITE' },
        false_floyd: { ru: 'FALSE FLOYD-STEINBERG', en: 'FALSE FLOYD-STEINBERG' },
        fan: { ru: 'FAN (1993 АДАПТИВНЫЙ)', en: 'FAN (1993)' },
        shiau_fan: { ru: 'SHIAU-FAN (МАТРИЧНЫЙ)', en: 'SHIAU-FAN' },
        ostromoukhov: { ru: 'OSTROMOUKHOV (ДИНАМИЧЕСКИЙ)', en: 'OSTROMOUKHOV' },
        gradient_diffusion: { ru: 'GRADIENT DIFFUSION (ВЕКТОРНЫЙ)', en: 'GRADIENT DIFFUSION' },
        heavy_error: { ru: 'HEAVY DISPERSION (ДИСПЕРСИЯ)', en: 'HEAVY DISPERSION' },
        bayer2: { ru: 'BAYER 2×2 (ГРУБЫЙ)', en: 'BAYER 2×2' },
        bayer4: { ru: 'BAYER 4×4 (УПОРЯДОЧЕННЫЙ)', en: 'BAYER 4×4 (ORDERED)' },
        bayer8: { ru: 'BAYER 8×8 (ТОНКИЙ МАТРИЧНЫЙ)', en: 'BAYER 8×8 (FINE MATRIX)' },
        bayer16: { ru: 'BAYER 16×16 (ВЫСОКОЕ РАЗРЕШЕНИЕ)', en: 'BAYER 16×16' },
        cluster_dot: { ru: 'CLUSTERED DOT 8×8 (КЛАСТЕР)', en: 'CLUSTERED DOT 8×8' },
        halftone: { ru: 'HALFTONE DOT (РАСТРОВАЯ ТОЧКА)', en: 'HALFTONE DOT SCREEN' },
        lines_horizontal: { ru: 'ГОРИЗОНТАЛЬНЫЕ ЛИНИИ', en: 'HORIZONTAL LINES' },
        lines_vertical: { ru: 'ВЕРТИКАЛЬНЫЕ ЛИНИИ', en: 'VERTICAL LINES' },
        lines_diagonal: { ru: 'ДИАГОНАЛЬНАЯ ШТРИХОВКА', en: 'DIAGONAL HATCH' },
        crosshatch: { ru: 'ПЕРЕКРЕСТНАЯ СЕТКА', en: 'CROSSHATCH MESH' },
        spiral: { ru: 'СПИРАЛЬНЫЙ ВИХРЬ', en: 'SPIRAL VORTEX' },
        stippling: { ru: 'СТИППЛИНГ (ШУМОВЫЕ ТОЧКИ)', en: 'STIPPLING NOISE' },
        hexagonal: { ru: 'ГЕКСАГОНАЛЬНЫЕ СОТЫ', en: 'HEXAGONAL HONEYCOMB' },
        random: { ru: 'СЛУЧАЙНЫЙ БЕЛЫЙ ШУМ', en: 'RANDOM DITHER' }
      },
      'select-color-mode': {
        palette: { ru: 'ПАЛИТРА (4-8 ЦВЕТОВ)', en: 'PALETTE (4-8 COLORS)' },
        single: { ru: 'МОНОХРОМНЫЙ ОДИН ЦВЕТ', en: 'SINGLE MONOCHROME' },
        original: { ru: 'ИСХОДНЫЙ ЦВЕТ ПИКСЕЛЕЙ', en: 'ORIGINAL PIXEL COLOR' }
      },
      'select-image-format': {
        png: { ru: 'PNG (БЕЗ ПОТЕРЬ)', en: 'PNG (LOSSLESS)' },
        jpeg: { ru: 'JPEG (RGB 95%)', en: 'JPEG (RGB 95%)' },
        webp: { ru: 'WEBP (КОМПАКТНЫЙ)', en: 'WEBP (COMPACT)' }
      }
    };

    Object.entries(SELECT_OPTIONS_I18N).forEach(([selId, optsMap]) => {
      const select = document.getElementById(selId) as HTMLSelectElement | null;
      if (!select) return;
      Array.from(select.options).forEach(opt => {
        const item = optsMap[opt.value];
        if (item && item[lang]) {
          opt.textContent = item[lang];
        }
      });
    });
  }

  // -------------------------------------------------------------
  // GLYPH DATABASE & MANUAL INPUT MANAGEMENT
  // -------------------------------------------------------------
  initCategoryTabs() {
    const container = document.getElementById('category-tabs-container');
    if (!container) return;
    container.innerHTML = '';
    GLYPH_CATEGORIES.forEach(cat => {
      const tab = document.createElement('button');
      tab.className = `category-tab ${cat.id === this.activeCategory ? 'active' : ''}`;
      tab.textContent = this.lang === 'ru' ? cat.nameRu : cat.nameEn;
      tab.onclick = () => {
        this.activeCategory = cat.id;
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.populateGlyphSets();
      };
      container.appendChild(tab);
    });
    this.populateGlyphSets();
  }

  populateGlyphSets() {
    const list = document.getElementById('glyph-sets-list');
    if (!list) return;
    list.innerHTML = '';
    const filtered = GLYPH_SETS.filter(s => s.categoryId === this.activeCategory);

    filtered.forEach(set => {
      const card = document.createElement('div');
      card.className = `glyph-set-card ${set.id === this.activeGlyphSetId ? 'active' : ''}`;
      const setName = this.lang === 'ru' ? (set.nameRu || set.name) : (set.nameEn || set.name);
      const countSuffix = this.lang === 'ru' ? 'симв.' : 'chars';
      card.innerHTML = `
        <div class="glyph-set-header">
          <span class="glyph-set-name">${setName}</span>
          <span class="glyph-set-count">${Array.from(set.glyphs).length} ${countSuffix}</span>
        </div>
        <div class="glyph-set-preview">${set.glyphs}</div>
      `;
      card.onclick = () => {
        this.activeGlyphSetId = set.id;
        this.isManualActive = false;
        this.manualGlyphsText = set.glyphs;
        const inputEl = document.getElementById('manual-glyph-input') as HTMLInputElement;
        if (inputEl) inputEl.value = set.glyphs;

        document.querySelectorAll('.glyph-set-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.updateLiveGlyphRibbon();
        this.markDirty();
      };
      list.appendChild(card);
    });

    this.updateLiveGlyphRibbon();
  }

  updateLiveGlyphRibbon() {
    const ribbon = document.getElementById('glyph-ribbon');
    if (!ribbon) return;
    ribbon.innerHTML = '';
    const glyphs = this.getActiveGlyphArray();

    const countEl = document.getElementById('active-glyph-count');
    if (countEl) {
      countEl.textContent = `${glyphs.length} ${this.lang === 'ru' ? 'символов' : 'glyphs'}`;
    }

    glyphs.forEach((ch, idx) => {
      const cell = document.createElement('div');
      cell.className = 'glyph-ribbon-cell';
      cell.title = this.lang === 'ru' ? `Символ #${idx + 1}: "${ch}" (Клик для осмотра)` : `Glyph #${idx + 1}: "${ch}" (Click to inspect)`;
      cell.innerHTML = `
        <span class="glyph-char">${ch === ' ' ? '␣' : ch}</span>
        <span class="glyph-idx">${idx}</span>
      `;
      cell.onclick = () => this.inspectGlyph(ch, idx);
      ribbon.appendChild(cell);
    });
  }

  inspectGlyph(char: string, index: number) {
    const modal = document.getElementById('glyph-inspect-modal');
    if (!modal) return;
    const view = document.getElementById('inspect-glyph-view');
    const uni = document.getElementById('inspect-glyph-unicode');
    const name = document.getElementById('inspect-glyph-name');
    const idxEl = document.getElementById('inspect-glyph-index');

    if (view) view.textContent = char;
    if (uni) uni.textContent = `U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`;
    if (name) name.textContent = this.lang === 'ru' ? `СИМВОЛ "${char}"` : `CHAR "${char}"`;
    if (idxEl) idxEl.textContent = `#${index}`;

    modal.style.display = 'flex';
  }

  initPalettesGrid() {
    const grid = document.getElementById('palettes-grid');
    if (!grid) return;
    grid.innerHTML = '';
    MEDIEVAL_PALETTES.forEach(pal => {
      const card = document.createElement('div');
      card.className = `palette-card ${pal.id === this.paletteId ? 'active' : ''}`;
      card.setAttribute('data-palette-id', pal.id);

      let swatchesHtml = '';
      pal.colors.forEach(col => {
        swatchesHtml += `<div class="palette-swatch" style="background-color: ${col};"></div>`;
      });

      const palName = this.lang === 'ru' ? (pal.nameRu || pal.name) : (pal.nameEn || pal.name);
      card.innerHTML = `
        <div class="palette-name">${palName}</div>
        <div class="palette-strip">${swatchesHtml}</div>
      `;
      card.onclick = () => {
        this.paletteId = pal.id;
        document.querySelectorAll('.palette-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.markDirty();
      };
      grid.appendChild(card);
    });
  }

  // -------------------------------------------------------------
  // EVENT LISTENERS BINDING
  // -------------------------------------------------------------
  setupEventListeners() {
    const bindSlider = (id: string, valId: string, suffix: string | (() => string), setter: (v: number) => void) => {
      const slider = document.getElementById(id) as HTMLInputElement;
      const display = document.getElementById(valId);
      if (slider) {
        slider.oninput = () => {
          if (this.isTimelinePlaying) {
            this.stopTimelinePlayback();
          }
          const v = parseFloat(slider.value);
          setter(v);
          this.markDirty();
          if (this.isTimelineRecording) {
            this.renderAsciiFrame();
          }
          if (id === 'slider-posterize' && v === 0) {
            if (display) display.textContent = this.lang === 'ru' ? 'ВЫКЛ' : 'OFF';
            return;
          }
          const s = typeof suffix === 'function' ? suffix() : suffix;
          if (display) display.textContent = `${slider.value}${s}`;
        };
      }
    };

    // Faders
    bindSlider('slider-cell-size', 'val-cell-size', ' px', v => this.cellSize = v);
    document.querySelectorAll('.btn-quick-cell').forEach(btn => {
      (btn as HTMLElement).onclick = () => {
        const sz = parseInt(btn.getAttribute('data-size') || '9', 10);
        this.cellSize = sz;
        const slider = document.getElementById('slider-cell-size') as HTMLInputElement;
        if (slider) slider.value = String(sz);
        const valEl = document.getElementById('val-cell-size');
        if (valEl) valEl.textContent = `${sz} px`;
        this.markDirty(true);
      };
    });
    bindSlider('slider-depth', 'val-depth', () => ` ${this.lang === 'ru' ? 'ур.' : 'levels'}`, v => {
      this.depth = v;
      this.updateLiveGlyphRibbon();
    });
    bindSlider('slider-offset', 'val-offset', '', v => this.offset = v);
    bindSlider('slider-aspect', 'val-aspect', '', v => this.aspect = v);
    bindSlider('slider-contrast', 'val-contrast', '×', v => this.contrast = v);
    bindSlider('slider-brightness', 'val-brightness', '%', v => this.brightness = v);

    // New Image & Animation Sliders (Request 5)
    bindSlider('slider-sharpness', 'val-sharpness', '%', v => this.sharpness = v);
    bindSlider('slider-gamma', 'val-gamma', '', v => this.gamma = v);
    bindSlider('slider-blur', 'val-blur', ' px', v => this.blur = v);
    bindSlider('slider-posterize', 'val-posterize', () => ` ${this.lang === 'ru' ? 'ур.' : 'levels'}`, v => this.posterize = v);

    // Toggles
    const toggleInvert = document.getElementById('toggle-invert') as HTMLInputElement;
    if (toggleInvert) {
      toggleInvert.onchange = () => {
        this.invert = toggleInvert.checked;
        this.updateLiveGlyphRibbon();
        this.markDirty();
      };
    }

    const toggleLfo = document.getElementById('toggle-lfo') as HTMLInputElement;
    if (toggleLfo) {
      toggleLfo.onchange = () => {
        this.lfoEnabled = toggleLfo.checked;
        this.markDirty();
        const lfoBox = document.getElementById('lfo-controls');
        if (lfoBox) {
          lfoBox.style.opacity = this.lfoEnabled ? '1' : '0.35';
          lfoBox.style.pointerEvents = this.lfoEnabled ? 'all' : 'none';
        }
      };
    }

    const toggleTrans = document.getElementById('toggle-bg-transparent') as HTMLInputElement;
    if (toggleTrans) {
      toggleTrans.onchange = () => {
        this.bgTransparent = toggleTrans.checked;
        this.markDirty();
      };
    }

    // Scanlines Toggle
    const toggleScanlines = document.getElementById('toggle-scanlines') as HTMLInputElement;
    if (toggleScanlines) {
      toggleScanlines.onchange = () => {
        this.scanlines = toggleScanlines.checked;
        this.markDirty();
      };
    }

    // Orientation: Rotate & Flip
    const btnRotate = document.getElementById('btn-rotate-cw');
    if (btnRotate) {
      btnRotate.onclick = () => {
        this.rotation = (this.rotation + 90) % 360;
        this.markDirty(true);
        this.showToast(this.lang === 'ru' ? `Поворот растра: ${this.rotation}°` : `Raster rotated: ${this.rotation}°`);
      };
    }
    const btnFlipH = document.getElementById('btn-flip-h');
    if (btnFlipH) {
      btnFlipH.onclick = () => {
        this.flipH = !this.flipH;
        this.markDirty(true);
        this.showToast(this.lang === 'ru' ? `Отражение H: ${this.flipH ? 'ВКЛ' : 'ВЫКЛ'}` : `Horizontal flip: ${this.flipH ? 'ON' : 'OFF'}`);
      };
    }
    const btnFlipV = document.getElementById('btn-flip-v');
    if (btnFlipV) {
      btnFlipV.onclick = () => {
        this.flipV = !this.flipV;
        this.markDirty(true);
        this.showToast(this.lang === 'ru' ? `Отражение V: ${this.flipV ? 'ВКЛ' : 'ВЫКЛ'}` : `Vertical flip: ${this.flipV ? 'ON' : 'OFF'}`);
      };
    }

    // Selects
    const selDither = document.getElementById('select-dither-algo') as HTMLSelectElement;
    if (selDither) {
      selDither.onchange = () => {
        this.ditherAlgo = selDither.value;
        this.markDirty();
      };
    }

    const selColorMode = document.getElementById('select-color-mode') as HTMLSelectElement;
    if (selColorMode) {
      selColorMode.onchange = () => {
        this.colorMode = selColorMode.value;
        this.markDirty();
        const singleBox = document.getElementById('single-color-box');
        const palBox = document.getElementById('palette-selection-box');
        if (singleBox && palBox) {
          singleBox.style.display = this.colorMode === 'single' ? 'flex' : 'none';
          palBox.style.display = this.colorMode === 'palette' ? 'flex' : 'none';
        }
      };
    }

    const selLfoTarget = document.getElementById('select-lfo-target') as HTMLSelectElement;
    if (selLfoTarget) {
      selLfoTarget.onchange = () => {
        this.lfoTarget = selLfoTarget.value;
        this.markDirty();
      };
    }

    const selLfoWave = document.getElementById('select-lfo-waveform') as HTMLSelectElement;
    if (selLfoWave) {
      selLfoWave.onchange = () => {
        this.lfoWaveform = selLfoWave.value;
        this.markDirty();
      };
    }

    bindSlider('slider-lfo-speed', 'val-lfo-speed', ' CYC/S', v => this.lfoSpeed = v);
    bindSlider('slider-lfo-depth', 'val-lfo-depth', '%', v => this.lfoDepth = v);

    // LFO 2 Modulation Chain Controls
    const toggleLfo2 = document.getElementById('toggle-lfo2') as HTMLInputElement;
    if (toggleLfo2) {
      toggleLfo2.onchange = () => {
        this.lfo2Enabled = toggleLfo2.checked;
        this.markDirty();
        const lfo2Box = document.getElementById('lfo2-controls');
        if (lfo2Box) {
          lfo2Box.style.opacity = this.lfo2Enabled ? '1' : '0.35';
          lfo2Box.style.pointerEvents = this.lfo2Enabled ? 'all' : 'none';
        }
      };
    }

    const selLfo2Mode = document.getElementById('select-lfo2-mode') as HTMLSelectElement;
    if (selLfo2Mode) {
      selLfo2Mode.onchange = () => {
        this.lfo2Mode = selLfo2Mode.value as any;
        const targetRow = document.getElementById('lfo2-target-row');
        if (targetRow) {
          targetRow.style.display = this.lfo2Mode === 'cross_target' ? 'flex' : 'none';
        }
        this.markDirty();
      };
    }

    const selLfo2Wave = document.getElementById('select-lfo2-waveform') as HTMLSelectElement;
    if (selLfo2Wave) {
      selLfo2Wave.onchange = () => {
        this.lfo2Waveform = selLfo2Wave.value;
        this.markDirty();
      };
    }

    const selLfo2Target = document.getElementById('select-lfo2-target') as HTMLSelectElement;
    if (selLfo2Target) {
      selLfo2Target.onchange = () => {
        this.lfo2Target = selLfo2Target.value;
        this.markDirty();
      };
    }

    bindSlider('slider-lfo2-speed', 'val-lfo2-speed', ' CYC/S', v => this.lfo2Speed = v);
    bindSlider('slider-lfo2-depth', 'val-lfo2-depth', '%', v => this.lfo2Depth = v);

    // Deep Color Grading Sliders
    bindSlider('slider-temp', 'val-temp', '', v => this.temperature = v);
    bindSlider('slider-tint', 'val-tint', '', v => this.tint = v);
    bindSlider('slider-sat', 'val-sat', '%', v => this.saturation = v);
    bindSlider('slider-hue-rot', 'val-hue-rot', '°', v => this.hueRotate = v);
    bindSlider('slider-lift-level', 'val-lift-level', '%', v => this.liftLevel = v);
    bindSlider('slider-gamma-level', 'val-gamma-level', '%', v => this.gammaLevel = v);
    bindSlider('slider-gain-level', 'val-gain-level', '%', v => this.gainLevel = v);

    // Image Fit Mode Selector
    const selFit = document.getElementById('select-fit-mode') as HTMLSelectElement;
    if (selFit) {
      selFit.onchange = () => {
        this.fitMode = selFit.value as any;
        this.markDirty(true);
      };
    }

    // Color Pickers
    const pickSingle = document.getElementById('picker-single-color') as HTMLInputElement;
    const hexSingle = document.getElementById('hex-single-color') as HTMLInputElement;
    if (pickSingle && hexSingle) {
      pickSingle.oninput = () => {
        this.singleColor = pickSingle.value;
        hexSingle.value = pickSingle.value;
        this.markDirty();
      };
      hexSingle.oninput = () => {
        this.singleColor = hexSingle.value;
        pickSingle.value = hexSingle.value;
        this.markDirty();
      };
    }

    const pickBg = document.getElementById('picker-bg-color') as HTMLInputElement;
    const hexBg = document.getElementById('hex-bg-color') as HTMLInputElement;
    if (pickBg && hexBg) {
      pickBg.oninput = () => {
        this.bgColor = pickBg.value;
        hexBg.value = pickBg.value;
        this.markDirty();
      };
      hexBg.oninput = () => {
        this.bgColor = hexBg.value;
        pickBg.value = hexBg.value;
        this.markDirty();
      };
    }

    // CRT Header Upload Button
    const btnCrtUpload = document.getElementById('btn-crt-upload');
    if (btnCrtUpload) {
      btnCrtUpload.onclick = () => {
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.click();
      };
    }

    // Animation Timeline & Live REC Controls
    const btnTimelineRec = document.getElementById('btn-timeline-rec');
    if (btnTimelineRec) {
      btnTimelineRec.onclick = () => {
        if (this.isTimelineRecording) {
          this.stopTimelineRecording();
        } else {
          this.startTimelineRecording();
        }
      };
    }

    const btnTimelinePlay = document.getElementById('btn-timeline-play');
    if (btnTimelinePlay) {
      btnTimelinePlay.onclick = () => {
        if (this.isTimelinePlaying) {
          this.stopTimelinePlayback();
        } else {
          this.startTimelinePlayback();
        }
      };
    }

    const btnTimelineStart = document.getElementById('btn-timeline-start');
    if (btnTimelineStart) {
      btnTimelineStart.onclick = () => {
        this.seekTimeline(0);
      };
    }

    const btnTimelinePrev = document.getElementById('btn-timeline-prev');
    if (btnTimelinePrev) {
      btnTimelinePrev.onclick = () => {
        this.seekTimeline(this.timelineCurrentIndex - 1);
      };
    }

    const btnTimelineNext = document.getElementById('btn-timeline-next');
    if (btnTimelineNext) {
      btnTimelineNext.onclick = () => {
        this.seekTimeline(this.timelineCurrentIndex + 1);
      };
    }

    const btnTimelineEnd = document.getElementById('btn-timeline-end');
    if (btnTimelineEnd) {
      btnTimelineEnd.onclick = () => {
        this.seekTimeline(this.timelineFrames.length - 1);
      };
    }

    const scrubber = document.getElementById('timeline-scrubber') as HTMLInputElement;
    if (scrubber) {
      scrubber.oninput = () => {
        this.isTimelineScrubbing = true;
        this.seekTimeline(parseInt(scrubber.value) || 0);
      };
      scrubber.onchange = () => {
        this.isTimelineScrubbing = false;
      };
    }

    const selectTimelineFps = document.getElementById('select-timeline-fps') as HTMLSelectElement;
    if (selectTimelineFps) {
      selectTimelineFps.onchange = () => {
        this.timelineFps = parseInt(selectTimelineFps.value) || 25;
        this.updateTimelineUI();
        this.drawTimelineTrack();
      };
    }

    const toggleTimelineLoop = document.getElementById('toggle-timeline-loop') as HTMLInputElement;
    if (toggleTimelineLoop) {
      toggleTimelineLoop.onchange = () => {
        this.timelineLoop = toggleTimelineLoop.checked;
      };
    }

    const btnTimelineClear = document.getElementById('btn-timeline-clear');
    if (btnTimelineClear) {
      btnTimelineClear.onclick = () => {
        this.clearTimeline();
      };
    }

    const btnTimelineExportGif = document.getElementById('btn-timeline-export-gif');
    if (btnTimelineExportGif) {
      btnTimelineExportGif.onclick = () => {
        this.exportTimelineGif();
      };
    }

    const btnTimelineExportWebm = document.getElementById('btn-timeline-export-webm');
    if (btnTimelineExportWebm) {
      btnTimelineExportWebm.onclick = () => {
        this.exportTimelineWebm();
      };
    }

    // Animation & Playback Controls in Rack
    const btnPlayPause = document.getElementById('btn-play-pause');
    if (btnPlayPause) {
      btnPlayPause.onclick = () => {
        this.gifIsPlaying = !this.gifIsPlaying;
        this.markDirty();
        const playIcon = document.getElementById('play-icon');
        const pauseIcon = document.getElementById('pause-icon');
        if (playIcon && pauseIcon) {
          playIcon.style.display = this.gifIsPlaying ? 'none' : 'block';
          pauseIcon.style.display = this.gifIsPlaying ? 'block' : 'none';
        }
      };
    }

    const btnLoop = document.getElementById('btn-loop-video');
    if (btnLoop) {
      btnLoop.onclick = () => {
        this.isLooping = !this.isLooping;
        btnLoop.classList.toggle('active', this.isLooping);
        this.showToast(this.lang === 'ru' ? `Повтор: ${this.isLooping ? 'ВКЛ' : 'ВЫКЛ'}` : `Loop: ${this.isLooping ? 'ON' : 'OFF'}`);
      };
    }

    const selSpeed = document.getElementById('select-playback-speed') as HTMLSelectElement;
    if (selSpeed) {
      selSpeed.onchange = () => {
        this.playbackSpeed = parseFloat(selSpeed.value);
        this.showToast(this.lang === 'ru' ? `Скорость воспроизведения: ${this.playbackSpeed}×` : `Playback speed: ${this.playbackSpeed}×`);
      };
    }

    const btnStepPrev = document.getElementById('btn-step-prev');
    if (btnStepPrev) {
      btnStepPrev.onclick = () => {
        if (this.mediaType === 'gif' && this.gifFrames.length > 0) {
          this.gifCurrentFrameIndex = (this.gifCurrentFrameIndex - 1 + this.gifFrames.length) % this.gifFrames.length;
          this.sourceDirty = true;
          this.isDirty = true;
          this.updateTimecode();
        }
      };
    }

    const btnStepNext = document.getElementById('btn-step-next');
    if (btnStepNext) {
      btnStepNext.onclick = () => {
        if (this.mediaType === 'gif' && this.gifFrames.length > 0) {
          this.gifCurrentFrameIndex = (this.gifCurrentFrameIndex + 1) % this.gifFrames.length;
          this.sourceDirty = true;
          this.isDirty = true;
          this.updateTimecode();
        }
      };
    }

    const btnQuickGif = document.getElementById('btn-quick-gif');
    if (btnQuickGif) btnQuickGif.onclick = () => this.captureAndSaveGif();

    // Zoom & Grid Controls
    const btnZoomIn = document.getElementById('btn-zoom-in');
    if (btnZoomIn) {
      btnZoomIn.onclick = () => {
        this.zoom = Math.min(5.0, +(this.zoom + 0.25).toFixed(2));
        this.updateCanvasTransform();
      };
    }

    const btnZoomOut = document.getElementById('btn-zoom-out');
    if (btnZoomOut) {
      btnZoomOut.onclick = () => {
        this.zoom = Math.max(0.4, +(this.zoom - 0.25).toFixed(2));
        if (this.zoom <= 1.0) {
          this.panX = 0;
          this.panY = 0;
        }
        this.updateCanvasTransform();
      };
    }

    const btnZoomReset = document.getElementById('btn-zoom-reset');
    if (btnZoomReset) {
      btnZoomReset.onclick = () => {
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.updateCanvasTransform();
      };
    }

    const btnGrid = document.getElementById('btn-toggle-grid');
    if (btnGrid) {
      btnGrid.onclick = () => {
        this.showGrid = !this.showGrid;
        btnGrid.classList.toggle('active', this.showGrid);
        this.markDirty();
      };
    }

    // Interactive Viewport Pan & Wheel Zoom on CRT Screen
    const crtContainer = document.getElementById('canvas-container');
    if (crtContainer) {
      crtContainer.addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        this.zoom = Math.min(5.0, Math.max(0.4, +(this.zoom + delta).toFixed(2)));
        if (this.zoom <= 1.0) {
          this.panX = 0;
          this.panY = 0;
        }
        this.updateCanvasTransform();
      }, { passive: false });

      crtContainer.addEventListener('mousedown', (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest('.crt-bezel-controls') || (e.target as HTMLElement).closest('#drop-zone-overlay')) return;
        if (e.button === 0) {
          this.isPanning = true;
          this.startX = e.clientX - this.panX;
          this.startY = e.clientY - this.panY;
          this.updateCanvasTransform();
        }
      });

      window.addEventListener('mousemove', (e: MouseEvent) => {
        if (!this.isPanning) return;
        this.panX = Math.round(e.clientX - this.startX);
        this.panY = Math.round(e.clientY - this.startY);
        this.updateCanvasTransform();
      });

      window.addEventListener('mouseup', () => {
        if (this.isPanning) {
          this.isPanning = false;
          this.updateCanvasTransform();
        }
      });

      crtContainer.addEventListener('dblclick', (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest('.crt-bezel-controls') || (e.target as HTMLElement).closest('#drop-zone-overlay')) return;
        if (this.zoom === 1.0) {
          this.zoom = 2.0;
        } else {
          this.zoom = 1.0;
          this.panX = 0;
          this.panY = 0;
        }
        this.updateCanvasTransform();
      });
    }

    // Top Header & Rack Buttons
    const btnTheme = document.getElementById('btn-toggle-theme');
    if (btnTheme) btnTheme.onclick = () => this.applyTheme(this.theme === 'light' ? 'dark' : 'light');

    const handleResetAction = () => {
      this.sourceImage = null;
      this.gifFrames = [];
      this.mediaType = 'none';
      this.resetAllSettings(false);
      const dropOverlay = document.getElementById('drop-zone-overlay');
      if (dropOverlay) dropOverlay.classList.remove('hidden');
      this.markDirty(true);
      this.showToast(this.lang === 'ru' ? 'Все настройки сброшены к исходным значениям' : 'All settings reset to defaults');
    };

    const btnResetAll = document.getElementById('btn-reset-all-settings');
    if (btnResetAll) btnResetAll.onclick = handleResetAction;

    const btnResetRack = document.getElementById('btn-reset-rack');
    if (btnResetRack) btnResetRack.onclick = handleResetAction;

    const btnLang = document.getElementById('btn-toggle-lang');
    if (btnLang) btnLang.onclick = () => this.setLanguage(this.lang === 'ru' ? 'en' : 'ru');

    const btnDownApp = document.getElementById('btn-download-app');
    if (btnDownApp) btnDownApp.onclick = () => this.downloadStandaloneHtml();

    const btnOpenExport = document.getElementById('btn-open-export');
    if (btnOpenExport) btnOpenExport.onclick = () => this.openExportModal();

    // Welcome / Entry Menu Window Handlers
    const btnOpenWelcome = document.getElementById('btn-open-welcome-menu');
    if (btnOpenWelcome) btnOpenWelcome.onclick = () => this.openWelcomeMenu();

    const btnCloseWelcome = document.getElementById('btn-close-welcome');
    if (btnCloseWelcome) btnCloseWelcome.onclick = () => this.closeWelcomeMenu();

    // File Ingest Trigger
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    const btnUpload = document.getElementById('btn-upload-file');
    if (btnUpload && fileInput) btnUpload.onclick = () => fileInput.click();

    const btnWelcomeUpload = document.getElementById('btn-welcome-upload');
    if (btnWelcomeUpload && fileInput) {
      btnWelcomeUpload.onclick = (e) => {
        e.stopPropagation();
        fileInput.click();
      };
    }

    const welcomeDropBox = document.getElementById('welcome-drop-box');
    if (welcomeDropBox) {
      welcomeDropBox.ondragover = (e) => {
        e.preventDefault();
        welcomeDropBox.classList.add('drag-over');
      };
      welcomeDropBox.ondragleave = (e) => {
        e.preventDefault();
        welcomeDropBox.classList.remove('drag-over');
      };
      welcomeDropBox.ondrop = (e) => {
        e.preventDefault();
        welcomeDropBox.classList.remove('drag-over');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleFileIngest(e.dataTransfer.files[0]);
          this.closeWelcomeMenu();
        }
      };
      welcomeDropBox.onclick = (e) => {
        if ((e.target as HTMLElement).closest('#btn-welcome-upload')) return;
        if (fileInput) fileInput.click();
      };
    }

    if (fileInput) {
      fileInput.onchange = (e: any) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          this.handleFileIngest(file);
          this.closeWelcomeMenu();
        }
      };
    }

    // Drag and Drop & Screen Click Ingest
    const dropOverlay = document.getElementById('drop-zone-overlay');
    if (dropOverlay && fileInput) {
      dropOverlay.onclick = (e) => {
        if ((e.target as HTMLElement).closest('button, select, input')) return;
        fileInput.click();
      };
    }

    const dropArea = document.getElementById('canvas-container');
    if (dropArea) {
      dropArea.ondragover = e => {
        e.preventDefault();
        if (dropOverlay) dropOverlay.classList.remove('hidden');
      };
      dropArea.ondragleave = e => {
        e.preventDefault();
        if (dropOverlay && this.mediaType !== 'none') dropOverlay.classList.add('hidden');
      };
      dropArea.ondrop = e => {
        e.preventDefault();
        if (dropOverlay && this.mediaType !== 'none') dropOverlay.classList.add('hidden');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleFileIngest(e.dataTransfer.files[0]);
        }
      };
    }

    // Export Studio Modal Buttons
    const btnCloseExport = document.getElementById('btn-close-export');
    const btnDismissExport = document.getElementById('btn-dismiss-export');
    if (btnCloseExport) btnCloseExport.onclick = () => this.closeExportModal();
    if (btnDismissExport) btnDismissExport.onclick = () => this.closeExportModal();

    const btnExportGif = document.getElementById('btn-modal-export-gif');
    if (btnExportGif) btnExportGif.onclick = () => this.captureAndSaveGif();

    const btnExportImg = document.getElementById('btn-export-image');
    if (btnExportImg) {
      btnExportImg.onclick = () => {
        const formatSel = document.getElementById('select-image-format') as HTMLSelectElement;
        const fmt = formatSel ? formatSel.value : 'png';
        this.exportImage(fmt as 'png' | 'jpeg');
      };
    }

    const btnExportVideo = document.getElementById('btn-record-video');
    if (btnExportVideo) btnExportVideo.onclick = () => this.exportVideoWebm();

    // Save Preset Modal
    const btnOpenSavePreset = document.getElementById('btn-save-preset-dialog');
    const btnCloseSavePreset = document.getElementById('btn-close-save-preset');
    const btnCancelPreset = document.getElementById('btn-cancel-preset');
    const btnConfirmSavePreset = document.getElementById('btn-confirm-save-preset');
    const presetModal = document.getElementById('save-preset-modal');

    if (btnOpenSavePreset && presetModal) btnOpenSavePreset.onclick = () => presetModal.style.display = 'flex';
    if (btnCloseSavePreset && presetModal) btnCloseSavePreset.onclick = () => presetModal.style.display = 'none';
    if (btnCancelPreset && presetModal) btnCancelPreset.onclick = () => presetModal.style.display = 'none';

    if (btnConfirmSavePreset && presetModal) {
      btnConfirmSavePreset.onclick = () => {
        const inputName = document.getElementById('input-preset-name') as HTMLInputElement;
        const name = inputName && inputName.value.trim() ? inputName.value.trim() : 'CUSTOM PRESET';
        const newPreset: MasterPreset = {
          id: 'custom_' + Date.now(),
          name,
          glyphSetId: this.activeGlyphSetId,
          cellSize: this.cellSize,
          depth: this.depth,
          offset: this.offset,
          aspect: this.aspect,
          invert: this.invert,
          ditherAlgo: this.ditherAlgo,
          contrast: this.contrast,
          brightness: this.brightness,
          sharpness: this.sharpness,
          gamma: this.gamma,
          blur: this.blur,
          posterize: this.posterize,
          colorMode: this.colorMode,
          paletteId: this.paletteId,
          singleColor: this.singleColor,
          bgTransparent: this.bgTransparent,
          bgColor: this.bgColor,
          lfoEnabled: this.lfoEnabled,
          lfoTarget: this.lfoTarget,
          lfoWaveform: this.lfoWaveform,
          lfoSpeed: this.lfoSpeed,
          lfoDepth: this.lfoDepth
        };
        MASTER_PRESETS.unshift(newPreset);
        this.initPresetsSelector();
        presetModal.style.display = 'none';
        this.showToast((this.lang === 'ru' ? 'Предустановка сохранена: ' : 'Preset saved: ') + name);
      };
    }

    // Glyph Inspector Modal Close
    const btnCloseInspect = document.getElementById('btn-close-inspect');
    const btnDismissInspect = document.getElementById('btn-dismiss-inspect');
    const inspectModal = document.getElementById('glyph-inspect-modal');
    if (btnCloseInspect && inspectModal) btnCloseInspect.onclick = () => inspectModal.style.display = 'none';
    if (btnDismissInspect && inspectModal) btnDismissInspect.onclick = () => inspectModal.style.display = 'none';

    const btnCopyInspect = document.getElementById('btn-copy-single-glyph');
    if (btnCopyInspect) {
      btnCopyInspect.onclick = () => {
        const view = document.getElementById('inspect-glyph-view');
        if (view && view.textContent) {
          navigator.clipboard.writeText(view.textContent).then(() => {
            this.showToast(this.lang === 'ru' ? 'Символ скопирован!' : 'Glyph copied!');
          });
        }
      };
    }

    // =============================================================
    // 7 STUDIO SECTIONS & SETTINGS MODAL EVENT LISTENERS
    // =============================================================
    const btnOpenSettings = document.getElementById('btn-open-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const btnDismissSettings = document.getElementById('btn-dismiss-settings');
    const settingsModal = document.getElementById('settings-modal');

    const openSettings = () => {
      if (settingsModal) {
        settingsModal.style.display = 'flex';
        this.syncControlsToState();
      }
    };
    const closeSettings = () => {
      if (settingsModal) settingsModal.style.display = 'none';
    };

    if (btnOpenSettings) btnOpenSettings.onclick = openSettings;
    if (btnCloseSettings) btnCloseSettings.onclick = closeSettings;
    if (btnDismissSettings) btnDismissSettings.onclick = closeSettings;
    if (settingsModal) {
      settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeSettings();
      });
    }

    // Settings Navigation Tabs
    const tabButtons = document.querySelectorAll('.settings-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const targetTab = btn.getAttribute('data-tab');
        document.querySelectorAll('.settings-section-view').forEach(view => {
          if (view.id === targetTab) view.classList.add('active');
          else view.classList.remove('active');
        });
      });
    });

    // Preset Pill Buttons in each section
    document.querySelectorAll('.preset-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.getAttribute('data-preset') || btn.getAttribute('data-preset-id');
        if (pid) {
          this.applyPreset(pid);
        }
      });
    });

    // Reset Section Button in Settings Modal
    const btnResetSection = document.getElementById('btn-settings-reset-section');
    if (btnResetSection) {
      btnResetSection.onclick = () => {
        const activeTab = document.querySelector('.settings-tab-btn.active');
        const tabId = activeTab ? activeTab.getAttribute('data-tab') : '';
        if (tabId === 'tab-shadr') {
          this.shadrActive = false;
          this.shadrSineSpeed = 1.0;
          this.shadrFreq = 2.0;
          this.shadrFeedback = 0;
          this.shadrWaveType = 'harmonic';
        } else if (tabId === 'tab-aikizi') {
          this.aikiziActive = false;
          this.aikiziNoiseScale = 12;
          this.aikiziEvolution = 1.0;
          this.aikiziNoiseType = 'perlin';
          this.aikiziIntensity = 40;
        } else if (tabId === 'tab-glitch') {
          this.glitchActive = false;
          this.glitchDatamosh = 0;
          this.glitchScanCorruption = 0;
          this.glitchRgbShift = 0;
        } else if (tabId === 'tab-dither') {
          this.ditherAlgo = 'bayer4';
          this.paletteId = 'phosphor_matrix';
          this.cellSize = 9;
          this.contrast = 1.25;
          this.brightness = 0;
        } else if (tabId === 'tab-neue') {
          this.customInjectionActive = false;
          this.customInjectionText = '';
          this.typoScale = 0;
          this.jitter = 0;
        } else if (tabId === 'tab-moduly') {
          this.lfoEnabled = false;
          this.lfoSpeed = 1.0;
          this.lfoDepth = 25;
          this.lfoBindCellSize = false;
          this.lfoBindDatamosh = false;
          this.lfoBindScanCorruption = false;
          this.lfoBindRgbShift = false;
          this.lfoBindNoiseScale = false;
          this.lfoBindTypoScale = false;
          this.lfoBindJitter = false;
          this.lfoBindSineSpeed = false;
          this.lfoBindBrightness = false;
        } else if (tabId === 'tab-abstract') {
          this.abstractActive = false;
          this.abstractWarpSwirl = 0;
          this.abstractKaleidoscope = 0;
          this.abstractRecursiveEcho = 0;
          this.abstractPixelSort = 0;
          this.abstractSpectrumDrift = 0;
        }
        this.syncControlsToState();
        this.markDirty(true);
        this.showToast(this.lang === 'ru' ? 'Секция сброшена' : 'Section reset');
      };
    }

    // SECTION 1: SHADR STUDIO
    const toggleShadr = document.getElementById('toggle-shadr-active') as HTMLInputElement;
    if (toggleShadr) {
      toggleShadr.onchange = () => {
        this.shadrActive = toggleShadr.checked;
        this.markDirty(true);
      };
    }
    bindSlider('slider-shadr-speed', 'val-shadr-speed', '×', v => this.shadrSineSpeed = v);
    bindSlider('slider-shadr-freq', 'val-shadr-freq', '', v => this.shadrFreq = v);
    bindSlider('slider-shadr-feedback', 'val-shadr-feedback', '%', v => this.shadrFeedback = v);

    const selShadrWave = document.getElementById('select-shadr-wave') as HTMLSelectElement;
    if (selShadrWave) {
      selShadrWave.onchange = () => {
        this.shadrWaveType = selShadrWave.value as any;
        this.markDirty(true);
      };
    }

    const btnSettingsUpload = document.getElementById('btn-settings-upload-file');
    if (btnSettingsUpload && fileInput) {
      btnSettingsUpload.onclick = () => fileInput.click();
    }
    const btnSettingsDemo = document.getElementById('btn-settings-demo-file');
    if (btnSettingsDemo) {
      btnSettingsDemo.onclick = () => {
        this.shadrActive = false;
        this.mediaType = 'demo';
        this.syncControlsToState();
        this.markDirty(true);
        this.showToast(this.lang === 'ru' ? 'Переключено на демо-сигнал' : 'Switched to demo signal');
      };
    }

    // SECTION 2: AIKIZI LAB
    const toggleAikizi = document.getElementById('toggle-aikizi-active') as HTMLInputElement;
    if (toggleAikizi) {
      toggleAikizi.onchange = () => {
        this.aikiziActive = toggleAikizi.checked;
        this.markDirty();
      };
    }
    const selAikiziType = document.getElementById('select-aikizi-type') as HTMLSelectElement;
    if (selAikiziType) {
      selAikiziType.onchange = () => {
        this.aikiziNoiseType = selAikiziType.value as any;
        this.markDirty();
      };
    }
    bindSlider('slider-aikizi-scale', 'val-aikizi-scale', ' px', v => this.aikiziNoiseScale = v);
    bindSlider('slider-aikizi-evolution', 'val-aikizi-evolution', '×', v => this.aikiziEvolution = v);
    bindSlider('slider-aikizi-intensity', 'val-aikizi-intensity', '%', v => this.aikiziIntensity = v);

    // SECTION 3: GLCHLAB
    const toggleGlitch = document.getElementById('toggle-glitch-active') as HTMLInputElement;
    if (toggleGlitch) {
      toggleGlitch.onchange = () => {
        this.glitchActive = toggleGlitch.checked;
        this.markDirty();
      };
    }
    bindSlider('slider-glitch-datamosh', 'val-glitch-datamosh', '%', v => this.glitchDatamosh = v);
    bindSlider('slider-glitch-scan', 'val-glitch-scan', '%', v => this.glitchScanCorruption = v);
    bindSlider('slider-glitch-rgb', 'val-glitch-rgb', ' px', v => this.glitchRgbShift = v);

    // SECTION 4: DITHER-BOY
    const selDitherSettings = document.getElementById('select-dither-algo-settings') as HTMLSelectElement;
    if (selDitherSettings) {
      selDitherSettings.onchange = () => {
        this.ditherAlgo = selDitherSettings.value;
        const mainSel = document.getElementById('select-dither-algo') as HTMLSelectElement;
        if (mainSel) mainSel.value = this.ditherAlgo;
        this.markDirty();
      };
    }
    const selPaletteSettings = document.getElementById('select-palette-settings') as HTMLSelectElement;
    if (selPaletteSettings) {
      selPaletteSettings.onchange = () => {
        this.paletteId = selPaletteSettings.value;
        this.colorMode = 'palette';
        const colorModeSel = document.getElementById('select-color-mode') as HTMLSelectElement;
        if (colorModeSel) colorModeSel.value = 'palette';
        this.syncControlsToState();
        this.markDirty();
      };
    }
    bindSlider('slider-cell-settings', 'val-cell-settings', ' px', v => {
      this.cellSize = v;
      const s = document.getElementById('slider-cell-size') as HTMLInputElement;
      if (s) s.value = v.toString();
      const txt = document.getElementById('val-cell-size');
      if (txt) txt.textContent = `${v} px`;
    });
    bindSlider('slider-bright-settings', 'val-bright-settings', '%', v => {
      this.brightness = v;
      const s = document.getElementById('slider-brightness') as HTMLInputElement;
      if (s) s.value = v.toString();
      const txt = document.getElementById('val-brightness');
      if (txt) txt.textContent = `${v}%`;
    });
    bindSlider('slider-contrast-settings', 'val-contrast-settings', '×', v => {
      this.contrast = v;
      const s = document.getElementById('slider-contrast') as HTMLInputElement;
      if (s) s.value = v.toString();
      const txt = document.getElementById('val-contrast');
      if (txt) txt.textContent = `${v}×`;
    });

    // SECTION 5: MAKE NEUE WORLD (Custom Injection & Knobs)
    const inputInjection = document.getElementById('input-custom-injection') as HTMLInputElement;
    const btnApplyInjection = document.getElementById('btn-apply-injection');
    const btnClearInjection = document.getElementById('btn-clear-injection');
    const injCountEl = document.getElementById('injection-char-count');

    if (inputInjection) {
      inputInjection.oninput = () => {
        if (injCountEl) injCountEl.textContent = `${inputInjection.value.length} / 10 символов`;
      };
    }
    if (btnApplyInjection && inputInjection) {
      btnApplyInjection.onclick = () => {
        const txt = inputInjection.value.trim().slice(0, 10);
        if (txt.length > 0) {
          this.customInjectionActive = true;
          this.customInjectionText = txt;
          this.updateLiveGlyphRibbon();
          this.markDirty(true);
          this.showToast(this.lang === 'ru' ? `Инжект символов применен: "${txt}"` : `Custom injection applied: "${txt}"`);
        }
      };
    }
    if (btnClearInjection && inputInjection) {
      btnClearInjection.onclick = () => {
        inputInjection.value = '';
        this.customInjectionActive = false;
        this.customInjectionText = '';
        if (injCountEl) injCountEl.textContent = `0 / 10 символов`;
        this.updateLiveGlyphRibbon();
        this.markDirty(true);
        this.showToast(this.lang === 'ru' ? 'Пользовательский инжект очищен' : 'Custom injection cleared');
      };
    }

    bindSlider('slider-depth-settings', 'val-depth-settings', () => ` ${this.lang === 'ru' ? 'ур.' : 'levels'}`, v => {
      this.depth = v;
      const s = document.getElementById('slider-depth') as HTMLInputElement;
      if (s) s.value = v.toString();
      const txt = document.getElementById('val-depth');
      if (txt) txt.textContent = `${v} ${this.lang === 'ru' ? 'ур.' : 'levels'}`;
      this.updateLiveGlyphRibbon();
    });
    bindSlider('slider-offset-settings', 'val-offset-settings', '', v => {
      this.offset = v;
      const s = document.getElementById('slider-offset') as HTMLInputElement;
      if (s) s.value = v.toString();
      const txt = document.getElementById('val-offset');
      if (txt) txt.textContent = `${v}`;
    });
    bindSlider('slider-typo-scale', 'val-typo-scale', '%', v => this.typoScale = v);
    bindSlider('slider-jitter', 'val-jitter', ' px', v => this.jitter = v);

    // SECTION 6: MODULY (Automation Toggles & Knobs)
    const toggleLfoSettings = document.getElementById('toggle-lfo-settings') as HTMLInputElement;
    if (toggleLfoSettings) {
      toggleLfoSettings.onchange = () => {
        this.lfoEnabled = toggleLfoSettings.checked;
        const mainToggle = document.getElementById('toggle-lfo') as HTMLInputElement;
        if (mainToggle) mainToggle.checked = this.lfoEnabled;
        this.markDirty();
      };
    }
    bindSlider('slider-lfo-rate-settings', 'val-lfo-rate-settings', ' CYC/S', v => {
      this.lfoSpeed = v;
      const s = document.getElementById('slider-lfo-speed') as HTMLInputElement;
      if (s) s.value = v.toString();
      const txt = document.getElementById('val-lfo-speed');
      if (txt) txt.textContent = `${v.toFixed(1)} CYC/S`;
    });
    bindSlider('slider-lfo-depth-settings', 'val-lfo-depth-settings', '%', v => {
      this.lfoDepth = v;
      const s = document.getElementById('slider-lfo-depth') as HTMLInputElement;
      if (s) s.value = v.toString();
      const txt = document.getElementById('val-lfo-depth');
      if (txt) txt.textContent = `${v}%`;
    });
    const selLfoWaveSettings = document.getElementById('select-lfo-wave-settings') as HTMLSelectElement;
    if (selLfoWaveSettings) {
      selLfoWaveSettings.onchange = () => {
        this.lfoWaveform = selLfoWaveSettings.value;
        const mainSel = document.getElementById('select-lfo-waveform') as HTMLSelectElement;
        if (mainSel) mainSel.value = this.lfoWaveform;
        this.markDirty();
      };
    }

    const bindToggleFlag = (id: string, setter: (val: boolean) => void) => {
      const el = document.getElementById(id) as HTMLInputElement;
      if (el) {
        el.onchange = () => {
          setter(el.checked);
          this.markDirty();
        };
      }
    };
    bindToggleFlag('toggle-bind-cell', v => this.lfoBindCellSize = v);
    bindToggleFlag('toggle-bind-datamosh', v => this.lfoBindDatamosh = v);
    bindToggleFlag('toggle-bind-scan', v => this.lfoBindScanCorruption = v);
    bindToggleFlag('toggle-bind-rgb', v => this.lfoBindRgbShift = v);
    bindToggleFlag('toggle-bind-noise', v => this.lfoBindNoiseScale = v);
    bindToggleFlag('toggle-bind-typo', v => this.lfoBindTypoScale = v);
    bindToggleFlag('toggle-bind-jitter', v => this.lfoBindJitter = v);
    bindToggleFlag('toggle-bind-speed', v => this.lfoBindSineSpeed = v);
    bindToggleFlag('toggle-bind-bright', v => this.lfoBindBrightness = v);

    // SECTION 7: ABSTRACT STUDIO
    const toggleAbstract = document.getElementById('toggle-abstract-active') as HTMLInputElement;
    if (toggleAbstract) {
      toggleAbstract.onchange = () => {
        this.abstractActive = toggleAbstract.checked;
        this.markDirty();
      };
    }
    bindSlider('slider-abstract-warp', 'val-abstract-warp', '%', v => this.abstractWarpSwirl = v);
    bindSlider('slider-abstract-kaleido', 'val-abstract-kaleido', () => {
      const el = document.getElementById('slider-abstract-kaleido') as HTMLInputElement;
      const v = el ? parseInt(el.value) || 0 : 0;
      return v === 0 ? '' : 'X';
    }, v => {
      this.abstractKaleidoscope = v;
      const display = document.getElementById('val-abstract-kaleido');
      if (display) display.textContent = v === 0 ? 'ВЫКЛ' : `${v}X`;
    });
    bindSlider('slider-abstract-echo', 'val-abstract-echo', '%', v => this.abstractRecursiveEcho = v);
    bindSlider('slider-abstract-sort', 'val-abstract-sort', '%', v => this.abstractPixelSort = v);
    bindSlider('slider-abstract-drift', 'val-abstract-drift', '%', v => this.abstractSpectrumDrift = v);

    // -----------------------------------------------------------
    // LAYER MANAGEMENT & COMPOSITING STACK LISTENERS
    // -----------------------------------------------------------
    const btnAddLayer = document.getElementById('btn-add-layer');
    const layerFileInput = document.getElementById('layer-file-input') as HTMLInputElement;
    if (btnAddLayer && layerFileInput) {
      btnAddLayer.onclick = () => {
        layerFileInput.click();
      };
    }
    if (layerFileInput) {
      layerFileInput.onchange = async () => {
        if (layerFileInput.files && layerFileInput.files[0]) {
          await this.addNewLayerFromFile(layerFileInput.files[0]);
          layerFileInput.value = '';
        }
      };
    }

    const btnDupLayer = document.getElementById('btn-duplicate-layer');
    if (btnDupLayer) {
      btnDupLayer.onclick = () => this.duplicateLayer(this.activeLayerId);
    }

    const btnDelLayer = document.getElementById('btn-delete-layer');
    if (btnDelLayer) {
      btnDelLayer.onclick = () => this.deleteLayer(this.activeLayerId);
    }

    const btnMoveUp = document.getElementById('btn-move-layer-up');
    if (btnMoveUp) {
      btnMoveUp.onclick = () => this.moveLayer(this.activeLayerId, 'up');
    }

    const btnMoveDown = document.getElementById('btn-move-layer-down');
    if (btnMoveDown) {
      btnMoveDown.onclick = () => this.moveLayer(this.activeLayerId, 'down');
    }

    const selLayerBlend = document.getElementById('select-layer-blend-mode') as HTMLSelectElement;
    if (selLayerBlend) {
      selLayerBlend.onchange = () => {
        this.setLayerBlendMode(this.activeLayerId, selLayerBlend.value as GlobalCompositeOperation);
      };
    }

    const sliderLayerOpacity = document.getElementById('slider-layer-opacity') as HTMLInputElement;
    if (sliderLayerOpacity) {
      sliderLayerOpacity.oninput = () => {
        const v = parseFloat(sliderLayerOpacity.value);
        this.setLayerOpacity(this.activeLayerId, v / 100);
      };
    }

    // -----------------------------------------------------------
    // MANUAL GLYPH INPUT & INVERT BUTTON (RIGHT SETTINGS RACK)
    // -----------------------------------------------------------
    const manualGlyphInput = document.getElementById('manual-glyph-input') as HTMLInputElement;
    if (manualGlyphInput) {
      manualGlyphInput.oninput = () => {
        this.manualGlyphsText = manualGlyphInput.value;
        this.isManualActive = true;
        const activeLyr = this.getActiveLayer();
        if (activeLyr) {
          activeLyr.manualGlyphsText = manualGlyphInput.value;
          activeLyr.isManualActive = true;
        }
        this.updateLiveGlyphRibbon();
        this.markDirty();
      };
    }

    const btnInvertGlyphs = document.getElementById('btn-invert-glyphs');
    if (btnInvertGlyphs) {
      btnInvertGlyphs.onclick = () => {
        const currentVal = manualGlyphInput ? manualGlyphInput.value : this.manualGlyphsText;
        const inverted = Array.from(currentVal).reverse().join('');
        if (manualGlyphInput) manualGlyphInput.value = inverted;
        this.manualGlyphsText = inverted;
        this.isManualActive = true;
        const activeLyr = this.getActiveLayer();
        if (activeLyr) {
          activeLyr.manualGlyphsText = inverted;
          activeLyr.isManualActive = true;
        }
        this.updateLiveGlyphRibbon();
        this.markDirty();
        this.showToast(this.lang === 'ru' ? 'Набор символов инвертирован' : 'Glyphs inverted');
      };
    }
  }

  // -------------------------------------------------------------
  // FILE INGEST DISPATCHER (GIF, PNG, JPG, WEBP, MP4)
  // -------------------------------------------------------------
  handleFileIngest(file: File) {
    const name = file.name.toLowerCase();

    // If first layer already has media, add as a new layer!
    if (this.layers && this.layers.length > 0 && (this.layers[0].mediaType !== 'none' || this.layers[0].sourceImage || this.layers[0].gifFrames.length > 0)) {
      this.addNewLayerFromFile(file);
      return;
    }

    this.resetAllSettings(false, true);
    this.showToast((this.lang === 'ru' ? 'Загрузка: ' : 'Ingesting: ') + file.name);

    if (name.endsWith('.gif') || file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onload = e => {
        if (e.target && e.target.result) {
          this.loadGifArrayBuffer(e.target.result as ArrayBuffer);
          if (this.layers && this.layers[0]) {
            this.layers[0].name = file.name;
            this.updateLayerStackUI();
          }
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => {
        if (e.target && e.target.result) {
          const img = new Image();
          img.onload = () => {
            this.sourceImage = img;
            this.mediaType = 'image';
            this.sourceDirty = true;
            if (this.layers && this.layers[0]) {
              this.layers[0].sourceImage = img;
              this.layers[0].mediaType = 'image';
              this.layers[0].name = file.name;
              this.updateLayerStackUI();
            }
            const dropOverlay = document.getElementById('drop-zone-overlay');
            if (dropOverlay) dropOverlay.classList.add('hidden');
            this.markDirty(true);
            this.showToast((this.lang === 'ru' ? 'Изображение загружено: ' : 'Image loaded: ') + `${img.naturalWidth}×${img.naturalHeight}px`);
          };
          img.src = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      const vid = document.createElement('video');
      vid.autoplay = true;
      vid.loop = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.src = url;
      vid.play();
      this.videoElement = vid;
      this.sourceImage = vid as any;
      this.mediaType = 'video';
      if (this.layers && this.layers[0]) {
        this.layers[0].videoElement = vid;
        this.layers[0].sourceImage = vid as any;
        this.layers[0].mediaType = 'video';
        this.layers[0].name = file.name;
        this.updateLayerStackUI();
      }
      const dropOverlay = document.getElementById('drop-zone-overlay');
      if (dropOverlay) dropOverlay.classList.add('hidden');
      this.markDirty(true);
      this.showToast(this.lang === 'ru' ? 'Видео поток подключен' : 'Video stream loaded');
    }
  }

  // -------------------------------------------------------------
  // WELCOME / ENTRY MENU WINDOW
  // -------------------------------------------------------------
  openWelcomeMenu() {
    const modal = document.getElementById('welcome-menu-modal');
    if (modal) {
      modal.classList.remove('hidden-menu');
    }
  }

  closeWelcomeMenu() {
    const modal = document.getElementById('welcome-menu-modal');
    if (modal) {
      modal.classList.add('hidden-menu');
    }
  }

  // -------------------------------------------------------------
  // EXPORT STUDIO (GIF, PNG/JPEG, WEBM)
  // -------------------------------------------------------------
  openExportModal() {
    const modal = document.getElementById('export-modal');
    if (modal) modal.style.display = 'flex';
  }

  closeExportModal() {
    const modal = document.getElementById('export-modal');
    if (modal) modal.style.display = 'none';
  }

  exportImage(format: 'png' | 'jpeg') {
    const scaleEl = document.getElementById('select-image-scale') as HTMLSelectElement;
    const qualityEl = document.getElementById('select-image-quality') as HTMLSelectElement;
    const scale = scaleEl ? parseFloat(scaleEl.value) || 1 : 1;
    const quality = qualityEl ? parseFloat(qualityEl.value) || 0.95 : 0.95;

    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const ext = format === 'jpeg' ? 'jpg' : 'png';

    let dataUrl: string;
    if (scale <= 1) {
      dataUrl = this.mainCanvas.toDataURL(mime, quality);
    } else {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = Math.round(this.mainCanvas.width * scale);
      exportCanvas.height = Math.round(this.mainCanvas.height * scale);
      const eCtx = exportCanvas.getContext('2d')!;
      eCtx.imageSmoothingEnabled = false; // preserve crisp ASCII pixel aesthetics
      eCtx.drawImage(this.mainCanvas, 0, 0, exportCanvas.width, exportCanvas.height);
      dataUrl = exportCanvas.toDataURL(mime, quality);
    }

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `sacred_glyph_artwork_${scale}x.${ext}`;
    link.click();
    this.showToast(
      this.lang === 'ru'
        ? `Изображение (${ext.toUpperCase()} ${scale}x, ${Math.round(quality * 100)}% кач.) сохранено!`
        : `Image saved as ${ext.toUpperCase()} (${scale}x, ${Math.round(quality * 100)}% qual)!`
    );
  }

  exportVideoWebm() {
    if (this.isRecordingVideo) return;
    this.isRecordingVideo = true;

    const stream = this.mainCanvas.captureStream(30);
    this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    this.recordedVideoChunks = [];

    this.mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) this.recordedVideoChunks.push(e.data);
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedVideoChunks, { type: 'video/webm' });
      this.downloadBlob(blob, 'wraithsword_video.webm');
      this.isRecordingVideo = false;
      const recStatus = document.getElementById('recording-status');
      if (recStatus) recStatus.style.display = 'none';
      this.showToast(this.lang === 'ru' ? 'WebM видео успешно сохранено!' : 'WebM video saved!');
    };

    const recStatus = document.getElementById('recording-status');
    const recTimer = document.getElementById('record-timer');
    if (recStatus) recStatus.style.display = 'inline-block';

    this.mediaRecorder.start();
    let secondsLeft = 5;
    if (recTimer) recTimer.textContent = '0s';

    const interval = setInterval(() => {
      secondsLeft--;
      if (recTimer) recTimer.textContent = `${5 - secondsLeft}s`;
      if (secondsLeft <= 0) {
        clearInterval(interval);
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
        }
      }
    }, 1000);
  }

  // -------------------------------------------------------------
  // ANIMATION TIMELINE & LIVE PARAMETER RECORDING ENGINE
  // -------------------------------------------------------------
  startTimelineRecording() {
    if (this.isTimelinePlaying) {
      this.stopTimelinePlayback();
    }
    this.timelineFrames = [];
    this.timelineCurrentIndex = 0;
    this.timelineCaptureW = this.mainCanvas.width;
    this.timelineCaptureH = this.mainCanvas.height;
    this.isTimelineRecording = true;

    // Capture initial frame right now
    this.captureTimelineFrame();

    const interval = Math.max(20, Math.round(1000 / this.timelineFps));
    this.timelineRecordTimer = setInterval(() => {
      if (!this.isTimelineRecording) return;
      if (this.timelineFrames.length >= this.timelineMaxFrames) {
        this.stopTimelineRecording();
        this.showToast(this.lang === 'ru' ? `Лимит записи достигнут (${this.timelineMaxFrames} кадров)` : `Record limit reached (${this.timelineMaxFrames} frames)`);
        return;
      }
      this.captureTimelineFrame();
    }, interval);

    // Update UI
    const recBtn = document.getElementById('btn-timeline-rec');
    if (recBtn) recBtn.classList.add('active');
    const recLbl = document.getElementById('lbl-timeline-rec');
    if (recLbl) recLbl.textContent = this.lang === 'ru' ? '■ СТОП REC' : '■ STOP REC';

    const recDot = document.getElementById('timeline-rec-indicator');
    if (recDot) recDot.classList.add('recording');

    const statusBadge = document.getElementById('timeline-status-badge');
    if (statusBadge) {
      statusBadge.textContent = this.lang === 'ru' ? '● ИДЕТ ЗАПИСЬ...' : '● RECORDING...';
      statusBadge.className = 'timeline-status-badge recording';
    }

    const scrubber = document.getElementById('timeline-scrubber') as HTMLInputElement;
    if (scrubber) scrubber.disabled = true;

    this.showToast(
      this.lang === 'ru'
        ? 'Идет запись! Меняйте любые ползунки (яркость, размер ячейки, цвет) — всё запишется!'
        : 'Recording! Adjust any sliders (brightness, cell size, color) — everything records!'
    );
  }

  stopTimelineRecording() {
    this.isTimelineRecording = false;
    if (this.timelineRecordTimer) {
      clearInterval(this.timelineRecordTimer);
      this.timelineRecordTimer = null;
    }

    const recBtn = document.getElementById('btn-timeline-rec');
    if (recBtn) recBtn.classList.remove('active');
    const recLbl = document.getElementById('lbl-timeline-rec');
    if (recLbl) recLbl.textContent = this.lang === 'ru' ? 'REC (ЗАПИСЬ)' : 'REC (RECORD)';

    const recDot = document.getElementById('timeline-rec-indicator');
    if (recDot) recDot.classList.remove('recording');

    const statusBadge = document.getElementById('timeline-status-badge');
    if (statusBadge) {
      statusBadge.textContent = this.timelineFrames.length > 0
        ? (this.lang === 'ru' ? `ЗАПИСАНО: ${this.timelineFrames.length} КДР` : `RECORDED: ${this.timelineFrames.length} F`)
        : (this.lang === 'ru' ? 'ГОТОВ К ЗАПИСИ' : 'READY TO RECORD');
      statusBadge.className = 'timeline-status-badge';
    }

    const scrubber = document.getElementById('timeline-scrubber') as HTMLInputElement;
    if (scrubber) {
      scrubber.disabled = this.timelineFrames.length <= 1;
      scrubber.min = '0';
      scrubber.max = Math.max(0, this.timelineFrames.length - 1).toString();
      scrubber.value = '0';
    }

    this.updateTimelineUI();
    this.drawTimelineTrack();
    if (this.timelineFrames.length > 0) {
      this.showToast(
        this.lang === 'ru'
          ? `Записано ${this.timelineFrames.length} кадров! Нажмите PLAY или перемещайте ползунок.`
          : `Captured ${this.timelineFrames.length} frames! Press PLAY or scrub timeline.`
      );
    }
  }

  captureTimelineFrame() {
    if (!this.mainCanvas) return;
    const w = this.timelineCaptureW || this.mainCanvas.width;
    const h = this.timelineCaptureH || this.mainCanvas.height;
    const fCanvas = document.createElement('canvas');
    fCanvas.width = w;
    fCanvas.height = h;
    const fCtx = fCanvas.getContext('2d')!;
    fCtx.imageSmoothingEnabled = false;
    fCtx.drawImage(this.mainCanvas, 0, 0, w, h);
    const delay = Math.max(20, Math.round(1000 / this.timelineFps));
    this.timelineFrames.push({ canvas: fCanvas, delay });

    this.updateTimelineUI();
    this.drawTimelineTrack();
  }

  startTimelinePlayback() {
    if (this.timelineFrames.length === 0) {
      this.showToast(this.lang === 'ru' ? 'Сначала запишите анимацию кнопкой REC' : 'Record an animation first using REC');
      return;
    }
    if (this.isTimelineRecording) {
      this.stopTimelineRecording();
    }
    this.isTimelinePlaying = true;
    this.timelineLastPlayTime = performance.now();

    const btnPlay = document.getElementById('lbl-timeline-play');
    if (btnPlay) btnPlay.textContent = this.lang === 'ru' ? '⏸ ПАУЗА' : '⏸ PAUSE';

    const statusBadge = document.getElementById('timeline-status-badge');
    if (statusBadge) {
      statusBadge.textContent = this.lang === 'ru' ? '▶ ВОСПРОИЗВЕДЕНИЕ' : '▶ PLAYING';
      statusBadge.className = 'timeline-status-badge playing';
    }
  }

  stopTimelinePlayback() {
    this.isTimelinePlaying = false;
    const btnPlay = document.getElementById('lbl-timeline-play');
    if (btnPlay) btnPlay.textContent = '▶ PLAY';

    const statusBadge = document.getElementById('timeline-status-badge');
    if (statusBadge) {
      statusBadge.textContent = this.timelineFrames.length > 0
        ? (this.lang === 'ru' ? `ЗАПИСАНО: ${this.timelineFrames.length} КДР` : `RECORDED: ${this.timelineFrames.length} F`)
        : (this.lang === 'ru' ? 'ГОТОВ К ЗАПИСИ' : 'READY TO RECORD');
      statusBadge.className = 'timeline-status-badge';
    }
  }

  displayTimelineFrame(index: number) {
    if (this.timelineFrames.length === 0 || !this.mainCanvas || !this.ctx) return;
    const boundedIdx = Math.max(0, Math.min(this.timelineFrames.length - 1, index));
    this.timelineCurrentIndex = boundedIdx;
    const frame = this.timelineFrames[boundedIdx];

    this.ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
    this.ctx.drawImage(frame.canvas, 0, 0, this.mainCanvas.width, this.mainCanvas.height);

    const scrubber = document.getElementById('timeline-scrubber') as HTMLInputElement;
    if (scrubber && !this.isTimelineScrubbing) {
      scrubber.value = boundedIdx.toString();
    }
    this.updateTimelineUI();
    this.drawTimelineTrack();
  }

  seekTimeline(index: number) {
    if (this.timelineFrames.length === 0) return;
    if (this.isTimelinePlaying) {
      this.stopTimelinePlayback();
    }
    this.displayTimelineFrame(index);
  }

  clearTimeline() {
    this.stopTimelinePlayback();
    this.stopTimelineRecording();
    this.timelineFrames = [];
    this.timelineCurrentIndex = 0;
    this.updateTimelineUI();
    this.drawTimelineTrack();
    this.markDirty(true);
    this.showToast(this.lang === 'ru' ? 'Таймлайн очищен' : 'Timeline cleared');
  }

  drawTimelineTrack() {
    const canvas = document.getElementById('timeline-track-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.clientWidth || 300;
    const h = 24;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);

    // Dark chassis track background
    ctx.fillStyle = '#0a0c09';
    ctx.fillRect(0, 0, w, h);

    const total = this.timelineFrames.length;
    if (total > 0) {
      // Draw tick marks for frames
      const barW = Math.max(1, w / total);
      ctx.fillStyle = this.theme === 'dark' ? 'rgba(143, 142, 236, 0.45)' : 'rgba(215, 155, 223, 0.45)';
      for (let i = 0; i < total; i++) {
        const x = (i / total) * w;
        const tickH = i % 5 === 0 ? h * 0.75 : h * 0.35;
        ctx.fillRect(x, h - tickH, Math.max(1, barW - 0.5), tickH);
      }

      // Playhead position
      const needleX = Math.min(w - 2, Math.max(0, (this.timelineCurrentIndex / Math.max(1, total - 1)) * w));
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(needleX - 1, 0, 3, h);
    } else {
      // Empty grid notches
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, h - 6);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
    }
  }

  updateTimelineUI() {
    const counterEl = document.getElementById('timeline-counter-readout');
    if (counterEl) {
      const cur = this.timelineFrames.length > 0 ? this.timelineCurrentIndex + 1 : 0;
      const total = this.timelineFrames.length;
      const curSec = (this.timelineCurrentIndex / this.timelineFps).toFixed(1);
      const totalSec = (total / this.timelineFps).toFixed(1);
      counterEl.textContent = `${cur} / ${total} КДР (${curSec}s / ${totalSec}s)`;
    }

    const scrubber = document.getElementById('timeline-scrubber') as HTMLInputElement;
    if (scrubber) {
      scrubber.disabled = this.timelineFrames.length <= 1;
      scrubber.min = '0';
      scrubber.max = Math.max(0, this.timelineFrames.length - 1).toString();
      if (!this.isTimelineScrubbing) {
        scrubber.value = this.timelineCurrentIndex.toString();
      }
    }
  }

  exportTimelineGif() {
    if (this.timelineFrames.length === 0) {
      this.showToast(this.lang === 'ru' ? 'Нет записанных кадров для экспорта GIF' : 'No recorded frames to export GIF');
      return;
    }
    this.showToast(this.lang === 'ru' ? `Экспорт GIF (${this.timelineFrames.length} кадров)...` : `Exporting GIF (${this.timelineFrames.length} frames)...`);

    setTimeout(() => {
      try {
        const firstCanvas = this.timelineFrames[0].canvas;
        const w = firstCanvas.width;
        const h = firstCanvas.height;

        const gif = GIFEncoder();
        const delay = Math.max(20, Math.round(1000 / this.timelineFps));

        const sCanvas = document.createElement('canvas');
        sCanvas.width = w;
        sCanvas.height = h;
        const sCtx = sCanvas.getContext('2d', { willReadFrequently: true })!;

        for (let i = 0; i < this.timelineFrames.length; i++) {
          sCtx.clearRect(0, 0, w, h);
          sCtx.drawImage(this.timelineFrames[i].canvas, 0, 0, w, h);
          const imgData = sCtx.getImageData(0, 0, w, h);
          const palette = quantize(imgData.data, 256);
          const index = applyPalette(imgData.data, palette);
          gif.writeFrame(index, w, h, { palette, delay });
        }
        gif.finish();

        const buffer = gif.bytes();
        const blob = new Blob([buffer as any], { type: 'image/gif' });
        this.downloadBlob(blob, `sacred_glyph_animation_${this.timelineFrames.length}frames.gif`);
        this.showToast(this.lang === 'ru' ? `GIF сохранен! (${this.timelineFrames.length} кадров)` : `GIF saved! (${this.timelineFrames.length} frames)`);
      } catch (err: any) {
        console.error('Timeline GIF export error:', err);
        this.showToast('GIF Export Error: ' + err.message);
      }
    }, 40);
  }

  exportTimelineWebm() {
    if (this.timelineFrames.length === 0) {
      this.showToast(this.lang === 'ru' ? 'Нет записанных кадров для экспорта WebM' : 'No recorded frames to export WebM');
      return;
    }
    this.showToast(this.lang === 'ru' ? `Кодирование WebM (${this.timelineFrames.length} кадров)...` : `Encoding WebM (${this.timelineFrames.length} frames)...`);

    const firstCanvas = this.timelineFrames[0].canvas;
    const w = firstCanvas.width;
    const h = firstCanvas.height;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = w;
    exportCanvas.height = h;
    const eCtx = exportCanvas.getContext('2d')!;

    const stream = exportCanvas.captureStream(this.timelineFps);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    const chunks: Blob[] = [];

    recorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      this.downloadBlob(blob, `sacred_glyph_animation_${this.timelineFrames.length}frames.webm`);
      this.showToast(this.lang === 'ru' ? 'WebM видео успешно сохранено!' : 'WebM video saved!');
    };

    recorder.start();

    let frameIdx = 0;
    const frameInterval = Math.round(1000 / this.timelineFps);
    const drawTimer = setInterval(() => {
      if (frameIdx >= this.timelineFrames.length) {
        clearInterval(drawTimer);
        setTimeout(() => {
          recorder.stop();
        }, 150);
        return;
      }
      eCtx.clearRect(0, 0, w, h);
      eCtx.drawImage(this.timelineFrames[frameIdx].canvas, 0, 0, w, h);
      frameIdx++;
    }, frameInterval);
  }

  downloadStandaloneHtml() {
    const html = document.documentElement.outerHTML;
    const blob = new Blob([html], { type: 'text/html' });
    this.downloadBlob(blob, 'sacred_glyph_workstation.html');
    this.showToast(this.lang === 'ru' ? 'Автономная рабочая станция сохранена!' : 'Standalone workstation HTML downloaded!');
  }

  downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  showToast(message: string) {
    let toast = document.getElementById('system-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'system-toast';
      toast.className = 'system-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = `[SYS] ${message}`;
    toast.classList.add('visible');
    setTimeout(() => {
      if (toast) toast.classList.remove('visible');
    }, 2800);
  }
}

// -------------------------------------------------------------
// BOOTSTRAP WORKSTATION ON DOM READY
// -------------------------------------------------------------
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    (window as any).sacredGlyphEngine = new SacredGlyphEngine();
    (window as any).scriptSlayerEngine = (window as any).sacredGlyphEngine;
    (window as any).sacredGlyphBrand = initSacredGlyphBrand('brand-sacred-glyph');
  });
}
