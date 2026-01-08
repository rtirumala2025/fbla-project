/**
 * BuildingProximityUI.tsx
 * 
 * Screen-space Enter button that appears when pet is near a building.
 * Uses Html with fixed screen positioning for reliable visibility.
 */

import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import type { ActivityZone } from '../core/SceneManager';
import { ACTIVITY_POSITIONS } from '../core/SceneManager';
import { setEntranceOpen } from '../core/CollisionSystem';

interface BuildingProximityUIProps {
    petPosition: [number, number, number];
    onEnterBuilding: (zone: ActivityZone) => void;
    indoorLocation: ActivityZone | null;
}

const BUILDING_NAMES: Record<ActivityZone, string> = {
    shop: 'Gift Shop',
    home: 'Pet House',
    agility: 'Training Center',
    vet: 'Vet Clinic',
    play: 'Play Pavilion',
    rest: 'Rest Area',
    center: 'Info Center',
};

const BUILDING_ICONS: Record<ActivityZone, string> = {
    shop: '🛍️',
    home: '🏠',
    agility: '🏃',
    vet: '🏥',
    play: '🎮',
    rest: '😴',
    center: 'ℹ️',
};

export function BuildingProximityUI({
    petPosition,
    onEnterBuilding,
    indoorLocation,
}: BuildingProximityUIProps) {
    // Don't show if already inside a building
    if (indoorLocation) return null;

    // Find nearest building within proximity threshold
    const nearbyBuilding = useMemo(() => {
        const proximityThreshold = 12; // Distance to show Enter button
        // Exclude outdoor-only zones
        const excludedZones: ActivityZone[] = ['play', 'rest', 'center'];
        let nearest: { zone: ActivityZone; distance: number; position: [number, number, number] } | null = null;

        for (const [zone, pos] of Object.entries(ACTIVITY_POSITIONS)) {
            // Skip excluded zones
            if (excludedZones.includes(zone as ActivityZone)) continue;

            const dx = petPosition[0] - pos[0];
            const dz = petPosition[2] - pos[2];
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < proximityThreshold) {
                if (!nearest || distance < nearest.distance) {
                    nearest = {
                        zone: zone as ActivityZone,
                        distance,
                        position: pos,
                    };
                }
            }
        }

        return nearest;
    }, [petPosition]);

    if (!nearbyBuilding) return null;

    const handleEnter = () => {
        setEntranceOpen(nearbyBuilding.zone);
        onEnterBuilding(nearbyBuilding.zone);
    };

    // Use a fixed screen position for the button (bottom center, above action buttons)
    return (
        <Html
            fullscreen
            style={{
                position: 'fixed',
                bottom: '120px',
                left: '50%',
                transform: 'translateX(-50%)',
                pointerEvents: 'auto',
                zIndex: 100,
            }}
        >
            <button
                onClick={handleEnter}
                style={{
                    padding: '16px 32px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'white',
                    background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
                    border: 'none',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.4), 0 0 0 3px rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s ease',
                    animation: 'pulse 2s ease-in-out infinite',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)';
                }}
            >
                <span style={{ fontSize: '28px' }}>{BUILDING_ICONS[nearbyBuilding.zone]}</span>
                <span>Enter {BUILDING_NAMES[nearbyBuilding.zone]}</span>
                <span style={{ fontSize: '20px' }}>→</span>
            </button>

            <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 6px 20px rgba(0,0,0,0.4), 0 0 0 3px rgba(255,255,255,0.2); }
          50% { box-shadow: 0 6px 25px rgba(76,175,80,0.6), 0 0 0 5px rgba(76,175,80,0.3); }
        }
      `}</style>
        </Html>
    );
}
