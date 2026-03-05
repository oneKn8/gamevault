import { Scene, Group } from 'three';
import type { BlockPosition } from './types';
import { createGhostMesh, recycleGhostMesh } from './BlockMesh';

/** Renders the ghost (drop preview) piece as wireframe blocks. */
export class GhostRenderer {
  private meshes: Group[] = [];
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /** Updates the ghost piece display at the given block positions. */
  update(blocks: BlockPosition[], color: number): void {
    // Reuse existing meshes if count matches, otherwise rebuild
    while (this.meshes.length < blocks.length) {
      const mesh = createGhostMesh(color);
      this.scene.add(mesh);
      this.meshes.push(mesh);
    }
    while (this.meshes.length > blocks.length) {
      const mesh = this.meshes.pop()!;
      this.scene.remove(mesh);
      recycleGhostMesh(mesh);
    }

    for (let i = 0; i < blocks.length; i++) {
      this.meshes[i].position.set(blocks[i].x + 0.5, blocks[i].y + 0.5, 0);
      this.meshes[i].visible = true;
    }
  }

  /** Hides all ghost meshes. */
  hide(): void {
    for (const mesh of this.meshes) {
      mesh.visible = false;
    }
  }

  /** Removes all ghost meshes from the scene. */
  clear(): void {
    for (const mesh of this.meshes) {
      this.scene.remove(mesh);
      recycleGhostMesh(mesh);
    }
    this.meshes = [];
  }
}
