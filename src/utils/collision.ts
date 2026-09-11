// Laboratory Collision Detection and Resolution System

export interface AABB {
  id: string
  name: string
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

// Physical obstacles in the laboratory (Tables, Cabinets, Equipment bases)
export const LAB_OBSTACLES: AABB[] = [
  // Center Main Table: position=[0, 0.45, -3.8], size=[4.2, 0.9, 1.2]
  {
    id: 'center-table',
    name: 'Center Main Table',
    minX: -2.15,
    maxX: 2.15,
    minZ: -4.45,
    maxZ: -3.15
  },
  // Left Table: position=[-4.2, 0.45, 0], size=[1.2, 0.9, 3.0]
  {
    id: 'left-table',
    name: 'Left Wall Table',
    minX: -4.85,
    maxX: -3.55,
    minZ: -1.55,
    maxZ: 1.55
  },
  // Climate Cabinet (Nem Kabini): position=[-3.1, 0.0, -0.6], size=[0.8, 1.8, 0.9]
  {
    id: 'climate-cabinet',
    name: 'Climate Cabinet',
    minX: -3.55,
    maxX: -2.65,
    minZ: -1.1,
    maxZ: -0.1
  },
  // Thunder Scientific 3920 Low Humidity Generation System: position=[-3.85, 0, 2.05]
  {
    id: 'thunder-scientific-3920',
    name: 'Thunder Scientific 3920 Low Frost Point Generator',
    minX: -4.30,
    maxX: -3.40,
    minZ: 1.60,
    maxZ: 2.50
  },
  // Thunder Scientific 2900 Two-Pressure (2P) Generation System: position=[-3.85, 0, 3.45]
  {
    id: 'thunder-scientific-2900',
    name: 'Thunder Scientific 2900 2P Humidity Generator Cart',
    minX: -4.35,
    maxX: -3.35,
    minZ: 2.95,
    maxZ: 3.95
  },
  // Chilled Mirror 2P Reference Instrument Stand: position=[-3.95, 0, 4.40]
  {
    id: 'chilled-mirror-2p-stand',
    name: '2P Chilled Mirror Reference Station Stand',
    minX: -4.30,
    maxX: -3.60,
    minZ: 4.10,
    maxZ: 4.70
  },
  // Right Equipment Table (Fluke Dry-Well Calibrators & Resistance Bridge): moved to position=[1.8, 0, 2.3], size=[1.9, 0.85, 0.88]
  {
    id: 'right-table',
    name: 'Right Equipment Table (Dry-Wells & Bridge)',
    minX: 0.80,
    maxX: 2.75,
    minZ: 1.85,
    maxZ: 2.75
  },
  // 9 ITS-90 Fixed-Point Furnaces Suite (MK_Ar to MK_Ag): position range x=[2.10, 6.95], z=[0.32, 0.88]
  {
    id: 'fixed-point-furnaces',
    name: 'ITS-90 Fixed-Point Furnaces Suite (9 Units: Ar to Ag)',
    minX: 2.10,
    maxX: 6.95,
    minZ: 0.32,
    maxZ: 0.88
  }
]

// Outer room wall boundaries (extended on right wall to x=7.2)
export const ROOM_BOUNDS = {
  minX: -4.6,
  maxX: 6.8,
  minZ: -4.6,
  maxZ: 4.6
}

export const PLAYER_RADIUS = 0.35 // 35 cm personal space / body radius

/**
 * Checks if a 2D point (X, Z) with a given radius collides with any obstacle.
 */
export function isCollidingWithObstacle(x: number, z: number, radius = PLAYER_RADIUS): boolean {
  for (const obs of LAB_OBSTACLES) {
    if (
      x >= obs.minX - radius &&
      x <= obs.maxX + radius &&
      z >= obs.minZ - radius &&
      z <= obs.maxZ + radius
    ) {
      return true
    }
  }
  return false
}

/**
 * Checks if a candidate position is valid (inside room and not inside any obstacle).
 */
export function isPositionValid(x: number, z: number, radius = PLAYER_RADIUS): boolean {
  if (
    x < ROOM_BOUNDS.minX + radius ||
    x > ROOM_BOUNDS.maxX - radius ||
    z < ROOM_BOUNDS.minZ + radius ||
    z > ROOM_BOUNDS.maxZ - radius
  ) {
    return false
  }
  return !isCollidingWithObstacle(x, z, radius)
}

/**
 * Resolves player movement by sliding along collision edges or staying in safe bounds.
 */
export function resolvePlayerPosition(
  requestedX: number,
  requestedZ: number,
  prevX: number,
  prevZ: number,
  radius = PLAYER_RADIUS
): { x: number; z: number } {
  // 1. Clamp to room boundary walls first
  let clampedX = Math.max(ROOM_BOUNDS.minX + radius, Math.min(ROOM_BOUNDS.maxX - radius, requestedX))
  let clampedZ = Math.max(ROOM_BOUNDS.minZ + radius, Math.min(ROOM_BOUNDS.maxZ - radius, requestedZ))

  // If new position is completely free, allow direct movement
  if (!isCollidingWithObstacle(clampedX, clampedZ, radius)) {
    return { x: clampedX, z: clampedZ }
  }

  // 2. Try sliding along X (keep prevZ, allow clampedX)
  if (!isCollidingWithObstacle(clampedX, prevZ, radius)) {
    return { x: clampedX, z: prevZ }
  }

  // 3. Try sliding along Z (keep prevX, allow clampedZ)
  if (!isCollidingWithObstacle(prevX, clampedZ, radius)) {
    return { x: prevX, z: clampedZ }
  }

  // 4. Blocked in both axes: stay at previous safe position
  return { x: prevX, z: prevZ }
}
