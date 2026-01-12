/**
 * RoomStage.tsx
 * 
 * "Open Floor Plan" - 3D Props in foreground with full house shell in background.
 */

import React, { useRef } from 'react';
import { Box, Cylinder, Sphere } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RoomType } from './RoomSwitcher';
import { HouseShell } from './HouseShell';

interface RoomStageProps {
    room: RoomType;
}

export function RoomStage({ room }: RoomStageProps) {
    return (
        <group position={[0, -0.8, 0]}>
            {/* === BACKGROUND: Full 3D House Environment === */}
            <HouseShell room={room} />

            {/* === FOREGROUND: Room-specific furniture === */}
            {room === 'living' && <LivingRoomProps />}
            {room === 'kitchen' && <KitchenProps />}
            {room === 'bathroom' && <BathroomProps />}
            {room === 'closet' && <ClosetProps />}
        </group>
    );
}


// Living Room: Bed, Nightstand, Lamp, Rug
function LivingRoomProps() {
    return (
        <group>
            {/* Fluffy Rug */}
            <Cylinder args={[2.5, 2.5, 0.08, 32]} position={[0, 0.04, 0]} receiveShadow>
                <meshStandardMaterial color="#FFCDD2" />
            </Cylinder>

            {/* The Bed */}
            <group position={[0, 0, 0]}>
                {/* Frame */}
                <Box args={[2.2, 0.35, 2.2]} position={[0, 0.175, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color="#5D4037" />
                </Box>
                {/* Mattress */}
                <Box args={[2, 0.25, 2]} position={[0, 0.475, 0]} castShadow>
                    <meshStandardMaterial color="#FFF8E1" />
                </Box>
                {/* Pillow */}
                <Box args={[1.6, 0.25, 0.5]} position={[0, 0.725, -0.7]} castShadow>
                    <meshStandardMaterial color="#C62828" />
                </Box>
            </group>

            {/* Nightstand */}
            <group position={[-1.8, 0, 0]}>
                <Box args={[0.6, 0.55, 0.6]} position={[0, 0.275, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color="#8D6E63" />
                </Box>
                {/* Lamp Base */}
                <Cylinder args={[0.06, 0.1, 0.2]} position={[0, 0.65, 0]}>
                    <meshStandardMaterial color="#3E2723" />
                </Cylinder>
                {/* Lamp Shade */}
                <Cylinder args={[0.18, 0.25, 0.25]} position={[0, 0.85, 0]}>
                    <meshStandardMaterial
                        color="#FFF59D"
                        emissive="#FFF59D"
                        emissiveIntensity={2.5}
                        toneMapped={false}
                    />
                </Cylinder>
            </group>
        </group>
    );
}

// Kitchen: Placemat and Bowls
function KitchenProps() {
    return (
        <group>
            {/* Floor Mat */}
            <Box args={[2.2, 0.06, 1.4]} position={[0, 0.03, 0]} receiveShadow>
                <meshStandardMaterial color="#90CAF9" />
            </Box>

            {/* Placemat */}
            <Box args={[1.4, 0.03, 0.8]} position={[0, 0.075, 0]} receiveShadow>
                <meshStandardMaterial color="#1976D2" />
            </Box>

            {/* Food Bowl */}
            <group position={[0.35, 0.1, 0]}>
                <Cylinder args={[0.25, 0.25, 0.18]} position={[0, 0.09, 0]} castShadow>
                    <meshStandardMaterial color="#FFFFFF" />
                </Cylinder>
                <Cylinder args={[0.2, 0.2, 0.1]} position={[0, 0.14, 0]}>
                    <meshStandardMaterial color="#795548" />
                </Cylinder>
            </group>

            {/* Water Bowl */}
            <group position={[-0.35, 0.1, 0]}>
                <Cylinder args={[0.25, 0.25, 0.18]} position={[0, 0.09, 0]} castShadow>
                    <meshStandardMaterial color="#FFFFFF" />
                </Cylinder>
                <Cylinder args={[0.2, 0.2, 0.1]} position={[0, 0.14, 0]}>
                    <meshStandardMaterial color="#4FC3F7" transparent opacity={0.8} />
                </Cylinder>
            </group>
        </group>
    );
}

// Bathroom: Tub with Duck
function BathroomProps() {
    return (
        <group>
            {/* Bath Mat */}
            <Box args={[2.4, 0.06, 2.8]} position={[0, 0.03, 0]} receiveShadow>
                <meshStandardMaterial color="#80DEEA" />
            </Box>

            {/* The Tub */}
            <group position={[0, 0.35, 0]}>
                {/* Tub Exterior */}
                <Box args={[1.8, 0.65, 2.2]} position={[0, 0, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color="#FFFFFF" />
                </Box>
                {/* Water */}
                <Box args={[1.5, 0.5, 1.9]} position={[0, 0.1, 0]}>
                    <meshStandardMaterial color="#4FC3F7" transparent opacity={0.7} />
                </Box>
                {/* Rim */}
                <Box args={[2, 0.08, 2.4]} position={[0, 0.37, 0]}>
                    <meshStandardMaterial color="#E0E0E0" />
                </Box>
            </group>

            {/* Rubber Duck */}
            <group position={[0.4, 0.75, 0.5]} rotation={[0, -0.4, 0]}>
                <Box args={[0.18, 0.12, 0.22]}>
                    <meshStandardMaterial color="#FFEB3B" />
                </Box>
                <Box args={[0.12, 0.12, 0.12]} position={[0, 0.1, 0.06]}>
                    <meshStandardMaterial color="#FFEB3B" />
                </Box>
                <Box args={[0.08, 0.04, 0.08]} position={[0, 0.1, 0.14]}>
                    <meshStandardMaterial color="#FF9800" />
                </Box>
            </group>

            {/* Bubbles */}
            <Sphere args={[0.1]} position={[-0.25, 0.8, 0.2]}>
                <meshStandardMaterial color="#FFFFFF" transparent opacity={0.5} />
            </Sphere>
            <Sphere args={[0.07]} position={[0.15, 0.75, -0.3]}>
                <meshStandardMaterial color="#FFFFFF" transparent opacity={0.5} />
            </Sphere>
        </group>
    );
}

// Closet: Fashion Podium
function ClosetProps() {
    const podiumRef = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        if (podiumRef.current) {
            podiumRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.3) * 0.06;
        }
    });

    return (
        <group ref={podiumRef}>
            {/* Podium Base */}
            <Cylinder args={[1.6, 1.8, 0.2, 32]} position={[0, 0.1, 0]} receiveShadow>
                <meshStandardMaterial color="#212121" />
            </Cylinder>

            {/* Red Carpet */}
            <Cylinder args={[1.4, 1.4, 0.06, 32]} position={[0, 0.23, 0]} receiveShadow>
                <meshStandardMaterial color="#D50000" roughness={0.8} />
            </Cylinder>

            {/* Gold Rim */}
            <Cylinder args={[1.42, 1.42, 0.03, 32]} position={[0, 0.28, 0]}>
                <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
            </Cylinder>
        </group>
    );
}
