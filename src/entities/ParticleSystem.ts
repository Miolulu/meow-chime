import * as PIXI from 'pixi.js';

interface Particle {
  sprite: PIXI.Graphics | PIXI.Text;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  gravity?: number;
  rotSpeed?: number;
}

// Colors mapped per note for the "music rainbow"
const NOTE_COLORS = [
  0xF8C84C, // DO - gold
  0x6ECF72, // RE - green
  0x5BB8F5, // MI - blue
  0xF89B4C, // FA - orange
  0xC77DFF, // SO - purple
  0xFF7EB3, // LA - pink
  0xFFE066, // TI - bright gold
];

export class ParticleSystem {
  private container: PIXI.Container;
  private particles: Particle[] = [];
  private trailParticles: Particle[] = [];
  private pool: PIXI.Graphics[] = [];
  private rainbowTrail: { x: number; y: number; color: number; alpha: number }[] = [];
  private rainbowGraphics: PIXI.Graphics;

  constructor(parent: PIXI.Container) {
    this.container = new PIXI.Container();
    this.container.zIndex = 100;
    parent.addChild(this.container);

    this.rainbowGraphics = new PIXI.Graphics();
    this.container.addChild(this.rainbowGraphics);
  }

  private getStarGraphics(size: number, color = 0xF8C84C): PIXI.Graphics {
    const g = this.pool.pop() || new PIXI.Graphics();
    g.clear();
    this.drawStar(g, 0, 0, 5, size, size * 0.4);
    g.fill({ color, alpha: 1 });
    g.visible = true;
    g.alpha = 1;
    g.scale.set(1);
    g.rotation = 0;
    return g;
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

  /** Burst of stars/sparkles on cat trigger */
  public emitBurst(x: number, y: number, count = 10, noteIndex?: number): void {
    const color = noteIndex !== undefined ? NOTE_COLORS[noteIndex % 7] : 0xF8C84C;

    for (let i = 0; i < count; i++) {
      const size = 4 + Math.random() * 8;
      const burstColor = Math.random() > 0.4 ? color : 0xFFF5AE;
      const sprite = this.getStarGraphics(size, burstColor);
      sprite.position.set(x, y);
      this.container.addChild(sprite);

      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 120;
      const particle: Particle = {
        sprite,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: 500 + Math.random() * 500,
        maxLife: 500 + Math.random() * 500,
        size,
        gravity: 60,
        rotSpeed: (Math.random() - 0.5) * 5,
      };
      particle.maxLife = particle.life;
      this.particles.push(particle);
    }
  }

  /** Wand trail sparkles */
  public emitTrail(x: number, y: number): void {
    if (Math.random() > 0.25) return;
    const size = 2 + Math.random() * 3;
    const color = Math.random() > 0.5 ? 0xF8C84C : 0xFFF5AE;
    const sprite = this.getStarGraphics(size, color);
    sprite.position.set(x + (Math.random() - 0.5) * 8, y + (Math.random() - 0.5) * 8);
    this.container.addChild(sprite);

    const particle: Particle = {
      sprite,
      vx: (Math.random() - 0.5) * 15,
      vy: 10 + Math.random() * 20,
      life: 400 + Math.random() * 300,
      maxLife: 400 + Math.random() * 300,
      size,
      gravity: 0,
    };
    particle.maxLife = particle.life;
    this.trailParticles.push(particle);
  }

  /** Colorful note that flies up toward the sky, leaving a rainbow trail */
  public emitNoteFloat(x: number, y: number, noteIndex?: number): void {
    const noteSymbols = ['♪', '♫', '♬', '♩', '✦'];
    const symbol = noteSymbols[Math.floor(Math.random() * noteSymbols.length)];
    const color = noteIndex !== undefined ? NOTE_COLORS[noteIndex % 7] : 0xF8C84C;

    const text = new PIXI.Text({
      text: symbol,
      style: { fontSize: 20 + Math.random() * 12, fill: color },
    });
    text.anchor.set(0.5);
    text.position.set(x + (Math.random() - 0.5) * 20, y - 20);
    text.alpha = 1;
    this.container.addChild(text);

    const noteParticle: Particle = {
      sprite: text as unknown as PIXI.Graphics,
      vx: (Math.random() - 0.5) * 25,
      vy: -80 - Math.random() * 40,
      life: 1500,
      maxLife: 1500,
      size: 20,
      gravity: -10,
    };
    this.particles.push(noteParticle);

    // Add to rainbow trail
    this.rainbowTrail.push({ x, y: y - 20, color, alpha: 1.0 });
    if (this.rainbowTrail.length > 50) {
      this.rainbowTrail.shift();
    }
  }

  public update(dtMs: number): void {
    this.updateList(this.particles, dtMs);
    this.updateList(this.trailParticles, dtMs);
    this.updateRainbow(dtMs);
  }

  private updateList(list: Particle[], dtMs: number): void {
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life -= dtMs;
      const t = dtMs / 1000;
      p.sprite.x += p.vx * t;
      p.sprite.y += p.vy * t;
      p.vy += (p.gravity ?? 30) * t;

      if (p.rotSpeed) {
        p.sprite.rotation += p.rotSpeed * t;
      }

      const lifeRatio = Math.max(0, p.life / p.maxLife);
      p.sprite.alpha = lifeRatio;
      p.sprite.scale.set(0.3 + lifeRatio * 0.7);

      if (p.life <= 0) {
        p.sprite.visible = false;
        this.container.removeChild(p.sprite);
        if (p.sprite instanceof PIXI.Graphics) {
          this.pool.push(p.sprite);
        } else {
          p.sprite.destroy();
        }
        list.splice(i, 1);
      }
    }
  }

  private updateRainbow(dtMs: number): void {
    // Fade rainbow trail over time
    for (let i = this.rainbowTrail.length - 1; i >= 0; i--) {
      this.rainbowTrail[i].alpha -= dtMs / 3000;
      if (this.rainbowTrail[i].alpha <= 0) {
        this.rainbowTrail.splice(i, 1);
      }
    }

    // Draw the rainbow
    this.rainbowGraphics.clear();
    if (this.rainbowTrail.length < 2) return;

    for (let i = 1; i < this.rainbowTrail.length; i++) {
      const prev = this.rainbowTrail[i - 1];
      const curr = this.rainbowTrail[i];
      this.rainbowGraphics.moveTo(prev.x, prev.y);
      this.rainbowGraphics.lineTo(curr.x, curr.y);
      this.rainbowGraphics.stroke({ color: curr.color, width: 2, alpha: curr.alpha * 0.4 });
    }
  }
}
