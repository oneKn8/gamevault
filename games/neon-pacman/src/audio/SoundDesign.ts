import { AudioEngine } from './AudioEngine';

/**
 * All game sounds implemented as procedural synthesizer patches using the
 * Web Audio API.  No external audio files are required.
 *
 * Each method creates short-lived oscillator graphs that auto-disconnect
 * after playback.  The sounds are intentionally short, punchy, and
 * recognizable -- arcade-style bleeps and bloops with a modern neon edge.
 */
export class SoundDesign {
  private readonly audioEngine: AudioEngine;

  /** Alternates between two pitches for the dot-eat "waka-waka" effect. */
  private wakaToggle = false;

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
  }

  // ---------------------------------------------------------------------------
  // Dot eat -- alternating "waka-waka"
  // ---------------------------------------------------------------------------

  /**
   * Short square-wave blip that alternates between 240 Hz and 480 Hz on
   * successive calls, producing the classic waka-waka rhythm.
   */
  dotEat(): void {
    const freq = this.wakaToggle ? 480 : 240;
    this.wakaToggle = !this.wakaToggle;
    this.audioEngine.playTone(freq, 'square', 0.05, 0.15);
  }

  // ---------------------------------------------------------------------------
  // Ghost eat -- rising tone scaled by combo count
  // ---------------------------------------------------------------------------

  /**
   * Triangle-wave tone whose pitch rises with each consecutive ghost eaten
   * within a single power-pellet window.  A second oscillator is slightly
   * detuned to add thickness.
   *
   * @param comboCount Number of ghosts eaten so far in this chain (1-based).
   */
  ghostEat(comboCount: number): void {
    const ctx = this.audioEngine.getContext();
    const master = this.audioEngine.getMasterGain();
    if (!ctx || !master) return;

    const baseFreq = 400 + comboCount * 200;
    const now = ctx.currentTime;
    const duration = 0.15;

    // Primary oscillator
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(baseFreq, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.05); // 50ms attack
    gain1.gain.linearRampToValueAtTime(0, now + duration);
    osc1.connect(gain1);
    gain1.connect(master);
    osc1.start(now);
    osc1.stop(now + duration);

    // Detuned oscillator for thickness
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(baseFreq + 8, now);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain2.gain.linearRampToValueAtTime(0, now + duration);
    osc2.connect(gain2);
    gain2.connect(master);
    osc2.start(now);
    osc2.stop(now + duration);

    // Cleanup
    osc1.onended = () => { osc1.disconnect(); gain1.disconnect(); };
    osc2.onended = () => { osc2.disconnect(); gain2.disconnect(); };
  }

  // ---------------------------------------------------------------------------
  // Capsule eat -- bass hit + high shimmer sweep
  // ---------------------------------------------------------------------------

  /**
   * Two-layer sound: a deep 80 Hz sine-wave thud plus a shimmer that
   * sweeps from 800 Hz to 1600 Hz over 200 ms.
   */
  capsuleEat(): void {
    const ctx = this.audioEngine.getContext();
    const master = this.audioEngine.getMasterGain();
    if (!ctx || !master) return;

    const now = ctx.currentTime;

    // -- Bass hit --
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(80, now);
    bassGain.gain.setValueAtTime(0.4, now);
    bassGain.gain.linearRampToValueAtTime(0, now + 0.3);
    bassOsc.connect(bassGain);
    bassGain.connect(master);
    bassOsc.start(now);
    bassOsc.stop(now + 0.3);

    // -- High shimmer sweep 800 -> 1600 Hz --
    const shimmerOsc = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmerOsc.type = 'sine';
    shimmerOsc.frequency.setValueAtTime(800, now);
    shimmerOsc.frequency.linearRampToValueAtTime(1600, now + 0.2);
    shimmerGain.gain.setValueAtTime(0.15, now);
    shimmerGain.gain.linearRampToValueAtTime(0, now + 0.2);
    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(master);
    shimmerOsc.start(now);
    shimmerOsc.stop(now + 0.2);

    // Cleanup
    bassOsc.onended = () => { bassOsc.disconnect(); bassGain.disconnect(); };
    shimmerOsc.onended = () => { shimmerOsc.disconnect(); shimmerGain.disconnect(); };
  }

  // ---------------------------------------------------------------------------
  // Death -- descending chromatic sequence
  // ---------------------------------------------------------------------------

  /**
   * Eight descending sawtooth notes from 600 Hz down to roughly 200 Hz,
   * each 120 ms, with progressively decreasing volume.
   */
  death(): void {
    const ctx = this.audioEngine.getContext();
    const master = this.audioEngine.getMasterGain();
    if (!ctx || !master) return;

    const noteCount = 8;
    const startFreq = 600;
    const endFreq = 200;
    const noteDuration = 0.12;
    const now = ctx.currentTime;

    for (let i = 0; i < noteCount; i++) {
      const t = i / (noteCount - 1); // 0..1
      const freq = startFreq + (endFreq - startFreq) * t;
      const volume = 0.25 * (1 - t * 0.7); // fade from 0.25 to ~0.075
      const offset = now + i * noteDuration;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, offset);
      gain.gain.setValueAtTime(volume, offset);
      gain.gain.linearRampToValueAtTime(0, offset + noteDuration);
      osc.connect(gain);
      gain.connect(master);
      osc.start(offset);
      osc.stop(offset + noteDuration);

      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    }
  }

  // ---------------------------------------------------------------------------
  // Level complete -- ascending arpeggio + held note with vibrato
  // ---------------------------------------------------------------------------

  /**
   * Ascending arpeggio: C5 (523), E5 (659), G5 (784), C6 (1047), each
   * 150 ms, followed by a sustained C6 with vibrato for 400 ms.
   * All square wave.
   */
  levelComplete(): void {
    const ctx = this.audioEngine.getContext();
    const master = this.audioEngine.getMasterGain();
    if (!ctx || !master) return;

    const now = ctx.currentTime;
    const arpeggioNotes = [523, 659, 784, 1047];
    const noteDuration = 0.15;

    // -- Arpeggio --
    for (let i = 0; i < arpeggioNotes.length; i++) {
      const offset = now + i * noteDuration;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(arpeggioNotes[i], offset);
      gain.gain.setValueAtTime(0.2, offset);
      gain.gain.linearRampToValueAtTime(0.05, offset + noteDuration);
      osc.connect(gain);
      gain.connect(master);
      osc.start(offset);
      osc.stop(offset + noteDuration);

      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    }

    // -- Held C6 with vibrato --
    const holdStart = now + arpeggioNotes.length * noteDuration;
    const holdDuration = 0.4;

    const holdOsc = ctx.createOscillator();
    const holdGain = ctx.createGain();
    holdOsc.type = 'square';
    holdOsc.frequency.setValueAtTime(1047, holdStart);

    // Vibrato via LFO modulating frequency
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(8, holdStart); // 8 Hz vibrato rate
    lfoGain.gain.setValueAtTime(15, holdStart); // +/- 15 Hz deviation
    lfo.connect(lfoGain);
    lfoGain.connect(holdOsc.frequency);

    holdGain.gain.setValueAtTime(0.25, holdStart);
    holdGain.gain.linearRampToValueAtTime(0, holdStart + holdDuration);

    holdOsc.connect(holdGain);
    holdGain.connect(master);

    lfo.start(holdStart);
    lfo.stop(holdStart + holdDuration);
    holdOsc.start(holdStart);
    holdOsc.stop(holdStart + holdDuration);

    holdOsc.onended = () => {
      holdOsc.disconnect();
      holdGain.disconnect();
      lfo.disconnect();
      lfoGain.disconnect();
    };
  }

  // ---------------------------------------------------------------------------
  // Menu select -- quick blip
  // ---------------------------------------------------------------------------

  /** Short 800 Hz square-wave blip for UI interactions. */
  menuSelect(): void {
    this.audioEngine.playTone(800, 'square', 0.03, 0.2);
  }

  // ---------------------------------------------------------------------------
  // Power up -- ascending whoosh
  // ---------------------------------------------------------------------------

  /**
   * Triangle-wave sweep from 200 Hz to 1000 Hz over 300 ms, giving
   * a satisfying ascending whoosh.
   */
  powerUp(): void {
    const ctx = this.audioEngine.getContext();
    const master = this.audioEngine.getMasterGain();
    if (!ctx || !master) return;

    const now = ctx.currentTime;
    const duration = 0.3;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(1000, now + duration);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.connect(gain);
    gain.connect(master);

    osc.start(now);
    osc.stop(now + duration);

    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
}
