import * as PIXI from 'pixi.js';
import { TIMBRES, type TimbreId, type TimbreInfo } from '../audio/AudioManager';

export class TimbreSelector {
  public container: PIXI.Container;
  private pills: Map<TimbreId, { bg: PIXI.Graphics; container: PIXI.Container; nameText: PIXI.Text }> = new Map();
  private activeId: TimbreId = 'electronic';
  public onChange: ((id: TimbreId) => void) | null = null;

  constructor() {
    this.container = new PIXI.Container();
    this.build();
  }

  private build(): void {
    // Background panel (leaf/stone slab style)
    const panel = new PIXI.Graphics();
    const totalW = this.getTotalWidth();
    panel.roundRect(-12, -6, totalW + 24, 34, 12);
    panel.fill({ color: 0x2D1F15, alpha: 0.7 });
    panel.stroke({ color: 0x5A4510, width: 1.5 });
    this.container.addChild(panel);

    let x = 0;
    TIMBRES.forEach((t) => {
      const { bg, container, nameText } = this.createPill(t, x);
      this.pills.set(t.id, { bg, container, nameText });
      this.container.addChild(container);
      x += 80;
    });
  }

  private createPill(timbre: TimbreInfo, x: number): { bg: PIXI.Graphics; container: PIXI.Container; nameText: PIXI.Text } {
    const container = new PIXI.Container();
    container.position.set(x, 0);
    container.eventMode = 'static';
    container.cursor = 'none';

    const bg = new PIXI.Graphics();
    const isActive = timbre.id === this.activeId;
    this.drawPillBg(bg, isActive);
    container.addChild(bg);

    const nameText = new PIXI.Text({
      text: `${timbre.icon} ${timbre.name}`,
      style: {
        fontSize: 11,
        fill: isActive ? 0xF8C84C : 0xB8B0C8,
        fontFamily: '"Microsoft YaHei", sans-serif',
        fontWeight: isActive ? '700' : '400',
      },
    });
    nameText.anchor.set(0.5);
    nameText.position.set(35, 11);
    container.addChild(nameText);

    container.on('pointerdown', () => {
      this.activeId = timbre.id;
      this.highlightActive();
      if (this.onChange) this.onChange(timbre.id);
    });

    container.on('pointerover', () => {
      if (timbre.id !== this.activeId) {
        this.drawPillBg(bg, false, true);
      }
    });

    container.on('pointerout', () => {
      if (timbre.id !== this.activeId) {
        this.drawPillBg(bg, false);
      }
    });

    return { bg, container, nameText };
  }

  private drawPillBg(g: PIXI.Graphics, active: boolean, hover = false): void {
    g.clear();
    g.roundRect(0, 0, 70, 22, 11);
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
    for (const [id, entry] of this.pills) {
      const isActive = id === this.activeId;
      this.drawPillBg(entry.bg, isActive);
      entry.nameText.style.fill = isActive ? 0xF8C84C : 0xB8B0C8;
      entry.nameText.style.fontWeight = isActive ? '700' : '400';
    }
  }

  public getTotalWidth(): number {
    return TIMBRES.length * 80 - 10;
  }
}
