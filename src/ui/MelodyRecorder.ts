import * as PIXI from 'pixi.js';
import { CAT_CONFIGS } from '../config/catConfig';

export interface NoteEvent {
  noteIndex: number;
  octave: -1 | 0 | 1;
  time: number;
}

const NOTE_COLORS = [
  0xF8C84C, 0x6ECF72, 0x5BB8F5, 0xF89B4C, 0xC77DFF, 0xFF7EB3, 0xFFE066,
];

export class MelodyRecorder {
  public container: PIXI.Container;
  private notes: NoteEvent[] = [];
  private noteDisplays: PIXI.Container;
  private maxDisplay = 20;
  private startTime = 0;

  constructor() {
    this.container = new PIXI.Container();
    this.noteDisplays = new PIXI.Container();
    this.buildBookUI();
    this.startTime = performance.now();
  }

  private buildBookUI(): void {
    // Book/scroll background
    const book = new PIXI.Graphics();

    // Parchment body
    book.roundRect(0, 0, 520, 56, 8);
    book.fill({ color: 0x3D2B1F, alpha: 0.85 });
    book.stroke({ color: 0x7D5A43, width: 2 });

    // Inner parchment area
    book.roundRect(4, 4, 512, 48, 6);
    book.fill({ color: 0x2D1F15, alpha: 0.5 });

    // Decorative scroll ends
    book.circle(-4, 28, 8);
    book.fill({ color: 0x7D5A43 });
    book.stroke({ color: 0x5A4510, width: 1.5 });
    book.circle(524, 28, 8);
    book.fill({ color: 0x7D5A43 });
    book.stroke({ color: 0x5A4510, width: 1.5 });

    this.container.addChild(book);

    // Label
    const label = new PIXI.Text({
      text: '📖',
      style: { fontSize: 16 },
    });
    label.anchor.set(0.5);
    label.position.set(24, 28);
    this.container.addChild(label);

    this.noteDisplays.position.set(48, 10);
    this.container.addChild(this.noteDisplays);
  }

  public recordNote(noteIndex: number, octave: -1 | 0 | 1): void {
    const now = performance.now() - this.startTime;
    this.notes.push({ noteIndex, octave, time: now });
    this.updateDisplay();
  }

  private updateDisplay(): void {
    this.noteDisplays.removeChildren();
    const visible = this.notes.slice(-this.maxDisplay);

    visible.forEach((note, i) => {
      const config = CAT_CONFIGS[note.noteIndex];
      const color = NOTE_COLORS[note.noteIndex % 7];

      // Note as a glowing pill
      const pill = new PIXI.Graphics();
      pill.roundRect(0, 0, 20, 34, 6);
      pill.fill({ color, alpha: 0.7 });
      pill.stroke({ color: 0xF7E8B8, width: 1, alpha: 0.5 });
      pill.position.set(i * 23, 0);
      this.noteDisplays.addChild(pill);

      // Note label
      const label = new PIXI.Text({
        text: config.noteLabel.substring(0, 2),
        style: { fontSize: 9, fill: 0xFFF8E7, fontWeight: '700', fontFamily: 'Montserrat, sans-serif' },
      });
      label.anchor.set(0.5);
      label.position.set(i * 23 + 10, 17);
      this.noteDisplays.addChild(label);

      // Octave dot indicator
      if (note.octave === 1) {
        const dot = new PIXI.Graphics();
        dot.circle(0, 0, 2);
        dot.fill({ color: 0xFFF8E7 });
        dot.position.set(i * 23 + 10, 4);
        this.noteDisplays.addChild(dot);
      } else if (note.octave === -1) {
        const dot = new PIXI.Graphics();
        dot.circle(0, 0, 2);
        dot.fill({ color: 0xFFF8E7 });
        dot.position.set(i * 23 + 10, 30);
        this.noteDisplays.addChild(dot);
      }
    });
  }

  public clear(): void {
    this.notes = [];
    this.startTime = performance.now();
    this.noteDisplays.removeChildren();
  }

  public undoLast(): void {
    if (this.notes.length > 0) {
      this.notes.pop();
      this.updateDisplay();
    }
  }

  public getNotes(): NoteEvent[] {
    return [...this.notes];
  }

  public hasNotes(): boolean {
    return this.notes.length > 0;
  }
}
