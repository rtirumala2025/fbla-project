/**
 * BuildingEntrance.tsx
 * 
 * Handles interactive building entrances with:
 * - "Enter" button that appears when pet is nearby
 * - Animated door opening
 * - Entrance detection and callback
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { ActivityZone } from '../core/SceneManager';

export type EntranceVariant = 'solid' | 'glass' | 'gate' | 'hidden' | 'none';

interface BuildingEntranceProps {
    buildingId: ActivityZone;
    buildingPosition: [number, number, number]; // World position of the building
    doorLocalPosition: [number, number, number]; // Door position relative to building
    triggerLocalPosition?: [number, number, number]; // Interaction detection position (defaults to door position)
    doorRotation?: number; // Building rotation (Y axis)
    onEnter: (buildingId: ActivityZone) => void;
    petPosition: [number, number, number];
    doorWidth?: number;
    doorHeight?: number;
    doorColor?: string;
    label?: string;
    requireStairs?: boolean; // Whether to render entrance stairs
    stairCount?: number;
    variant?: EntranceVariant;
    frameColor?: string;
}

export function BuildingEntrance({
    buildingId,
    buildingPosition,
    doorLocalPosition,
    triggerLocalPosition,
    doorRotation = 0,
    onEnter,
    petPosition,
    doorWidth = 2,
    doorHeight = 3,
    doorColor = '#5d4037',
    label = 'ENTER',
    requireStairs = false,
    stairCount = 2,
    variant = 'solid',
    frameColor = '#2c2c2c',
}: BuildingEntranceProps) {
    const [isNearby, setIsNearby] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [doorOpen, setDoorOpen] = useState(false);
    const [isEntering, setIsEntering] = useState(false);

    // For 'none' variant, don't render anything
    if (variant === 'none') {
        return null;
    }

    // Ref for the specific door group
    const doorRef = useRef<THREE.Group>(null);
    // Ref for the interaction trigger zone
    const triggerRef = useRef<THREE.Group>(null);

    // Track world position for proximity check
    const [worldPos] = useState(() => new THREE.Vector3());

    // Check proximity frame-by-frame (throttled)
    const frameCount = useRef(0);

    useFrame(() => {
        // Use triggerRef for proximity if available, otherwise doorRef
        const targetRef = triggerRef.current || doorRef.current;
        if (!targetRef) return;

        // Throttle: Run only every 10 frames (~6 times/sec at 60fps)
        frameCount.current++;
        if (frameCount.current % 10 !== 0) return;

        // Get actual world position from scene graph
        targetRef.getWorldPosition(worldPos);

        const dx = petPosition[0] - worldPos.x;
        const dz = petPosition[2] - worldPos.z;
        const distSquared = dx * dx + dz * dz;

        const proximityThreshold = 5;
        const thresholdSquared = proximityThreshold * proximityThreshold;
        const isClose = distSquared < thresholdSquared;

        if (isClose !== isNearby) {
            setIsNearby(isClose);
        }

        // Use slightly larger hysteresis for exiting to prevent flickering
        // (5 + 2)^2 = 49
        const exitThresholdSquared = 49;
        if (distSquared > exitThresholdSquared && doorOpen) {
            setDoorOpen(false);
            setIsEntering(false);
        }
    });

    // Animate door
    const doorPivotRef = useRef<THREE.Group>(null);
    const doorAngle = useRef(0);
    const targetAngle = useRef(0);

    useFrame((_, delta) => {
        if (!doorPivotRef.current || variant === 'hidden') return;

        targetAngle.current = doorOpen ? -Math.PI / 2 : 0;

        // Optimization: Stop updating if we're close enough to target
        if (Math.abs(doorAngle.current - targetAngle.current) < 0.001) {
            if (doorPivotRef.current.rotation.y !== targetAngle.current) {
                doorPivotRef.current.rotation.y = targetAngle.current;
                doorAngle.current = targetAngle.current;
            }
            return;
        }

        doorAngle.current = THREE.MathUtils.lerp(
            doorAngle.current,
            targetAngle.current,
            delta * 5
        );

        doorPivotRef.current.rotation.y = doorAngle.current;
    });

    const handleEnterClick = () => {
        setDoorOpen(true);
        setIsEntering(true);

        // Delay the actual entry to allow door animation
        setTimeout(() => {
            onEnter(buildingId);
        }, 600);
    };

    // Stair dimensions
    const stairWidth = doorWidth + 1;
    const stairDepth = 0.6;
    const stairHeight = 0.15;

    return (
        <group>
            {/* Invisible Trigger Zone Helper - Positioned at triggerLocalPosition */}
            <group
                ref={triggerRef}
                position={triggerLocalPosition || doorLocalPosition}
                visible={false}
            >
                {/* Debug Helper in Dev Mode */}
                {process.env.NODE_ENV === 'development' && <mesh><sphereGeometry args={[0.5]} /><meshBasicMaterial color="lime" wireframe /></mesh>}
            </group>

            {/* Visual Door Group - Positioned at doorLocalPosition */}
            <group
                ref={doorRef}
                position={doorLocalPosition}
                rotation={[0, 0, 0]} // Rotation handled by parent
            >
                {/* Entrance Stairs (if needed) */}
                {requireStairs && (
                    <group position={[0, -doorLocalPosition[1], doorWidth / 2 + 0.5]}>
                        {Array.from({ length: stairCount }).map((_, i) => (
                            <Box
                                key={i}
                                args={[stairWidth + i * 0.3, stairHeight, stairDepth]}
                                position={[0, -stairHeight * (i + 0.5), stairDepth * i]}
                                castShadow
                                receiveShadow
                            >
                                <meshStandardMaterial color="#9e9e9e" roughness={0.8} />
                            </Box>
                        ))}
                    </group>
                )}

                {/* Animated Door */}
                <group
                    ref={doorPivotRef}
                    position={[-doorWidth / 2, 0, 0]} // Pivot point at left edge (hinge)
                >
                    <Box
                        args={[doorWidth, doorHeight, 0.1]}
                        position={[doorWidth / 2, 0, 0]} // Center relative to pivot
                        castShadow
                    >
                        <meshStandardMaterial color={doorColor} />
                    </Box>

                    {/* Door Handle */}
                    <mesh position={[doorWidth - 0.3, 0, 0.1]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshStandardMaterial color="#ffd700" metalness={0.8} />
                    </mesh>
                </group>

                {/* Visual indicator when door is open */}
                {doorOpen && variant !== 'hidden' && (
                    <pointLight
                        position={[0, doorHeight / 2, -1]}
                        intensity={1}
                        color="#fff8e1"
                        distance={5}
                    />
                )}
            </group>
        </group>
    );
}

// Helper to get entrance configuration for each building type
export const BUILDING_ENTRANCES: Record<ActivityZone, {
    doorLocalPosition: [number, number, number];
    triggerLocalPosition?: [number, number, number]; // Optional override for interaction zone
    requireStairs: boolean;
    stairCount: number;
    doorWidth: number;
    doorHeight: number;
    variant: EntranceVariant;
    doorColor?: string;
    frameColor?: string;
}> = {
    shop: {
        // Gift Shop: Solid wood door with stairs
        doorLocalPosition: [0, 2.2, 5.9],
        triggerLocalPosition: [0, 1.0, 14.0], // Moved out to lamps
        requireStairs: true,
        stairCount: 2,
        doorWidth: 2.4,
        doorHeight: 3.2,
        variant: 'solid',
        doorColor: '#5d4037'
    },
    home: {
        // Pet House: Solid door, built-in stairs handled by model
        doorLocalPosition: [0, 2.2, 4.9],
        triggerLocalPosition: [0, 1.0, 13.0], // Moved out to lamps
        requireStairs: false,
        stairCount: 0,
        doorWidth: 1.8,
        doorHeight: 3,
        variant: 'solid',
        doorColor: '#6d4c41'
    },
    agility: {
        // Agility: Rustic Gate
        doorLocalPosition: [0, 0.5, 11],
        triggerLocalPosition: [0, 0.5, 16.0], // Moved out to lamps
        requireStairs: false,
        stairCount: 0,
        doorWidth: 3,
        doorHeight: 1.5,
        variant: 'gate',
        doorColor: '#8d6e63'
    },
    vet: {
        // Vet: Glass double doors
        doorLocalPosition: [0, 1.6, 4.26],
        triggerLocalPosition: [0, 1.0, 15.0], // Moved out to lamps (Consistent with others)
        requireStairs: false,
        stairCount: 0,
        doorWidth: 2.2,
        doorHeight: 2.4,
        variant: 'glass',
        frameColor: '#333'
    },
    play: {
        // Play: Outdoor playground area - no entrance needed
        doorLocalPosition: [0, 1.8, 5],
        requireStairs: false,
        stairCount: 0,
        doorWidth: 4,
        doorHeight: 4,
        variant: 'none'
    },
    rest: {
        // Rest: Outdoor rest area with benches - no entrance needed
        doorLocalPosition: [0, 1.8, 5],
        requireStairs: false,
        stairCount: 0,
        doorWidth: 4,
        doorHeight: 4,
        variant: 'none'
    },
    center: {
        // Park Hub: Modern Glass
        doorLocalPosition: [0, 1.8, 2],
        triggerLocalPosition: [0, 1.0, 15.0], // Moved out to lamps (Consistent with others)
        requireStairs: false, // Deck handles this
        stairCount: 0,
        doorWidth: 2.4,
        doorHeight: 3.6,
        variant: 'glass',
        frameColor: '#2c2c2c'
    },
    market: {
        // Supermarket: Sliding glass doors
        doorLocalPosition: [0, 2.5, 6.9],
        triggerLocalPosition: [0, 1.0, 16.0], // Moved out to lamps (Further back for market)
        requireStairs: true,
        stairCount: 2,
        doorWidth: 3,
        doorHeight: 4,
        variant: 'glass',
        doorColor: '#4caf50',
        frameColor: '#1b5e20'
    },
};
