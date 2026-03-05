import {
  BoxGeometry,
  MeshPhongMaterial,
  Mesh,
  EdgesGeometry,
  LineSegments,
  LineBasicMaterial,
  Group,
  Color,
} from 'three';

// Cache geometries to avoid recreating them
const blockGeometry = new BoxGeometry(0.95, 0.95, 0.95);
const edgesGeo = new EdgesGeometry(blockGeometry);

// Mesh pools keyed by color hex
const meshPool: Map<number, Group[]> = new Map();
const ghostPool: Group[] = [];

/** Creates a brighter version of a color for edge glow. */
function brightenColor(hex: number, factor: number = 1.5): Color {
  const c = new Color(hex);
  c.r = Math.min(1.0, c.r * factor);
  c.g = Math.min(1.0, c.g * factor);
  c.b = Math.min(1.0, c.b * factor);
  return c;
}

/** Creates a 3D block mesh group (solid box + glowing edges). */
export function createBlockMesh(color: number, emissive: number): Group {
  // Check pool
  const pool = meshPool.get(color);
  if (pool && pool.length > 0) {
    const reused = pool.pop()!;
    reused.visible = true;
    return reused;
  }

  const group = new Group();

  // Solid block
  const material = new MeshPhongMaterial({
    color,
    emissive,
    shininess: 80,
    transparent: true,
    opacity: 0.88,
  });
  const mesh = new Mesh(blockGeometry, material);
  group.add(mesh);

  // Glowing edges
  const edgeColor = brightenColor(color, 1.8);
  const edgeMaterial = new LineBasicMaterial({
    color: edgeColor,
    transparent: true,
    opacity: 0.7,
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
