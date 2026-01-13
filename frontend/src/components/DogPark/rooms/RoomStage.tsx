/**
 * RoomStage.tsx
 * 
 * "Open Floor Plan" - 3D Props in foreground with full house shell in background.
 */

import React, { useRef } from 'react';
import { Box, Cylinder, Sphere, RoundedBox } from '@react-three/drei';
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
            {/* Large Round Rug - Centered under the dog */}
            <Cylinder args={[3.2, 3.2, 0.08, 64]} position={[0, 0.04, 0]} receiveShadow>
                <meshStandardMaterial color="#E1F5FE" />
            </Cylinder>

            {/* The Bed - SHIFTED LEFT */}
            <group position={[-5, 0, 0]} rotation={[0, 0.2, 0]}>
                {/* Frame */}
                <RoundedBox args={[2.2, 0.35, 2.2]} position={[0, 0.175, 0]} radius={0.08} smoothness={4} castShadow receiveShadow>
                    <meshStandardMaterial color="#5D4037" />
                </RoundedBox>
                {/* Mattress */}
                <RoundedBox args={[2, 0.25, 2]} position={[0, 0.475, 0]} radius={0.12} smoothness={4} castShadow>
                    <meshStandardMaterial color="#FFF8E1" />
                </RoundedBox>
                {/* Pillow */}
                <RoundedBox args={[1.6, 0.25, 0.5]} position={[0, 0.725, -0.7]} radius={0.1} smoothness={4} castShadow>
                    <meshStandardMaterial color="#C62828" />
                </RoundedBox>
            </group>

            {/* Nightstand - SHIFTED LEFT */}
            <group position={[-7, 0, 0.5]}>
                <RoundedBox args={[0.6, 0.55, 0.6]} position={[0, 0.275, 0]} radius={0.06} smoothness={4} castShadow receiveShadow>
                    <meshStandardMaterial color="#8D6E63" />
                </RoundedBox>
                {/* Lamp Base */}
                <Cylinder args={[0.06, 0.1, 0.2]} position={[0, 0.65, 0]}>
                    <meshStandardMaterial color="#3E2723" />
                </Cylinder>
                {/* Lamp Shade */}
                <Cylinder args={[1.8, 2.5, 2.5]} position={[0, 0.85, 0]} scale={0.1}>
                    <meshStandardMaterial
                        color="#FFF59D"
                        emissive="#FFF59D"
                        emissiveIntensity={2.5}
                        toneMapped={false}
                    />
                </Cylinder>
            </group>

            {/* Clutter: Stack of Books - NEAR BED */}
            <group position={[-4, 0, 1.5]} rotation={[0, 0.4, 0]}>
                <RoundedBox args={[0.4, 0.08, 0.3]} position={[0, 0.04, 0]} radius={0.02} smoothness={4} castShadow>
                    <meshStandardMaterial color="#E57373" />
                </RoundedBox>
                <RoundedBox args={[0.38, 0.08, 0.28]} position={[0, 0.12, 0.02]} rotation={[0, -0.2, 0]} radius={0.02} smoothness={4} castShadow>
                    <meshStandardMaterial color="#64B5F6" />
                </RoundedBox>
                <RoundedBox args={[0.35, 0.1, 0.25]} position={[0.05, 0.2, -0.01]} rotation={[0, 0.1, 0]} radius={0.02} smoothness={4} castShadow>
                    <meshStandardMaterial color="#FFF176" />
                </RoundedBox>
            </group>

            {/* Clutter: Toy Ball */}
            <Sphere args={[0.15]} position={[-2.5, 0.15, 2]} castShadow>
                <meshStandardMaterial color="#BA68C8" />
            </Sphere>

            {/* Potted Plant in corner (Far Left) */}
            <group position={[-9, 0, -5]}>
                {/* Pot */}
                <Cylinder args={[0.3, 0.25, 0.5]} position={[0, 0.25, 0]} castShadow>
                    <meshStandardMaterial color="#8D6E63" />
                </Cylinder>
                {/* Soil */}
                <Cylinder args={[0.28, 0.28, 0.05]} position={[0, 0.48, 0]}>
                    <meshStandardMaterial color="#3E2723" />
                </Cylinder>
                {/* Plant Leaves */}
                <Sphere args={[0.25]} position={[0, 0.7, 0]} castShadow>
                    <meshStandardMaterial color="#4CAF50" />
                </Sphere>
            </group>
        </group>
    );
}

// Kitchen: Placemat and Bowls - SHIFTED RIGHT (COMPRESSED)
function KitchenProps() {
    return (
        <group position={[3, 0, 0]}>
            {/* Floor Mat */}
            <RoundedBox args={[2.2, 0.06, 1.4]} position={[0, 0.03, 0]} radius={0.03} smoothness={4} receiveShadow>
                <meshStandardMaterial color="#90CAF9" />
            </RoundedBox>

            {/* Placemat */}
            <RoundedBox args={[1.4, 0.03, 0.8]} position={[0, 0.075, 0]} radius={0.02} smoothness={4} receiveShadow>
                <meshStandardMaterial color="#1976D2" />
            </RoundedBox>

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
            <RoundedBox args={[2.4, 0.06, 2.8]} position={[0, 0.03, 0]} radius={0.03} smoothness={4} receiveShadow>
                <meshStandardMaterial color="#80DEEA" />
            </RoundedBox>

            {/* The Tub */}
            <group position={[0, 0.35, 0]}>
                {/* Tub Exterior */}
                <RoundedBox args={[1.8, 0.65, 2.2]} position={[0, 0, 0]} radius={0.15} smoothness={4} castShadow receiveShadow>
                    <meshStandardMaterial color="#FFFFFF" />
                </RoundedBox>
                {/* Water */}
                <RoundedBox args={[1.5, 0.5, 1.9]} position={[0, 0.1, 0]} radius={0.08} smoothness={4}>
                    <meshStandardMaterial color="#4FC3F7" transparent opacity={0.7} />
                </RoundedBox>
                {/* Rim */}
                <RoundedBox args={[2, 0.08, 2.4]} position={[0, 0.37, 0]} radius={0.05} smoothness={4}>
                    <meshStandardMaterial color="#E0E0E0" />
                </RoundedBox>
            </group>

            {/* Rubber Duck */}
            <group position={[0.4, 0.75, 0.5]} rotation={[0, -0.4, 0]}>
                <RoundedBox args={[0.18, 0.12, 0.22]} radius={0.04} smoothness={4}>
                    <meshStandardMaterial color="#FFEB3B" />
                </RoundedBox>
                <RoundedBox args={[0.12, 0.12, 0.12]} position={[0, 0.1, 0.06]} radius={0.06} smoothness={4}>
                    <meshStandardMaterial color="#FFEB3B" />
                </RoundedBox>
                <RoundedBox args={[0.08, 0.04, 0.08]} position={[0, 0.1, 0.14]} radius={0.02} smoothness={4}>
                    <meshStandardMaterial color="#FF9800" />
                </RoundedBox>
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
