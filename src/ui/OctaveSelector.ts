import * as PIXI from 'pixi.js';

export class OctaveSelector {
  public container: PIXI.Container;
  public onChange: ((octave: -1 | 0 | 1) => void) | null = null;
  private activeOctave: -1 | 0 | 1 = 0;
  private buttons: Map<number, { bg: PIXI.Graphics; container: PIXI.Container; text: PIXI.Text }> = new Map();

  private static readonly ITEMS: { octave: -1 | 0 | 1; label: string; icon: string }[] = [
    { octave: -1, label: '低音', icon: '⬇' },
    { octave: 0, label: '中音', icon: '●' },
    { octave: 1, label: '高音', icon: '⬆' },
  ];

  constructor() {
    this.container = new PIXI.Container();
    this.build();
  }

  private build(): void {
    const btnWidth = 64;
    const btnHeight = 32;
    const gap = 8;
    const totalWidth = this.getTotalWidth();

    // Background stone slab
    const panel = new PIXI.Graphics();
    panel.roundRect(-10, -6, totalWidth + 20, btnHeight + 12, 10);
    panel.fill({ color: 0x2D1F15, alpha: 0.7 });
    panel.stroke({ color: 0x5A4510, width: 1.5 });
    this.container.addChild(panel);

    OctaveSelector.ITEMS.forEach((item, i) => {
      const x = i * (btnWidth + gap);
      const btn = new PIXI.Container();
      btn.position.set(x, 0);
      btn.eventMode = 'static';
      btn.cursor = 'none';

      const bg = new PIXI.Graphics();
      this.drawBtnBg(bg, btnWidth, btnHeight, item.octave === this.activeOctave);
      btn.addChild(bg);

      const text = new PIXI.Text({
        text: `${item.icon} ${item.label}`,
        style: {
          fontSize: 12,
          fill: item.octave === this.activeOctave ? 0xF8C84C : 0xB8B0C8,
          fontWeight: item.octave === this.activeOctave ? '700' : '400',
          fontFamily: '"Microsoft YaHei", sans-serif',
        },
      });
      text.anchor.set(0.5);
      text.position.set(btnWidth / 2, btnHeight / 2);
      btn.addChild(text);

      btn.on('pointerdown', () => {
        this.activeOctave = item.octave;
        this.highlightActive();
        if (this.onChange) this.onChange(item.octave);
      });

      btn.on('pointerover', () => {
        if (item.octave !== this.activeOctave) {
          this.drawBtnBg(bg, btnWidth, btnHeight, false, true);
        }
      });

      btn.on('pointerout', () => {
        if (item.octave !== this.activeOctave) {
          this.drawBtnBg(bg, btnWidth, btnHeight, false, false);
        }
      });

      this.container.addChild(btn);
      this.buttons.set(item.octave, { bg, container: btn, text });
    });
  }

  private drawBtnBg(g: PIXI.Graphics, w: number, h: number, active: boolean, hover = false): void {
    g.clear();
    g.roundRect(0, 0, w, h, 8);
    if (active) {
      g.fill({ color: 0xF8C84C, alpha: 0.2 });
      g.stroke({ color: 0xF8C84C, width: 1.5 });
    } else if (hover) {
      g.fill({ color: 0x4A3F2A, alpha: 0.5 });
      g.stroke({ color: 0x7D5A43, width: 1 });
    } else {
      g.fill({ color: 0x3D2B1F, alpha: 0.3 });
      g.stroke({ color: 0x5A4510, width: 0.5, alpha: 0.5 });
    }
  }

  private highlightActive(): void {
    const btnWidth = 64;
    const btnHeight = 32;

    OctaveSelector.ITEMS.forEach((item) => {
      const entry = this.buttons.get(item.octave);
      if (!entry) return;
      const isActive = item.octave === this.activeOctave;
      this.drawBtnBg(entry.bg, btnWidth, btnHeight, isActive);
      entry.text.style.fill = isActive ? 0xF8C84C : 0xB8B0C8;
      entry.text.style.fontWeight = isActive ? '700' : '400';
    });
  }

  public getTotalWidth(): number {
    return 64 * 3 + 8 * 2;
  }
}
