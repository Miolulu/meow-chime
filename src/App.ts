import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { Cat } from './entities/Cat';
import { WandCursor } from './entities/WandCursor';
import { ParticleSystem } from './entities/ParticleSystem';
import { ForestBackground } from './entities/ForestBackground';
import { AudioManager } from './audio/AudioManager';
import { MelodyRecorder } from './ui/MelodyRecorder';
import { ControlPanel } from './ui/ControlPanel';
import { TimbreSelector } from './ui/TimbreSelector';
import { OctaveSelector } from './ui/OctaveSelector';
import { CAT_CONFIGS, KEY_MAP } from './config/catConfig';

// Note index mapping: DO=0, RE=1, MI=2, FA=3, SO=4, LA=5, Ti=6
// -1 = rest, -2 = long rest

interface Song {
  name: string;
  notes: number[];
  tempo: number; // ms per beat
}

const SONGS: Song[] = [
  {
    name: '小星星',
    tempo: 350,
    notes: [0, 0, 4, 4, 5, 5, 4, -1, 3, 3, 2, 2, 1, 1, 0, -2,
            4, 4, 3, 3, 2, 2, 1, -1, 4, 4, 3, 3, 2, 2, 1],
  },
  {
    name: '生日快乐',
    tempo: 300,
    notes: [0, 0, 1, 0, 3, 2, -2,
            0, 0, 1, 0, 4, 3, -2,
            0, 0, 0, 5, 3, 2, 1, -1,
            6, 6, 5, 3, 4, 3],
  },
  {
    name: '虫儿飞',
    tempo: 400,
    notes: [2, 3, 4, 4, -1, 4, 5, 4, 3, -1,
            2, 3, 4, 4, -1, 3, 2, 1, -2,
            2, 3, 4, 4, -1, 4, 5, 4, 3, -1,
            5, 4, 3, 2, 1, 0],
  },
  {
    name: '两只老虎',
    tempo: 280,
    notes: [0, 1, 2, 0, -1, 0, 1, 2, 0, -1,
            2, 3, 4, -1, 2, 3, 4, -1,
            4, 5, 4, 3, 2, 0, -1,
            4, 5, 4, 3, 2, 0, -1,
            0, 4, 0, -1, 0, 4, 0],
  },
  {
    name: '欢乐颂',
    tempo: 320,
    notes: [2, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1, 2, 2, 1, 1, -2,
            2, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1, 2, 1, 0, 0],
  },
  {
    name: '世上只有妈妈好',
    tempo: 380,
    notes: [4, 3, 2, 3, 4, 4, 4, -1,
            5, 4, 3, 2, 2, -1,
            4, 3, 2, 3, 4, 4, 4, -1,
            5, 4, 3, 4, 2],
  },
];

export class App {
  private app: PIXI.Application;
  private mainLayer!: PIXI.Container;
  private cats: Cat[] = [];
  private wandCursor: WandCursor;
  private particleSystem!: ParticleSystem;
  private audioManager: AudioManager;
  private melodyRecorder: MelodyRecorder;
  private controlPanel: ControlPanel;
  private timbreSelector: TimbreSelector;
  private octaveSelector: OctaveSelector;
  private isPlayingBack = false;
  private playbackAborted = false;
  private audioInitialized = false;
  private sceneReady = false;
  private recentNotes: number[] = []; // track last 7 notes for scale easter egg

  private title!: PIXI.Text;
  private subtitle!: PIXI.Text;
  private forestBg!: ForestBackground;

  constructor() {
    this.app = new PIXI.Application();
    this.audioManager = new AudioManager();
    this.wandCursor = new WandCursor();
    this.melodyRecorder = new MelodyRecorder();
    this.controlPanel = new ControlPanel({
      onClear: () => this.melodyRecorder.clear(),
      onPlayback: () => this.togglePlayback(),
      onRandomPlay: () => this.playRandomMelody(),
      onUndo: () => this.melodyRecorder.undoLast(),
    });
    this.octaveSelector = new OctaveSelector();
    this.octaveSelector.onChange = (o) => this.audioManager.setOctave(o);
    this.timbreSelector = new TimbreSelector();
    this.timbreSelector.onChange = (id) => this.audioManager.setTimbre(id);
  }

  async init(): Promise<void> {
    await this.app.init({
      background: 0x241F3A,
      resizeTo: window,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio, 2),
      autoDensity: true,
    });

    const appEl = document.getElementById('app');
    if (appEl) {
      appEl.appendChild(this.app.canvas);
    }

    await this.showLoadingScreen();
    this.buildScene();
    this.setupInput();
    this.app.ticker.add(this.gameLoop.bind(this));
    window.addEventListener('resize', () => this.onResize());

    this.showEntranceAnimation();

    const isFirstVisit = !localStorage.getItem('meow-chime-visited');
    if (isFirstVisit) {
      localStorage.setItem('meow-chime-visited', '1');
      setTimeout(() => this.showTutorial(), 1200);
    }
  }

  /* ─── Loading Screen ─── */

  private async showLoadingScreen(): Promise<void> {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const loadingLayer = new PIXI.Container();

    const bg = new PIXI.Graphics();
    bg.rect(0, 0, w, h);
    bg.fill(0x241F3A);
    loadingLayer.addChild(bg);

    const title = new PIXI.Text({
      text: '✨ 喵喵音阶森林 ✨',
      style: { fontSize: 42, fill: 0xF7E8B8, fontFamily: '"Microsoft YaHei", sans-serif', fontWeight: '700' },
    });
    title.anchor.set(0.5);
    title.position.set(w / 2, h / 2 - 60);
    loadingLayer.addChild(title);

    // Loading dots animation
    const dots: PIXI.Graphics[] = [];
    const noteLabels = ['DO', 'RE', 'MI', 'FA', 'SO', 'LA', 'Ti'];
    const dotColors = CAT_CONFIGS.map((c) => (c.bodyColor === 0xffffff ? 0xe0e0e0 : c.bodyColor));

    for (let i = 0; i < 7; i++) {
      const dot = new PIXI.Graphics();
      dot.circle(0, 0, 8);
      dot.fill(dotColors[i]);
      dot.stroke({ color: 0x333333, width: 1.5 });
      dot.position.set(w / 2 - 90 + i * 30, h / 2 + 20);
      dot.scale.set(0.5);
      dot.alpha = 0.3;
      loadingLayer.addChild(dot);
      dots.push(dot);

      const label = new PIXI.Text({
        text: noteLabels[i],
        style: { fontSize: 8, fill: 0xF8C84C, fontFamily: 'Montserrat, sans-serif', fontWeight: '700' },
      });
      label.anchor.set(0.5);
      label.position.set(w / 2 - 90 + i * 30, h / 2 + 40);
      label.alpha = 0;
      loadingLayer.addChild(label);

      gsap.to(dot, {
        alpha: 1,
        delay: i * 0.12,
        duration: 0.3,
        ease: 'power2.out',
      });
      gsap.to(dot.scale, {
        x: 1,
        y: 1,
        delay: i * 0.12,
        duration: 0.3,
        ease: 'back.out(3)',
      });
      gsap.to(label, {
        alpha: 1,
        delay: i * 0.12 + 0.2,
        duration: 0.3,
      });
    }

    const loadingText = new PIXI.Text({
      text: '正在唤醒森林...',
      style: { fontSize: 14, fill: 0xB8B0C8, fontFamily: '"Microsoft YaHei", sans-serif' },
    });
    loadingText.anchor.set(0.5);
    loadingText.position.set(w / 2, h / 2 + 70);
    loadingLayer.addChild(loadingText);

    this.app.stage.addChild(loadingLayer);

    // Simulate loading (audio init)
    await this.audioManager.init();
    this.audioInitialized = true;

    // Wait for animation to complete
    await new Promise((r) => setTimeout(r, 1200));

    // Fade out loading screen
    await new Promise<void>((resolve) => {
      gsap.to(loadingLayer, {
        alpha: 0,
        duration: 0.5,
        ease: 'power2.in',
        onComplete: () => {
          this.app.stage.removeChild(loadingLayer);
          loadingLayer.destroy({ children: true });
          resolve();
        },
      });
    });
  }

  /* ─── Tutorial Overlay ─── */

  private showTutorial(): void {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const overlay = new PIXI.Container();
    overlay.zIndex = 500;

    const dimBg = new PIXI.Graphics();
    dimBg.rect(0, 0, w, h);
    dimBg.fill({ color: 0x000000, alpha: 0.6 });
    dimBg.eventMode = 'static';
    overlay.addChild(dimBg);

    const panel = new PIXI.Graphics();
    const pw = 420, ph = 280;
    panel.roundRect((w - pw) / 2, (h - ph) / 2, pw, ph, 20);
    panel.fill({ color: 0x241F3A, alpha: 0.95 });
    panel.stroke({ color: 0xF8C84C, width: 2 });
    overlay.addChild(panel);

    const cx = w / 2;
    const cy = h / 2;

    const tutTitle = new PIXI.Text({
      text: '✨ 欢迎来到喵喵音阶森林 ✨',
      style: { fontSize: 22, fill: 0xF8C84C, fontFamily: '"Microsoft YaHei", sans-serif', fontWeight: '700' },
    });
    tutTitle.anchor.set(0.5);
    tutTitle.position.set(cx, cy - 100);
    overlay.addChild(tutTitle);

    const instructions = [
      '🖱️  轻触猫咪 → 唤醒对应音阶',
      '⌨️  按 A S D F G H J → 键盘演奏',
      '🪄  移动鼠标 → 魔法棒拖尾闪烁',
      '🎵  点击「随机」→ 森林中响起旋律',
      '🔊  按 M → 静音/取消静音',
    ];

    instructions.forEach((text, i) => {
      const line = new PIXI.Text({
        text,
        style: { fontSize: 14, fill: 0xFFF8E7, fontFamily: '"Microsoft YaHei", sans-serif' },
      });
      line.anchor.set(0.5);
      line.position.set(cx, cy - 50 + i * 28);
      line.alpha = 0;
      overlay.addChild(line);
      gsap.to(line, { alpha: 1, delay: 0.1 * i, duration: 0.3 });
    });

    const startBtn = new PIXI.Container();
    startBtn.eventMode = 'static';
    startBtn.cursor = 'pointer';
    const btnBg = new PIXI.Graphics();
    btnBg.roundRect(0, 0, 160, 40, 20);
    btnBg.fill(0xF8C84C);
    startBtn.addChild(btnBg);
    const btnText = new PIXI.Text({
      text: '进入森林 🌙',
      style: { fontSize: 16, fill: 0x241F3A, fontFamily: '"Microsoft YaHei", sans-serif', fontWeight: '700' },
    });
    btnText.anchor.set(0.5);
    btnText.position.set(80, 20);
    startBtn.addChild(btnText);
    startBtn.position.set(cx - 80, cy + 90);
    overlay.addChild(startBtn);

    startBtn.on('pointerover', () => {
      gsap.to(startBtn.scale, { x: 1.05, y: 1.05, duration: 0.15 });
    });
    startBtn.on('pointerout', () => {
      gsap.to(startBtn.scale, { x: 1, y: 1, duration: 0.15 });
    });

    const dismissTutorial = () => {
      gsap.to(overlay, {
        alpha: 0,
        duration: 0.3,
        onComplete: () => {
          this.app.stage.removeChild(overlay);
          overlay.destroy({ children: true });
        },
      });
    };

    startBtn.on('pointerdown', dismissTutorial);
    dimBg.on('pointerdown', dismissTutorial);

    overlay.alpha = 0;
    this.app.stage.addChild(overlay);
    gsap.to(overlay, { alpha: 1, duration: 0.3 });
  }

  /* ─── Entrance Animation ─── */

  private showEntranceAnimation(): void {
    this.title.alpha = 0;
    this.subtitle.alpha = 0;
    gsap.to(this.title, { alpha: 1, y: this.title.y, duration: 0.6, ease: 'power2.out' });
    gsap.to(this.subtitle, { alpha: 1, delay: 0.2, duration: 0.5 });

    // Title gentle floating animation (breathing)
    gsap.to(this.title, {
      y: this.title.y - 3,
      duration: 2.5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    this.cats.forEach((cat, i) => {
      cat.container.alpha = 0;
      cat.container.y += 30;
      gsap.to(cat.container, {
        alpha: 1,
        y: cat.container.y - 30,
        delay: 0.1 + i * 0.08,
        duration: 0.5,
        ease: 'back.out(1.5)',
      });
    });

    this.timbreSelector.container.alpha = 0;
    this.melodyRecorder.container.alpha = 0;
    this.controlPanel.container.alpha = 0;
    gsap.to(this.timbreSelector.container, { alpha: 1, delay: 0.7, duration: 0.4 });
    gsap.to(this.melodyRecorder.container, { alpha: 1, delay: 0.8, duration: 0.4 });
    gsap.to(this.controlPanel.container, { alpha: 1, delay: 0.9, duration: 0.4 });

    gsap.delayedCall(1.0, () => {
      this.sceneReady = true;
    });
  }

  /* ─── Scene Building ─── */

  private buildScene(): void {
    this.mainLayer = new PIXI.Container();
    this.app.stage.addChild(this.mainLayer);

    this.createBackground();
    this.createTitle();
    this.createCats();
    this.particleSystem = new ParticleSystem(this.mainLayer);
    this.mainLayer.addChild(this.wandCursor.container);

    // Octave selector: below cats
    const osw = this.octaveSelector.getTotalWidth();
    this.octaveSelector.container.position.set(
      (this.app.screen.width - osw) / 2,
      this.app.screen.height * 0.6 + 120,
    );
    this.mainLayer.addChild(this.octaveSelector.container);

    // Timbre selector: below octave
    const tsw = this.timbreSelector.getTotalWidth();
    this.timbreSelector.container.position.set(
      (this.app.screen.width - tsw) / 2,
      this.app.screen.height - 180,
    );
    this.mainLayer.addChild(this.timbreSelector.container);

    // Melody recorder
    this.melodyRecorder.container.position.set(
      (this.app.screen.width - 520) / 2,
      this.app.screen.height - 150,
    );
    this.mainLayer.addChild(this.melodyRecorder.container);

    // Control buttons at bottom
    const totalBtnWidth = 4 * 70;
    this.controlPanel.container.position.set(
      (this.app.screen.width - totalBtnWidth) / 2,
      this.app.screen.height - 70,
    );
    this.mainLayer.addChild(this.controlPanel.container);
  }

  private createBackground(): void {
    this.forestBg = new ForestBackground(
      this.mainLayer,
      this.app.screen.width,
      this.app.screen.height,
    );
  }

  private createTitle(): void {
    this.title = new PIXI.Text({
      text: '✨ 喵喵音阶森林 ✨',
      style: {
        fontSize: 36,
        fill: 0xF7E8B8,
        fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
        fontWeight: '700',
        dropShadow: {
          color: 0x000000,
          blur: 12,
          distance: 2,
          alpha: 0.6,
        },
      },
    });
    this.title.anchor.set(0.5);
    this.title.position.set(this.app.screen.width / 2, 50);
    this.mainLayer.addChild(this.title);

    this.subtitle = new PIXI.Text({
      text: '轻触猫咪，唤醒森林里的魔法旋律',
      style: {
        fontSize: 14,
        fill: 0xB8B0C8,
        fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      },
    });
    this.subtitle.anchor.set(0.5);
    this.subtitle.position.set(this.app.screen.width / 2, 82);
    this.mainLayer.addChild(this.subtitle);
  }

  private createCats(): void {
    const catCount = CAT_CONFIGS.length;
    const spacing = Math.min(140, (this.app.screen.width - 100) / catCount);
    const totalWidth = spacing * (catCount - 1);
    const startX = (this.app.screen.width - totalWidth) / 2;
    const catY = this.app.screen.height * 0.6;

    const platform = new PIXI.Graphics();
    platform.roundRect(startX - 60, catY + 55, totalWidth + 120, 12, 6);
    platform.fill({ color: 0x355A4B, alpha: 0.7 });
    platform.stroke({ color: 0x4A7D62, width: 1, alpha: 0.4 });
    this.mainLayer.addChild(platform);

    CAT_CONFIGS.forEach((config, i) => {
      const cat = new Cat(config);
      cat.container.position.set(startX + i * spacing, catY);
      cat.onTrigger = () => this.onCatTriggered(i);
      this.cats.push(cat);
      this.mainLayer.addChild(cat.container);
    });

  }

  /* ─── Audio ─── */

  private async ensureAudio(): Promise<void> {
    if (!this.audioInitialized) {
      await this.audioManager.init();
      this.audioInitialized = true;
    }
    await this.audioManager.ensureResumed();
  }

  private async onCatTriggered(index: number): Promise<void> {
    if (this.isPlayingBack) return;
    await this.ensureAudio();
    this.audioManager.playNote(index);
    this.melodyRecorder.recordNote(index, this.audioManager.getOctave());

    const cat = this.cats[index];
    const center = cat.getWorldCenter();
    this.particleSystem.emitBurst(center.x, center.y - 30, 12, index);
    this.particleSystem.emitNoteFloat(center.x, center.y - 50, index);

    // Easter egg: complete scale check (0,1,2,3,4,5,6)
    this.recentNotes.push(index);
    if (this.recentNotes.length > 7) this.recentNotes.shift();
    if (this.recentNotes.length === 7) {
      const isFullScale = this.recentNotes.every((n, i) => n === i);
      if (isFullScale) {
        this.triggerForestAwaken();
        this.recentNotes = [];
      }
    }
  }

  /* ─── Easter Eggs ─── */

  private triggerForestAwaken(): void {
    // All cats glow simultaneously
    this.cats.forEach((cat, i) => {
      setTimeout(() => {
        cat.trigger();
        const center = cat.getWorldCenter();
        this.particleSystem.emitBurst(center.x, center.y - 30, 15, i);
        this.particleSystem.emitNoteFloat(center.x, center.y - 60, i);
      }, i * 100);
    });

    // Flash the entire screen with warm golden light
    const flash = new PIXI.Graphics();
    flash.rect(0, 0, this.app.screen.width, this.app.screen.height);
    flash.fill({ color: 0xF8C84C, alpha: 0.15 });
    this.mainLayer.addChild(flash);
    gsap.to(flash, {
      alpha: 0,
      duration: 2,
      ease: 'power2.out',
      onComplete: () => {
        this.mainLayer.removeChild(flash);
        flash.destroy();
      },
    });
  }

  /* ─── Input ─── */

  private setupInput(): void {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();

      if (key in KEY_MAP) {
        const cat = this.cats[KEY_MAP[key]];
        cat.trigger();
        cat.showKeyPress();
      } else if (key === ' ') {
        e.preventDefault();
        this.togglePlayback();
      }
    });

    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on('pointermove', (e: PIXI.FederatedPointerEvent) => {
      const pos = e.global;
      this.wandCursor.moveTo(pos.x, pos.y);
      if (this.sceneReady) {
        this.particleSystem.emitTrail(pos.x, pos.y - 20);
      }
    });

    this.app.canvas.style.cursor = 'none';
  }

  /* ─── Playback ─── */

  private togglePlayback(): void {
    if (this.isPlayingBack) {
      this.playbackAborted = true;
    } else {
      this.playbackMelody();
    }
  }

  private async playbackMelody(): Promise<void> {
    if (this.isPlayingBack || !this.melodyRecorder.hasNotes()) return;
    this.isPlayingBack = true;
    this.playbackAborted = false;
    this.controlPanel.updatePlaybackButton(true);
    await this.ensureAudio();

    const notes = this.melodyRecorder.getNotes();
    const MIN_DELAY = 120;
    const MAX_DELAY = 2000;

    for (let i = 0; i < notes.length; i++) {
      if (this.playbackAborted) break;

      let delay = 0;
      if (i > 0) {
        const rawDelta = notes[i].time - notes[i - 1].time;
        delay = Math.max(MIN_DELAY, Math.min(MAX_DELAY, rawDelta));
      }

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          if (!this.playbackAborted) {
            this.cats[notes[i].noteIndex].trigger();
            this.audioManager.playNote(notes[i].noteIndex, notes[i].octave);
            const cat = this.cats[notes[i].noteIndex];
            const center = cat.getWorldCenter();
            this.particleSystem.emitBurst(center.x, center.y - 30, 6);
          }
          resolve();
        }, delay);
      });
    }
    this.isPlayingBack = false;
    this.playbackAborted = false;
    this.controlPanel.updatePlaybackButton(false);
  }

  private async playRandomMelody(): Promise<void> {
    if (this.isPlayingBack) return;
    this.isPlayingBack = true;
    await this.ensureAudio();

    const song = SONGS[Math.floor(Math.random() * SONGS.length)];

    for (const noteIndex of song.notes) {
      if (noteIndex === -1) {
        await new Promise((r) => setTimeout(r, song.tempo));
        continue;
      }
      if (noteIndex === -2) {
        await new Promise((r) => setTimeout(r, song.tempo * 2));
        continue;
      }
      this.cats[noteIndex].trigger();
      this.audioManager.playNote(noteIndex);
      const cat = this.cats[noteIndex];
      const center = cat.getWorldCenter();
      this.particleSystem.emitBurst(center.x, center.y - 30, 6);
      await new Promise((r) => setTimeout(r, song.tempo));
    }
    this.isPlayingBack = false;
  }

  /* ─── Game Loop ─── */

  private gameLoop(ticker: PIXI.Ticker): void {
    const dt = ticker.deltaMS;
    this.cats.forEach((cat) => cat.update(dt));
    this.wandCursor.update(dt);
    this.particleSystem.update(dt);
    this.forestBg.update(dt);
  }

  /* ─── Resize ─── */

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.forestBg.resize(w, h);

    this.title.position.set(w / 2, 50);
    this.subtitle.position.set(w / 2, 82);

    const catCount = CAT_CONFIGS.length;
    const spacing = Math.min(140, (w - 100) / catCount);
    const totalWidth = spacing * (catCount - 1);
    const startX = (w - totalWidth) / 2;
    const catY = h * 0.6;

    this.cats.forEach((cat, i) => {
      cat.container.position.set(startX + i * spacing, catY);
    });

    const tsw = this.timbreSelector.getTotalWidth();
    this.timbreSelector.container.position.set((w - tsw) / 2, h - 180);
    this.melodyRecorder.container.position.set((w - 520) / 2, h - 150);
    const totalBtnWidth = 4 * 70;
    this.controlPanel.container.position.set((w - totalBtnWidth) / 2, h - 70);

    const osw = this.octaveSelector.getTotalWidth();
    this.octaveSelector.container.position.set((w - osw) / 2, catY + 120);
  }
}
