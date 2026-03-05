import { FIXED_DT, MAX_DT } from '../constants';

export class GameLoop {
  private running = false;
  private rafId = 0;
  private lastTime = 0;
  private accumulator = 0;

  onUpdate: (dt: number) => void = () => {};
  onRender: (interp: number) => void = () => {};

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.tick(this.lastTime);
  }

  stop(): void {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private tick = (now: number): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.tick);

    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Cap delta to prevent spiral of death (e.g. tab backgrounded)
    if (dt > MAX_DT) dt = MAX_DT;

    this.accumulator += dt;

    while (this.accumulator >= FIXED_DT) {
      this.onUpdate(FIXED_DT);
      this.accumulator -= FIXED_DT;
    }

    // interp = how far we are between fixed steps (for smooth rendering)
    const interp = this.accumulator / FIXED_DT;
    this.onRender(interp);
  };
}
