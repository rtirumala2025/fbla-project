/**
 * CollisionSystem.ts
 * 
 * Collision detection for the 3D pet game.
 * Provides functions to check if a position collides with buildings, trees, or other obstacles.
 */

import { ACTIVITY_POSITIONS, type ActivityZone } from './SceneManager';

// Building colliders - circular collision zones around each building
// Radius is generous to account for building size + some margin
interface BuildingCollider {
    id: ActivityZone;
    centerX: number;
    centerZ: number;
    radius: number;
}

// Generate building colliders from ACTIVITY_POSITIONS
export const BUILDING_COLLIDERS: BuildingCollider[] = Object.entries(ACTIVITY_POSITIONS).map(
    ([id, pos]) => ({
        id: id as ActivityZone,
        centerX: pos[0],
        centerZ: pos[2],
        radius: 7, // Building radius - buildings are roughly 10-14 units wide, using 7 for collision
    })
);

// Tree colliders - stored separately and can be populated from DogPark scenery
interface TreeCollider {
    x: number;
    z: number;
    radius: number;
}

// Tree positions will be set by DogPark when trees are generated
let treeColliders: TreeCollider[] = [];

// Track which building entrances are currently open (collision disabled)
let openEntrances: Set<ActivityZone> = new Set();

/**
 * Set tree colliders from the DogPark scenery generation
 */
export function setTreeColliders(trees: { pos: [number, number, number]; scale: number }[]) {
    treeColliders = trees.map(tree => ({
        x: tree.pos[0],
        z: tree.pos[2],
        radius: 0.8 + tree.scale * 0.3, // Smaller collision radius based on tree scale
    }));
}

/**
 * Get current tree colliders (for debugging)
 */
export function getTreeColliders(): TreeCollider[] {
    return treeColliders;
}

/**
 * Check if a position collides with any building
 * @returns The building ID if collision, null if no collision
 */
export function checkBuildingCollision(x: number, z: number): ActivityZone | null {
    for (const building of BUILDING_COLLIDERS) {
        // Skip buildings with open entrances (pet can walk through)
        if (openEntrances.has(building.id)) continue;

        const dx = x - building.centerX;
        const dz = z - building.centerZ;
        const distSq = dx * dx + dz * dz;

        if (distSq < building.radius * building.radius) {
            return building.id;
        }
    }
    return null;
}

/**
 * Check if a position collides with any tree
 */
export function checkTreeCollision(x: number, z: number): boolean {
    for (const tree of treeColliders) {
        const dx = x - tree.x;
        const dz = z - tree.z;
        const distSq = dx * dx + dz * dz;

        if (distSq < tree.radius * tree.radius) {
            return true;
        }
    }
    return false;
}

/**
 * Check if a position collides with any obstacle (building or tree)
 */
export function checkCollision(x: number, z: number): boolean {
    return checkBuildingCollision(x, z) !== null || checkTreeCollision(x, z);
}

/**
 * Get a valid position that slides along obstacles
 * Uses a simple approach: if collision detected, try moving only in X or only in Z
 * @param currentX Current X position
 * @param currentZ Current Z position
 * @param targetX Desired X position
 * @param targetZ Desired Z position
 * @returns Valid [x, z] position that doesn't collide
 */
export function getValidPosition(
    currentX: number,
    currentZ: number,
    targetX: number,
    targetZ: number
): [number, number] {
    // First, check if target position is valid
    if (!checkCollision(targetX, targetZ)) {
        return [targetX, targetZ];
    }

    // Try sliding along X axis only (keep current Z)
    if (!checkCollision(targetX, currentZ)) {
        return [targetX, currentZ];
    }

    // Try sliding along Z axis only (keep current X)
    if (!checkCollision(currentX, targetZ)) {
        return [currentX, targetZ];
    }

    // Both directions blocked, push back from nearest obstacle
    // Find the nearest building and push away from it
    let nearestDist = Infinity;
    let pushX = currentX;
    let pushZ = currentZ;

    for (const building of BUILDING_COLLIDERS) {
        const dx = targetX - building.centerX;
        const dz = targetZ - building.centerZ;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < nearestDist && dist < building.radius + 2) {
            nearestDist = dist;
            // Push away from building center
            const pushDist = building.radius + 0.5;
            const angle = Math.atan2(dz, dx);
            pushX = building.centerX + Math.cos(angle) * pushDist;
            pushZ = building.centerZ + Math.sin(angle) * pushDist;
        }
    }

    // Verify push position is valid
    if (!checkCollision(pushX, pushZ)) {
        return [pushX, pushZ];
    }

    // Last resort: stay at current position
    return [currentX, currentZ];
}

/**
 * Get distance to nearest building
 * Useful for camera distance adjustments
 */
export function getDistanceToNearestBuilding(x: number, z: number): number {
    let minDist = Infinity;

    for (const building of BUILDING_COLLIDERS) {
        const dx = x - building.centerX;
        const dz = z - building.centerZ;
        const dist = Math.sqrt(dx * dx + dz * dz) - building.radius;
        minDist = Math.min(minDist, dist);
    }

    return minDist;
}

/**
 * Check if position is inside the outer boundary
 */
export function isWithinBounds(x: number, z: number, maxBound: number = 58): boolean {
    return Math.abs(x) <= maxBound && Math.abs(z) <= maxBound;
}

/**
 * Clamp position to bounds
 */
export function clampToBounds(x: number, z: number, maxBound: number = 58): [number, number] {
    return [
        Math.max(-maxBound, Math.min(maxBound, x)),
        Math.max(-maxBound, Math.min(maxBound, z)),
    ];
}

// ========== ENTRANCE ZONE MANAGEMENT ==========


/**
 * Mark a building entrance as open (disables collision for that building)
 */
export function setEntranceOpen(buildingId: ActivityZone): void {
    openEntrances.add(buildingId);
}

/**
 * Mark a building entrance as closed (re-enables collision)
 */
export function setEntranceClosed(buildingId: ActivityZone): void {
    openEntrances.delete(buildingId);
}

/**
 * Check if an entrance is currently open
 */
export function isEntranceOpen(buildingId: ActivityZone): boolean {
    return openEntrances.has(buildingId);
}

/**
 * Clear all open entrances (e.g., when pet exits a building)
 */
export function closeAllEntrances(): void {
    openEntrances.clear();
}

/**
 * Get which building (if any) has an open entrance that contains this position
 * Returns the building ID if inside an open entrance zone, null otherwise
 */
export function getOpenEntranceAt(x: number, z: number): ActivityZone | null {
    for (const building of BUILDING_COLLIDERS) {
        if (!openEntrances.has(building.id)) continue;

        const dx = x - building.centerX;
        const dz = z - building.centerZ;
        const distSq = dx * dx + dz * dz;

        // Extended radius for entrance zone (building radius + entrance buffer)
        const entranceRadius = building.radius + 2;
        if (distSq < entranceRadius * entranceRadius) {
            return building.id;
        }
    }
    return null;
}

