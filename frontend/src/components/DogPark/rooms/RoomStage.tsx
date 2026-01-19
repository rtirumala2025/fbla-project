/**
 * RoomStage.tsx
 * 
 * Scene Swapper: Renders the appropriate furniture based on currentActivity.
 * Uses STRICT CONDITIONAL RENDERING - each room gets its own distinct environment.
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { BedroomFurniture } from './BedroomFurniture';
import { KitchenFurniture } from './KitchenFurniture';
import { KitchenShell } from './KitchenShell';
import { HouseShellFixed } from './HouseShellFixed';
import { BathroomShell } from './BathroomShell';
import { BathroomFurniture } from './BathroomFurniture';

interface RoomStageProps {
    currentActivity: string;
    isSleeping: boolean;
    isBathing?: boolean;  // Bath animation trigger
    hasFood?: boolean;
    foodType?: string; // Type of food in bowl for dynamic colors
}

export function RoomStage({ currentActivity, isSleeping, isBathing = false, hasFood = false, foodType = 'kibble' }: RoomStageProps) {
    const dogRef = useRef<THREE.Group>(null);

    // DEBUG: Log which room is being rendered
    console.log('🏠 ROOMSTAGE RENDERING:', currentActivity);

    // Animation Loop for dog/pet positioning (sleep behavior)
    useFrame(() => {
        // Dog Sleep Animation (Smooth Lerp)
        if (dogRef.current) {
            if (isSleeping) {
                // Go to Bed Position
                dogRef.current.position.lerp(new THREE.Vector3(0, 0.35, 0), 0.1);
                // Curl up (Scale Y down)
                dogRef.current.scale.lerp(new THREE.Vector3(0.9, 0.7, 0.9), 0.1);
            } else {
                // Wake up (Stand on Bed)
                dogRef.current.position.lerp(new THREE.Vector3(0, 0.25, 0), 0.1);
                dogRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
            }
        }
    });

    return (
        <group>
            {/* === STRICT CONDITIONAL RENDERING: Each room gets its own environment === */}

            {/* Kitchen Environment */}
            {currentActivity === 'kitchen' && (
                <group>
                    <KitchenShell />
                    <KitchenFurniture hasFood={hasFood} foodType={foodType} />
                </group>
            )}

            {/* Bedroom/Living Environment */}
            {(currentActivity === 'bedroom' || currentActivity === 'living') && (
                <group>
                    <HouseShellFixed />
                    <BedroomFurniture isSleeping={isSleeping} />
                </group>
            )}

            {/* Bathroom Environment - Distinct White/Blue Scene */}
            {currentActivity === 'bathroom' && (
                <group>
                    <BathroomShell />
                    <BathroomFurniture isBathing={isBathing} />
                    {/* Contact Shadows for realistic grounding */}
                    <ContactShadows
                        position={[0, 0.01, 0]}
                        opacity={0.4}
                        scale={25}
                        blur={2.5}
                        far={10}
                        color="#4A90A4"
                    />
                </group>
            )}

            {/* Closet Environment - DISTINCT from Bedroom with wardrobe visuals */}
            {currentActivity === 'closet' && (
                <group>
                    <HouseShellFixed />
                    {/* Pink runway mat */}
                    <mesh position={[0, 0.015, 0]} receiveShadow>
                        <boxGeometry args={[5, 0.02, 4]} />
                        <meshStandardMaterial color="#F8BBD9" roughness={1.0} />
                    </mesh>
                    {/* Wardrobe Cabinet (visually distinct from bedroom) */}
                    <group position={[-3, 0, -2]}>
                        {/* Main cabinet body */}
                        <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
                            <boxGeometry args={[1.8, 2.4, 0.6]} />
                            <meshStandardMaterial color="#5B4033" roughness={0.7} />
                        </mesh>
                        {/* Door lines */}
                        <mesh position={[-0.45, 1.2, 0.31]} castShadow>
                            <boxGeometry args={[0.02, 2.3, 0.02]} />
                            <meshStandardMaterial color="#3D2817" />
                        </mesh>
                        <mesh position={[0.45, 1.2, 0.31]} castShadow>
                            <boxGeometry args={[0.02, 2.3, 0.02]} />
                            <meshStandardMaterial color="#3D2817" />
                        </mesh>
                        {/* Handles */}
                        <mesh position={[-0.25, 1.2, 0.35]} castShadow>
                            <sphereGeometry args={[0.05, 8, 8]} />
                            <meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.2} />
                        </mesh>
                        <mesh position={[0.25, 1.2, 0.35]} castShadow>
                            <sphereGeometry args={[0.05, 8, 8]} />
                            <meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.2} />
                        </mesh>
                    </group>
                    {/* Mirror */}
                    <group position={[3, 0, -2]}>
                        <mesh position={[0, 1.5, 0]} castShadow>
                            <boxGeometry args={[1.2, 2, 0.1]} />
                            <meshStandardMaterial color="#8B4513" roughness={0.6} />
                        </mesh>
                        <mesh position={[0, 1.5, 0.06]}>
                            <boxGeometry args={[1, 1.8, 0.01]} />
                            <meshStandardMaterial color="#b8d4e8" metalness={0.9} roughness={0.1} />
                        </mesh>
                    </group>
                    {/* CLOSET label */}
                    {/* Decorative clothing rack */}
                    <group position={[0, 0, -3]}>
                        <mesh position={[0, 1.2, 0]} castShadow>
                            <cylinderGeometry args={[0.03, 0.03, 2.5, 8]} />
                            <meshStandardMaterial color="#666" metalness={0.7} />
                        </mesh>
                        <mesh position={[-1.2, 1.2, 0]} castShadow>
                            <cylinderGeometry args={[0.03, 0.03, 1.5, 8]} />
                            <meshStandardMaterial color="#666" metalness={0.7} />
                        </mesh>
                        <mesh position={[1.2, 1.2, 0]} castShadow>
                            <cylinderGeometry args={[0.03, 0.03, 1.5, 8]} />
                            <meshStandardMaterial color="#666" metalness={0.7} />
                        </mesh>
                        {/* Hanging clothes (colored boxes) */}
                        <mesh position={[-0.8, 0.9, 0]} rotation={[0, 0, 0.1]} castShadow>
                            <boxGeometry args={[0.3, 0.6, 0.05]} />
                            <meshStandardMaterial color="#ff6b6b" />
                        </mesh>
                        <mesh position={[-0.4, 0.85, 0]} rotation={[0, 0, -0.05]} castShadow>
                            <boxGeometry args={[0.3, 0.7, 0.05]} />
                            <meshStandardMaterial color="#4dabf7" />
                        </mesh>
                        <mesh position={[0, 0.9, 0]} rotation={[0, 0, 0.02]} castShadow>
                            <boxGeometry args={[0.3, 0.65, 0.05]} />
                            <meshStandardMaterial color="#51cf66" />
                        </mesh>
                        <mesh position={[0.4, 0.87, 0]} rotation={[0, 0, -0.08]} castShadow>
                            <boxGeometry args={[0.3, 0.68, 0.05]} />
                            <meshStandardMaterial color="#ffd43b" />
                        </mesh>
                        <mesh position={[0.8, 0.92, 0]} rotation={[0, 0, 0.05]} castShadow>
                            <boxGeometry args={[0.3, 0.6, 0.05]} />
                            <meshStandardMaterial color="#da77f2" />
                        </mesh>
                    </group>
                </group>
            )}
        </group>
    );
}
