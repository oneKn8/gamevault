import {
  Scene, Group, Mesh, CylinderGeometry, IcosahedronGeometry,
  MeshPhongMaterial, Color,
} from 'three';
import {
  PLAYER_COLORS, PIECE_BASE_TOP_RADIUS, PIECE_BASE_BOTTOM_RADIUS,
  PIECE_BASE_HEIGHT, PIECE_BODY_TOP_RADIUS, PIECE_BODY_BOTTOM_RADIUS,
  PIECE_BODY_HEIGHT, PIECE_CAP_RADIUS, PIECE_SEGMENTS, TILE_GAP,
  TILE_HEIGHT, PIECE_MOVE_DURATION, PIECE_DEATH_DURATION,
} from './constants';
import type { PlayerID, Piece } from './types';

interface PieceMesh {
  group: Group;
  pieceId: number;
  owner: PlayerID;
  // Animation state
  animating: boolean;
  animStartTime: number;
  animDuration: number;
  fromX: number;
  fromZ: number;
  toX: number;
  toZ: number;
  // Death animation
  dying: boolean;
  deathStartTime: number;
  // Planning pulse
  pulsing: boolean;
}

export class PieceRenderer {
  private scene: Scene;
  private pieceMeshes: Map<number, PieceMesh> = new Map();
  private pieceGroup = new Group();
  private onDeathComplete: ((pieceId: number) => void) | null = null;
  private onMoveComplete: ((pieceId: number) => void) | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
    this.scene.add(this.pieceGroup);
  }

  createPiece(piece: Piece): void {
    const color = PLAYER_COLORS[piece.owner];
    const group = new Group();

    const mat = new MeshPhongMaterial({ color, shininess: 80 });

    // Base (hexagonal plate)
    const baseGeo = new CylinderGeometry(
      PIECE_BASE_TOP_RADIUS, PIECE_BASE_BOTTOM_RADIUS,
      PIECE_BASE_HEIGHT, PIECE_SEGMENTS,
    );
    const baseMesh = new Mesh(baseGeo, mat.clone());
    baseMesh.position.y = PIECE_BASE_HEIGHT / 2;
    group.add(baseMesh);

    // Body (hexagonal prism)
    const bodyGeo = new CylinderGeometry(
      PIECE_BODY_TOP_RADIUS, PIECE_BODY_BOTTOM_RADIUS,
      PIECE_BODY_HEIGHT, PIECE_SEGMENTS,
    );
    const bodyMesh = new Mesh(bodyGeo, mat.clone());
    bodyMesh.position.y = PIECE_BASE_HEIGHT + PIECE_BODY_HEIGHT / 2;
    group.add(bodyMesh);

    // Cap (faceted sphere)
    const capGeo = new IcosahedronGeometry(PIECE_CAP_RADIUS, 1);
    const capMesh = new Mesh(capGeo, mat.clone());
    capMesh.position.y = PIECE_BASE_HEIGHT + PIECE_BODY_HEIGHT + PIECE_CAP_RADIUS * 0.6;
    group.add(capMesh);

    // Position on board
    const x = piece.col * TILE_GAP;
    const z = piece.row * TILE_GAP;
    group.position.set(x, TILE_HEIGHT, z);

    this.pieceGroup.add(group);

    this.pieceMeshes.set(piece.id, {
      group,
      pieceId: piece.id,
      owner: piece.owner,
      animating: false,
      animStartTime: 0,
      animDuration: PIECE_MOVE_DURATION,
      fromX: x,
      fromZ: z,
      toX: x,
      toZ: z,
      dying: false,
      deathStartTime: 0,
      pulsing: false,
    });
  }

  movePiece(pieceId: number, fromRow: number, fromCol: number, toRow: number, toCol: number): void {
    const pm = this.pieceMeshes.get(pieceId);
    if (!pm) return;

    pm.fromX = fromCol * TILE_GAP;
    pm.fromZ = fromRow * TILE_GAP;
    pm.toX = toCol * TILE_GAP;
    pm.toZ = toRow * TILE_GAP;
    pm.animating = true;
    pm.animStartTime = performance.now();
    pm.animDuration = PIECE_MOVE_DURATION;
  }

  killPiece(pieceId: number): void {
    const pm = this.pieceMeshes.get(pieceId);
    if (!pm) return;
    pm.dying = true;
    pm.deathStartTime = performance.now();
  }

  setPlanningPulse(pieceId: number, active: boolean): void {
    const pm = this.pieceMeshes.get(pieceId);
    if (!pm) return;
    pm.pulsing = active;
  }

  setOnMoveComplete(callback: (pieceId: number) => void): void {
    this.onMoveComplete = callback;
  }

  setOnDeathComplete(callback: (pieceId: number) => void): void {
    this.onDeathComplete = callback;
  }

  update(time: number): void {
    const now = performance.now();

    for (const [, pm] of this.pieceMeshes) {
      // Move animation
      if (pm.animating) {
        const elapsed = now - pm.animStartTime;
        const t = Math.min(1, elapsed / pm.animDuration);
        // Ease-out cubic
        const ease = 1 - Math.pow(1 - t, 3);

        const x = pm.fromX + (pm.toX - pm.fromX) * ease;
        const z = pm.fromZ + (pm.toZ - pm.fromZ) * ease;
        // Y arc (sin hop)
        const yHop = Math.sin(t * Math.PI) * 0.25;

        pm.group.position.set(x, TILE_HEIGHT + yHop, z);

        if (t >= 1) {
          pm.animating = false;
          pm.group.position.set(pm.toX, TILE_HEIGHT, pm.toZ);
          this.onMoveComplete?.(pm.pieceId);
        }
      }

      // Death animation
      if (pm.dying) {
        const elapsed = now - pm.deathStartTime;
        const t = Math.min(1, elapsed / PIECE_DEATH_DURATION);

        const scale = 1 - t;
        pm.group.scale.set(scale, scale, scale);
        pm.group.position.y = TILE_HEIGHT + t * 0.4;

        if (t >= 1) {
          pm.dying = false;
          pm.group.visible = false;
          this.onDeathComplete?.(pm.pieceId);
        }
      }

      // Planning pulse
      if (pm.pulsing && !pm.animating && !pm.dying) {
        const pulse = Math.sin(time * 4) * 0.05;
        pm.group.position.y = TILE_HEIGHT + pulse;
      }
    }
  }

  removePiece(pieceId: number): void {
    const pm = this.pieceMeshes.get(pieceId);
    if (!pm) return;

    this.pieceGroup.remove(pm.group);
    pm.group.traverse(obj => {
      if (obj instanceof Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    this.pieceMeshes.delete(pieceId);
  }

  clearAll(): void {
    for (const [id] of this.pieceMeshes) {
      this.removePiece(id);
    }
    this.pieceMeshes.clear();
  }

  getPieceWorldPos(pieceId: number): { x: number; z: number } | null {
    const pm = this.pieceMeshes.get(pieceId);
    if (!pm) return null;
    return { x: pm.group.position.x, z: pm.group.position.z };
  }
}
