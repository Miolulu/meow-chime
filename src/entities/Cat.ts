import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import type { CatConfig } from '../config/catConfig';

type CatState = 'idle' | 'hover' | 'active';

const NOTE_TO_FILE: Record<string, string> = {
  DO: 'cat_do.png',
  RE: 'cat_re.png',
  MI: 'cat_mi.png',
  FA: 'cat_fa.png',
  SO: 'cat_so.png',
  LA: 'cat_la.png',
  Ti: 'cat_ti.png',
};

export class Cat {
  public container: PIXI.Container;
  public config: CatConfig;
  private state: CatState = 'idle';
  private catGroup: PIXI.Container;
  private fallbackBody: PIXI.Graphics | null = null;
  private nameText: PIXI.Text;
  private noteText: PIXI.Text;
  private keyIndicator: PIXI.Container;
  private roleText: PIXI.Text;
  private glow: PIXI.Graphics;
  private consecutiveClicks = 0;
  private lastClickTime = 0;
  private isAngry = false;

  public onTrigger: (() => void) | null = null;

  constructor(config: CatConfig) {
    this.config = config;
    this.container = new PIXI.Container();
    this.container.eventMode = 'static';
    this.container.cursor = 'none';

    this.catGroup = new PIXI.Container();
    this.glow = new PIXI.Graphics();

    this.nameText = new PIXI.Text({
      text: config.name,
      style: { fontFamily: '"Microsoft YaHei", sans-serif', fontSize: 15, fill: 0xF7E8B8, fontWeight: '500' },
    });
    this.noteText = new PIXI.Text({
      text: config.noteLabel,
      style: { fontFamily: 'Montserrat, sans-serif', fontSize: 20, fill: 0xF8C84C, fontWeight: '700' },
    });
    this.keyIndicator = this.createKeyIndicator(config.keyBind.toUpperCase());
    this.roleText = new PIXI.Text({
      text: '',
      style: { fontFamily: '"Microsoft YaHei", sans-serif', fontSize: 11, fill: 0xB8B0C8 },
    });

    this.buildCat();
    this.setupInteraction();
    this.startIdleAnimation();
  }

  private buildCat(): void {
    this.glow.alpha = 0;
    this.glow.circle(0, 0, 70);
    this.glow.fill({ color: 0xF8C84C, alpha: 0.25 });
    this.catGroup.addChild(this.glow);

    this.drawFallback();
    this.loadSpriteAsync();

    this.container.addChild(this.catGroup);

    this.nameText.anchor.set(0.5);
    this.nameText.position.set(0, 72);
    this.nameText.alpha = 0;
    this.container.addChild(this.nameText);

    this.noteText.anchor.set(0.5);
    this.noteText.position.set(0, 90);
    this.container.addChild(this.noteText);

    this.keyIndicator.position.set(0, -75);
    this.keyIndicator.alpha = 0;
    this.container.addChild(this.keyIndicator);

    this.roleText.anchor.set(0.5);
    this.roleText.position.set(0, -90);
    this.roleText.alpha = 0;
    this.container.addChild(this.roleText);
  }

  private async loadSpriteAsync(): Promise<void> {
    const fileName = NOTE_TO_FILE[this.config.noteLabel];
    if (!fileName) return;

    try {
      const texture = await PIXI.Assets.load<PIXI.Texture>(`/assets/cats/${fileName}`);
      if (!texture || !texture.width) return;

      const sprite = new PIXI.Sprite(texture);
      sprite.anchor.set(0.5, 1.0);

      const targetHeight = 100;
      const scale = targetHeight / texture.height;
      sprite.scale.set(scale);
      sprite.position.y = 50;

      if (this.fallbackBody) {
        this.catGroup.removeChild(this.fallbackBody);
        this.fallbackBody.destroy();
        this.fallbackBody = null;
      }

      this.catGroup.addChild(sprite);
    } catch {
      // Keep fallback on load failure
    }
  }

  private drawFallback(): void {
    this.fallbackBody = new PIXI.Graphics();
    const color = this.config.bodyColor;
    const darkerColor = this.darken(color, 0.3);
    const lighterColor = this.lighten(color, 0.3);

    // Tail
    this.fallbackBody.moveTo(22, 30);
    this.fallbackBody.quadraticCurveTo(45, 10, 38, -5);
    this.fallbackBody.quadraticCurveTo(34, -10, 28, 0);
    this.fallbackBody.quadraticCurveTo(22, 15, 18, 28);
    this.fallbackBody.fill(darkerColor);

    // Body
    this.fallbackBody.ellipse(0, 22, 28, 32);
    this.fallbackBody.fill(color);

    // Head
    this.fallbackBody.circle(0, -14, 24);
    this.fallbackBody.fill(color);

    // Left ear
    this.fallbackBody.moveTo(-20, -30);
    this.fallbackBody.lineTo(-12, -52);
    this.fallbackBody.lineTo(-2, -30);
    this.fallbackBody.closePath();
    this.fallbackBody.fill(color);
    this.fallbackBody.moveTo(-17, -32);
    this.fallbackBody.lineTo(-12, -46);
    this.fallbackBody.lineTo(-5, -32);
    this.fallbackBody.closePath();
    this.fallbackBody.fill(0xffb6c1);

    // Right ear
    this.fallbackBody.moveTo(2, -30);
    this.fallbackBody.lineTo(12, -52);
    this.fallbackBody.lineTo(20, -30);
    this.fallbackBody.closePath();
    this.fallbackBody.fill(color);
    this.fallbackBody.moveTo(5, -32);
    this.fallbackBody.lineTo(12, -46);
    this.fallbackBody.lineTo(17, -32);
    this.fallbackBody.closePath();
    this.fallbackBody.fill(0xffb6c1);

    // Belly patch
    this.fallbackBody.ellipse(0, 26, 16, 20);
    this.fallbackBody.fill(lighterColor);

    // Eyes
    this.fallbackBody.ellipse(-8, -16, 5, 6);
    this.fallbackBody.fill(0xffffff);
    this.fallbackBody.ellipse(8, -16, 5, 6);
    this.fallbackBody.fill(0xffffff);
    this.fallbackBody.circle(-7, -15, 3);
    this.fallbackBody.fill(0x222222);
    this.fallbackBody.circle(9, -15, 3);
    this.fallbackBody.fill(0x222222);
    // Eye highlights
    this.fallbackBody.circle(-6, -17, 1.2);
    this.fallbackBody.fill(0xffffff);
    this.fallbackBody.circle(10, -17, 1.2);
    this.fallbackBody.fill(0xffffff);

    // Nose
    this.fallbackBody.moveTo(0, -8);
    this.fallbackBody.lineTo(-3, -5);
    this.fallbackBody.lineTo(3, -5);
    this.fallbackBody.closePath();
    this.fallbackBody.fill(0xffb6c1);

    // Mouth
    this.fallbackBody.moveTo(0, -5);
    this.fallbackBody.quadraticCurveTo(-4, 0, -6, -2);
    this.fallbackBody.stroke({ color: 0x555555, width: 1.2 });
    this.fallbackBody.moveTo(0, -5);
    this.fallbackBody.quadraticCurveTo(4, 0, 6, -2);
    this.fallbackBody.stroke({ color: 0x555555, width: 1.2 });

    // Whiskers
    this.fallbackBody.moveTo(-12, -7);
    this.fallbackBody.lineTo(-26, -10);
    this.fallbackBody.stroke({ color: 0x555555, width: 0.8 });
    this.fallbackBody.moveTo(-12, -4);
    this.fallbackBody.lineTo(-26, -3);
    this.fallbackBody.stroke({ color: 0x555555, width: 0.8 });
    this.fallbackBody.moveTo(12, -7);
    this.fallbackBody.lineTo(26, -10);
    this.fallbackBody.stroke({ color: 0x555555, width: 0.8 });
    this.fallbackBody.moveTo(12, -4);
    this.fallbackBody.lineTo(26, -3);
    this.fallbackBody.stroke({ color: 0x555555, width: 0.8 });

    // Paws
    this.fallbackBody.ellipse(-12, 50, 8, 5);
    this.fallbackBody.fill(darkerColor);
    this.fallbackBody.ellipse(12, 50, 8, 5);
    this.fallbackBody.fill(darkerColor);

    this.catGroup.addChild(this.fallbackBody);
  }

  private darken(color: number, amount: number): number {
    const r = Math.max(0, ((color >> 16) & 0xFF) * (1 - amount)) | 0;
    const g = Math.max(0, ((color >> 8) & 0xFF) * (1 - amount)) | 0;
    const b = Math.max(0, (color & 0xFF) * (1 - amount)) | 0;
    return (r << 16) | (g << 8) | b;
  }

  private lighten(color: number, amount: number): number {
    const r = Math.min(255, ((color >> 16) & 0xFF) + (255 - ((color >> 16) & 0xFF)) * amount) | 0;
    const g = Math.min(255, ((color >> 8) & 0xFF) + (255 - ((color >> 8) & 0xFF)) * amount) | 0;
    const b = Math.min(255, (color & 0xFF) + (255 - (color & 0xFF)) * amount) | 0;
    return (r << 16) | (g << 8) | b;
  }

  private createKeyIndicator(key: string): PIXI.Container {
    const c = new PIXI.Container();
    const bg = new PIXI.Graphics();
    bg.roundRect(-16, -14, 32, 28, 8);
    bg.fill({ color: 0xF8C84C, alpha: 0.9 });
    c.addChild(bg);

    const label = new PIXI.Text({
      text: key,
      style: { fontFamily: 'Montserrat, monospace', fontSize: 14, fill: 0x241F3A, fontWeight: '700' },
    });
    label.anchor.set(0.5);
    c.addChild(label);
    return c;
  }

  public showKeyPress(): void {
    this.keyIndicator.alpha = 1;
    this.keyIndicator.scale.set(0.6);
    gsap.to(this.keyIndicator.scale, { x: 1, y: 1, duration: 0.1, ease: 'back.out(3)' });
    gsap.to(this.keyIndicator, { alpha: 0, delay: 0.4, duration: 0.3, ease: 'power2.in' });
  }

  private setupInteraction(): void {
    this.container.on('pointerover', () => this.hover());
    this.container.on('pointerout', () => this.leave());
    this.container.on('pointerdown', () => this.trigger());
  }

  private startIdleAnimation(): void {
    gsap.to(this.catGroup, {
      y: -4,
      duration: 1.2 + Math.random() * 0.4,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    });
  }

  public update(_dt: number): void {}

  public hover(): void {
    if (this.state === 'active') return;
    this.state = 'hover';

    gsap.to(this.container.scale, { x: 1.1, y: 1.1, duration: 0.2, ease: 'power2.out' });
    this.roleText.text = this.config.role;
    gsap.to(this.roleText, { alpha: 1, y: -95, duration: 0.2, ease: 'power2.out' });
    gsap.to(this.nameText, { alpha: 1, duration: 0.2, ease: 'power2.out' });
  }

  public leave(): void {
    if (this.state === 'active') return;
    this.state = 'idle';

    gsap.to(this.container.scale, { x: 1, y: 1, duration: 0.2, ease: 'power2.out' });
    gsap.to(this.roleText, { alpha: 0, y: -90, duration: 0.15, ease: 'power2.in' });
    gsap.to(this.nameText, { alpha: 0, duration: 0.15, ease: 'power2.in' });
  }

  public trigger(): void {
    if (this.state === 'active') return;
    this.state = 'active';

    const now = Date.now();
    if (now - this.lastClickTime < 800) {
      this.consecutiveClicks++;
    } else {
      this.consecutiveClicks = 1;
    }
    this.lastClickTime = now;

    if (this.consecutiveClicks >= 7) {
      this.triggerAngry();
      return;
    }

    this.glow.alpha = 0;
    gsap.to(this.glow, { alpha: 1, duration: 0.1, ease: 'power2.out' });

    const tl = gsap.timeline();

    tl.to(this.catGroup.scale, { x: 1.15, y: 0.85, duration: 0.06, ease: 'power2.in' });
    tl.to(this.catGroup.scale, { x: 0.88, y: 1.2, duration: 0.1, ease: 'power2.out' }, '>');
    tl.to(this.catGroup, { y: this.catGroup.y - 25, duration: 0.15, ease: 'power2.out' }, '<');
    tl.to(this.catGroup.scale, { x: 1.0, y: 1.0, duration: 0.05 }, '>');
    tl.to(this.catGroup, { y: this.catGroup.y + 3, duration: 0.12, ease: 'power2.in' }, '>');
    tl.to(this.catGroup.scale, { x: 1.12, y: 0.88, duration: 0.08, ease: 'power2.in' }, '<');
    tl.to(this.catGroup.scale, { x: 1.0, y: 1.0, duration: 0.2, ease: 'elastic.out(1, 0.5)' }, '>');
    tl.to(this.catGroup, { y: this.catGroup.y, duration: 0.15, ease: 'power1.out' }, '<');

    gsap.delayedCall(0.5, () => {
      gsap.to(this.glow, { alpha: 0, duration: 0.3, ease: 'power2.in' });
      this.state = 'idle';
    });

    this.onTrigger?.();
  }

  private triggerAngry(): void {
    this.isAngry = true;

    gsap.to(this.catGroup.scale, { x: 1.25, y: 1.2, duration: 0.15, ease: 'back.out(3)' });

    const shakeTl = gsap.timeline();
    for (let i = 0; i < 6; i++) {
      shakeTl.to(this.catGroup, { x: (i % 2 === 0 ? 3 : -3), duration: 0.05 });
    }
    shakeTl.to(this.catGroup, { x: 0, duration: 0.05 });

    gsap.delayedCall(1.5, () => {
      this.isAngry = false;
      this.consecutiveClicks = 0;
      gsap.to(this.catGroup.scale, { x: 1, y: 1, duration: 0.4, ease: 'power2.out' });
      this.state = 'idle';
    });

    this.onTrigger?.();
  }

  public getState(): CatState {
    return this.state;
  }

  public getWorldCenter(): { x: number; y: number } {
    const bounds = this.container.getBounds();
    return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  }
}
