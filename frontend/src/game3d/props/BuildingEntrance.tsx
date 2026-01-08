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

interface BuildingEntranceProps {
    buildingId: ActivityZone;
    buildingPosition: [number, number, number]; // World position of the building
    doorLocalPosition: [number, number, number]; // Door position relative to building
    doorRotation?: number; // Building rotation (Y axis)
    onEnter: (buildingId: ActivityZone) => void;
    petPosition: [number, number, number];
    doorWidth?: number;
    doorHeight?: number;
    doorColor?: string;
    label?: string;
    requireStairs?: boolean; // Whether to render entrance stairs
    stairCount?: number;
}

export function BuildingEntrance({
    buildingId,
    buildingPosition,
    doorLocalPosition,
    doorRotation = 0,
    onEnter,
    petPosition,
    doorWidth = 2,
    doorHeight = 3,
    doorColor = '#5d4037',
    label = 'ENTER',
    requireStairs = false,
    stairCount = 2,
}: BuildingEntranceProps) {
    const [isNearby, setIsNearby] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [doorOpen, setDoorOpen] = useState(false);
    const [isEntering, setIsEntering] = useState(false);

    const doorRef = useRef<THREE.Group>(null);
    const doorAngle = useRef(0);
    const targetAngle = useRef(0);

    // Calculate world position of door
    const doorWorldPosition = useMemo(() => {
        // Apply building rotation to local door position
        const cos = Math.cos(doorRotation);
        const sin = Math.sin(doorRotation);
        const localX = doorLocalPosition[0];
        const localZ = doorLocalPosition[2];

        return [
            buildingPosition[0] + localX * cos - localZ * sin,
            buildingPosition[1] + doorLocalPosition[1],
            buildingPosition[2] + localX * sin + localZ * cos,
        ] as [number, number, number];
    }, [buildingPosition, doorLocalPosition, doorRotation]);

    // Check proximity to door
    useEffect(() => {
        const dx = petPosition[0] - doorWorldPosition[0];
        const dz = petPosition[2] - doorWorldPosition[2];
        const distance = Math.sqrt(dx * dx + dz * dz);

        const proximityThreshold = 5; // Units
        const isClose = distance < proximityThreshold;

        if (isClose !== isNearby) {
            console.log(`BuildingEntrance [${buildingId}]: Distance ${distance.toFixed(2)} (Thresh: ${proximityThreshold}) -> Nearby: ${isClose}`);
            setIsNearby(isClose);
        }

        // Auto-close door when pet moves away
        if (distance > proximityThreshold + 2) {
            if (doorOpen) console.log(`BuildingEntrance [${buildingId}]: Auto-closing door`);
            setDoorOpen(false);
            setIsEntering(false);
        }
    }, [petPosition, doorWorldPosition, isNearby, buildingId, doorOpen]);

    // Animate door
    useFrame((_, delta) => {
        if (!doorRef.current) return;

        targetAngle.current = doorOpen ? -Math.PI / 2 : 0; // Open = 90 degrees

        // Smooth door animation
        doorAngle.current = THREE.MathUtils.lerp(
            doorAngle.current,
            targetAngle.current,
            delta * 5
        );

        doorRef.current.rotation.y = doorAngle.current;
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
        <group position={doorWorldPosition} rotation={[0, doorRotation, 0]}>
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
                ref={doorRef}
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

            {/* ENTER Button - Floating above door when nearby */}
            {isNearby && !isEntering && (
                <group position={[0, doorHeight / 2 + 1, 1]}>
                    {/* 3D Button Background */}
                    <Box
                        args={[2.5, 0.8, 0.2]}
                        onPointerEnter={() => {
                            setIsHovered(true);
                            document.body.style.cursor = 'pointer';
                        }}
                        onPointerLeave={() => {
                            setIsHovered(false);
                            document.body.style.cursor = 'auto';
                        }}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            handleEnterClick();
                        }}
                    >
                        <meshStandardMaterial
                            color={isHovered ? '#4caf50' : '#388e3c'}
                            emissive={isHovered ? '#4caf50' : '#2e7d32'}
                            emissiveIntensity={0.3}
                        />
                    </Box>

                    {/* Button Text */}
                    <Text
                        position={[0, 0, 0.15]}
                        fontSize={0.35}
                        color="#ffffff"
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.02}
                        outlineColor="#1b5e20"
                    >
                        {label}
                    </Text>

                    {/* Arrow indicator */}
                    <mesh position={[0.9, 0, 0.15]} rotation={[0, 0, -Math.PI / 2]}>
                        <coneGeometry args={[0.12, 0.25, 8]} />
                        <meshStandardMaterial color="#ffffff" />
                    </mesh>
                </group>
            )}

            {/* Visual indicator when door is open */}
            {doorOpen && (
                <pointLight
                    position={[0, doorHeight / 2, -1]}
                    intensity={1}
                    color="#fff8e1"
                    distance={5}
                />
            )}
        </group>
    );
}

// Helper to get entrance configuration for each building type
export const BUILDING_ENTRANCES: Record<ActivityZone, {
    doorLocalPosition: [number, number, number];
    requireStairs: boolean;
    stairCount: number;
    doorWidth: number;
    doorHeight: number;
}> = {
    shop: {
        doorLocalPosition: [0, 2.2, 6], // GiftShop door position (relative)
        requireStairs: true,
        stairCount: 2,
        doorWidth: 2.4,
        doorHeight: 3.2,
    },
    home: {
        doorLocalPosition: [0, 2.2, 5], // PetHouse door (already has stairs in building)
        requireStairs: false, // Built into PetHouse
        stairCount: 0,
        doorWidth: 1.8,
        doorHeight: 3,
    },
    agility: {
        doorLocalPosition: [0, 1.8, 5],
        requireStairs: true,
        stairCount: 1,
        doorWidth: 2,
        doorHeight: 2.8,
    },
    vet: {
        doorLocalPosition: [0, 1.8, 5],
        requireStairs: true,
        stairCount: 1,
        doorWidth: 2,
        doorHeight: 2.8,
    },
    play: {
        doorLocalPosition: [0, 1.8, 5],
        requireStairs: true,
        stairCount: 1,
        doorWidth: 2.2,
        doorHeight: 2.8,
    },
    rest: {
        doorLocalPosition: [0, 1.8, 5],
        requireStairs: true,
        stairCount: 1,
        doorWidth: 2,
        doorHeight: 2.8,
    },
    center: {
        doorLocalPosition: [0, 1.8, 5],
        requireStairs: true,
        stairCount: 1,
        doorWidth: 2.2,
        doorHeight: 3,
    },
};
