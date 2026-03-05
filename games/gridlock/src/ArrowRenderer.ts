import {
  Scene, Group, Mesh, BoxGeometry, ConeGeometry,
  MeshPhongMaterial,
} from 'three';
import {
  PLAYER_COLORS, ARROW_SHAFT_WIDTH, ARROW_SHAFT_LENGTH,
  ARROW_HEAD_RADIUS, ARROW_HEAD_HEIGHT, TILE_GAP, TILE_HEIGHT,
} from './constants';
import type { PlayerID, PlannedMove } from './types';

interface ArrowData {
  group: Group;
  pieceId: number;
  owner: PlayerID;
}

export class ArrowRenderer {
  private scene: Scene;
  private arrows: Map<number, ArrowData> = new Map();
  private arrowGroup = new Group();

  constructor(scene: Scene) {
    this.scene = scene;
    this.scene.add(this.arrowGroup);
  }

  showArrow(move: PlannedMove, owner: PlayerID, opacity: number = 0.6): void {
    this.hideArrow(move.pieceId);

    const color = PLAYER_COLORS[owner];
    const group = new Group();

    const shaftMat = new MeshPhongMaterial({
      color,
      transparent: true,
      opacity,
      shininess: 40,
    });
    const headMat = new MeshPhongMaterial({
      color,
      transparent: true,
      opacity,
      shininess: 40,
    });

    // Shaft
    const shaftGeo = new BoxGeometry(ARROW_SHAFT_WIDTH, 0.02, ARROW_SHAFT_LENGTH);
    const shaft = new Mesh(shaftGeo, shaftMat);
    group.add(shaft);

    // Head
    const headGeo = new ConeGeometry(ARROW_HEAD_RADIUS, ARROW_HEAD_HEIGHT, 4);
    const head = new Mesh(headGeo, headMat);
    head.rotation.x = -Math.PI / 2;
    head.position.z = -ARROW_SHAFT_LENGTH / 2 - ARROW_HEAD_HEIGHT / 2;
    group.add(head);

    // Position at source tile
    const fromX = move.fromCol * TILE_GAP;
    const fromZ = move.fromRow * TILE_GAP;
    const toX = move.toCol * TILE_GAP;
    const toZ = move.toRow * TILE_GAP;

    // Center between from and to
    const cx = (fromX + toX) / 2;
    const cz = (fromZ + toZ) / 2;
    group.position.set(cx, TILE_HEIGHT + 0.5, cz);

    // Rotate to point in direction
    const dx = toX - fromX;
    const dz = toZ - fromZ;
    const angle = Math.atan2(dx, dz);
    group.rotation.y = -angle + Math.PI;

    this.arrowGroup.add(group);
    this.arrows.set(move.pieceId, { group, pieceId: move.pieceId, owner });
  }

  hideArrow(pieceId: number): void {
    const arrow = this.arrows.get(pieceId);
    if (!arrow) return;
    this.arrowGroup.remove(arrow.group);
    arrow.group.traverse(obj => {
      if (obj instanceof Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    this.arrows.delete(pieceId);
  }

  revealAll(allMoves: PlannedMove[], pieces: { id: number; owner: PlayerID }[]): void {
    // Show all arrows at full opacity
    for (const move of allMoves) {
      const piece = pieces.find(p => p.id === move.pieceId);
      if (!piece) continue;
      this.showArrow(move, piece.owner, 1.0);
    }
  }

  clearAll(): void {
    for (const [id] of this.arrows) {
      this.hideArrow(id);
    }
    this.arrows.clear();
  }
}
