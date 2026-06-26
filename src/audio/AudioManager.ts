import { CAT_CONFIGS } from '../config/catConfig';

export type TimbreId = 'electronic' | 'piano' | 'chime' | 'water' | 'wind';

export interface TimbreInfo {
  id: TimbreId;
  name: string;
  icon: string;
}

export const TIMBRES: TimbreInfo[] = [
  { id: 'electronic', name: '电子音', icon: '🎹' },
  { id: 'piano', name: '钢琴', icon: '🎵' },
  { id: 'chime', name: '编钟', icon: '🎐' },
  { id: 'water', name: '木琴', icon: '🪵' },
  { id: 'wind', name: '八音盒', icon: '🎶' },
];

type SynthFn = (freq: number, noteIndex: number, sr: number) => AudioBuffer;

export class AudioManager {
  private audioCtx: AudioContext | null = null;
  private bufferBank: Map<TimbreId, AudioBuffer[]> = new Map();
  private currentTimbre: TimbreId = 'electronic';
  private masterGain: GainNode | null = null;
  private reverbSend: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private _volume = 0.7;
  private _muted = false;
  private _octave: -1 | 0 | 1 = 0; // -1=低音, 0=中音, 1=高音
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    this.audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    this.buildMasterChain();
    this.buildReverb();
    this.synthesizeAll();
    this.initialized = true;
  }

  /* ═══ Master Chain ═══ */

  private buildMasterChain(): void {
    const ctx = this.audioCtx!;
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -18;
    this.compressor.knee.value = 12;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.15;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this._volume;
    this.dryGain = ctx.createGain();
    this.dryGain.gain.value = 0.65;
    this.reverbGain = ctx.createGain();
    this.reverbGain.gain.value = 0.35;

    this.dryGain.connect(this.compressor);
    this.reverbGain.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(ctx.destination);
  }

  private buildReverb(): void {
    const ctx = this.audioCtx!;
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * 2.0);
    const impulse = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = impulse.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / sr;
        const early = t < 0.04 ? 1.0 : 0;
        const late = Math.exp(-3.2 * t);
        d[i] = (Math.random() * 2 - 1) * (early * 0.4 + late) * 0.35;
      }
    }
    this.reverbSend = ctx.createConvolver();
    this.reverbSend.buffer = impulse;
    this.reverbSend.connect(this.reverbGain!);
  }

  /* ═══ Synthesis (all timbres) ═══ */

  private synthesizeAll(): void {
    const synthMap: Record<TimbreId, SynthFn> = {
      electronic: (f, ni, sr) => this.synthPiano(f, ni, sr),
      piano: (f, ni, sr) => this.synthElectronic(f, ni, sr),
      chime: (f, ni, sr) => this.synthChime(f, ni, sr),
      water: (f, ni, sr) => this.synthWater(f, ni, sr),
      wind: (f, ni, sr) => this.synthWind(f, ni, sr),
    };

    const sr = this.audioCtx!.sampleRate;
    for (const timbre of TIMBRES) {
      const buffers: AudioBuffer[] = [];
      for (let ni = 0; ni < CAT_CONFIGS.length; ni++) {
        buffers.push(synthMap[timbre.id](CAT_CONFIGS[ni].frequency, ni, sr));
      }
      this.bufferBank.set(timbre.id, buffers);
    }
  }

  private makeBuf(sr: number, dur: number): { buffer: AudioBuffer; data: Float32Array; len: number } {
    const len = Math.floor(sr * dur);
    const buffer = this.audioCtx!.createBuffer(1, len, sr);
    return { buffer, data: buffer.getChannelData(0), len };
  }

  /* ─── Timbre 1: Electronic (soft synth pad, gentle & dreamy) ─── */
  private synthElectronic(freq: number, ni: number, sr: number): AudioBuffer {
    const dur = 1.4;
    const { buffer, data, len } = this.makeBuf(sr, dur);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const tN = t / dur;

      // Soft envelope: slower attack, gentle sustain, smooth release
      let env: number;
      if (t < 0.02) {
        env = t / 0.02; // gentle fade-in
      } else if (t < 0.15) {
        env = 1.0 - (t - 0.02) / 0.13 * 0.2;
      } else {
        env = 0.8 * Math.exp(-1.8 * (t - 0.15));
      }

      // Warm sine fundamental (dominant, clean)
      let s = Math.sin(2 * Math.PI * freq * t) * 0.6;

      // Soft detuned pair for gentle chorus/warmth
      s += Math.sin(2 * Math.PI * freq * 1.002 * t) * 0.15;
      s += Math.sin(2 * Math.PI * freq * 0.998 * t) * 0.15;

      // Gentle 2nd harmonic (subtle brightness)
      s += Math.sin(2 * Math.PI * freq * 2 * t) * 0.1 * Math.exp(-2.5 * t);

      // Soft sub-octave (fullness)
      s += Math.sin(2 * Math.PI * freq * 0.5 * t) * 0.06 * Math.exp(-1.5 * t);

      // Very mild FM shimmer (much less aggressive than before)
      const modDepth = (0.3 - ni * 0.02) * freq;
      const modEnv = Math.exp(-8 * t);
      const shimmer = Math.sin(2 * Math.PI * freq * 2 * t) * modDepth * modEnv;
      s += Math.sin(2 * Math.PI * freq * t + shimmer * 0.003) * 0.12 * Math.exp(-3 * t);

      // Gentle vibrato (slow, subtle)
      const vib = 1 + 0.002 * Math.sin(2 * Math.PI * 4.5 * t) * Math.min(1, t / 0.4);
      s *= vib;

      s *= env;
      // Soft saturation (keeps peaks gentle)
      s = Math.tanh(s * 0.9) * 0.7;
      if (tN > 0.92) s *= (1 - tN) / 0.08;
      data[i] = s;
    }
    return buffer;
  }

  /* ─── Timbre 2: Piano (realistic piano modeling) ─── */
  private synthPiano(freq: number, _ni: number, sr: number): AudioBuffer {
    const dur = 2.5;
    const { buffer, data, len } = this.makeBuf(sr, dur);

    // Real piano characteristics:
    // - Multiple strings per note (2-3), slightly detuned
    // - Stiff string inharmonicity: f_n = n * f0 * sqrt(1 + B*n^2)
    // - Hammer excitation: brief, position-dependent
    // - Damping varies per partial (high partials die faster)
    const B = 0.0004; // inharmonicity coefficient
    const numPartials = 12;
    const hammerPos = 0.12; // hammer strikes at 1/8 of string length

    // Three detuned "strings" for chorus effect (real pianos have 3 strings per note)
    const detunes = [1.0, 1.0003, 0.9997];
    const stringAmps = [0.5, 0.3, 0.3];

    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const tN = t / dur;

      // Piano hammer envelope: sharp percussive strike
      let hammerEnv: number;
      if (t < 0.002) {
        hammerEnv = t / 0.002;
      } else if (t < 0.008) {
        hammerEnv = 1.0;
      } else if (t < 0.025) {
        hammerEnv = 1.0 - (t - 0.008) / 0.017 * 0.35;
      } else {
        hammerEnv = 0.65 * Math.exp(-2.2 * (t - 0.025));
      }

      let s = 0;

      for (let str = 0; str < 3; str++) {
        const strFreq = freq * detunes[str];
        let strSum = 0;

        for (let n = 1; n <= numPartials; n++) {
          // Inharmonic partial frequency
          const partialFreq = n * strFreq * Math.sqrt(1 + B * n * n);
          if (partialFreq > sr * 0.45) break;

          // Hammer position filtering (partials at hammer node are suppressed)
          const hammerFilter = 1 - 0.5 * Math.pow(Math.cos(Math.PI * n * hammerPos), 2);

          // Amplitude: 1/n roll-off, modified by hammer position
          const amp = hammerFilter / n;

          // Per-partial damping (higher partials decay much faster)
          const partialDamp = 1.5 + n * 0.4 + n * n * 0.02;
          const partialEnv = Math.exp(-partialDamp * t);

          strSum += Math.sin(2 * Math.PI * partialFreq * t) * amp * partialEnv;
        }

        s += strSum * stringAmps[str];
      }

      // Hammer contact noise (very brief thud)
      if (t < 0.006) {
        const noiseEnv = (1 - t / 0.006);
        s += (Math.random() * 2 - 1) * 0.08 * noiseEnv * noiseEnv * noiseEnv;
      }

      // Soundboard resonance: subtle low-frequency body
      s += Math.sin(2 * Math.PI * freq * 0.5 * t) * 0.03 * Math.exp(-3 * t);

      s *= hammerEnv;
      s = Math.tanh(s * 1.8) * 0.7;
      if (tN > 0.95) s *= (1 - tN) / 0.05;
      data[i] = s;
    }
    return buffer;
  }

  /* ─── Timbre 3: Chime (metallic bell, inharmonic partials) ─── */
  private synthChime(freq: number, _ni: number, sr: number): AudioBuffer {
    const dur = 2.5;
    const { buffer, data, len } = this.makeBuf(sr, dur);

    // Inharmonic partial ratios characteristic of bells/chimes
    const ratios = [1.0, 2.76, 5.40, 8.93, 13.34, 18.64];
    const amps = [1.0, 0.55, 0.30, 0.18, 0.08, 0.03];
    const decays = [1.5, 2.2, 3.8, 5.5, 7.0, 9.0];

    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const tN = t / dur;

      // Sharp metallic strike
      let env: number;
      if (t < 0.001) {
        env = t / 0.001;
      } else {
        env = Math.exp(-1.0 * t);
      }

      let s = 0;
      for (let p = 0; p < ratios.length; p++) {
        const pFreq = freq * ratios[p];
        if (pFreq > sr * 0.45) continue;
        s += Math.sin(2 * Math.PI * pFreq * t) * amps[p] * Math.exp(-decays[p] * t);
      }

      // Metallic strike noise
      if (t < 0.008) {
        const nEnv = (1 - t / 0.008);
        s += (Math.random() * 2 - 1) * 0.3 * nEnv * nEnv;
      }

      // Beating effect (two close frequencies) for shimmer
      const beat1 = Math.sin(2 * Math.PI * freq * 1.002 * t) * 0.06 * Math.exp(-1.5 * t);
      const beat2 = Math.sin(2 * Math.PI * freq * 0.998 * t) * 0.06 * Math.exp(-1.5 * t);
      s += beat1 + beat2;

      s *= env;
      s = Math.tanh(s * 1.0) * 0.7;
      if (tN > 0.96) s *= (1 - tN) / 0.04;
      data[i] = s;
    }
    return buffer;
  }

  /* ─── Timbre 4: Marimba (warm, woody, round mallet tone) ─── */
  private synthWater(freq: number, _ni: number, sr: number): AudioBuffer {
    const dur = 1.2;
    const { buffer, data, len } = this.makeBuf(sr, dur);

    // Marimba: resonant wooden bar struck by soft mallet
    // Characteristics: strong fundamental, weak odd harmonics, 4x partial prominent
    // Warm, round tone with clear pitch and gentle decay

    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const tN = t / dur;

      // Soft mallet envelope: gentle attack, smooth exponential decay
      let env: number;
      if (t < 0.004) {
        env = t / 0.004;
      } else if (t < 0.015) {
        env = 1.0 - (t - 0.004) / 0.011 * 0.15;
      } else {
        env = 0.85 * Math.exp(-3.0 * (t - 0.015));
      }

      // Fundamental: strong and warm
      let s = Math.sin(2 * Math.PI * freq * t) * 1.0;

      // 4x partial (characteristic of marimba bars - tuned resonance)
      s += Math.sin(2 * Math.PI * freq * 4.0 * t) * 0.35 * Math.exp(-5.0 * t);

      // Subtle 2nd harmonic for richness
      s += Math.sin(2 * Math.PI * freq * 2.0 * t) * 0.12 * Math.exp(-4.0 * t);

      // Very weak 3rd partial (odd harmonics suppressed in bars)
      s += Math.sin(2 * Math.PI * freq * 3.0 * t) * 0.05 * Math.exp(-6.0 * t);

      // Resonator body: sub-octave warmth (tubular resonator beneath bar)
      s += Math.sin(2 * Math.PI * freq * 0.5 * t) * 0.08 * Math.exp(-2.5 * t);

      // Mallet "thud" transient (soft mallet on wood)
      if (t < 0.012) {
        const thudEnv = (1 - t / 0.012);
        s += (Math.random() * 2 - 1) * 0.04 * thudEnv * thudEnv;
        // Brief woody knock
        s += Math.sin(2 * Math.PI * freq * 9.5 * t) * 0.08 * thudEnv * thudEnv;
      }

      // Gentle amplitude modulation (sympathetic vibration feel)
      s *= (1 + 0.02 * Math.sin(2 * Math.PI * 4.0 * t));

      s *= env;
      s = Math.tanh(s * 1.0) * 0.75;
      if (tN > 0.93) s *= (1 - tN) / 0.07;
      data[i] = s;
    }
    return buffer;
  }

  /* ─── Timbre 5: Music Box (warm, twinkling, cheerful 八音盒) ─── */
  private synthWind(freq: number, ni: number, sr: number): AudioBuffer {
    const dur = 1.6;
    const { buffer, data, len } = this.makeBuf(sr, dur);

    // Music box: metal tine plucked by pin on rotating cylinder
    // Warm, nostalgic, twinkling — think of a lullaby music box
    // Characteristics: clear fundamental, gentle harmonics, soft pluck attack

    // Music box lives in a sweet mid-high range
    const boxFreq = freq * 2;

    // Phase offset per note for natural variety
    const ph = ni * 0.91;

    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const tN = t / dur;

      // Gentle pluck envelope: soft attack, warm decay
      let env: number;
      if (t < 0.001) {
        env = t / 0.001;
      } else if (t < 0.01) {
        env = 1.0 - (t - 0.001) / 0.009 * 0.2;
      } else {
        // Warm exponential decay (not too fast, lets it ring sweetly)
        env = 0.8 * Math.exp(-2.8 * (t - 0.01));
      }

      // Strong, pure fundamental (the core warm tone)
      let s = Math.sin(2 * Math.PI * boxFreq * t + ph) * 0.7;

      // 2nd harmonic: adds brightness without harshness
      s += Math.sin(2 * Math.PI * boxFreq * 2 * t + ph * 1.3) * 0.25 * Math.exp(-3.5 * t);

      // 3rd harmonic: tiny bit of sparkle
      s += Math.sin(2 * Math.PI * boxFreq * 3 * t) * 0.1 * Math.exp(-5.0 * t);

      // 4th harmonic: very subtle, high shimmer
      s += Math.sin(2 * Math.PI * boxFreq * 4 * t) * 0.04 * Math.exp(-7.0 * t);

      // Soft sub-octave body (warmth from the wooden box resonance)
      s += Math.sin(2 * Math.PI * boxFreq * 0.5 * t) * 0.12 * Math.exp(-2.0 * t);

      // Gentle pluck transient (pin releasing the tine)
      if (t < 0.005) {
        const pluckEnv = (1 - t / 0.005);
        s += Math.sin(2 * Math.PI * boxFreq * 5 * t) * 0.15 * pluckEnv * pluckEnv;
      }

      // Very subtle amplitude wobble (resonance of the box)
      s *= (1 + 0.015 * Math.sin(2 * Math.PI * 6 * t));

      s *= env;
      s = Math.tanh(s * 1.2) * 0.7;
      if (tN > 0.95) s *= (1 - tN) / 0.05;
      data[i] = s;
    }
    return buffer;
  }

  /* ═══ ADSR helper ═══ */

  private adsrEnv(t: number, atk: number, dec: number, susLvl: number, dur: number): number {
    if (t < atk) return t / atk;
    if (t < atk + dec) {
      const dp = (t - atk) / dec;
      return 1.0 - dp * (1.0 - susLvl);
    }
    const rel = dur - atk - dec;
    const rp = (t - atk - dec) / rel;
    return susLvl * Math.exp(-3.2 * rp);
  }

  /* ═══ Playback ═══ */

  playNote(noteIndex: number, octaveOverride?: -1 | 0 | 1): void {
    const ctx = this.audioCtx;
    if (!ctx || !this.masterGain || this._muted) return;
    const buffers = this.bufferBank.get(this.currentTimbre);
    if (!buffers || noteIndex < 0 || noteIndex >= buffers.length) return;

    if (ctx.state === 'suspended') ctx.resume();

    const source = ctx.createBufferSource();
    source.buffer = buffers[noteIndex];

    // Octave shift via playbackRate: 0.5 = down octave, 1 = normal, 2 = up octave
    const octave = octaveOverride !== undefined ? octaveOverride : this._octave;
    source.playbackRate.value = Math.pow(2, octave);

    const noteGain = ctx.createGain();
    noteGain.gain.value = 0.85;

    source.connect(noteGain);
    noteGain.connect(this.dryGain!);
    if (this.reverbSend) noteGain.connect(this.reverbSend);

    source.start();
    source.onended = () => { source.disconnect(); noteGain.disconnect(); };
  }

  /* ═══ Timbre switching ═══ */

  setTimbre(id: TimbreId): void {
    this.currentTimbre = id;
  }

  getTimbre(): TimbreId {
    return this.currentTimbre;
  }

  /* ═══ Octave (低音/中音/高音) ═══ */

  setOctave(o: -1 | 0 | 1): void {
    this._octave = o;
  }

  getOctave(): -1 | 0 | 1 {
    return this._octave;
  }

  cycleOctave(): -1 | 0 | 1 {
    if (this._octave === -1) this._octave = 0;
    else if (this._octave === 0) this._octave = 1;
    else this._octave = -1;
    return this._octave;
  }

  /* ═══ Volume / Mute ═══ */

  setVolume(value: number): void {
    this._volume = Math.max(0, Math.min(1, value));
    if (this.masterGain) this.masterGain.gain.value = this._muted ? 0 : this._volume;
  }

  get volume(): number { return this._volume; }

  toggleMute(): boolean {
    this._muted = !this._muted;
    if (this.masterGain) this.masterGain.gain.value = this._muted ? 0 : this._volume;
    return this._muted;
  }

  get muted(): boolean { return this._muted; }

  async ensureResumed(): Promise<void> {
    if (this.audioCtx && this.audioCtx.state === 'suspended') await this.audioCtx.resume();
  }
}
