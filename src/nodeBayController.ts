import { MultiEngineWorkstation, RotaryKnobConfig, PatchCable } from './multiEngine';

export class NodeBayController {
  private multiEngine: MultiEngineWorkstation;
  private containerEl: HTMLElement | null = null;
  private svgEl: SVGSVGElement | null = null;
  private onRenderNeeded: () => void;

  // Dragging state for nodes
  private draggingNode: { id: string; startMouseX: number; startMouseY: number; startNodeX: number; startNodeY: number } | null = null;

  // Dragging state for cables
  private draggingCable: {
    fromPortId: string;
    fromX: number;
    fromY: number;
    curX: number;
    curY: number;
    type: 'signal' | 'modulation';
  } | null = null;

  // Active knob dragging
  private draggingKnob: {
    id: string;
    startY: number;
    startVal: number;
    knobConfig: RotaryKnobConfig;
    el: HTMLElement;
  } | null = null;

  constructor(multiEngine: MultiEngineWorkstation, onRenderNeeded: () => void) {
    this.multiEngine = multiEngine;
    this.onRenderNeeded = onRenderNeeded;
  }

  mount(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) return;
    this.containerEl = el;

    this.renderBayHtml();
    this.attachEventListeners();
    this.updateAllKnobsVisuals();
    this.renderCables();
  }

  private renderBayHtml() {
    if (!this.containerEl) return;

    this.containerEl.innerHTML = `
      <!-- Modular Bay Header Toolbar -->
      <div class="node-bay-toolbar">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="vfd-label" style="color: var(--vfd-green); font-size: 13px;">[МОДУЛЬНЫЙ НОД-ЭДИТОР // 5 GRAPHIC ENGINES]</span>
          <span class="hw-led active-green"></span>
        </div>

        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          <button type="button" class="hw-btn hw-btn-green node-add-btn" data-node="shadr" title="Добавить ноду генеративной математики SHADR">+ SHADR</button>
          <button type="button" class="hw-btn hw-btn-green node-add-btn" data-node="aikizi" title="Добавить ноду органического шума AIKIZI">+ AIKIZI</button>
          <button type="button" class="hw-btn hw-btn-amber node-add-btn" data-node="lfo" title="Добавить LFO Модулятор MODULY">+ MODULY LFO</button>
          <button type="button" class="hw-btn hw-btn-green node-add-btn" data-node="neue" title="Добавить ноду вариативной тайпографики NEUE">+ NEUE TYPO</button>
          <button type="button" class="hw-btn hw-btn-red node-add-btn" data-node="glch" title="Добавить аппаратный глитч GLCHLAB">+ GLCH</button>
          <button type="button" class="hw-btn" id="btn-reset-wires" style="padding: 4px 8px; font-size: 11px;" title="Восстановить исходные соединения проводов">↺ ПРОВОДА</button>
        </div>
      </div>

      <!-- Patchbay Surface Canvas -->
      <div class="node-bay-canvas" id="node-bay-canvas">
        <!-- SVG Canvas for Curved Analog Patch Cables with Droop & Pulses -->
        <svg class="patch-cables-svg" id="patch-cables-svg"></svg>

        <!-- 1. INGEST SOURCE NODE -->
        <div class="analog-node-card" id="node-source" style="left: 18px; top: 16px;">
          <div class="node-card-header">
            <div style="display: flex; align-items: center; gap: 5px;">
              <span class="hw-led active-amber"></span>
              <span class="node-title">INGEST SOURCE</span>
            </div>
            <span class="node-badge">VIDEO/IMAGE</span>
          </div>
          <div class="node-card-body">
            <div style="font-size: 11px; color: var(--text-dim); margin-bottom: 6px;">
              Источник сигнала: Загруженная GIF, изображение или демо-сигнал.
            </div>
            <div class="node-ports-row" style="justify-content: flex-end;">
              <div class="jack-port-wrap">
                <span class="jack-label">OUT</span>
                <div class="hw-jack jack-signal-out" id="port-source-out" data-port="port-source-out" data-node="node-source" data-type="signal_out" title="Signal Output (Drag wire to another node)"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. SHADR STUDIO GENERATOR NODE -->
        <div class="analog-node-card" id="node-shadr" style="left: 18px; top: 175px;">
          <div class="node-card-header">
            <div style="display: flex; align-items: center; gap: 5px;">
              <span class="hw-led" id="led-shadr"></span>
              <span class="node-title">SHADR GENERATOR</span>
            </div>
            <label class="toggle-switch" style="width: 32px; height: 16px;">
              <input type="checkbox" id="toggle-shadr-active" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="node-card-body">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span class="jack-label" style="font-size: 10px;">ФОРМУЛА:</span>
              <select id="select-shadr-formula" class="hardware-select" style="font-size: 11px; padding: 2px 4px;">
                <option value="plasma" selected>ПЛАЗМА (PLASMA)</option>
                <option value="julia">ФРАКТАЛ (JULIA)</option>
                <option value="moire">МУАР (MOIRE)</option>
                <option value="torus">ТОР (TORUS)</option>
              </select>
            </div>

            <div class="knobs-row">
              <!-- SINE SPEED KNOB -->
              <div class="rotary-knob-unit" data-knob="shadr-speed">
                <div class="rotary-dial" id="knob-shadr-speed" title="SINE SPEED: Скорость анимации волн">
                  <div class="knob-pointer"></div>
                </div>
                <span class="knob-name">SINE SPEED</span>
                <span class="knob-val-readout" id="val-shadr-speed">1.2x</span>
                <div class="hw-jack jack-mod-in" id="modjack-shadr-speed" data-port="modjack-shadr-speed" data-knob="shadr-speed" data-type="mod_in" title="Modulation Jack (Plug LFO wire here)"></div>
              </div>

              <!-- FREQ KNOB -->
              <div class="rotary-knob-unit" data-knob="shadr-freq">
                <div class="rotary-dial" id="knob-shadr-freq" title="FREQ: Частота фрактала/интерференции">
                  <div class="knob-pointer"></div>
                </div>
                <span class="knob-name">FREQ</span>
                <span class="knob-val-readout" id="val-shadr-freq">4.0Hz</span>
                <div class="hw-jack jack-mod-in" id="modjack-shadr-freq" data-port="modjack-shadr-freq" data-knob="shadr-freq" data-type="mod_in" title="Modulation Jack (Plug LFO wire here)"></div>
              </div>

              <!-- FEEDBACK KNOB -->
              <div class="rotary-knob-unit" data-knob="shadr-fb">
                <div class="rotary-dial" id="knob-shadr-fb" title="FEEDBACK: Эффект шлейфа / эха кадра">
                  <div class="knob-pointer"></div>
                </div>
                <span class="knob-name">FEEDBACK</span>
                <span class="knob-val-readout" id="val-shadr-fb">65%</span>
                <div class="hw-jack jack-mod-in" id="modjack-shadr-fb" data-port="modjack-shadr-fb" data-knob="shadr-fb" data-type="mod_in" title="Modulation Jack (Plug LFO wire here)"></div>
              </div>
            </div>

            <div class="node-ports-row" style="justify-content: flex-end; margin-top: 6px;">
              <div class="jack-port-wrap">
                <span class="jack-label">OUT</span>
                <div class="hw-jack jack-signal-out" id="port-shadr-out" data-port="port-shadr-out" data-node="node-shadr" data-type="signal_out" title="Signal Output"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. AIKIZI LAB NOISE NODE -->
        <div class="analog-node-card" id="node-aikizi" style="left: 260px; top: 16px;">
          <div class="node-card-header">
            <div style="display: flex; align-items: center; gap: 5px;">
              <span class="hw-led active-green" id="led-aikizi"></span>
              <span class="node-title">AIKIZI NOISE</span>
            </div>
            <label class="toggle-switch" style="width: 32px; height: 16px;">
              <input type="checkbox" id="toggle-aikizi-active" checked />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="node-card-body">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span class="jack-label" style="font-size: 10px;">РЕЖИМ:</span>
              <select id="select-aikizi-mode" class="hardware-select" style="font-size: 11px; padding: 2px 4px;">
                <option value="overlay" selected>GRAIN (ЗЕРНО)</option>
                <option value="smoke">SMOKE (ДЫМ)</option>
                <option value="add">ADD (СВЕЧЕНИЕ)</option>
                <option value="displace">DISPLACE (СДВИГ)</option>
              </select>
            </div>

            <div class="knobs-row">
              <!-- NOISE SCALE KNOB -->
              <div class="rotary-knob-unit" data-knob="aikizi-scale">
                <div class="rotary-dial" id="knob-aikizi-scale" title="NOISE SCALE: Размер зерна/шума">
                  <div class="knob-pointer"></div>
                </div>
                <span class="knob-name">NOISE SCALE</span>
                <span class="knob-val-readout" id="val-aikizi-scale">14px</span>
                <div class="hw-jack jack-mod-in" id="modjack-aikizi-scale" data-port="modjack-aikizi-scale" data-knob="aikizi-scale" data-type="mod_in" title="Modulation Jack"></div>
              </div>

              <!-- EVOLUTION KNOB -->
              <div class="rotary-knob-unit" data-knob="aikizi-evol">
                <div class="rotary-dial" id="knob-aikizi-evol" title="EVOLUTION: Скорость изменения шума">
                  <div class="knob-pointer"></div>
                </div>
                <span class="knob-name">EVOLUTION</span>
                <span class="knob-val-readout" id="val-aikizi-evol">1.0spd</span>
                <div class="hw-jack jack-mod-in" id="modjack-aikizi-evol" data-port="modjack-aikizi-evol" data-knob="aikizi-evol" data-type="mod_in" title="Modulation Jack"></div>
              </div>
            </div>

            <div class="node-ports-row" style="margin-top: 6px;">
              <div class="jack-port-wrap">
                <span class="jack-label">IN</span>
                <div class="hw-jack jack-signal-in" id="port-aikizi-in" data-port="port-aikizi-in" data-node="node-aikizi" data-type="signal_in" title="Signal Input"></div>
              </div>
              <div class="jack-port-wrap">
                <span class="jack-label">OUT</span>
                <div class="hw-jack jack-signal-out" id="port-aikizi-out" data-port="port-aikizi-out" data-node="node-aikizi" data-type="signal_out" title="Signal Output"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. GLCHLAB GLITCH PROCESSOR NODE -->
        <div class="analog-node-card" id="node-glch" style="left: 260px; top: 220px;">
          <div class="node-card-header">
            <div style="display: flex; align-items: center; gap: 5px;">
              <span class="hw-led active-red" id="led-glch"></span>
              <span class="node-title">GLCH PROCESSOR</span>
            </div>
            <label class="toggle-switch" style="width: 32px; height: 16px;">
              <input type="checkbox" id="toggle-glch-active" checked />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="node-card-body">
            <div class="knobs-row">
              <!-- DATAMOSH KNOB -->
              <div class="rotary-knob-unit" data-knob="glch-mosh">
                <div class="rotary-dial" id="knob-glch-mosh" title="DATAMOSH: Сдвиг блоков пикселей">
                  <div class="knob-pointer"></div>
                </div>
                <span class="knob-name">DATAMOSH</span>
                <span class="knob-val-readout" id="val-glch-mosh">25%</span>
                <div class="hw-jack jack-mod-in" id="modjack-glch-mosh" data-port="modjack-glch-mosh" data-knob="glch-mosh" data-type="mod_in" title="Modulation Jack"></div>
              </div>

              <!-- SCAN-CORRUPTION KNOB -->
              <div class="rotary-knob-unit" data-knob="glch-corrupt">
                <div class="rotary-dial" id="knob-glch-corrupt" title="SCAN-CORRUPTION: Выпадение строк текста">
                  <div class="knob-pointer"></div>
                </div>
                <span class="knob-name">CORRUPT</span>
                <span class="knob-val-readout" id="val-glch-corrupt">15%</span>
                <div class="hw-jack jack-mod-in" id="modjack-glch-corrupt" data-port="modjack-glch-corrupt" data-knob="glch-corrupt" data-type="mod_in" title="Modulation Jack"></div>
              </div>

              <!-- RGB SHIFT KNOB -->
              <div class="rotary-knob-unit" data-knob="glch-rgb">
                <div class="rotary-dial" id="knob-glch-rgb" title="RGB SHIFT: Хроматическая аберрация">
                  <div class="knob-pointer"></div>
                </div>
                <span class="knob-name">RGB SHIFT</span>
                <span class="knob-val-readout" id="val-glch-rgb">4px</span>
                <div class="hw-jack jack-mod-in" id="modjack-glch-rgb" data-port="modjack-glch-rgb" data-knob="glch-rgb" data-type="mod_in" title="Modulation Jack"></div>
              </div>
            </div>

            <div class="node-ports-row" style="margin-top: 6px;">
              <div class="jack-port-wrap">
                <span class="jack-label">IN</span>
                <div class="hw-jack jack-signal-in" id="port-glch-in" data-port="port-glch-in" data-node="node-glch" data-type="signal_in" title="Signal Input"></div>
              </div>
              <div class="jack-port-wrap">
                <span class="jack-label">OUT</span>
                <div class="hw-jack jack-signal-out" id="port-glch-out" data-port="port-glch-out" data-node="node-glch" data-type="signal_out" title="Signal Output"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 5. MAKE NEUE WORLD ENGINE (NEUE TYPO) -->
        <div class="analog-node-card" id="node-typo" style="left: 505px; top: 16px;">
          <div class="node-card-header">
            <div style="display: flex; align-items: center; gap: 5px;">
              <span class="hw-led" id="led-typo"></span>
              <span class="node-title">NEUE TYPO</span>
            </div>
            <label class="toggle-switch" style="width: 32px; height: 16px;">
              <input type="checkbox" id="toggle-typo-active" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="node-card-body">
            <div style="font-size: 11px; color: var(--text-dim); margin-bottom: 6px;">
              Динамический масштаб символов по яркости &amp; разлетающийся/жидкий текст.
            </div>

            <div class="knobs-row">
              <!-- SCALE DYN KNOB -->
              <div class="rotary-knob-unit" data-knob="typo-scale">
                <div class="rotary-dial" id="knob-typo-scale" title="SCALE DYN: Динамический масштаб шрифта от яркости">
                  <div class="knob-pointer"></div>
                </div>
                <span class="knob-name">SCALE DYN</span>
                <span class="knob-val-readout" id="val-typo-scale">1.0x</span>
                <div class="hw-jack jack-mod-in" id="modjack-typo-scale" data-port="modjack-typo-scale" data-knob="typo-scale" data-type="mod_in" title="Modulation Jack"></div>
              </div>

              <!-- X/Y SCATTER KNOB -->
              <div class="rotary-knob-unit" data-knob="typo-scatter">
                <div class="rotary-dial" id="knob-typo-scatter" title="X/Y SCATTER: Разлет и смещение символов">
                  <div class="knob-pointer"></div>
                </div>
                <span class="knob-name">SCATTER</span>
                <span class="knob-val-readout" id="val-typo-scatter">6px</span>
                <div class="hw-jack jack-mod-in" id="modjack-typo-scatter" data-port="modjack-typo-scatter" data-knob="typo-scatter" data-type="mod_in" title="Modulation Jack"></div>
              </div>
            </div>

            <div class="node-ports-row" style="margin-top: 6px;">
              <div class="jack-port-wrap">
                <span class="jack-label">IN</span>
                <div class="hw-jack jack-signal-in" id="port-typo-in" data-port="port-typo-in" data-node="node-typo" data-type="signal_in" title="Signal Input"></div>
              </div>
              <div class="jack-port-wrap">
                <span class="jack-label">OUT</span>
                <div class="hw-jack jack-signal-out" id="port-typo-out" data-port="port-typo-out" data-node="node-typo" data-type="signal_out" title="Signal Output"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 6. MODULY ENGINE (LFO MODULATOR NODE) -->
        <div class="analog-node-card" id="node-lfo1" style="left: 505px; top: 220px; border-color: #00e5ff;">
          <div class="node-card-header" style="background: rgba(0, 229, 255, 0.12);">
            <div style="display: flex; align-items: center; gap: 5px;">
              <span class="hw-led active-blue" id="led-lfo1"></span>
              <span class="node-title" style="color: #00e5ff;">LFO MODULATOR</span>
            </div>
            <span class="node-badge" style="color: #00e5ff; border-color: #00e5ff;">MODULY</span>
          </div>
          <div class="node-card-body">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span class="jack-label" style="font-size: 10px; color: #00e5ff;">ВОЛНА:</span>
              <select id="select-lfo1-wave" class="hardware-select" style="font-size: 11px; padding: 2px 4px; color: #00e5ff;">
                <option value="sine" selected>СИНУС (SINE)</option>
                <option value="triangle">ТРЕУГОЛЬНИК</option>
                <option value="square">МЕАНДР</option>
                <option value="saw">ПИЛА ВВЕРХ</option>
                <option value="random_glitch">S&amp;H ГЛИТЧ</option>
                <option value="lorenz">ХАОС ЛОРЕНЦА</option>
              </select>
            </div>

            <div class="knobs-row">
              <!-- RATE KNOB -->
              <div class="rotary-knob-unit" data-knob="lfo1-rate">
                <div class="rotary-dial knob-dial-cyan" id="knob-lfo1-rate" title="RATE: Скорость циклической модуляции">
                  <div class="knob-pointer"></div>
                </div>
                <span class="knob-name" style="color: #00e5ff;">RATE</span>
                <span class="knob-val-readout" id="val-lfo1-rate">1.2Hz</span>
              </div>

              <!-- DEPTH KNOB -->
              <div class="rotary-knob-unit" data-knob="lfo1-depth">
                <div class="rotary-dial knob-dial-cyan" id="knob-lfo1-depth" title="DEPTH: Глубина воздействия на крутилку">
                  <div class="knob-pointer"></div>
                </div>
                <span class="knob-name" style="color: #00e5ff;">DEPTH</span>
                <span class="knob-val-readout" id="val-lfo1-depth">60%</span>
              </div>
            </div>

            <div class="node-ports-row" style="justify-content: space-between; align-items: center; margin-top: 6px;">
              <span style="font-size: 10px; color: #00e5ff; font-family: var(--font-mono);" id="lfo-target-readout">→ RGB SHIFT</span>
              <div class="jack-port-wrap">
                <span class="jack-label" style="color: #00e5ff;">MOD OUT</span>
                <div class="hw-jack jack-mod-out" id="port-lfo1-out" data-port="port-lfo1-out" data-node="node-lfo1" data-type="mod_out" title="Drag wire from here to ANY rotary knob [MOD] jack to modulate it!"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 7. CRT SINK NODE (FINAL MASTER OUTPUT) -->
        <div class="analog-node-card" id="node-sink" style="left: 745px; top: 120px; border-color: var(--vfd-green);">
          <div class="node-card-header" style="background: rgba(0, 255, 102, 0.12);">
            <div style="display: flex; align-items: center; gap: 5px;">
              <span class="hw-led active-green"></span>
              <span class="node-title" style="color: var(--vfd-green);">CRT SINK</span>
            </div>
            <span class="node-badge" style="color: var(--vfd-green); border-color: var(--vfd-green);">MASTER</span>
          </div>
          <div class="node-card-body">
            <div style="font-size: 11px; color: var(--text-dim); margin-bottom: 6px;">
              Финальный вывод растра на основной экран CRT Monitor 1.
            </div>
            <div class="node-ports-row">
              <div class="jack-port-wrap">
                <span class="jack-label">IN</span>
                <div class="hw-jack jack-signal-in" id="port-sink-in" data-port="port-sink-in" data-node="node-sink" data-type="signal_in" title="Master Display Input"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.svgEl = document.getElementById('patch-cables-svg') as unknown as SVGSVGElement;
  }

  private attachEventListeners() {
    if (!this.containerEl) return;

    // Toggle switch listeners for engines
    const toggleShadr = document.getElementById('toggle-shadr-active') as HTMLInputElement;
    if (toggleShadr) {
      toggleShadr.addEventListener('change', () => {
        this.multiEngine.shadr.active = toggleShadr.checked;
        const led = document.getElementById('led-shadr');
        if (led) led.className = toggleShadr.checked ? 'hw-led active-green' : 'hw-led';
        this.onRenderNeeded();
      });
    }

    const selectShadrFormula = document.getElementById('select-shadr-formula') as HTMLSelectElement;
    if (selectShadrFormula) {
      selectShadrFormula.addEventListener('change', () => {
        this.multiEngine.shadr.formula = selectShadrFormula.value as any;
        this.multiEngine.shadr.resetFeedback();
        this.onRenderNeeded();
      });
    }

    const toggleAikizi = document.getElementById('toggle-aikizi-active') as HTMLInputElement;
    if (toggleAikizi) {
      toggleAikizi.addEventListener('change', () => {
        this.multiEngine.aikizi.active = toggleAikizi.checked;
        const led = document.getElementById('led-aikizi');
        if (led) led.className = toggleAikizi.checked ? 'hw-led active-green' : 'hw-led';
        this.onRenderNeeded();
      });
    }

    const selectAikiziMode = document.getElementById('select-aikizi-mode') as HTMLSelectElement;
    if (selectAikiziMode) {
      selectAikiziMode.addEventListener('change', () => {
        this.multiEngine.aikizi.mode = selectAikiziMode.value as any;
        this.onRenderNeeded();
      });
    }

    const toggleGlch = document.getElementById('toggle-glch-active') as HTMLInputElement;
    if (toggleGlch) {
      toggleGlch.addEventListener('change', () => {
        this.multiEngine.glch.active = toggleGlch.checked;
        const led = document.getElementById('led-glch');
        if (led) led.className = toggleGlch.checked ? 'hw-led active-red' : 'hw-led';
        this.onRenderNeeded();
      });
    }

    const toggleTypo = document.getElementById('toggle-typo-active') as HTMLInputElement;
    if (toggleTypo) {
      toggleTypo.addEventListener('change', () => {
        this.multiEngine.neueTypo.active = toggleTypo.checked;
        const led = document.getElementById('led-typo');
        if (led) led.className = toggleTypo.checked ? 'hw-led active-green' : 'hw-led';
        this.onRenderNeeded();
      });
    }

    const selectLfoWave = document.getElementById('select-lfo1-wave') as HTMLSelectElement;
    if (selectLfoWave) {
      selectLfoWave.addEventListener('change', () => {
        this.multiEngine.lfoNodes[0].waveform = selectLfoWave.value as any;
        this.onRenderNeeded();
      });
    }

    const btnResetWires = document.getElementById('btn-reset-wires');
    if (btnResetWires) {
      btnResetWires.addEventListener('click', () => {
        this.resetDefaultCables();
      });
    }

    // Node header dragging for moving cards
    const nodeCards = this.containerEl.querySelectorAll<HTMLElement>('.analog-node-card');
    nodeCards.forEach(card => {
      const header = card.querySelector<HTMLElement>('.node-card-header');
      if (!header) return;
      header.addEventListener('mousedown', (e: MouseEvent) => {
        if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'LABEL') return;
        const cardEl = card as HTMLElement;
        const rect = cardEl.getBoundingClientRect();
        const parentRect = this.containerEl!.getBoundingClientRect();
        this.draggingNode = {
          id: cardEl.id,
          startMouseX: e.clientX,
          startMouseY: e.clientY,
          startNodeX: rect.left - parentRect.left,
          startNodeY: rect.top - parentRect.top
        };
        e.preventDefault();
      });
    });

    // Rotary Knob Dragging
    const rotaryKnobs = this.containerEl.querySelectorAll<HTMLElement>('.rotary-dial');
    rotaryKnobs.forEach(knobEl => {
      knobEl.addEventListener('mousedown', (e: MouseEvent) => {
        const id = knobEl.id.replace('knob-', '');
        const cfg = this.multiEngine.knobs.get(id);
        if (!cfg) return;

        this.draggingKnob = {
          id,
          startY: e.clientY,
          startVal: cfg.value,
          knobConfig: cfg,
          el: knobEl as HTMLElement
        };
        e.preventDefault();
      });

      // Mouse wheel support
      knobEl.addEventListener('wheel', (e: WheelEvent) => {
        const id = knobEl.id.replace('knob-', '');
        const cfg = this.multiEngine.knobs.get(id);
        if (!cfg) return;

        const delta = e.deltaY < 0 ? cfg.step : -cfg.step;
        this.multiEngine.updateKnobValue(id, cfg.value + delta);
        this.updateKnobVisual(id);
        this.onRenderNeeded();
        e.preventDefault();
      }, { passive: false });
    });

    // Patch Jack Dragging for Cables
    const jacks = this.containerEl.querySelectorAll<HTMLElement>('.hw-jack');
    jacks.forEach(jack => {
      jack.addEventListener('mousedown', (e: MouseEvent) => {
        e.stopPropagation();
        const portId = jack.id;
        const type = (jack as HTMLElement).dataset.type as any;
        const rect = jack.getBoundingClientRect();
        const parentRect = this.containerEl!.getBoundingClientRect();
        const fromX = rect.left + rect.width / 2 - parentRect.left;
        const fromY = rect.top + rect.height / 2 - parentRect.top;

        this.draggingCable = {
          fromPortId: portId,
          fromX,
          fromY,
          curX: fromX,
          curY: fromY,
          type: type.startsWith('mod') ? 'modulation' : 'signal'
        };
        this.renderCables();
      });

      // Right-click on jack unplugs all connected cables
      jack.addEventListener('contextmenu', (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const portId = jack.id;
        this.multiEngine.cables = this.multiEngine.cables.filter(c => c.fromPortId !== portId && c.toPortId !== portId);
        this.renderCables();
        this.onRenderNeeded();
      });
    });

    // Clicking a patch cable on the SVG unplugs it
    this.svgEl?.addEventListener('click', (e: MouseEvent) => {
      const target = (e.target as SVGElement).closest('[data-cable-id]') as SVGElement | null;
      if (target && target.dataset.cableId) {
        const cid = target.dataset.cableId;
        this.multiEngine.cables = this.multiEngine.cables.filter(c => c.id !== cid);
        this.renderCables();
        this.onRenderNeeded();
      }
    });

    // Global Mousemove / Mouseup on Window
    window.addEventListener('mousemove', (e: MouseEvent) => {
      // 1. Node card dragging
      if (this.draggingNode && this.containerEl) {
        const dx = e.clientX - this.draggingNode.startMouseX;
        const dy = e.clientY - this.draggingNode.startMouseY;
        const el = document.getElementById(this.draggingNode.id);
        if (el) {
          const newX = Math.max(0, this.draggingNode.startNodeX + dx);
          const newY = Math.max(0, this.draggingNode.startNodeY + dy);
          el.style.left = `${newX}px`;
          el.style.top = `${newY}px`;
          this.multiEngine.nodePositions.set(this.draggingNode.id, { x: newX, y: newY });
          this.renderCables();
        }
      }

      // 2. Rotary knob dragging (vertical drag)
      if (this.draggingKnob) {
        const dy = this.draggingKnob.startY - e.clientY; // drag up = increase
        const cfg = this.draggingKnob.knobConfig;
        const range = cfg.max - cfg.min;
        const change = (dy / 150) * range;
        this.multiEngine.updateKnobValue(this.draggingKnob.id, this.draggingKnob.startVal + change);
        this.updateKnobVisual(this.draggingKnob.id);
        this.onRenderNeeded();
      }

      // 3. Patch cable dragging
      if (this.draggingCable && this.containerEl) {
        const parentRect = this.containerEl.getBoundingClientRect();
        this.draggingCable.curX = e.clientX - parentRect.left;
        this.draggingCable.curY = e.clientY - parentRect.top;
        this.renderCables();
      }
    });

    window.addEventListener('mouseup', (e: MouseEvent) => {
      // End Node drag
      this.draggingNode = null;
      // End Knob drag
      this.draggingKnob = null;

      // End Cable drag & check if dropped on a jack
      if (this.draggingCable) {
        const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        const jackTarget = target?.closest('.hw-jack') as HTMLElement | null;

        if (jackTarget && jackTarget.id !== this.draggingCable.fromPortId) {
          const targetPortId = jackTarget.id;
          const targetType = jackTarget.dataset.type;

          // Connect cable
          const newCable: PatchCable = {
            id: `cable-${Date.now()}`,
            fromPortId: this.draggingCable.fromPortId,
            toPortId: targetPortId,
            type: this.draggingCable.type,
            color: this.draggingCable.type === 'modulation' ? '#00e5ff' : '#33ff77'
          };

          // If modulation, bind LFO to knob
          if (this.draggingCable.type === 'modulation') {
            const knobId = jackTarget.dataset.knob;
            if (knobId) {
              this.multiEngine.lfoNodes[0].targetId = knobId;
              const readout = document.getElementById('lfo-target-readout');
              if (readout) readout.textContent = `→ ${knobId.toUpperCase()}`;
            }
          }

          this.multiEngine.cables.push(newCable);
          this.onRenderNeeded();
        }

        this.draggingCable = null;
        this.renderCables();
      }
    });
  }

  resetDefaultCables() {
    this.multiEngine.cables = [
      { id: 'c1', fromPortId: 'port-source-out', toPortId: 'port-aikizi-in', type: 'signal', color: '#ffaa00' },
      { id: 'c2', fromPortId: 'port-aikizi-out', toPortId: 'port-glch-in', type: 'signal', color: '#33ff77' },
      { id: 'c3', fromPortId: 'port-glch-out', toPortId: 'port-sink-in', type: 'signal', color: '#33ff77' },
      { id: 'c-mod1', fromPortId: 'port-lfo1-out', toPortId: 'modjack-glch-rgb', type: 'modulation', color: '#00e5ff' }
    ];
    this.multiEngine.lfoNodes[0].targetId = 'glch-rgb';
    const readout = document.getElementById('lfo-target-readout');
    if (readout) readout.textContent = '→ GLCH-RGB';
    this.renderCables();
    this.onRenderNeeded();
  }

  updateAllKnobsVisuals() {
    for (const [id] of this.multiEngine.knobs) {
      this.updateKnobVisual(id);
    }
  }

  updateKnobVisual(id: string) {
    const cfg = this.multiEngine.knobs.get(id);
    if (!cfg) return;

    const knobEl = document.getElementById(`knob-${id}`);
    const readoutEl = document.getElementById(`val-${id}`);

    // Map min..max to -135deg .. +135deg
    const normalized = (cfg.value - cfg.min) / (cfg.max - cfg.min);
    const degrees = -135 + normalized * 270;

    if (knobEl) {
      knobEl.style.transform = `rotate(${degrees}deg)`;
    }
    if (readoutEl) {
      readoutEl.textContent = `${cfg.value.toFixed(cfg.step < 0.1 ? 2 : 1)}${cfg.unit}`;
    }
  }

  // Draw smooth Bezier patch cables with gravity sag & pulse animations
  renderCables() {
    if (!this.svgEl || !this.containerEl) return;

    const parentRect = this.containerEl.getBoundingClientRect();
    let svgHtml = '';

    for (const cable of this.multiEngine.cables) {
      const fromEl = document.getElementById(cable.fromPortId);
      const toEl = document.getElementById(cable.toPortId);
      if (!fromEl || !toEl) continue;

      const fRect = fromEl.getBoundingClientRect();
      const tRect = toEl.getBoundingClientRect();

      const x1 = fRect.left + fRect.width / 2 - parentRect.left;
      const y1 = fRect.top + fRect.height / 2 - parentRect.top;
      const x2 = tRect.left + tRect.width / 2 - parentRect.left;
      const y2 = tRect.top + tRect.height / 2 - parentRect.top;

      const dist = Math.hypot(x2 - x1, y2 - y1);
      const sag = Math.max(25, dist * 0.35); // Realistic gravity droop

      const pathData = `M ${x1} ${y1} C ${x1} ${y1 + sag}, ${x2} ${y2 + sag}, ${x2} ${y2}`;

      // Outer glow and shadow
      svgHtml += `<path data-cable-id="${cable.id}" d="${pathData}" fill="none" stroke="${cable.color}" stroke-opacity="0.25" stroke-width="8" stroke-linecap="round" style="cursor: pointer; pointer-events: stroke;" />`;
      // Main cable body
      svgHtml += `<path data-cable-id="${cable.id}" d="${pathData}" class="patch-cable-path" fill="none" stroke="${cable.color}" stroke-width="3.5" stroke-linecap="round" style="cursor: pointer; pointer-events: stroke;" />`;
      // Animated signal flow pulse
      svgHtml += `<path data-cable-id="${cable.id}" d="${pathData}" class="cable-pulse-line" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="6,8" stroke-linecap="round" style="cursor: pointer; pointer-events: none;" />`;

      // Plugs at both ends
      svgHtml += `<circle cx="${x1}" cy="${y1}" r="5" fill="#111" stroke="${cable.color}" stroke-width="2" />`;
      svgHtml += `<circle cx="${x2}" cy="${y2}" r="5" fill="#111" stroke="${cable.color}" stroke-width="2" />`;
    }

    // Active in-flight dragged cable
    if (this.draggingCable) {
      const { fromX, fromY, curX, curY, color } = {
        ...this.draggingCable,
        color: this.draggingCable.type === 'modulation' ? '#00e5ff' : '#ffaa00'
      };
      const dist = Math.hypot(curX - fromX, curY - fromY);
      const sag = Math.max(15, dist * 0.25);
      const pathData = `M ${fromX} ${fromY} C ${fromX} ${fromY + sag}, ${curX} ${curY + sag}, ${curX} ${curY}`;

      svgHtml += `<path d="${pathData}" fill="none" stroke="${color}" stroke-width="3.5" stroke-dasharray="4,4" />`;
      svgHtml += `<circle cx="${fromX}" cy="${fromY}" r="5" fill="#111" stroke="${color}" stroke-width="2" />`;
      svgHtml += `<circle cx="${curX}" cy="${curY}" r="6" fill="${color}" />`;
    }

    this.svgEl.innerHTML = svgHtml;
  }
}
