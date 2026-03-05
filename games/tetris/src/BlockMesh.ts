import {
  BoxGeometry,
  MeshPhongMaterial,
  Mesh,
  EdgesGeometry,
  LineSegments,
  LineBasicMaterial,
  Group,
} from 'three';

// Cache geometries to avoid recreating them
const blockGeometry = new BoxGeometry(0.95, 0.95, 0.95);
const edgesGeo = new EdgesGeometry(blockGeometry);

// Mesh pools keyed by color hex
const meshPool: Map<number, Group[]> = new Map();
const ghostPool: Group[] = [];

/** Creates a 3D block mesh group (solid box + clean edges). */
export function createBlockMesh(color: number, _emissive: number): Group {
  // Check pool
  const pool = meshPool.get(color);
  if (pool && pool.length > 0) {
    const reused = pool.pop()!;
    reused.visible = true;
    return reused;
  }

  const group = new Group();

  // Solid block -- clean opaque material, no emissive glow
  const material = new MeshPhongMaterial({
    color,
    emissive: 0x000000,
    shininess: 40,
    transparent: false,
    opacity: 1.0,
  });
  const mesh = new Mesh(blockGeometry, material);
  group.add(mesh);

  // Subtle dark edges for definition
  const edgeMaterial = new LineBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.15,
  });
  const edges = new LineSegments(edgesGeo, edgeMaterial);
  group.add(edges);

  // Store the original color for pool lookup
  group.userData.blockColor = color;

  return group;
}

/** Creates a ghost (wireframe) block mesh for the drop preview. */
export function createGhostMesh(color: number): Group {
  if (ghostPool.length > 0) {
    const reused = ghostPool.pop()!;
    // Update color
    const edges = reused.children[0] as LineSegments;
    (edges.material as LineBasicMaterial).color.set(color);
    reused.visible = true;
    return reused;
  }

  const group = new Group();

  const edgeMaterial = new LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.35,
  });
  const edges = new LineSegments(edgesGeo, edgeMaterial);
  group.add(edges);

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
