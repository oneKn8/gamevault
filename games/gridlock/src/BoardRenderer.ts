import {
  Scene, Group, Mesh, BoxGeometry, MeshPhongMaterial, MeshBasicMaterial,
} from 'three';
import { BOARD_PLATFORM_COLOR, GRID_LINE_COLOR, TILE_GAP } from './constants';

export class BoardRenderer {
  private scene: Scene;
  private group = new Group();

  constructor(scene: Scene) {
    this.scene = scene;
    this.scene.add(this.group);
  }

  build(gridSize: number): void {
    this.clear();

    const gridW = gridSize * TILE_GAP;
    const gridH = gridSize * TILE_GAP;
    const platformPad = 0.6;

    // Base platform
    const platformGeo = new BoxGeometry(gridW + platformPad, 0.4, gridH + platformPad);
    const platformMat = new MeshPhongMaterial({
      color: BOARD_PLATFORM_COLOR,
      shininess: 20,
    });
    const platform = new Mesh(platformGeo, platformMat);
    const centerOffset = (gridSize - 1) / 2;
    platform.position.set(centerOffset, -0.2, centerOffset);
    this.group.add(platform);

    // Edge bevels (4 thin boxes around the platform edges, slightly lighter)
    const bevelColor = 0x3f3f55;
    const bevelThickness = 0.04;
    const bevelHeight = 0.42;

    // Front edge
    const frontBevel = new Mesh(
      new BoxGeometry(gridW + platformPad, bevelHeight, bevelThickness),
      new MeshPhongMaterial({ color: bevelColor, shininess: 15 }),
    );
    frontBevel.position.set(centerOffset, -0.19, centerOffset + gridH / 2 + platformPad / 2);
    this.group.add(frontBevel);

    // Back edge
    const backBevel = new Mesh(
      new BoxGeometry(gridW + platformPad, bevelHeight, bevelThickness),
      new MeshPhongMaterial({ color: bevelColor, shininess: 15 }),
    );
    backBevel.position.set(centerOffset, -0.19, centerOffset - gridH / 2 - platformPad / 2);
    this.group.add(backBevel);

    // Left edge
    const leftBevel = new Mesh(
      new BoxGeometry(bevelThickness, bevelHeight, gridH + platformPad),
      new MeshPhongMaterial({ color: bevelColor, shininess: 15 }),
    );
    leftBevel.position.set(centerOffset - gridW / 2 - platformPad / 2, -0.19, centerOffset);
    this.group.add(leftBevel);

    // Right edge
    const rightBevel = new Mesh(
      new BoxGeometry(bevelThickness, bevelHeight, gridH + platformPad),
      new MeshPhongMaterial({ color: bevelColor, shininess: 15 }),
    );
    rightBevel.position.set(centerOffset + gridW / 2 + platformPad / 2, -0.19, centerOffset);
    this.group.add(rightBevel);

    // Grid etch lines
    const lineMat = new MeshBasicMaterial({
      color: GRID_LINE_COLOR,
      transparent: true,
      opacity: 0.3,
    });

    // Horizontal lines
    for (let r = 0; r <= gridSize; r++) {
      const lineGeo = new BoxGeometry(gridW, 0.005, 0.02);
      const line = new Mesh(lineGeo, lineMat);
      line.position.set(centerOffset, 0.21, r * TILE_GAP - 0.5);
      this.group.add(line);
    }

    // Vertical lines
    for (let c = 0; c <= gridSize; c++) {
      const lineGeo = new BoxGeometry(0.02, 0.005, gridH);
      const line = new Mesh(lineGeo, lineMat);
      line.position.set(c * TILE_GAP - 0.5, 0.21, centerOffset);
      this.group.add(line);
    }
  }

  clear(): void {
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
      if (child instanceof Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
  }
}
