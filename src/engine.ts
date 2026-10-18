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
}

export interface DecodedGifFrame {
  canvas: HTMLCanvasElement;
  delay: number; // in milliseconds
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
// 2. PALETTES (10 Authentic Japanese & Broadcast Palettes)
// -------------------------------------------------------------
export const MEDIEVAL_PALETTES: ColorPalette[] = [
  {
    id: 'phosphor_matrix',
    name: 'Phosphor Green Matrix',
    nameRu: 'Фосфорный зеленый (Matrix)',
    nameEn: 'Phosphor Green Matrix',
    colors: ['#040a04', '#0d2b0d', '#145214', '#1f8a1f', '#2bd12b', '#4dff4d', '#b3ffb3']
  },
  {
    id: 'amber_terminal',
    name: 'Industrial Amber CRT',
    nameRu: 'Промышленный янтарь CRT',
    nameEn: 'Industrial Amber CRT',
    colors: ['#0a0802', '#331e04', '#663c08', '#a8630c', '#e68a12', '#ffaa2b', '#ffd480']
  },
  {
    id: 'sgi_cyber',
    name: 'SGI Indigo Workstation',
    nameRu: 'Индиго-станция SGI',
    nameEn: 'SGI Indigo Workstation',
    colors: ['#080a14', '#141d3d', '#20336b', '#33549e', '#4b7cd1', '#72a6ff', '#bdd7ff']
  },
  {
    id: 'gothic_blood',
    name: 'Gothic Blood & Gold',
    nameRu: 'Готическая кровь & Золото',
    nameEn: 'Gothic Blood & Gold',
    colors: ['#0f0507', '#2e0b12', '#57131e', '#8a1c27', '#c23232', '#d97706', '#fde68a']
  },
  {
    id: 'illuminated_gold',
    name: 'Illuminated Manuscript',
    nameRu: 'Иллюминированный манускрипт',
    nameEn: 'Illuminated Manuscript',
    colors: ['#120d04', '#2e1f0b', '#573d12', '#8c641c', '#c79228', '#f0b83c', '#fae19c']
  },
  {
    id: 'monochrome_high',
    name: 'Monochrome High-Contrast',
    nameRu: 'Монохром высокая контрастность',
    nameEn: 'Monochrome High-Contrast',
    colors: ['#000000', '#222222', '#444444', '#777777', '#aaaaaa', '#dddddd', '#ffffff']
  },
  {
    id: 'abyssal_teal',
    name: 'Abyssal Radar Cyan',
    nameRu: 'Бирюзовый радар бездны',
    nameEn: 'Abyssal Radar Cyan',
    colors: ['#030a0a', '#0a2124', '#114045', '#1c6970', '#2aa0aa', '#40dbe8', '#a8f6fc']
  },
  {
    id: 'spectral_neon',
    name: 'Spectral Ditherpunk',
    nameRu: 'Спектральный дизерпанк',
    nameEn: 'Spectral Ditherpunk',
    colors: ['#0d0417', '#2d0c4d', '#58168f', '#9624db', '#d936e6', '#ff66c4', '#ffe0f0']
  },
  {
    id: 'parchment_sepia',
    name: 'Ancient Parchment Sepia',
    nameRu: 'Древний пергамент сепия',
    nameEn: 'Ancient Parchment Sepia',
    colors: ['#1a140d', '#3b2f21', '#66533c', '#998061', '#c7ab88', '#ebd8be', '#faf2e6']
  },
  {
    id: 'acid_radiation',
    name: 'Acid Geiger Yellow',
    nameRu: 'Кислотный счетчик Гейгера',
    nameEn: 'Acid Geiger Yellow',
    colors: ['#090a03', '#202408', '#3e4510', '#6f7a1c', '#acc22d', '#d9f538', '#f4ff9e']
  }
];

// -------------------------------------------------------------
// 3. MASTER PRESETS (Expanded library of 16 rich presets)
// -------------------------------------------------------------
export const MASTER_PRESETS: MasterPreset[] = [
  {
    id: 'preset_cyber_green',
    name: 'ФОСФОРНЫЙ ТЕРМИНАЛ // PHOSPHOR GREEN',
    glyphSetId: 'classic_clean',
    cellSize: 9,
    depth: 8,
    offset: 0,
    aspect: 0.55,
    invert: false,
    ditherAlgo: 'bayer4',
    contrast: 1.25,
    brightness: 0,
    sharpness: 25,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    paletteId: 'phosphor_matrix',
    singleColor: '#00ff66',
    bgTransparent: false,
    bgColor: '#040904',
    lfoEnabled: true,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 25
  },
  {
    id: 'preset_amber_plasma',
    name: 'ЯНТАРНАЯ ПЛАЗМА 1991 // AMBER CRT',
    glyphSetId: 'classic_standard',
    cellSize: 8,
    depth: 10,
    offset: 0,
    aspect: 0.52,
    invert: false,
    ditherAlgo: 'floyd',
    contrast: 1.3,
    brightness: 5,
    sharpness: 30,
    gamma: 1.05,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    paletteId: 'amber_terminal',
    singleColor: '#ffaa00',
    bgTransparent: false,
    bgColor: '#080501',
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 0.8,
    lfoDepth: 20
  },
  {
    id: 'preset_xerox_bw',
    name: 'КСЕРОКС И ЗИН-АРТ // XEROX 90s B&W',
    glyphSetId: 'classic_standard',
    cellSize: 7,
    depth: 6,
    offset: 0,
    aspect: 0.55,
    invert: false,
    ditherAlgo: 'atkinson',
    contrast: 1.6,
    brightness: -8,
    sharpness: 60,
    gamma: 0.9,
    blur: 0,
    posterize: 4,
    colorMode: 'palette',
    paletteId: 'monochrome_high',
    singleColor: '#ffffff',
    bgTransparent: false,
    bgColor: '#0a0a0a',
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 15
  },
  {
    id: 'preset_hermetic_alchemy',
    name: 'АЛХИМИЧЕСКИЙ ГРИМУАР // ALCHEMY GOLD',
    glyphSetId: 'medieval_alchemy',
    cellSize: 11,
    depth: 8,
    offset: 0,
    aspect: 0.55,
    invert: false,
    ditherAlgo: 'bayer8',
    contrast: 1.2,
    brightness: 0,
    sharpness: 40,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    paletteId: 'illuminated_gold',
    singleColor: '#f5d061',
    bgTransparent: false,
    bgColor: '#080603',
    lfoEnabled: true,
    lfoTarget: 'both',
    lfoWaveform: 'triangle',
    lfoSpeed: 0.9,
    lfoDepth: 35
  },
  {
    id: 'preset_gothic_runic',
    name: 'ГОТИЧЕСКИЙ ФУТАРК // GOTHIC BLOOD RUNES',
    glyphSetId: 'runic_futhark',
    cellSize: 10,
    depth: 10,
    offset: 0,
    aspect: 0.55,
    invert: false,
    ditherAlgo: 'bayer4',
    contrast: 1.35,
    brightness: 0,
    sharpness: 35,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    paletteId: 'gothic_blood',
    singleColor: '#dc2626',
    bgTransparent: false,
    bgColor: '#0b0406',
    lfoEnabled: true,
    lfoTarget: 'depth',
    lfoWaveform: 'sine',
    lfoSpeed: 1.2,
    lfoDepth: 40
  },
  {
    id: 'preset_matrix_tokyo',
    name: 'ТОКИЙСКАЯ МАТРИЦА // CYBER TOKYO RAIN',
    glyphSetId: 'jp_tokyo_rain',
    cellSize: 9,
    depth: 7,
    offset: 0,
    aspect: 0.52,
    invert: false,
    ditherAlgo: 'bayer8',
    contrast: 1.4,
    brightness: 4,
    sharpness: 45,
    gamma: 1.1,
    blur: 0,
    posterize: 0,
    colorMode: 'single',
    paletteId: 'phosphor_matrix',
    singleColor: '#00ff66',
    bgTransparent: false,
    bgColor: '#020502',
    lfoEnabled: true,
    lfoTarget: 'offset',
    lfoWaveform: 'sawtooth',
    lfoSpeed: 1.8,
    lfoDepth: 50
  },
  {
    id: 'preset_sgi_indigo',
    name: 'РАБОЧАЯ СТАНЦИЯ SGI // SGI INDIGO BLUE',
    glyphSetId: 'cyber_radar_scope',
    cellSize: 9,
    depth: 6,
    offset: 0,
    aspect: 0.55,
    invert: false,
    ditherAlgo: 'bayer4',
    contrast: 1.2,
    brightness: 0,
    sharpness: 20,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    paletteId: 'sgi_cyber',
    singleColor: '#4b7cd1',
    bgTransparent: false,
    bgColor: '#060812',
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 30
  },
  {
    id: 'preset_thermal_flir',
    name: 'ТЕПЛОВИЗОР FLIR // THERMAL INFRARED',
    glyphSetId: 'geo_circles_phase',
    cellSize: 8,
    depth: 7,
    offset: 0,
    aspect: 0.55,
    invert: false,
    ditherAlgo: 'halftone',
    contrast: 1.45,
    brightness: 6,
    sharpness: 50,
    gamma: 1.15,
    blur: 1,
    posterize: 0,
    colorMode: 'palette',
    paletteId: 'gothic_blood',
    singleColor: '#ff3300',
    bgTransparent: false,
    bgColor: '#0d0205',
    lfoEnabled: true,
    lfoTarget: 'cell',
    lfoWaveform: 'sine',
    lfoSpeed: 0.7,
    lfoDepth: 25
  },
  {
    id: 'preset_braille_radar',
    name: 'ОПТИЧЕСКИЙ БРАЙЛЬ // RADAR DOTS',
    glyphSetId: 'braille_progressive',
    cellSize: 6,
    depth: 7,
    offset: 0,
    aspect: 0.55,
    invert: false,
    ditherAlgo: 'halftone',
    contrast: 1.35,
    brightness: 5,
    sharpness: 30,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    paletteId: 'abyssal_teal',
    singleColor: '#00e5ff',
    bgTransparent: false,
    bgColor: '#020708',
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.5,
    lfoDepth: 45
  },
  {
    id: 'preset_macintosh_atkinson',
    name: 'MACINTOSH 1-BIT // ATKINSON DITHER',
    glyphSetId: 'block_shades',
    cellSize: 7,
    depth: 5,
    offset: 0,
    aspect: 0.55,
    invert: false,
    ditherAlgo: 'atkinson',
    contrast: 1.5,
    brightness: -5,
    sharpness: 55,
    gamma: 0.95,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    paletteId: 'monochrome_high',
    singleColor: '#ffffff',
    bgTransparent: false,
    bgColor: '#0a0a0a',
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 0.8,
    lfoDepth: 20
  },
  {
    id: 'preset_glitch_hardware',
    name: 'АППАРАТНЫЙ СБОЙ // HARDWARE GLITCH',
    glyphSetId: 'cyber_glitch_sys',
    cellSize: 10,
    depth: 7,
    offset: 0,
    aspect: 0.52,
    invert: true,
    ditherAlgo: 'bayer8',
    contrast: 1.55,
    brightness: 10,
    sharpness: 70,
    gamma: 1.2,
    blur: 0,
    posterize: 6,
    colorMode: 'palette',
    paletteId: 'spectral_neon',
    singleColor: '#d936e6',
    bgTransparent: false,
    bgColor: '#080310',
    lfoEnabled: true,
    lfoTarget: 'offset',
    lfoWaveform: 'pulse',
    lfoSpeed: 2.2,
    lfoDepth: 65
  },
  {
    id: 'preset_vapor_synth',
    name: 'СИНТВЕЙВ ПЛАЗМА // SYNTHWAVE MAGENTA',
    glyphSetId: 'geo_pointers',
    cellSize: 9,
    depth: 6,
    offset: 0,
    aspect: 0.55,
    invert: false,
    ditherAlgo: 'floyd',
    contrast: 1.3,
    brightness: 0,
    sharpness: 25,
    gamma: 1.05,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    paletteId: 'spectral_neon',
    singleColor: '#ff66c4',
    bgTransparent: false,
    bgColor: '#0a0312',
    lfoEnabled: true,
    lfoTarget: 'both',
    lfoWaveform: 'sine',
    lfoSpeed: 1.1,
    lfoDepth: 30
  },
  {
    id: 'preset_geiger_acid',
    name: 'РАДИАЦИЯ ГЕЙГЕРА // ACID MONOCHROME',
    glyphSetId: 'minimal_stipple',
    cellSize: 8,
    depth: 4,
    offset: 0,
    aspect: 0.55,
    invert: false,
    ditherAlgo: 'bayer4',
    contrast: 1.4,
    brightness: 0,
    sharpness: 40,
    gamma: 1.0,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    paletteId: 'acid_radiation',
    singleColor: '#d9f538',
    bgTransparent: false,
    bgColor: '#080902',
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 25
  },
  {
    id: 'preset_solar_flare',
    name: 'СОЛНЕЧНАЯ ВСПЫШКА // SOLAR FLARE',
    glyphSetId: 'geo_squares_steps',
    cellSize: 9,
    depth: 7,
    offset: 0,
    aspect: 0.55,
    invert: false,
    ditherAlgo: 'halftone',
    contrast: 1.35,
    brightness: 5,
    sharpness: 35,
    gamma: 1.1,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    paletteId: 'amber_terminal',
    singleColor: '#ffaa2b',
    bgTransparent: false,
    bgColor: '#0c0701',
    lfoEnabled: true,
    lfoTarget: 'depth',
    lfoWaveform: 'sine',
    lfoSpeed: 1.3,
    lfoDepth: 45
  },
  {
    id: 'preset_halftone_news',
    name: 'ГАЗЕТНЫЙ РАСТР // HALFTONE NEWSPAPER',
    glyphSetId: 'minimal_wires',
    cellSize: 7,
    depth: 5,
    offset: 0,
    aspect: 0.55,
    invert: false,
    ditherAlgo: 'halftone',
    contrast: 1.45,
    brightness: -4,
    sharpness: 50,
    gamma: 0.95,
    blur: 0,
    posterize: 0,
    colorMode: 'palette',
    paletteId: 'parchment_sepia',
    singleColor: '#3b2f21',
    bgTransparent: false,
    bgColor: '#f5ebdc',
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  },
  {
    id: 'preset_sharp_contour',
    name: 'МАКСИМАЛЬНАЯ РЕЗКОСТЬ // SHARP CONTOUR',
    glyphSetId: 'classic_clean',
    cellSize: 6,
    depth: 8,
    offset: 0,
    aspect: 0.55,
    invert: false,
    ditherAlgo: 'atkinson',
    contrast: 1.7,
    brightness: 0,
    sharpness: 90,
    gamma: 1.0,
    blur: 0,
    posterize: 8,
    colorMode: 'single',
    paletteId: 'phosphor_matrix',
    singleColor: '#00ff66',
    bgTransparent: false,
    bgColor: '#000000',
    lfoEnabled: false,
    lfoTarget: 'offset',
    lfoWaveform: 'sine',
    lfoSpeed: 1.0,
    lfoDepth: 20
  }
];

// Bayer Dithering Matrices
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
    welcomeSub: 'ПРОФЕССИОНАЛЬНАЯ СТАНЦИЯ ASCII & DITHER АРТА // v2.4',
    welcomeUploadBtn: 'ЗАГРУЗИТЬ GIF ИЛИ КАРТИНКУ',
    welcomeDropHint: 'или перетащите файл (.GIF, .PNG, .JPG, .WEBP) прямо в это окно',
    welcomeSkipBtn: '▶ ВОЙТИ В СТУДИЮ С ОБРАЗЦОМ',
    presetLbl: 'ПРЕСЕТ:',
    savePreset: 'СОХРАНИТЬ',
    saveApp: 'СКАЧАТЬ (.HTML)',
    exportBtn: 'ЭКСПОРТ',
    themeLight: '◐ ТЕМА: СВЕТЛАЯ',
    themeDark: '◑ ТЕМА: ТЕМНАЯ',
    mon1: '[МОНИТОР-1: ОСНОВНОЙ РАСТРОВЫЙ ДИСПЛЕЙ CRT // 8-BIT DAC]',
    fitLbl: 'МАСШТАБ (FIT):',
    fitModeTooltip: 'Режим масштабирования изображения',
    sourceLbl: 'ДЕМО-ИСТОЧНИК:',
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
    gradeTitle: '[КОЛОР-ГРЕЙДИНГ: ЦВЕТОВЫЕ КРУГИ 3-WAY]',
    liftWheelLbl: 'ТЕНИ (LIFT)',
    gammaWheelLbl: 'ТОНА (GAMMA)',
    gainWheelLbl: 'СВЕТА (GAIN)',
    wheelLevelLbl: 'УРОВЕНЬ',
    tempLbl: 'ТЕМПЕРАТУРА',
    tintLbl: 'ОТТЕНОК (TINT)',
    satLbl: 'НАСЫЩЕННОСТЬ',
    hueLbl: 'СДВИГ ТОНА',
    deck1Title: '[БАЗА ГЛИФОВ & РУЧНОЙ ВВОД СИМВОЛОВ]',
    activeLbl: 'АКТИВНО:',
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
    imageBoxTitle: '2. ИЗОБРАЖЕНИЕ (PNG / JPEG)',
    imageBoxDesc: 'Экспорт текущего растрового кадра в высоком разрешении.',
    imageFormatLbl: 'ФОРМАТ:',
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
    btnReverseTooltip: 'Инвертировать порядок глифов (от светлого к темному / наоборот)',
    btnResetSetTooltip: 'Загрузить символы из выбранного набора',
    btnClearTooltip: 'Очистить строку ввода',
    btnCopyTooltip: 'Скопировать строку символов в буфер',
    uploadSlotTooltip: 'Нажмите для загрузки GIF или картинки',
    resetGradingBtn: 'СБРОС ↺',
    zoomInTooltip: 'Приблизить (+)',
    zoomOutTooltip: 'Отдалить (-)',
    zoomResetTooltip: 'Сбросить масштаб (1:1)',
    toggleLangTooltip: 'Переключить язык (RU / EN)',
    // Start Menu & Header Launcher
    startMenuTitle: 'SACRED GLYPH WORKSTATION // СТАРТОВОЕ МЕНЮ РЕДАКТОРА',
    startMenuSubtitle: 'ПРОФЕССИОНАЛЬНАЯ РАСТРОВАЯ СТАНЦИЯ // 90s ASCII & DITHER GRAPHICS SUITE',
    startMenuDropTitle: 'ОТКРЫТЬ ИЗОБРАЖЕНИЕ ИЛИ ВИДЕО',
    startMenuDropDesc: 'Перетащите файл сюда или нажмите кнопку ниже для загрузки с компьютера',
    startMenuBrowseBtn: '📁 ВЫБРАТЬ ФАЙЛ С ДИСКА',
    startMenuSupported: 'PNG, JPG, WebP, GIF (анимации), MP4, WebM',
    startMenuTemplatesTitle: '❖ БЫСТРЫЙ СТАРТ И ОБРАЗЦЫ',
    startMenuDemo1Title: 'Герметическая Печать',
    startMenuDemo1Desc: 'LFO кинетика, алхимическая геометрия и сакральные глифы',
    startMenuDemo2Title: 'Пламя Бездны',
    startMenuDemo2Desc: 'Динамические частицы огня, темная градация и дым',
    startMenuBlankTitle: 'Новый пустой холст',
    startMenuBlankDesc: 'Чистый растровый проект для ручного ввода символов и текста',
    startMenuPresetsTitle: '◈ БЫСТРЫЙ ВЫБОР СТИЛЯ',
    startMenuCloseBtn: 'ПЕРЕЙТИ В РЕДАКТОР →',
    startMenuShowOnBoot: 'Показывать это меню при запуске',
    startMenuTip: 'Меню всегда доступно по кнопке [СТАРТ / МЕНЮ] или [F1]',
    btnStartMenuHeader: 'СТАРТ / МЕНЮ [F1]',
    btnHeaderOpenFile: 'ОТКРЫТЬ ФАЙЛ',
    startMenuTooltip: 'Открыть стартовое меню редактора (F1)',
    headerOpenFileTooltip: 'Загрузить файл изображения или видео'
  },
  en: {
    brandTitle: 'Sacred Glyph Workstation',
    brandTooltip: 'Sacred Glyph Workstation — CS Denisa Halfpixel Top Demo — Hover to crumble and reconstitute',
    welcomeMenuBtn: '⏏ MENU',
    welcomeMenuTooltip: 'Open GIF or image upload menu window',
    welcomeTermTitle: 'SACRED GLYPH // INITIALIZATION INGEST BAY',
    welcomeSub: 'MEDIEVAL ASCII & DITHER WORKSTATION // GRAPHICS PIPELINE',
    welcomeUploadBtn: 'UPLOAD GIF OR IMAGE',
    welcomeDropHint: 'or drag & drop a file (.GIF, .PNG, .JPG, .WEBP) into this window',
    welcomeSkipBtn: '▶ ENTER STUDIO WITH SAMPLE',
    presetLbl: 'PRESET:',
    savePreset: 'SAVE',
    saveApp: 'DOWNLOAD (.HTML)',
    exportBtn: 'EXPORT',
    themeLight: '◐ THEME: LIGHT',
    themeDark: '◑ THEME: DARK',
    mon1: '[MONITOR-1: PRIMARY RASTER CRT DISPLAY // 8-BIT DAC]',
    fitLbl: 'FIT MODE:',
    fitModeTooltip: 'Image scaling mode',
    sourceLbl: 'DEMO SOURCE:',
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
    gradeTitle: '[COLOR GRADING: 3-WAY WHEELS]',
    liftWheelLbl: 'SHADOWS (LIFT)',
    gammaWheelLbl: 'MIDTONES (GAMMA)',
    gainWheelLbl: 'HIGHLIGHTS (GAIN)',
    wheelLevelLbl: 'LEVEL',
    tempLbl: 'TEMPERATURE',
    tintLbl: 'TINT',
    satLbl: 'SATURATION',
    hueLbl: 'HUE SHIFT',
    deck1Title: '[GLYPH DATABASE & MANUAL INPUT]',
    activeLbl: 'ACTIVE:',
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
    imageBoxTitle: '2. STILL IMAGE (PNG / JPEG)',
    imageBoxDesc: 'Export current raster frame in high resolution.',
    imageFormatLbl: 'FORMAT:',
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
    btnReverseTooltip: 'Invert glyph order (light to dark / dark to light)',
    btnResetSetTooltip: 'Load characters from active preset set',
    btnClearTooltip: 'Clear input field',
    btnCopyTooltip: 'Copy characters to clipboard',
    uploadSlotTooltip: 'Click to upload GIF or image',
    resetGradingBtn: 'RESET ↺',
    zoomInTooltip: 'Zoom In (+)',
    zoomOutTooltip: 'Zoom Out (-)',
    zoomResetTooltip: 'Reset View (1:1)',
    toggleLangTooltip: 'Switch Language (RU / EN)',
    // Start Menu & Header Launcher
    startMenuTitle: 'SACRED GLYPH WORKSTATION // GRAPHIC SUITE LAUNCHER',
    startMenuSubtitle: 'PROFESSIONAL RASTER SUITE // 90s ASCII & DITHER GRAPHICS SUITE',
    startMenuDropTitle: 'OPEN IMAGE OR VIDEO FILE',
    startMenuDropDesc: 'Drag & drop your file here or click below to browse from disk',
    startMenuBrowseBtn: '📁 BROWSE FILE FROM DISK',
    startMenuSupported: 'PNG, JPG, WebP, GIF (animations), MP4, WebM',
    startMenuTemplatesTitle: '❖ QUICK START & SAMPLES',
    startMenuDemo1Title: 'Hermetic Sigil',
    startMenuDemo1Desc: 'LFO kinetic modulation, sacred geometry & alchemical runes',
    startMenuDemo2Title: 'Abyssal Flame',
    startMenuDemo2Desc: 'Dynamic fire particles, dark grading & organic embers',
    startMenuBlankTitle: 'New Blank Canvas',
    startMenuBlankDesc: 'Clean raster canvas ready for manual glyph input and typography',
    startMenuPresetsTitle: '◈ QUICK STYLE PRESETS',
    startMenuCloseBtn: 'ENTER WORKSPACE →',
    startMenuShowOnBoot: 'Show this start menu on launch',
    startMenuTip: 'Launcher always available via [START / MENU] or [F1]',
    btnStartMenuHeader: 'START / MENU [F1]',
    btnHeaderOpenFile: 'OPEN FILE',
    startMenuTooltip: 'Open Graphic Suite Start Menu (F1)',
    headerOpenFileTooltip: 'Load image or video file'
  }
};

// -------------------------------------------------------------
// MAIN WORKSTATION ENGINE CLASS
// -------------------------------------------------------------
export class ScriptSlayerEngine {
  mainCanvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tempCanvas: HTMLCanvasElement;
  tempCtx: CanvasRenderingContext2D;
  oscilloCanvas: HTMLCanvasElement;
  oscilloCtx: CanvasRenderingContext2D;

  // Media Source
  mediaType: 'demo' | 'image' | 'gif' = 'demo';
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

  // Advanced 3-Way Color Grading (Lift, Gamma, Gain Color Wheels & Temp/Tint/Sat/Hue)
  liftX: number = 0;
  liftY: number = 0;
  liftLevel: number = 0; // -50 to +50%
  gammaX: number = 0;
  gammaY: number = 0;
  gammaLevel: number = 0; // -50 to +50%
  gainX: number = 0;
  gainY: number = 0;
  gainLevel: number = 0; // -50 to +50%

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

  // Particles for Abyssal Flame Demo
  flameParticles: Array<{ x: number; y: number; vx: number; vy: number; life: number; decay: number; size: number }> = [];

  constructor() {
    this.mainCanvas = document.getElementById('ascii-canvas') as HTMLCanvasElement;
    this.ctx = this.mainCanvas.getContext('2d', { willReadFrequently: true })!;

    this.tempCanvas = document.createElement('canvas');
    this.tempCtx = this.tempCanvas.getContext('2d', { willReadFrequently: true })!;

    this.sampleCanvas = document.createElement('canvas');
    this.sampleCtx = this.sampleCanvas.getContext('2d', { willReadFrequently: true })!;

    this.oscilloCanvas = document.getElementById('oscillo-canvas') as HTMLCanvasElement;
    this.oscilloCtx = this.oscilloCanvas.getContext('2d')!;

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
    this.updateCanvasTransform();

    // Check if start menu should be shown on boot
    const showStart = localStorage.getItem('sg_show_start_on_boot');
    if (showStart === 'false') {
      this.closeStartMenu();
    } else {
      this.openStartMenu();
    }

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

    // Step animated GIF frame if mediaType === 'gif'
    if (this.mediaType === 'gif' && this.gifFrames.length > 0 && this.gifIsPlaying) {
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

      this.isDirty = true;
    }

    // Procedural demo sources continuously animate
    if (this.mediaType === 'demo') {
      this.sourceDirty = true;
      this.isDirty = true;
    }

    // Draw Source Image or Demo into temp canvas if source is dirty
    if (this.sourceDirty) {
      this.drawSourceMedia(timestamp);
    }

    // Render ASCII Art on Main Canvas only when state/frame is dirty
    if (this.isDirty) {
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

    if (this.mediaType === 'demo') {
      this.drawDemoMedia(ctx, w, h, timestamp * this.playbackSpeed);
    } else if (this.mediaType === 'image' && this.sourceImage) {
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

    // Glowing Green Wave Trace
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ff66';
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

    const btnResetAll = document.getElementById('btn-reset-all-grading');
    if (btnResetAll) {
      btnResetAll.onclick = () => {
        this.liftX = 0; this.liftY = 0; this.liftLevel = 0;
        this.gammaX = 0; this.gammaY = 0; this.gammaLevel = 0;
        this.gainX = 0; this.gainY = 0; this.gainLevel = 0;
        this.temperature = 0; this.tint = 0; this.saturation = 100; this.hueRotate = 0;
        this.syncControlsToState();
        this.redrawAllColorWheels();
        this.markDirty();
        this.showToast(this.lang === 'ru' ? 'Все настройки грейдинга сброшены' : 'Color grading reset');
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
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#00ff66';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // -------------------------------------------------------------
  // DEEP COLOR GRADING PIPELINE (3-Way Lift/Gamma/Gain + Sat/Temp/Tint/Hue)
  // -------------------------------------------------------------
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
    effGainLvl: number
  ) {
    const totalPixels = cols * rows;

    const wheelToRgb = (x: number, y: number, level: number) => {
      const dist = Math.min(1.0, Math.hypot(x, y));
      const angle = Math.atan2(y, x);
      const r = dist * Math.cos(angle) + level * 0.01;
      const g = dist * Math.cos(angle - 2.094395) + level * 0.01;
      const b = dist * Math.cos(angle + 2.094395) + level * 0.01;
      return { r, g, b };
    };

    const liftRgb = wheelToRgb(this.liftX, this.liftY, effLiftLvl);
    const gammaRgb = wheelToRgb(this.gammaX, this.gammaY, effGammaLvl);
    const gainRgb = wheelToRgb(this.gainX, this.gainY, effGainLvl);

    const tempR = effTemp * 0.004;
    const tempB = -effTemp * 0.004;
    const tintG = -effTint * 0.004;
    const tintR = effTint * 0.002;
    const tintB = effTint * 0.002;

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
      let r = data[idx] * 0.003921568627;
      let g = data[idx + 1] * 0.003921568627;
      let b = data[idx + 2] * 0.003921568627;

      // Saturation
      const yLuma = 0.299 * r + 0.587 * g + 0.114 * b;
      r = yLuma + (r - yLuma) * satMult;
      g = yLuma + (g - yLuma) * satMult;
      b = yLuma + (b - yLuma) * satMult;

      // Hue Rotate
      if (effHue !== 0) {
        const nr = r * m00 + g * m01 + b * m02;
        const ng = r * m10 + g * m11 + b * m12;
        const nb = r * m20 + g * m21 + b * m22;
        r = nr;
        g = ng;
        b = nb;
      }

      // 3-Way Lift, Gamma, Gain
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const wLift = (1 - luma) * (1 - luma);
      const wGamma = 4 * luma * (1 - luma);
      const wGain = luma * luma;

      r += liftRgb.r * wLift + gammaRgb.r * wGamma + (r * gainRgb.r) * wGain + tempR + tintR;
      g += liftRgb.g * wLift + gammaRgb.g * wGamma + (g * gainRgb.g) * wGain + tintG;
      b += liftRgb.b * wLift + gammaRgb.b * wGamma + (b * gainRgb.b) * wGain + tempB + tintB;

      data[idx] = r < 0 ? 0 : r > 1 ? 255 : Math.round(r * 255);
      data[idx + 1] = g < 0 ? 0 : g > 1 ? 255 : Math.round(g * 255);
      data[idx + 2] = b < 0 ? 0 : b > 1 ? 255 : Math.round(b * 255);
    }
  }

  // -------------------------------------------------------------
  // DECODE ANIMATED GIF (Optimized streaming & hardware-accelerated compositing)
  // -------------------------------------------------------------
  async loadGifArrayBuffer(buffer: ArrayBuffer) {
    try {
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

      this.showToast(
        this.lang === 'ru'
          ? `Декодирование GIF (${numFrames} кадров)...`
          : `Decoding GIF (${numFrames} frames)...`
      );

      for (let i = 0; i < numFrames; i++) {
        // Yield to browser UI loop periodically to prevent page unresponsive freezes
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

      this.gifFrames = decodedFrames;
      this.gifCurrentFrameIndex = 0;
      this.gifLastFrameTime = performance.now();
      this.gifIsPlaying = true;
      this.mediaType = 'gif';
      this.markDirty(true);

      this.updateTimecode();
      this.showToast(
        this.lang === 'ru'
          ? `GIF загружен: ${numFrames} кадров (${width}×${height})`
          : `GIF loaded: ${numFrames} frames (${width}×${height})`
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

    const capturedFrames: ImageData[] = [];
    const totalFrames = 26;
    const captureDelay = 70;

    let frameIdx = 0;
    const targetW = this.mainCanvas.width;
    const targetH = this.mainCanvas.height;

    const maxDim = 460;
    let scale = 1;
    if (targetW > maxDim || targetH > maxDim) {
      scale = Math.min(maxDim / targetW, maxDim / targetH);
    }
    const gifW = Math.max(120, Math.round(targetW * scale));
    const gifH = Math.max(120, Math.round(targetH * scale));

    const gifTempCanvas = document.createElement('canvas');
    gifTempCanvas.width = gifW;
    gifTempCanvas.height = gifH;
    const gifTempCtx = gifTempCanvas.getContext('2d', { willReadFrequently: true })!;

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
              const palette = quantize(frameData, 256);
              const index = applyPalette(frameData, palette);
              gif.writeFrame(index, gifW, gifH, {
                palette,
                delay: captureDelay
              });
            }
            gif.finish();

            const buffer = gif.bytes();
            const blob = new Blob([buffer as any], { type: 'image/gif' });
            this.downloadBlob(blob, 'sacred_glyph_dither.gif');
            this.showToast(this.lang === 'ru' ? 'GIF файл успешно сохранен!' : 'GIF animation saved!');
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
  // ACTIVE GLYPH RAMP BUILDER (Curated sets or Manual input)
  // -------------------------------------------------------------
  getActiveGlyphArray(): string[] {
    let chars: string[];

    if (this.isManualActive && this.manualGlyphsText.trim().length > 0) {
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
    if (algo === 'floyd') {
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
    } else if (algo === 'atkinson') {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const oldVal = lums[i];
          const newVal = Math.round(oldVal * (qLevels - 1)) / (qLevels - 1);
          lums[i] = newVal;
          const err = (oldVal - newVal) * 0.125; // / 8

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
    } else if (algo === 'bayer4') {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const threshold = (BAYER_4X4[y % 4][x % 4] / 16.0) - 0.5;
          const val = lums[i] + threshold * (1.0 / (qLevels - 1));
          lums[i] = val < 0 ? 0 : val > 1 ? 1 : val;
        }
      }
    } else if (algo === 'bayer8') {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const threshold = (BAYER_8X8[y % 8][x % 8] / 64.0) - 0.5;
          const val = lums[i] + threshold * (1.0 / (qLevels - 1));
          lums[i] = val < 0 ? 0 : val > 1 ? 1 : val;
        }
      }
    } else if (algo === 'halftone') {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const cx = (x % 4) - 1.5;
          const cy = (y % 4) - 1.5;
          const dist = Math.sqrt(cx * cx + cy * cy) / 2.12;
          const threshold = dist - 0.5;
          const val = lums[i] + threshold * (1.0 / (qLevels - 1));
          lums[i] = val < 0 ? 0 : val > 1 ? 1 : val;
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
  // PRIMARY RASTER CRT CANVAS RENDERER (Optimized Hardware Execution)
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

    // Reuse persistent offscreen sampling canvas (zero DOM allocation churn)
    if (this.sampleCanvas.width !== cols || this.sampleCanvas.height !== rows) {
      this.sampleCanvas.width = cols;
      this.sampleCanvas.height = rows;
    }
    const sampleCtx = this.sampleCtx;

    // Pick source media
    let sourceMedia: CanvasImageSource = this.tempCanvas;
    let imgW = 640;
    let imgH = 480;

    if (this.mediaType === 'image' && this.sourceImage) {
      sourceMedia = this.sourceImage;
      imgW = (this.sourceImage as any).naturalWidth || (this.sourceImage as any).width || 640;
      imgH = (this.sourceImage as any).naturalHeight || (this.sourceImage as any).height || 480;
    } else if (this.mediaType === 'gif' && this.gifFrames.length > 0) {
      const frame = this.gifFrames[this.gifCurrentFrameIndex];
      sourceMedia = frame.canvas;
      imgW = frame.canvas.width;
      imgH = frame.canvas.height;
    } else {
      sourceMedia = this.tempCanvas;
      imgW = this.tempCanvas.width || 640;
      imgH = this.tempCanvas.height || 480;
    }

    // Mathematical projection to prevent squishing / distortion:
    const screenW = totalW;
    const screenH = totalH;
    let dw = screenW;
    let dh = screenH;
    let dx = 0;
    let dy = 0;

    if (this.fitMode === 'fit') {
      const scale = Math.min(screenW / imgW, screenH / imgH);
      dw = imgW * scale;
      dh = imgH * scale;
      dx = (screenW - dw) / 2;
      dy = (screenH - dh) / 2;
    } else if (this.fitMode === 'cover') {
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

    if (effRotation !== 0 || this.flipH || this.flipV) {
      sampleCtx.translate(cols / 2, rows / 2);
      if (effRotation !== 0) sampleCtx.rotate((effRotation * Math.PI) / 180);
      sampleCtx.scale(this.flipH ? -1 : 1, this.flipV ? -1 : 1);
      sampleCtx.translate(-cols / 2, -rows / 2);
    }

    if (this.fitMode === 'stretch') {
      sampleCtx.drawImage(sourceMedia, 0, 0, cols, rows);
    } else {
      sampleCtx.drawImage(sourceMedia, gridX, gridY, gridW, gridH);
    }
    sampleCtx.restore();

    const sampleImageData = sampleCtx.getImageData(0, 0, cols, rows);

    // Apply Deep 3-Way Color Grading & Temperature/Tint/Sat/Hue
    this.applyColorGrading(
      sampleImageData.data,
      cols,
      rows,
      effTemp,
      this.tint,
      effSat,
      effHueRotate,
      effLiftLevel,
      effGammaLevel,
      effGainLevel
    );

    const ditheredLums = this.applyDithering(
      sampleImageData,
      cols,
      rows,
      this.ditherAlgo,
      effDepth,
      effContrast,
      effBrightness,
      effGamma,
      effSharpness,
      effBlur
    );

    // Clear Canvas
    const ctx = this.ctx;
    ctx.clearRect(0, 0, totalW, totalH);

    if (!this.bgTransparent) {
      ctx.fillStyle = this.bgColor;
      ctx.fillRect(0, 0, totalW, totalH);
    }

    const glyphRamp = this.getActiveGlyphArray();
    const glyphCount = glyphRamp.length;

    const currentPalette = MEDIEVAL_PALETTES.find(p => p.id === this.paletteId) || MEDIEVAL_PALETTES[0];
    const paletteColors = currentPalette.colors;

    // HIGH-DENSITY ULTRA RESOLUTION PATH:
    // When cellW <= 2, render micro-pixel direct matrix via Uint32Array for crystal-clear HD & 60 FPS
    if (cellW <= 2) {
      if (!this.pixelImageData || this.pixelImageData.width !== totalW || this.pixelImageData.height !== totalH) {
        this.pixelImageData = ctx.createImageData(totalW, totalH);
      }
      const buf32 = new Uint32Array(this.pixelImageData.data.buffer);
      if (!this.bgTransparent) {
        const [bgR, bgG, bgB] = this.hexOrRgbToRgb(this.bgColor);
        const bgUint32 = (255 << 24) | (bgB << 16) | (bgG << 8) | bgR;
        buf32.fill(bgUint32);
      } else {
        buf32.fill(0);
      }

      const parsedPalette = paletteColors.map(c => this.hexOrRgbToRgb(c));
      const [sR, sG, sB] = this.hexOrRgbToRgb(this.singleColor);

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
          if (this.colorMode === 'rgb') {
            const pixelIdx = i * 4;
            r = sampleImageData.data[pixelIdx];
            g = sampleImageData.data[pixelIdx + 1];
            b = sampleImageData.data[pixelIdx + 2];
          } else if (this.colorMode === 'palette') {
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

      ctx.putImageData(this.pixelImageData, 0, 0);
    } else {
      // TYPOGRAPHY GLYPH PATH (cellW >= 3):
      const fontSize = Math.max(3, Math.round(cellH * 0.95));
      if (this.cachedFontSize !== fontSize) {
        this.cachedFontSize = fontSize;
        ctx.font = `bold ${fontSize}px var(--font-mono), monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
      }

      let lastFill = '';
      if (this.colorMode === 'single') {
        ctx.fillStyle = this.singleColor;
        lastFill = this.singleColor;
      }

      // Draw Character Grid with batched fillStyle changes
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

          // Color selection with state caching
          if (this.colorMode === 'palette') {
            const palIdx = Math.floor(lum * paletteColors.length);
            const col = paletteColors[Math.min(paletteColors.length - 1, Math.max(0, palIdx))];
            if (col !== lastFill) {
              ctx.fillStyle = col;
              lastFill = col;
            }
          } else if (this.colorMode === 'rgb') {
            const pixelIdx = i * 4;
            const r = sampleImageData.data[pixelIdx];
            const g = sampleImageData.data[pixelIdx + 1];
            const b = sampleImageData.data[pixelIdx + 2];
            const col = `rgb(${r},${g},${b})`;
            if (col !== lastFill) {
              ctx.fillStyle = col;
              lastFill = col;
            }
          }

          const posX = x * cellW + cellW / 2;
          ctx.fillText(char, posX, posY);
        }
      }
    }

    // Optional Grid Overlay (only visible when cells are large enough to be meaningful)
    if (this.showGrid && cellW >= 4) {
      ctx.strokeStyle = 'rgba(0, 255, 102, 0.15)';
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
  // PRESET MANAGEMENT
  // -------------------------------------------------------------
  initPresetsSelector() {
    const sel = document.getElementById('preset-selector') as HTMLSelectElement;
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = '';
    MASTER_PRESETS.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      if (p.name.includes('//')) {
        const parts = p.name.split('//').map(s => s.trim());
        opt.textContent = this.lang === 'ru' ? parts[0] : (parts[1] || parts[0]);
      } else {
        opt.textContent = this.lang === 'ru' ? (p.nameRu || p.name) : (p.nameEn || p.name);
      }
      sel.appendChild(opt);
    });
    if (currentVal) sel.value = currentVal;
    sel.onchange = () => this.applyPreset(sel.value);
  }

  applyPreset(presetId: string) {
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

    setVal('preset-selector', this.activeGlyphSetId);
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

    // Color Grading & 3-Way Color Wheels sync
    setVal('slider-lift-level', this.liftLevel);
    setText('val-lift-level', `${this.liftLevel}%`);
    setVal('slider-gamma-level', this.gammaLevel);
    setText('val-gamma-level', `${this.gammaLevel}%`);
    setVal('slider-gain-level', this.gainLevel);
    setText('val-gain-level', `${this.gainLevel}%`);

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
    setTxt('btn-download-app', t.saveApp);
    setTxt('btn-open-export', t.exportBtn);

    // Monitors & Scopes
    setTxt('i18n-mon1', t.mon1);
    setTxt('i18n-fit-lbl', t.fitLbl);
    setTxt('i18n-source-lbl', t.sourceLbl);
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

    // 3-Way Color Wheels
    setTxt('i18n-grade-title', t.gradeTitle);
    setTxt('i18n-lift-wheel-lbl', t.liftWheelLbl);
    setTxt('i18n-gamma-wheel-lbl', t.gammaWheelLbl);
    setTxt('i18n-gain-wheel-lbl', t.gainWheelLbl);
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
    setTxt('i18n-image-box-title', t.imageBoxTitle);
    setTxt('i18n-image-box-desc', t.imageBoxDesc);
    setTxt('i18n-image-download-btn', t.imageDownloadBtn);
    setTxt('i18n-image-format-lbl', t.imageFormatLbl);
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

    // Start Menu Modal & Header Launcher
    setTxt('i18n-start-title', t.startMenuTitle);
    setTxt('i18n-start-sub', t.startMenuSubtitle);
    setTxt('i18n-start-drop-title', t.startMenuDropTitle);
    setTxt('i18n-start-drop-desc', t.startMenuDropDesc);
    setTxt('i18n-start-browse-btn', t.startMenuBrowseBtn);
    setTxt('i18n-start-supported', t.startMenuSupported);
    setTxt('i18n-start-templates-title', t.startMenuTemplatesTitle);
    setTxt('i18n-start-demo1-title', t.startMenuDemo1Title);
    setTxt('i18n-start-demo1-desc', t.startMenuDemo1Desc);
    setTxt('i18n-start-demo2-title', t.startMenuDemo2Title);
    setTxt('i18n-start-demo2-desc', t.startMenuDemo2Desc);
    setTxt('i18n-start-blank-title', t.startMenuBlankTitle);
    setTxt('i18n-start-blank-desc', t.startMenuBlankDesc);
    setTxt('i18n-start-presets-title', t.startMenuPresetsTitle);
    setTxt('i18n-start-close-btn', t.startMenuCloseBtn);
    setTxt('i18n-start-show-lbl', t.startMenuShowOnBoot);
    setTxt('i18n-start-tip', t.startMenuTip);
    setTxt('i18n-btn-start-menu', t.btnStartMenuHeader);
    setTxt('i18n-btn-header-file', t.btnHeaderOpenFile);

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
    setTitle('btn-open-start-menu', t.startMenuTooltip);
    setTitle('btn-header-open-file', t.headerOpenFileTooltip);
    setTitle('start-menu-brand', t.brandTooltip);
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
      'demo-source-selector': {
        hermetic_sigil: { ru: 'ДЕМО 1: ГЕРМЕТИЧЕСКАЯ ПЕЧАТЬ (LFO АНИМАЦИЯ)', en: 'DEMO 1: HERMETIC SIGIL (LFO ANIMATION)' },
        abyssal_flame: { ru: 'ДЕМО 2: ПЛАМЯ БЕЗДНЫ (ЧАСТИЦЫ)', en: 'DEMO 2: ABYSSAL FLAME (PARTICLES)' }
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
        floyd: { ru: 'FLOYD-STEINBERG (ДИФФУЗИЯ ОШИБКИ)', en: 'FLOYD-STEINBERG (DIFFUSION)' },
        bayer4: { ru: 'BAYER 4×4 (УПОРЯДОЧЕННЫЙ)', en: 'BAYER 4×4 (ORDERED)' },
        bayer8: { ru: 'BAYER 8×8 (ТОНКИЙ МАТРИЧНЫЙ)', en: 'BAYER 8×8 (FINE MATRIX)' },
        atkinson: { ru: 'ATKINSON (ЧЕТКИЙ MACINTOSH)', en: 'ATKINSON (MACINTOSH)' },
        halftone: { ru: 'HALFTONE DOT (РАСТРОВАЯ ТОЧКА)', en: 'HALFTONE DOT SCREEN' }
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
          const v = parseFloat(slider.value);
          setter(v);
          this.markDirty();
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

    // Demo Source Select (Only hermetic_sigil & abyssal_flame!)
    const selDemo = document.getElementById('demo-media-select') as HTMLSelectElement;
    if (selDemo) {
      selDemo.onchange = () => {
        this.activeDemoMedia = selDemo.value as any;
        this.mediaType = 'demo';
        this.markDirty(true);
        this.showToast(this.lang === 'ru' ? 'Источник: ' + selDemo.value : 'Source: ' + selDemo.value);
      };
    }

    // Manual Glyph Input (Request 6)
    const manualInput = document.getElementById('manual-glyph-input') as HTMLInputElement;
    if (manualInput) {
      manualInput.oninput = () => {
        this.manualGlyphsText = manualInput.value;
        this.isManualActive = true;
        this.updateLiveGlyphRibbon();
        this.markDirty();
      };
    }

    const btnReverse = document.getElementById('btn-reverse-glyphs');
    if (btnReverse) {
      btnReverse.onclick = () => {
        const chars = Array.from(this.manualGlyphsText).reverse().join('');
        this.manualGlyphsText = chars;
        this.isManualActive = true;
        if (manualInput) manualInput.value = chars;
        this.updateLiveGlyphRibbon();
        this.markDirty();
        this.showToast(this.lang === 'ru' ? 'Порядок символов инвертирован' : 'Glyph order reversed');
      };
    }

    const btnResetSet = document.getElementById('btn-reset-to-set');
    if (btnResetSet) {
      btnResetSet.onclick = () => {
        const setObj = GLYPH_SETS.find(s => s.id === this.activeGlyphSetId) || GLYPH_SETS[0];
        this.manualGlyphsText = setObj.glyphs;
        this.isManualActive = false;
        if (manualInput) manualInput.value = setObj.glyphs;
        this.updateLiveGlyphRibbon();
        this.markDirty();
        this.showToast(this.lang === 'ru' ? 'Восстановлен набор: ' + setObj.name : 'Reset to set: ' + setObj.name);
      };
    }

    const btnClearManual = document.getElementById('btn-clear-glyphs');
    if (btnClearManual) {
      btnClearManual.onclick = () => {
        this.manualGlyphsText = ' ';
        this.isManualActive = true;
        if (manualInput) manualInput.value = ' ';
        this.updateLiveGlyphRibbon();
        this.markDirty();
      };
    }

    const btnCopyManual = document.getElementById('btn-copy-glyphs');
    if (btnCopyManual) {
      btnCopyManual.onclick = () => {
        navigator.clipboard.writeText(this.manualGlyphsText).then(() => {
          this.showToast(this.lang === 'ru' ? 'Символы скопированы в буфер!' : 'Glyphs copied to clipboard!');
        });
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

    // Top Header Buttons
    const btnTheme = document.getElementById('btn-toggle-theme');
    if (btnTheme) btnTheme.onclick = () => this.applyTheme(this.theme === 'light' ? 'dark' : 'light');

    const btnLang = document.getElementById('btn-toggle-lang');
    if (btnLang) btnLang.onclick = () => this.setLanguage(this.lang === 'ru' ? 'en' : 'ru');

    const btnDownApp = document.getElementById('btn-download-app');
    if (btnDownApp) btnDownApp.onclick = () => this.downloadStandaloneHtml();

    const btnOpenExport = document.getElementById('btn-open-export');
    if (btnOpenExport) btnOpenExport.onclick = () => this.openExportModal();

    // Launcher / Start Menu Open Button
    const btnOpenStartMenu = document.getElementById('btn-open-start-menu');
    if (btnOpenStartMenu) btnOpenStartMenu.onclick = () => this.openStartMenu();

    const btnCloseStartMenu = document.getElementById('btn-close-start-menu');
    if (btnCloseStartMenu) btnCloseStartMenu.onclick = () => this.closeStartMenu();

    const btnDismissStartMenu = document.getElementById('btn-dismiss-start-menu');
    if (btnDismissStartMenu) btnDismissStartMenu.onclick = () => this.closeStartMenu();

    // File Ingest Trigger
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    const btnUpload = document.getElementById('btn-upload-file');
    if (btnUpload && fileInput) btnUpload.onclick = () => fileInput.click();

    const btnHeaderOpenFile = document.getElementById('btn-header-open-file');
    if (btnHeaderOpenFile && fileInput) btnHeaderOpenFile.onclick = () => fileInput.click();

    if (fileInput) {
      fileInput.onchange = (e: any) => {
        const file = e.target.files && e.target.files[0];
        if (file) this.handleFileIngest(file);
      };
    }

    // Start Menu Ingest & Browse
    const startFileInput = document.getElementById('start-menu-file-input') as HTMLInputElement;
    const btnStartBrowse = document.getElementById('btn-start-browse');
    if (btnStartBrowse) {
      btnStartBrowse.onclick = (e) => {
        e.stopPropagation();
        if (startFileInput) startFileInput.click();
        else if (fileInput) fileInput.click();
      };
    }
    if (startFileInput) {
      startFileInput.onchange = (e: any) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          this.handleFileIngest(file);
          this.closeStartMenu();
        }
      };
    }

    // Start Menu Drag & Drop Zone
    const startDrop = document.getElementById('start-menu-drop-zone');
    if (startDrop) {
      startDrop.onclick = (e) => {
        if ((e.target as HTMLElement).tagName !== 'BUTTON') {
          if (startFileInput) startFileInput.click();
          else if (fileInput) fileInput.click();
        }
      };
      startDrop.ondragover = e => {
        e.preventDefault();
        startDrop.classList.add('dragover');
      };
      startDrop.ondragleave = e => {
        e.preventDefault();
        startDrop.classList.remove('dragover');
      };
      startDrop.ondrop = e => {
        e.preventDefault();
        startDrop.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleFileIngest(e.dataTransfer.files[0]);
          this.closeStartMenu();
        }
      };
    }

    // Start Menu Quick Start Samples
    const cardDemo1 = document.getElementById('card-start-demo1');
    if (cardDemo1) {
      cardDemo1.onclick = () => {
        this.activeDemoMedia = 'hermetic_sigil';
        this.mediaType = 'demo';
        const selDemo = document.getElementById('demo-media-select') as HTMLSelectElement;
        if (selDemo) selDemo.value = 'hermetic_sigil';
        this.markDirty(true);
        this.closeStartMenu();
        this.showToast(this.lang === 'ru' ? 'Загружено: Герметическая Печать' : 'Loaded: Hermetic Sigil');
      };
    }

    const cardDemo2 = document.getElementById('card-start-demo2');
    if (cardDemo2) {
      cardDemo2.onclick = () => {
        this.activeDemoMedia = 'abyssal_flame';
        this.mediaType = 'demo';
        const selDemo = document.getElementById('demo-media-select') as HTMLSelectElement;
        if (selDemo) selDemo.value = 'abyssal_flame';
        this.markDirty(true);
        this.closeStartMenu();
        this.showToast(this.lang === 'ru' ? 'Загружено: Пламя Бездны' : 'Loaded: Abyssal Flame');
      };
    }

    const cardBlank = document.getElementById('card-start-blank');
    if (cardBlank) {
      cardBlank.onclick = () => {
        const blankC = document.createElement('canvas');
        blankC.width = 640;
        blankC.height = 480;
        const bCtx = blankC.getContext('2d');
        if (bCtx) {
          bCtx.fillStyle = '#0a0c0a';
          bCtx.fillRect(0, 0, 640, 480);
          bCtx.strokeStyle = 'rgba(0, 255, 102, 0.2)';
          bCtx.lineWidth = 1;
          bCtx.strokeRect(32, 32, 576, 416);
        }
        const img = new Image();
        img.src = blankC.toDataURL();
        img.onload = () => {
          this.sourceImage = img;
          this.mediaType = 'image';
          this.markDirty(true);
        };
        this.closeStartMenu();
        this.showToast(this.lang === 'ru' ? 'Создан новый пустой холст' : 'Created new blank canvas');
      };
    }

    // Start Menu Style Presets Chips
    document.querySelectorAll('.start-preset-chip').forEach(el => {
      el.addEventListener('click', () => {
        const presetId = el.getAttribute('data-preset');
        if (presetId) {
          this.applyPreset(presetId);
          const sel = document.getElementById('preset-selector') as HTMLSelectElement;
          if (sel) sel.value = presetId;
        }
        this.closeStartMenu();
      });
    });

    // Start Menu Show on Boot Checkbox
    const checkBoot = document.getElementById('check-show-start-on-boot') as HTMLInputElement;
    if (checkBoot) {
      const saved = localStorage.getItem('sg_show_start_on_boot');
      checkBoot.checked = saved !== 'false';
      checkBoot.onchange = () => {
        localStorage.setItem('sg_show_start_on_boot', checkBoot.checked ? 'true' : 'false');
      };
    }

    // Global Keyboard Shortcuts (F1, Escape, Ctrl+O)
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        const modal = document.getElementById('start-menu-modal');
        if (modal && modal.style.display !== 'none') {
          this.closeStartMenu();
        } else {
          this.openStartMenu();
        }
      } else if (e.key === 'Escape') {
        const startModal = document.getElementById('start-menu-modal');
        if (startModal && startModal.style.display !== 'none') {
          this.closeStartMenu();
          return;
        }
        const expModal = document.getElementById('export-modal');
        if (expModal && expModal.style.display !== 'none') {
          this.closeExportModal();
          return;
        }
        const presetModal = document.getElementById('save-preset-modal');
        if (presetModal && presetModal.style.display !== 'none') {
          presetModal.style.display = 'none';
          return;
        }
        const inspectModal = document.getElementById('glyph-inspect-modal');
        if (inspectModal && inspectModal.style.display !== 'none') {
          inspectModal.style.display = 'none';
          return;
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        if (fileInput) fileInput.click();
      }
    });

    // Drag and Drop Ingest
    const dropArea = document.getElementById('canvas-container');
    if (dropArea) {
      dropArea.ondragover = e => {
        e.preventDefault();
        const dropOverlay = document.getElementById('drop-zone-overlay');
        if (dropOverlay) dropOverlay.classList.add('visible');
      };
      dropArea.ondragleave = e => {
        e.preventDefault();
        const dropOverlay = document.getElementById('drop-zone-overlay');
        if (dropOverlay) dropOverlay.classList.remove('visible');
      };
      dropArea.ondrop = e => {
        e.preventDefault();
        const dropOverlay = document.getElementById('drop-zone-overlay');
        if (dropOverlay) dropOverlay.classList.remove('visible');
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
  }

  // -------------------------------------------------------------
  // FILE INGEST DISPATCHER (GIF, PNG, JPG, WEBP, MP4)
  // -------------------------------------------------------------
  handleFileIngest(file: File) {
    const name = file.name.toLowerCase();
    this.showToast((this.lang === 'ru' ? 'Загрузка: ' : 'Ingesting: ') + file.name);

    if (name.endsWith('.gif') || file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onload = e => {
        if (e.target && e.target.result) {
          this.loadGifArrayBuffer(e.target.result as ArrayBuffer);
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => {
        if (e.target && e.target.result) {
          const img = new Image();
          img.onload = () => {
            // Keep full original uncompressed resolution and natural aspect ratio
            this.sourceImage = img;
            this.mediaType = 'image';
            this.sourceDirty = true;
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
      this.mediaType = 'image';
      this.markDirty(true);
      this.showToast(this.lang === 'ru' ? 'Видео поток подключен' : 'Video stream loaded');
    }
  }

  // -------------------------------------------------------------
  // START MENU LAUNCHER (GRAPHIC EDITOR STYLE)
  // -------------------------------------------------------------
  openStartMenu() {
    const modal = document.getElementById('start-menu-modal');
    if (modal) {
      modal.style.display = 'flex';
      if ((window as any).sacredGlyphBrand) {
        (window as any).sacredGlyphBrand.refresh();
      }
    }
  }

  closeStartMenu() {
    const modal = document.getElementById('start-menu-modal');
    if (modal) {
      modal.style.display = 'none';
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
    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const ext = format === 'jpeg' ? 'jpg' : 'png';
    const dataUrl = this.mainCanvas.toDataURL(mime, 0.95);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `wraithsword_artwork.${ext}`;
    link.click();
    this.showToast(this.lang === 'ru' ? `Изображение (${ext.toUpperCase()}) сохранено!` : `Image saved as ${ext.toUpperCase()}!`);
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
    (window as any).scriptSlayerEngine = new ScriptSlayerEngine();
    (window as any).sacredGlyphBrand = initSacredGlyphBrand('start-menu-brand');
  });
}
