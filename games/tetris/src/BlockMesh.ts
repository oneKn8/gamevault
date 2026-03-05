import {
  BoxGeometry,
  MeshPhongMaterial,
  MeshBasicMaterial,
  Mesh,
  PlaneGeometry,
  Group,
  Color,
} from 'three';

// Shared geometries
const blockGeometry = new BoxGeometry(0.92, 0.92, 0.92);

// Bevel highlight plane: covers top-left corner strip
// Positioned slightly in front of the block face
const highlightGeo = new PlaneGeometry(0.78, 0.06);
const shadowGeo = new PlaneGeometry(0.78, 0.06);
const highlightVGeo = new PlaneGeometry(0.06, 0.78);
const shadowVGeo = new PlaneGeometry(0.06, 0.78);

// Mesh pools keyed by color hex
const meshPool: Map<number, Group[]> = new Map();
const ghostPool: Group[] = [];

/** Lighten a color by mixing with white at the given ratio. */
function lighten(hex: number, amount: number): number {
  const c = new Color(hex);
  c.r = Math.min(1, c.r + amount);
  c.g = Math.min(1, c.g + amount);
  c.b = Math.min(1, c.b + amount);
  return c.getHex();
}

/** Darken a color by scaling down. */
function darken(hex: number, amount: number): number {
  const c = new Color(hex);
  c.r = Math.max(0, c.r - amount);
  c.g = Math.max(0, c.g - amount);
  c.b = Math.max(0, c.b - amount);
  return c.getHex();
}

/** Creates a 3D block mesh group with bevel highlight/shadow edges for depth. */
export function createBlockMesh(color: number, _emissive: number): Group {
  const pool = meshPool.get(color);
  if (pool && pool.length > 0) {
    const reused = pool.pop()!;
    reused.visible = true;
    return reused;
  }

  const group = new Group();

  // Main solid block
  const mat = new MeshPhongMaterial({
    color,
    emissive: 0x000000,
    shininess: 60,
    transparent: false,
    opacity: 1.0,
  });
  const mesh = new Mesh(blockGeometry, mat);
  group.add(mesh);

  const hiColor = lighten(color, 0.35);
  const shColor = darken(color, 0.30);
  const z = 0.47; // just in front of block face

  // Top highlight strip
  const hiMat = new MeshBasicMaterial({ color: hiColor, transparent: true, opacity: 0.55 });
  const topHi = new Mesh(highlightGeo, hiMat);
  topHi.position.set(0, 0.385, z);
  group.add(topHi);

  // Bottom shadow strip
  const shMat = new MeshBasicMaterial({ color: shColor, transparent: true, opacity: 0.55 });
  const botSh = new Mesh(shadowGeo, shMat);
  botSh.position.set(0, -0.385, z);
  group.add(botSh);

  // Left highlight strip
  const hiMatV = new MeshBasicMaterial({ color: hiColor, transparent: true, opacity: 0.45 });
  const leftHi = new Mesh(highlightVGeo, hiMatV);
  leftHi.position.set(-0.385, 0, z);
  group.add(leftHi);

  // Right shadow strip
  const shMatV = new MeshBasicMaterial({ color: shColor, transparent: true, opacity: 0.45 });
  const rightSh = new Mesh(shadowVGeo, shMatV);
  rightSh.position.set(0.385, 0, z);
  group.add(rightSh);

  group.userData.blockColor = color;

  return group;
}

/** Creates a ghost (wireframe outline) block for the drop preview. */
export function createGhostMesh(color: number): Group {
  if (ghostPool.length > 0) {
    const reused = ghostPool.pop()!;
    const mesh = reused.children[0] as Mesh;
    (mesh.material as MeshBasicMaterial).color.set(color);
    reused.visible = true;
    return reused;
  }

  const group = new Group();

  // Subtle transparent filled block for ghost
  const mat = new MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.12,
  });
  const mesh = new Mesh(blockGeometry, mat);
  group.add(mesh);

  return group;
}

/** Returns a block mesh to the pool for reuse. */
export function recycleBlockMesh(group: Group): void {
  group.visible = false;
  const color = group.userData.blockColor as number | undefined;
  if (color !== undefined) {
    if (!meshPool.has(color)) meshPool.set(color, []);
    meshPool.get(color)!.push(group);
  }
}

/** Returns a ghost mesh to the pool for reuse. */
export function recycleGhostMesh(group: Group): void {
  group.visible = false;
  ghostPool.push(group);
}
