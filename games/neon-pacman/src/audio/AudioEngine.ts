/**
 * Web Audio API engine with lazy initialization.
 *
 * Browser autoplay policies require an AudioContext to be created (or resumed)
 * inside a user-gesture handler. Call {@link init} on the first click / keypress
 * before attempting to play any sound.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;
  private initialized = false;

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Create the AudioContext and master gain node.
   *
   * Must be called from within a user-gesture event handler (click, keydown,
   * touchstart) so the browser allows audio playback.  Subsequent calls are
   * harmless no-ops.
   */
  init(): void {
    if (this.initialized) return;

    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.initialized = true;
  }

  /** Returns the underlying AudioContext, or `null` before {@link init}. */
  getContext(): AudioContext | null {
    return this.ctx;
  }

  /** Returns the master GainNode, or `null` before {@link init}. */
  getMasterGain(): GainNode | null {
    return this.masterGain;
  }

  // ---------------------------------------------------------------------------
  // Volume
  // ---------------------------------------------------------------------------

  /** Toggle mute on / off. Returns the new muted state. */
  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 1;
    }
    return this.muted;
  }

  /** Whether audio is currently muted. */
  isMuted(): boolean {
    return this.muted;
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  /**
   * Play a single oscillator tone that auto-disconnects after `duration`.
   *
   * @param freq     Frequency in Hz.
   * @param type     OscillatorType (sine, square, sawtooth, triangle).
   * @param duration Duration in seconds.
   * @param volume   Gain from 0 to 1 (default 0.3).
   */
  playTone(
    freq: number,
    type: OscillatorType,
    duration: number,
    volume = 0.3,
  ): void {
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(volume, now);
    // Quick fade-out to avoid click artifacts.
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);

    // Clean up nodes after they finish.
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  /**
   * Play a sequence of tones back-to-back.
   *
   * Each note starts immediately after the previous one ends. All notes
   * share the same oscillator type and volume.
   *
   * @param notes  Array of `{ freq, duration }` objects.
   * @param type   OscillatorType shared by all notes.
   * @param volume Gain from 0 to 1 (default 0.3).
   */
  playSequence(
    notes: Array<{ freq: number; duration: number }>,
    type: OscillatorType,
    volume = 0.3,
  ): void {
    if (!this.ctx || !this.masterGain) return;

    let offset = this.ctx.currentTime;

    for (const note of notes) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(note.freq, offset);

      gain.gain.setValueAtTime(volume, offset);
      gain.gain.linearRampToValueAtTime(0, offset + note.duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(offset);
      osc.stop(offset + note.duration);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };

      offset += note.duration;
    }
  }
}
