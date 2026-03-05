export class Timer {
  private startTime: number | null = null;
  private elapsed = 0;
  private running = false;

  start(): void {
    if (this.running) return;
    this.startTime = performance.now();
    this.running = true;
  }

  stop(): void {
    if (!this.running) return;
    if (this.startTime !== null) {
      this.elapsed += (performance.now() - this.startTime) / 1000;
    }
    this.running = false;
    this.startTime = null;
  }

  reset(): void {
    this.startTime = null;
    this.elapsed = 0;
    this.running = false;
  }

  /** Returns elapsed time in seconds. */
  getElapsed(): number {
    if (this.running && this.startTime !== null) {
      return this.elapsed + (performance.now() - this.startTime) / 1000;
    }
    return this.elapsed;
  }

  /** Returns a zero-padded 3-digit string of elapsed seconds (capped at 999). */
  getDisplay(): string {
    const seconds = Math.min(999, Math.floor(this.getElapsed()));
    return String(seconds).padStart(3, '0');
  }
}
