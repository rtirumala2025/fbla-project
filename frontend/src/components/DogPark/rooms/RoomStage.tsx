/**
 * RoomStage.tsx
 * 
 * Scene Swapper: Renders the appropriate furniture based on currentActivity.
 * The HouseShellFixed (walls, windows, ceiling) is rendered separately in PetViewer3D.
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BedroomFurniture } from './BedroomFurniture';
import { KitchenFurniture } from './KitchenFurniture';
import { KitchenShell } from './KitchenShell';
import { HouseShellFixed } from './HouseShellFixed';

interface RoomStageProps {
    currentActivity: string;
    isSleeping: boolean;
}

export function RoomStage({ currentActivity, isSleeping }: RoomStageProps) {
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
            {/* === ENVIRONMENT SWAPPER: Shell + Furniture === */}

            {/* Kitchen Environment */}
            {currentActivity === 'kitchen' ? (
                <group>
                    <KitchenShell />
                    <KitchenFurniture />
                </group>
            ) : (
                /* Default/Bedroom/Living Environment */
                <group>
                    <HouseShellFixed />
                    <BedroomFurniture isSleeping={isSleeping} />
                </group>
            )}

            {/* Extra Layers (Bathroom/Closet) - Show mats over persistent shell logic */}
            {(currentActivity === 'bathroom' || currentActivity === 'closet') && (
                <group>
                    {currentActivity === 'bathroom' && (
                        <mesh position={[0, 0.015, 0]} receiveShadow>
                            <boxGeometry args={[5, 0.02, 4]} />
                            <meshStandardMaterial color="#B3E5FC" roughness={1.0} />
                        </mesh>
                    )}
                    {currentActivity === 'closet' && (
                        <mesh position={[0, 0.015, 0]} receiveShadow>
                            <boxGeometry args={[5, 0.02, 4]} />
                            <meshStandardMaterial color="#F8BBD9" roughness={1.0} />
                        </mesh>
                    )}
                </group>
            )}
        </group>
    );
}
