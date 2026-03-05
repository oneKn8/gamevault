export class AnimationQueue {
  private queue: (() => Promise<void>)[] = [];

  enqueue(animation: () => Promise<void>): void {
    this.queue.push(animation);
  }

  async playAll(): Promise<void> {
    for (const animation of this.queue) {
      await animation();
    }
    this.queue = [];
  }

  async parallel(animations: (() => Promise<void>)[]): Promise<void> {
    await Promise.all(animations.map(a => a()));
  }

  clear(): void {
    this.queue = [];
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
