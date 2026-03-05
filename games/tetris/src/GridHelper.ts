import {
  Scene,
  BufferGeometry,
  Float32BufferAttribute,
  LineSegments,
  LineBasicMaterial,
} from 'three';
import { BOARD_W, VISIBLE_HEIGHT } from './constants';

/** Creates a wireframe border and subtle grid lines around the playfield. */
export function createGridHelper(scene: Scene): void {
  // Outer border
  const borderVerts: number[] = [];
  borderVerts.push(0, 0, 0, BOARD_W, 0, 0);
  borderVerts.push(BOARD_W, 0, 0, BOARD_W, VISIBLE_HEIGHT, 0);
  borderVerts.push(BOARD_W, VISIBLE_HEIGHT, 0, 0, VISIBLE_HEIGHT, 0);
  borderVerts.push(0, VISIBLE_HEIGHT, 0, 0, 0, 0);

  const borderGeo = new BufferGeometry();
  borderGeo.setAttribute('position', new Float32BufferAttribute(borderVerts, 3));

  const borderMat = new LineBasicMaterial({
    color: 0x666666,
    transparent: true,
    opacity: 0.7,
  });

  const border = new LineSegments(borderGeo, borderMat);
  scene.add(border);

  // Internal grid lines (subtle)
  const gridVerts: number[] = [];

  for (let x = 1; x < BOARD_W; x++) {
    gridVerts.push(x, 0, -0.01, x, VISIBLE_HEIGHT, -0.01);
  }

  for (let y = 1; y < VISIBLE_HEIGHT; y++) {
    gridVerts.push(0, y, -0.01, BOARD_W, y, -0.01);
  }

  const gridGeo = new BufferGeometry();
  gridGeo.setAttribute('position', new Float32BufferAttribute(gridVerts, 3));

  const gridMat = new LineBasicMaterial({
    color: 0x444444,
    transparent: true,
    opacity: 0.25,
  });

  const grid = new LineSegments(gridGeo, gridMat);
  scene.add(grid);

  // Back wall rectangle (slightly behind the grid)
  const backVerts: number[] = [];
  const z = -0.5;
  backVerts.push(0, 0, z, BOARD_W, 0, z);
  backVerts.push(BOARD_W, 0, z, BOARD_W, VISIBLE_HEIGHT, z);
  backVerts.push(BOARD_W, VISIBLE_HEIGHT, z, 0, VISIBLE_HEIGHT, z);
  backVerts.push(0, VISIBLE_HEIGHT, z, 0, 0, z);

  const backGeo = new BufferGeometry();
  backGeo.setAttribute('position', new Float32BufferAttribute(backVerts, 3));

  const backMat = new LineBasicMaterial({
    color: 0x3a3a48,
    transparent: true,
    opacity: 0.4,
  });

  const backLines = new LineSegments(backGeo, backMat);
  scene.add(backLines);
}
