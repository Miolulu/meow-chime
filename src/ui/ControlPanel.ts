import * as PIXI from 'pixi.js';

export interface ControlPanelCallbacks {
  onClear: () => void;
  onPlayback: () => void;
  onRandomPlay: () => void;
  onUndo: () => void;
}

const ICON_FILES: Record<string, string> = {
  playback: 'icon_play.png',
  random: 'icon_random.png',
  undo: 'icon_back.png',
  clear: 'icon_close.png',
};

export class ControlPanel {
  public container: PIXI.Container;
  private buttons: Map<string, PIXI.Container> = new Map();
  private static readonly BUTTON_GAP = 70;
  private static readonly BUTTON_WIDTH = 50;

  constructor(private callbacks: ControlPanelCallbacks) {
    this.container = new PIXI.Container();
    this.buildPanel();
  }

  private buildPanel(): void {
    const items = [
      { id: 'playback', label: '播放', cb: this.callbacks.onPlayback },
      { id: 'random', label: '随机', cb: this.callbacks.onRandomPlay },
      { id: 'undo', label: '回退', cb: this.callbacks.onUndo },
      { id: 'clear', label: '清空', cb: this.callbacks.onClear },
    ];

    items.forEach((item, i) => {
      const btn = this.createIconButton(item.id, item.label, item.cb);
      btn.position.set(i * ControlPanel.BUTTON_GAP, 0);
      this.container.addChild(btn);
      this.buttons.set(item.id, btn);
    });
  }

  private createIconButton(id: string, label: string, onClick: () => void): PIXI.Container {
    const btn = new PIXI.Container();
    btn.eventMode = 'static';
    btn.cursor = 'none';

    const iconContainer = new PIXI.Container();
    iconContainer.position.set(25, 16);
    btn.addChild(iconContainer);
    this.loadIcon(id, iconContainer);

    const labelText = new PIXI.Text({
      text: label,
      style: { fontSize: 11, fill: 0xF7E8B8, fontFamily: '"Microsoft YaHei", sans-serif' },
    });
    labelText.anchor.set(0.5);
    labelText.position.set(25, 42);
    btn.addChild(labelText);

    btn.on('pointerover', () => {
      btn.scale.set(1.15);
    });

    btn.on('pointerout', () => {
      btn.scale.set(1.0);
    });

    btn.on('pointerdown', onClick);
    return btn;
  }

  private async loadIcon(id: string, container: PIXI.Container): Promise<void> {
    const fileName = ICON_FILES[id];
    if (!fileName) return;

    try {
      const texture = await PIXI.Assets.load<PIXI.Texture>(`/assets/icons/${fileName}`);
      if (!texture || !texture.width) return;

      const sprite = new PIXI.Sprite(texture);
      sprite.anchor.set(0.5);
      const scale = 36 / Math.max(texture.width, texture.height);
      sprite.scale.set(scale);
      container.addChild(sprite);
    } catch {
      const fallbackIcons: Record<string, string> = {
        playback: '▶', random: '🎲', undo: '⬅', clear: '✕',
      };
      const text = new PIXI.Text({ text: fallbackIcons[id] || '?', style: { fontSize: 20, fill: 0xFFF8E7 } });
      text.anchor.set(0.5);
      container.addChild(text);
    }
  }

  public updatePlaybackButton(isPlaying: boolean): void {
    const btn = this.buttons.get('playback');
    if (!btn) return;
    const labelText = btn.children[1] as PIXI.Text;
    if (labelText) labelText.text = isPlaying ? '停止' : '播放';
  }

  public getTotalWidth(): number {
    return ControlPanel.BUTTON_GAP * 3 + ControlPanel.BUTTON_WIDTH;
  }
}
