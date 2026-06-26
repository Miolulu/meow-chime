import * as PIXI from 'pixi.js';

interface Firefly {
  g: PIXI.Graphics;
  x: number;
  y: number;
  phase: number;
  speed: number;
  radius: number;
}

export class ForestBackground {
  private fireflies: Firefly[] = [];
  private time = 0;
  private w: number;
  private h: number;
  private bgSprite: PIXI.Sprite | null = null;
  private fallbackSky: PIXI.Graphics | null = null;

  constructor(private stage: PIXI.Container, w: number, h: number) {
    this.w = w;
    this.h = h;
    this.build();
  }

  private async build(): Promise<void> {
    try {
      const texture = await PIXI.Assets.load<PIXI.Texture>('/assets/bg_forest.png');
      this.bgSprite = new PIXI.Sprite(texture);
      this.bgSprite.width = this.w;
      this.bgSprite.height = this.h;
      this.stage.addChildAt(this.bgSprite, 0);
    } catch {
      this.drawFallbackSky();
    }

    this.drawFireflies();
  }

  private drawFallbackSky(): void {
    const sky = new PIXI.Graphics();
    const steps = 12;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const y = t * this.h;
      const height = this.h / steps + 1;
      const r = Math.round(0x24 + (0x33 - 0x24) * t);
      const g = Math.round(0x1F + (0x2C - 0x1F) * t);
      const b = Math.round(0x3A + (0x52 - 0x3A) * t);
      const color = (r << 16) | (g << 8) | b;
      sky.rect(0, y, this.w, height);
      sky.fill({ color });
    }
    this.stage.addChildAt(sky, 0);
    this.fallbackSky = sky;
  }

  private drawFireflies(): void {
    const fireflyContainer = new PIXI.Container();
    this.stage.addChild(fireflyContainer);

    for (let i = 0; i < 25; i++) {
      const g = new PIXI.Graphics();
      const x = Math.random() * this.w;
      const y = this.h * 0.3 + Math.random() * this.h * 0.5;
      g.circle(0, 0, 2 + Math.random() * 2);
      g.fill({ color: 0xF8C84C, alpha: 0.7 });
      g.position.set(x, y);
      fireflyContainer.addChild(g);
      this.fireflies.push({
        g,
        x,
        y,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.6,
        radius: 15 + Math.random() * 25,
      });
    }
  }

  public update(dt: number): void {
    this.time += dt * 0.01;

    for (const ff of this.fireflies) {
      ff.g.position.x = ff.x + Math.sin(this.time * ff.speed + ff.phase) * ff.radius;
      ff.g.position.y = ff.y + Math.cos(this.time * ff.speed * 0.7 + ff.phase) * ff.radius * 0.6;
      ff.g.alpha = 0.3 + Math.sin(this.time * ff.speed * 2 + ff.phase) * 0.4;
    }
  }

  public resize(w: number, h: number): void {
    const prevW = this.w || 1;
    const prevH = this.h || 1;
    this.w = w;
    this.h = h;

    if (this.bgSprite) {
      this.bgSprite.width = this.w;
      this.bgSprite.height = this.h;
    }

    if (this.fallbackSky) {
      this.fallbackSky.clear();
      const steps = 12;
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const y = t * this.h;
        const height = this.h / steps + 1;
        const r = Math.round(0x24 + (0x33 - 0x24) * t);
        const g = Math.round(0x1F + (0x2C - 0x1F) * t);
        const b = Math.round(0x3A + (0x52 - 0x3A) * t);
        const color = (r << 16) | (g << 8) | b;
        this.fallbackSky.rect(0, y, this.w, height);
        this.fallbackSky.fill({ color });
      }
    }

    const sx = this.w / prevW;
    const sy = this.h / prevH;
    this.fireflies.forEach((ff) => {
      ff.x *= sx;
      ff.y *= sy;
      ff.g.position.x *= sx;
      ff.g.position.y *= sy;
    });
  }
}
