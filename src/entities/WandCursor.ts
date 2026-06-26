import * as PIXI from 'pixi.js';

interface TrailParticle {
  g: PIXI.Graphics;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
}

export class WandCursor {
  public container: PIXI.Container;
  private wand: PIXI.Graphics;
  private glow: PIXI.Graphics;
  private trailLayer: PIXI.Container;
  private pulsePhase = 0;
  private trail: TrailParticle[] = [];
  private lastX = 0;
  private lastY = 0;
  private trailTimer = 0;

  constructor() {
    this.container = new PIXI.Container();
    this.container.zIndex = 999;
    this.container.eventMode = 'none';

    this.trailLayer = new PIXI.Container();
    this.glow = new PIXI.Graphics();
    this.wand = new PIXI.Graphics();

    this.drawWand();
    this.container.addChild(this.trailLayer);
    this.container.addChild(this.glow);
    this.container.addChild(this.wand);
  }

  private drawWand(): void {
    this.wand.clear();

    // Star tip (5 pointed, golden)
    this.drawStar(this.wand, 0, -20, 5, 10, 4);
    this.wand.fill({ color: 0xF8C84C });
    this.wand.stroke({ color: 0xCC9900, width: 1.5 });

    // Shaft (wooden wand)
    this.wand.rect(-2, -10, 4, 30);
    this.wand.fill(0x8B6914);
    this.wand.stroke({ color: 0x5A4510, width: 1 });

    // Bright core at tip
    this.wand.circle(0, -20, 3);
    this.wand.fill({ color: 0xFFFFFF, alpha: 0.9 });

    // Glow aura
    this.glow.circle(0, -20, 22);
    this.glow.fill({ color: 0xF8C84C, alpha: 0.12 });
  }

  private drawStar(g: PIXI.Graphics, cx: number, cy: number, spikes: number, outerR: number, innerR: number): void {
    let rot = -Math.PI / 2;
    const step = Math.PI / spikes;
    g.moveTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    for (let i = 0; i < spikes; i++) {
      g.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
      rot += step;
      g.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
    }
    g.closePath();
  }

  public moveTo(x: number, y: number): void {
    this.lastX = x;
    this.lastY = y;
    this.container.position.set(x, y);
  }

  public update(dt: number): void {
    this.pulsePhase += dt * 0.004;
    const pulse = 0.85 + 0.15 * Math.sin(this.pulsePhase);
    this.glow.alpha = 0.12 * pulse;
    this.glow.scale.set(pulse);

    // Emit trail particles
    this.trailTimer += dt;
    if (this.trailTimer > 30) {
      this.trailTimer = 0;
      this.emitTrailParticle();
    }

    // Update trail
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const p = this.trail[i];
      p.life -= dt / 1000;
      if (p.life <= 0) {
        this.trailLayer.removeChild(p.g);
        p.g.destroy();
        this.trail.splice(i, 1);
        continue;
      }
      const t = p.life / p.maxLife;
      p.g.alpha = t * 0.8;
      p.g.scale.set(t * 0.8 + 0.2);
      p.g.x += p.vx * dt / 1000;
      p.g.y += p.vy * dt / 1000;
    }
  }

  private emitTrailParticle(): void {
    if (this.trail.length > 30) return;

    const g = new PIXI.Graphics();
    const size = 1.5 + Math.random() * 2.5;

    // Alternate between star-shaped and round particles
    if (Math.random() > 0.6) {
      this.drawStar(g, 0, 0, 4, size, size * 0.4);
      g.fill({ color: 0xFFF5AE });
    } else {
      g.circle(0, 0, size);
      g.fill({ color: Math.random() > 0.5 ? 0xF8C84C : 0xFFF5AE });
    }

    g.position.set(
      (Math.random() - 0.5) * 8,
      -20 + (Math.random() - 0.5) * 8,
    );

    const maxLife = 0.4 + Math.random() * 0.4;
    this.trailLayer.addChild(g);
    this.trail.push({
      g,
      life: maxLife,
      maxLife,
      vx: (Math.random() - 0.5) * 20,
      vy: 10 + Math.random() * 20,
    });
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.lastX, y: this.lastY };
  }
}
