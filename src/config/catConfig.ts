export interface CatConfig {
  id: string;
  name: string;
  role: string;
  note: string;
  noteLabel: string;
  frequency: number;
  playbackRate: number;
  keyBind: string;
  bodyColor: number;
  accentColor: number;
  personality: string;
}

export const CAT_CONFIGS: CatConfig[] = [
  {
    id: 'do',
    name: '哆哆',
    role: '乐团指挥家',
    note: 'C4',
    noteLabel: 'DO',
    frequency: 261.63,
    playbackRate: 1.0,
    keyBind: 'a',
    bodyColor: 0xffffff,
    accentColor: 0xffc857,
    personality: '优雅、从容',
  },
  {
    id: 're',
    name: '来来',
    role: '工作狂',
    note: 'D4',
    noteLabel: 'RE',
    frequency: 293.66,
    playbackRate: 1.12,
    keyBind: 's',
    bodyColor: 0xd4a574,
    accentColor: 0x4a4a4a,
    personality: '认真、严谨',
  },
  {
    id: 'mi',
    name: '咪咪',
    role: '旅行家',
    note: 'E4',
    noteLabel: 'MI',
    frequency: 329.63,
    playbackRate: 1.26,
    keyBind: 'd',
    bodyColor: 0x3a3a3a,
    accentColor: 0x8b4513,
    personality: '神秘、悠闲',
  },
  {
    id: 'fa',
    name: '发发',
    role: '美食鉴赏家',
    note: 'F4',
    noteLabel: 'FA',
    frequency: 349.23,
    playbackRate: 1.33,
    keyBind: 'f',
    bodyColor: 0xf4a460,
    accentColor: 0x4682b4,
    personality: '开心、贪吃',
  },
  {
    id: 'so',
    name: '嗦嗦',
    role: '海盗',
    note: 'G4',
    noteLabel: 'SO',
    frequency: 392.0,
    playbackRate: 1.5,
    keyBind: 'g',
    bodyColor: 0xf5f5dc,
    accentColor: 0xdc143c,
    personality: '勇敢、调皮',
  },
  {
    id: 'la',
    name: '啦啦',
    role: '科研工作者',
    note: 'A4',
    noteLabel: 'LA',
    frequency: 440.0,
    playbackRate: 1.68,
    keyBind: 'h',
    bodyColor: 0xe8e8e8,
    accentColor: 0xffd700,
    personality: '好奇、聪明',
  },
  {
    id: 'ti',
    name: '茜茜',
    role: '魔法师',
    note: 'B4',
    noteLabel: 'Ti',
    frequency: 493.88,
    playbackRate: 1.89,
    keyBind: 'j',
    bodyColor: 0xd2691e,
    accentColor: 0xff8c00,
    personality: '灵动、调皮',
  },
];

export const COLORS = {
  bgPrimary: 0x2a2438,
  bgSecondary: 0x3d344e,
  catAreaHighlight: 0x4a3f5c,
  gold: 0xffd700,
  goldSecondary: 0xffc857,
  textPrimary: 0xfff8e7,
  textSecondary: 0xb8b0c8,
  glowAlpha: 0.3,
};

export const KEY_MAP: Record<string, number> = {
  a: 0,
  s: 1,
  d: 2,
  f: 3,
  g: 4,
  h: 5,
  j: 6,
};
