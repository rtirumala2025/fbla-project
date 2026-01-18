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

            {/* Closet Environment - Uses Bedroom Shell with Pink Mat */}
            {currentActivity === 'closet' && (
                <group>
                    <HouseShellFixed />
                    <BedroomFurniture isSleeping={false} />
                    <mesh position={[0, 0.015, 0]} receiveShadow>
                        <boxGeometry args={[5, 0.02, 4]} />
                        <meshStandardMaterial color="#F8BBD9" roughness={1.0} />
                    </mesh>
                </group>
            )}
        </group>
    );
}
