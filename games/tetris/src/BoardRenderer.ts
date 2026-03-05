import {
  Scene,
  Group,
  Mesh,
  MeshPhongMaterial,
  Color,
} from 'three';
import { Board } from './Board';
import { createBlockMesh, recycleBlockMesh } from './BlockMesh';
import { BOARD_W, VISIBLE_HEIGHT, TETROMINO_DATA } from './constants';

/** Manages 3D mesh representations of locked blocks on the board. */
export class BoardRenderer {
  private lockedMeshes: Map<string, Group> = new Map();
  private scene: Scene;
  private animatingRows: Set<number> = new Set();

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /** Syncs the 3D mesh state with the board grid. */
  updateLocked(board: Board): void {
    const currentKeys = new Set<string>();

    // Add/update meshes for all filled cells
    const cells = board.getFilledCells();
    for (const cell of cells) {
      // Only render visible rows
      if (cell.row >= VISIBLE_HEIGHT) continue;
      // Skip rows currently being animated
      if (this.animatingRows.has(cell.row)) continue;

      const key = `${cell.row},${cell.col}`;
      currentKeys.add(key);

      if (!this.lockedMeshes.has(key)) {
        // Find the emissive color for this block color
        const emissive = this.findEmissive(cell.color);
        const mesh = createBlockMesh(cell.color, emissive);
        mesh.position.set(cell.col + 0.5, cell.row + 0.5, 0);
        this.scene.add(mesh);
        this.lockedMeshes.set(key, mesh);
      }
    }

    // Remove meshes that no longer correspond to filled cells
    for (const [key, mesh] of this.lockedMeshes) {
      if (!currentKeys.has(key)) {
        this.scene.remove(mesh);
        recycleBlockMesh(mesh);
        this.lockedMeshes.delete(key);
      }
    }
  }

  /** Animates line clear with flash and explode effect. */
  animateLineClear(rows: number[], board: Board, onComplete: () => void): void {
    // Collect meshes in the cleared rows
    const rowMeshes: Map<string, Group> = new Map();

    for (const row of rows) {
      this.animatingRows.add(row);
      for (let col = 0; col < BOARD_W; col++) {
        const key = `${row},${col}`;
        const mesh = this.lockedMeshes.get(key);
        if (mesh) {
          rowMeshes.set(key, mesh);
        }
      }
    }

    // Phase 1: Flash white (0-200ms)
    for (const [, mesh] of rowMeshes) {
      const block = mesh.children[0] as Mesh;
      if (block && block.material instanceof MeshPhongMaterial) {
        block.material.emissive = new Color(0xffffff);
        block.material.emissiveIntensity = 2.0;
      }
    }

    // Phase 2: Explode outward (200-500ms)
    setTimeout(() => {
      const velocities = new Map<string, { vx: number; vy: number; vz: number; ry: number }>();

      for (const [key, mesh] of rowMeshes) {
        const vx = (Math.random() - 0.5) * 12;
        const vy = (Math.random() - 0.5) * 8 + 4;
        const vz = Math.random() * 10 + 3;
        const ry = (Math.random() - 0.5) * 8;
        velocities.set(key, { vx, vy, vz, ry });

        // Reduce opacity
        const block = mesh.children[0] as Mesh;
        if (block && block.material instanceof MeshPhongMaterial) {
          block.material.opacity = 0.6;
        }
      }

      // Animate explosion over 300ms
      const startTime = performance.now();
      const animateExplosion = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(elapsed / 300, 1);

        for (const [key, mesh] of rowMeshes) {
          const vel = velocities.get(key)!;
          mesh.position.x += vel.vx * 0.016;
          mesh.position.y += vel.vy * 0.016;
          mesh.position.z += vel.vz * 0.016;
          mesh.rotation.y += vel.ry * 0.016;

          // Fade out
          const block = mesh.children[0] as Mesh;
          if (block && block.material instanceof MeshPhongMaterial) {
            block.material.opacity = 0.6 * (1 - t);
          }
        }

        if (t < 1) {
          requestAnimationFrame(animateExplosion);
        } else {
          // Phase 3: Clean up
          for (const [key, mesh] of rowMeshes) {
            this.scene.remove(mesh);
            recycleBlockMesh(mesh);
            this.lockedMeshes.delete(key);
          }

          // Clear animating state
          this.animatingRows.clear();

          // Re-sync all remaining meshes (rows have shifted)
          this.clearAll();
          this.updateLocked(board);

          onComplete();
        }
      };

      requestAnimationFrame(animateExplosion);
    }, 200);
  }

  /** Removes all locked meshes from the scene. */
  clearAll(): void {
    for (const [, mesh] of this.lockedMeshes) {
      this.scene.remove(mesh);
      recycleBlockMesh(mesh);
    }
    this.lockedMeshes.clear();
  }

  /** Finds the emissive color for a given block color. */
  private findEmissive(color: number): number {
    for (const data of Object.values(TETROMINO_DATA)) {
      if (data.color === color) return data.emissive;
    }
    return 0x111111;
  }
}
