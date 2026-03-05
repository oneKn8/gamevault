import {
  Scene, Group, Mesh, BoxGeometry, MeshPhongMaterial, PlaneGeometry,
  MeshBasicMaterial, Color,
} from 'three';
import {
  TILE_SIZE, TILE_HEIGHT, TILE_GAP, OBSTACLE_HEIGHT, OBSTACLE_COLOR,
  NEUTRAL_COLOR, TILE_LIFT, TILE_CAPTURE_DURATION,
} from './constants';
import type { Cell, PlayerID } from './types';

interface TileData {
  group: Group;
  mainMesh: Mesh;
  mainMat: MeshPhongMaterial;
  bevels: { mesh: Mesh; mat: MeshBasicMaterial }[];
  currentColor: number;
  targetColor: number;
  lerpProgress: number;
  isObstacle: boolean;
  lifted: boolean;
}

function lighten(hex: number, amount: number): Color {
  const c = new Color(hex);
  c.r = Math.min(1, c.r + amount);
  c.g = Math.min(1, c.g + amount);
  c.b = Math.min(1, c.b + amount);
  return c;
}

function darken(hex: number, amount: number): Color {
  const c = new Color(hex);
  c.r = Math.max(0, c.r - amount);
  c.g = Math.max(0, c.g - amount);
  c.b = Math.max(0, c.b - amount);
  return c;
}

export class TileRenderer {
  private scene: Scene;
  private tiles: TileData[][] = [];
  private tileGroup = new Group();

  constructor(scene: Scene) {
    this.scene = scene;
    this.scene.add(this.tileGroup);
  }

  buildGrid(gridSize: number, grid: Cell[][]): void {
    this.clearGrid();
    this.tiles = [];

    for (let r = 0; r < gridSize; r++) {
      const row: TileData[] = [];
      for (let c = 0; c < gridSize; c++) {
        const cell = grid[r][c];
        const isObstacle = cell.isObstacle;
        const color = isObstacle ? OBSTACLE_COLOR : NEUTRAL_COLOR;
        const height = isObstacle ? OBSTACLE_HEIGHT : TILE_HEIGHT;

        const group = new Group();
        group.position.set(c * TILE_GAP, height / 2, r * TILE_GAP);

        // Main tile mesh
        const mainGeo = new BoxGeometry(TILE_SIZE, height, TILE_SIZE);
        const mainMat = new MeshPhongMaterial({
          color,
          shininess: isObstacle ? 10 : 40,
        });
        const mainMesh = new Mesh(mainGeo, mainMat);
        group.add(mainMesh);

        // Bevel strips (only for non-obstacle tiles)
        const bevels: { mesh: Mesh; mat: MeshBasicMaterial }[] = [];
        if (!isObstacle) {
          const bevelW = TILE_SIZE - 0.14;
          const bevelH = 0.03;

          // Top highlight
          const topMat = new MeshBasicMaterial({
            color: lighten(color, 0.2),
            transparent: true,
            opacity: 0.4,
          });
          const topGeo = new PlaneGeometry(bevelW, bevelH);
          const topMesh = new Mesh(topGeo, topMat);
          topMesh.rotation.x = -Math.PI / 2;
          topMesh.position.set(0, height / 2 + 0.001, -TILE_SIZE / 2 + bevelH / 2 + 0.03);
          group.add(topMesh);
          bevels.push({ mesh: topMesh, mat: topMat });

          // Bottom shadow
          const botMat = new MeshBasicMaterial({
            color: darken(color, 0.2),
            transparent: true,
            opacity: 0.4,
          });
          const botGeo = new PlaneGeometry(bevelW, bevelH);
          const botMesh = new Mesh(botGeo, botMat);
          botMesh.rotation.x = -Math.PI / 2;
          botMesh.position.set(0, height / 2 + 0.001, TILE_SIZE / 2 - bevelH / 2 - 0.03);
          group.add(botMesh);
          bevels.push({ mesh: botMesh, mat: botMat });

          // Left highlight
          const leftMat = new MeshBasicMaterial({
            color: lighten(color, 0.2),
            transparent: true,
            opacity: 0.35,
          });
          const leftGeo = new PlaneGeometry(bevelH, TILE_SIZE - 0.14);
          const leftMesh = new Mesh(leftGeo, leftMat);
          leftMesh.rotation.x = -Math.PI / 2;
          leftMesh.position.set(-TILE_SIZE / 2 + bevelH / 2 + 0.03, height / 2 + 0.001, 0);
          group.add(leftMesh);
          bevels.push({ mesh: leftMesh, mat: leftMat });

          // Right shadow
          const rightMat = new MeshBasicMaterial({
            color: darken(color, 0.2),
            transparent: true,
            opacity: 0.35,
          });
          const rightGeo = new PlaneGeometry(bevelH, TILE_SIZE - 0.14);
          const rightMesh = new Mesh(rightGeo, rightMat);
          rightMesh.rotation.x = -Math.PI / 2;
          rightMesh.position.set(TILE_SIZE / 2 - bevelH / 2 - 0.03, height / 2 + 0.001, 0);
          group.add(rightMesh);
          bevels.push({ mesh: rightMesh, mat: rightMat });
        }

        this.tileGroup.add(group);
        row.push({
          group,
          mainMesh,
          mainMat,
          bevels,
          currentColor: color,
          targetColor: color,
          lerpProgress: 1,
          isObstacle,
          lifted: false,
        });
      }
      this.tiles.push(row);
    }
  }

  setTileColor(row: number, col: number, color: number, animated: boolean): void {
    const tile = this.tiles[row]?.[col];
    if (!tile || tile.isObstacle) return;

    if (animated) {
      tile.targetColor = color;
      tile.lerpProgress = 0;
    } else {
      tile.currentColor = color;
      tile.targetColor = color;
      tile.lerpProgress = 1;
      tile.mainMat.color.setHex(color);
      this.updateBevelColors(tile, color);
    }
  }

  setTileHighlight(row: number, col: number, highlight: boolean): void {
    const tile = this.tiles[row]?.[col];
    if (!tile || tile.isObstacle) return;

    if (highlight) {
      tile.mainMat.emissive.setHex(0x222233);
    } else {
      tile.mainMat.emissive.setHex(0x000000);
    }
  }

  setTileValidTarget(row: number, col: number, valid: boolean, playerColor: number): void {
    const tile = this.tiles[row]?.[col];
    if (!tile || tile.isObstacle) return;

    if (valid) {
      tile.mainMat.emissive.set(new Color(playerColor).multiplyScalar(0.15));
    } else {
      tile.mainMat.emissive.setHex(0x000000);
    }
  }

  clearAllHighlights(): void {
    for (const row of this.tiles) {
      for (const tile of row) {
        if (!tile.isObstacle) {
          tile.mainMat.emissive.setHex(0x000000);
        }
      }
    }
  }

  update(dt: number): void {
    for (const row of this.tiles) {
      for (const tile of row) {
        if (tile.lerpProgress < 1) {
          tile.lerpProgress = Math.min(1, tile.lerpProgress + dt / TILE_CAPTURE_DURATION);
          const fromColor = new Color(tile.currentColor);
          const toColor = new Color(tile.targetColor);
          fromColor.lerp(toColor, tile.lerpProgress);
          tile.mainMat.color.copy(fromColor);

          if (tile.lerpProgress >= 1) {
            tile.currentColor = tile.targetColor;
            tile.mainMat.color.setHex(tile.targetColor);
            this.updateBevelColors(tile, tile.targetColor);
          }
        }

        // Lift animation
        const targetY = tile.lifted
          ? (tile.isObstacle ? OBSTACLE_HEIGHT : TILE_HEIGHT) / 2 + TILE_LIFT
          : (tile.isObstacle ? OBSTACLE_HEIGHT : TILE_HEIGHT) / 2;
        const currentY = tile.group.position.y;
        if (Math.abs(currentY - targetY) > 0.001) {
          tile.group.position.y += (targetY - currentY) * 0.15;
        }
      }
    }
  }

  private updateBevelColors(tile: TileData, color: number): void {
    if (tile.bevels.length >= 4) {
      tile.bevels[0].mat.color.copy(lighten(color, 0.2));
      tile.bevels[1].mat.color.copy(darken(color, 0.2));
      tile.bevels[2].mat.color.copy(lighten(color, 0.2));
      tile.bevels[3].mat.color.copy(darken(color, 0.2));
    }
  }

  setTileLift(row: number, col: number, lifted: boolean): void {
    const tile = this.tiles[row]?.[col];
    if (!tile) return;
    tile.lifted = lifted;
  }

  clearGrid(): void {
    while (this.tileGroup.children.length > 0) {
      const child = this.tileGroup.children[0];
      this.tileGroup.remove(child);
      if (child instanceof Group) {
        child.traverse(obj => {
          if (obj instanceof Mesh) {
            obj.geometry.dispose();
            if (Array.isArray(obj.material)) {
              obj.material.forEach(m => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        });
      }
    }
    this.tiles = [];
  }

  worldToGrid(gridSize: number, x: number, z: number): { row: number; col: number } | null {
    const col = Math.round(x / TILE_GAP);
    const row = Math.round(z / TILE_GAP);
    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      return { row, col };
    }
    return null;
  }
}
