/**
 * RoomStage.tsx
 * 
 * Renders "Chunky, Cute, & Detailed" Low Poly furniture groups.
 * Replaces primitive shapes with intentional voxel designs.
 */

import React, { useMemo, useRef } from 'react';
import { Box, Cylinder, Sphere, Plane, Cone } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RoomType } from './RoomSwitcher';

interface RoomStageProps {
    room: RoomType;
}

export function RoomStage({ room }: RoomStageProps) {
    return (
        <group position={[0, -0.6, 0]}>
            {room === 'living' && <LivingRoomStage />}
            {room === 'kitchen' && <KitchenStage />}
            {room === 'bathroom' && <BathroomStage />}
            {room === 'closet' && <ClosetStage />}
        </group>
    );
}

// 1. Closet: The Runway
function ClosetStage() {
    const spotlightsRef = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        if (spotlightsRef.current) {
            // Subtle sway for lights
            spotlightsRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.5) * 0.05;
        }
    });

    return (
        <group>
            {/* Base: Dark Cylinder */}
            <Cylinder args={[1.5, 1.5, 0.2, 32]} position={[0, 0.1, 0]} receiveShadow>
                <meshStandardMaterial color="#212121" />
            </Cylinder>

            {/* Top: Red Carpet */}
            <Cylinder args={[1.3, 1.3, 0.05, 32]} position={[0, 0.22, 0]} receiveShadow>
                <meshStandardMaterial color="#D50000" roughness={0.8} />
            </Cylinder>

            {/* Mirror Background */}
            <Box args={[2.5, 3.5, 0.1]} position={[0, 1.8, -1.5]}>
                <meshStandardMaterial color="#E1F5FE" metalness={0.8} roughness={0.1} />
            </Box>

            {/* Floating Spotlights */}
            <group ref={spotlightsRef} position={[0, 3, 1]}>
                {/* Left Light */}
                <group position={[-1.5, 0, 0]} rotation={[0, 0, -0.5]}>
                    <Cone args={[0.2, 0.4]} position={[0, 0.2, 0]}>
                        <meshStandardMaterial color="#FFD700" />
                    </Cone>
                    <Cone args={[0.8, 4, 32, 1, true]} position={[0, -2, 0]} rotation={[Math.PI, 0, 0]}>
                        <meshStandardMaterial color="#FFF9C4" transparent opacity={0.1} depthWrite={false} side={THREE.DoubleSide} />
                    </Cone>
                </group>

                {/* Right Light */}
                <group position={[1.5, 0, 0]} rotation={[0, 0, 0.5]}>
                    <Cone args={[0.2, 0.4]} position={[0, 0.2, 0]}>
                        <meshStandardMaterial color="#FFD700" />
                    </Cone>
                    <Cone args={[0.8, 4, 32, 1, true]} position={[0, -2, 0]} rotation={[Math.PI, 0, 0]}>
                        <meshStandardMaterial color="#FFF9C4" transparent opacity={0.1} depthWrite={false} side={THREE.DoubleSide} />
                    </Cone>
                </group>
            </group>
        </group>
    );
}

// 2. Living Room: Cozy Corner
function LivingRoomStage() {
    return (
        <group>
            {/* Rug */}
            <Cylinder args={[2.5, 2.5, 0.05, 32]} position={[0, 0.025, 0]} receiveShadow>
                <meshStandardMaterial color="#E1F5FE" /> {/* Pastel Blue Rug */}
            </Cylinder>

            {/* The Bed (Wider) */}
            <group position={[0.4, 0, 0]}>
                {/* Frame */}
                <Box args={[2.2, 0.3, 2.2]} position={[0, 0.15, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color="#5D4037" /> {/* Wood */}
                </Box>
                {/* Mattress */}
                <Box args={[2.0, 0.25, 2.0]} position={[0, 0.425, 0]} castShadow>
                    <meshStandardMaterial color="#FFEBEE" />
                </Box>
                {/* Pillow */}
                <Box args={[1.8, 0.25, 0.6]} position={[0, 0.675, -0.6]} castShadow>
                    <meshStandardMaterial color="#C62828" />
                </Box>
            </group>

            {/* Nightstand */}
            <group position={[-1.2, 0, -0.5]}>
                <Box args={[0.6, 0.6, 0.6]} position={[0, 0.3, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color="#8D6E63" />
                </Box>
                {/* Lamp */}
                <Cylinder args={[0.05, 0.1, 0.2]} position={[0, 0.7, 0]}>
                    <meshStandardMaterial color="#3E2723" />
                </Cylinder>
                <Cone args={[0.25, 0.3]} position={[0, 0.9, 0]}>
                    <meshStandardMaterial color="#FFF59D" />
                </Cone>
            </group>
        </group>
    );
}

// 3. Kitchen: The Diner
function KitchenStage() {
    // Generate scattered tiles strictly deterministically
    const tiles = useMemo(() => {
        const positions = [
            [-0.8, -0.8], [0.8, 0.8], [-0.5, 0.5], [0.5, -0.5], [0, 0],
            [-1.2, 0.2], [1.2, -0.2]
        ];
        return positions.map((pos, i) => (
            <Plane key={i} args={[0.5, 0.5]} position={[pos[0], 0.06, pos[1]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <meshStandardMaterial color="#212121" />
            </Plane>
        ));
    }, []);

    return (
        <group>
            {/* White Floor Base */}
            <Box args={[3.5, 0.1, 3.5]} position={[0, 0, 0]} receiveShadow>
                <meshStandardMaterial color="#FAFAFA" />
            </Box>

            {/* Black Checker Hints */}
            {tiles}

            {/* Placemat */}
            <Box args={[1.4, 0.05, 0.8]} position={[0, 0.08, 0.8]} receiveShadow>
                <meshStandardMaterial color="#90CAF9" />
            </Box>

            {/* Bowls on Placemat */}
            <group position={[0, 0.15, 0.8]}>
                {/* Food */}
                <group position={[0.35, 0, 0]}>
                    <Cylinder args={[0.25, 0.25, 0.15]} position={[0, 0.075, 0]} castShadow>
                        <meshStandardMaterial color="#fff" />
                    </Cylinder>
                    <Cylinder args={[0.2, 0.2, 0.1]} position={[0, 0.13, 0]}>
                        <meshStandardMaterial color="#795548" /> {/* Kibble */}
                    </Cylinder>
                </group>
                {/* Water */}
                <group position={[-0.35, 0, 0]}>
                    <Cylinder args={[0.25, 0.25, 0.15]} position={[0, 0.075, 0]} castShadow>
                        <meshStandardMaterial color="#fff" />
                    </Cylinder>
                    <Cylinder args={[0.2, 0.2, 0.1]} position={[0, 0.13, 0]}>
                        <meshStandardMaterial color="#4FC3F7" /> {/* Water */}
                    </Cylinder>
                </group>
            </group>
        </group>
    );
}

// 4. Bathroom: The Spa
function BathroomStage() {
    // "Hollow" Tub effect using multiple boxes
    return (
        <group>
            {/* Tub Container Group */}
            <group position={[0, 0.3, 0]}>
                {/* Bottom Base */}
                <Box args={[1.4, 0.1, 2.0]} position={[0, -0.25, 0]} castShadow>
                    <meshStandardMaterial color="#fff" />
                </Box>
                {/* Side Walls */}
                <Box args={[0.1, 0.6, 2.0]} position={[0.65, 0, 0]} castShadow>
                    <meshStandardMaterial color="#fff" />
                </Box>
                <Box args={[0.1, 0.6, 2.0]} position={[-0.65, 0, 0]} castShadow>
                    <meshStandardMaterial color="#fff" />
                </Box>
                {/* End Walls */}
                <Box args={[1.2, 0.6, 0.1]} position={[0, 0, 0.95]} castShadow>
                    <meshStandardMaterial color="#fff" />
                </Box>
                <Box args={[1.2, 0.6, 0.1]} position={[0, 0, -0.95]} castShadow>
                    <meshStandardMaterial color="#fff" />
                </Box>

                {/* Water Volume (Slightly larger height but inside) */}
                <Box args={[1.2, 0.45, 1.8]} position={[0, -0.05, 0]}>
                    <meshStandardMaterial color="#4FC3F7" transparent opacity={0.8} />
                </Box>

                {/* Rubber Duck */}
                <group position={[0.3, 0.2, 0.5]} rotation={[0, -0.5, 0]}>
                    <Box args={[0.15, 0.12, 0.2]} position={[0, 0, 0]}><meshStandardMaterial color="#FFEB3B" /></Box>
                    <Box args={[0.1, 0.1, 0.1]} position={[0, 0.1, 0.05]}><meshStandardMaterial color="#FFEB3B" /></Box>
                    <Box args={[0.08, 0.04, 0.08]} position={[0, 0.1, 0.12]}><meshStandardMaterial color="#FF9800" /></Box>
                </group>
            </group>
        </group>
    );
}
