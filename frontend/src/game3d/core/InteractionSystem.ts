import { useState, useCallback, useMemo } from 'react';
import type { ActivityZone } from './SceneManager';

export interface InteractiveZone {
    id: ActivityZone;
    position: [number, number, number];
    label: string; // "Enter Shop", "Use Computer", "Inspect Tablet"
    icon?: string; // "shop", "game", "vet"
    interactionType: 'building' | 'object' | 'service';
    minDistance?: number;
}

// Configuration for each environment
export interface EnvironmentConfig {
    zones: InteractiveZone[];
    bounds: { x: number; z: number };
}

export function useInteractionSystem(
    currentPosition: [number, number, number],
    config: EnvironmentConfig
) {
    const [nearbyZone, setNearbyZone] = useState<ActivityZone | null>(null);

    // Check proximity
    useMemo(() => {
        let closest: ActivityZone | null = null;
        let minD = Infinity;

        for (const zone of config.zones) {
            const dx = currentPosition[0] - zone.position[0];
            const dz = currentPosition[2] - zone.position[2];
            const dist = Math.sqrt(dx * dx + dz * dz);
            const threshold = zone.minDistance || 4.0; // Default generic interaction distance

            if (dist < threshold && dist < minD) {
                minD = dist;
                closest = zone.id;
            }
        }
        setNearbyZone(closest);
    }, [currentPosition, config.zones]);

    return {
        nearbyZone,
        activeZoneConfig: config.zones.find(z => z.id === nearbyZone) || null
    };
}
