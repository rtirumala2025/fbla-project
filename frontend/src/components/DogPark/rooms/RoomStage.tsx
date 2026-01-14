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
    onSwitchRoom?: (room: any) => void;
}

export function RoomStage({ room, onSwitchRoom }: RoomStageProps) {
    return (
        <group position={[0, 0, 0]}>
            {/* === BACKGROUND: The Box === */}
            <HouseShell room={room} onSwitchRoom={onSwitchRoom} />

            {/* === FOREGROUND: Clustered Props === */}
            {room === 'living' && <LivingRoomProps onSwitchRoom={onSwitchRoom} />}
            {/* Other rooms remain as is or adjust if necessary */}
            {room === 'kitchen' && <KitchenProps />}
            {room === 'bathroom' && <BathroomProps />}
            {room === 'closet' && <ClosetProps />}
        </group>
    );
}


// Living Room: High Precision "Flatten & Detail"
function LivingRoomProps({ onSwitchRoom }: { onSwitchRoom?: (room: any) => void }) {
    return (
        <group>
            {/* === LEVEL 1: PAPER THIN RUG === */}
            <RoundedBox args={[9, 0.05, 6]} position={[0, 0.025, -2]} radius={0.05} receiveShadow>
                <meshStandardMaterial color="#F5F5F5" roughness={1.0} /> {/* Matte Fabric */}
            </RoundedBox>

            {/* === LEVEL 2: BED LAYERS (Low & Precise) === */}
            <group position={[0, 0, -2]}>
                {/* Cushion (y=0.1) */}
                <mesh position={[0, 0.1, 0]} receiveShadow>
                    <cylinderGeometry args={[1.4, 1.4, 0.1, 32]} />
                    <meshStandardMaterial color="#FFF8E1" roughness={0.9} />
                </mesh>
                {/* Donut Rim (y=0.15) */}
                <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
                    <torusGeometry args={[1.5, 0.3, 16, 32]} />
                    <meshStandardMaterial color="#5D4037" roughness={0.4} /> {/* Leather Sheen */}
                </mesh>
            </group>

            {/* === LEVEL 3: MCM NIGHTSTANDS (On Legs) === */}
            {/* Left Nightstand */}
            <Nightstand position={[-3.2, 0, -2]} />
            {/* Right Nightstand */}
            <Nightstand position={[3.2, 0, -2]} />
        </group>
    );
}

function Nightstand({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            {/* Floating Body (Center y=0.8) */}
            <RoundedBox args={[1, 0.6, 1]} position={[0, 0.8, 0]} radius={0.05} smoothness={4} castShadow>
                <meshStandardMaterial color="#3E2723" roughness={0.2} /> {/* Polished Wood */}
            </RoundedBox>

            {/* Legs (Gold/Wood) */}
            <group position={[0, 0, 0]}>
                <Cylinder args={[0.04, 0.02, 0.5]} position={[-0.4, 0.25, -0.4]} castShadow><meshStandardMaterial color="#FFD700" metalness={0.8} /></Cylinder>
                <Cylinder args={[0.04, 0.02, 0.5]} position={[0.4, 0.25, -0.4]} castShadow><meshStandardMaterial color="#FFD700" metalness={0.8} /></Cylinder>
                <Cylinder args={[0.04, 0.02, 0.5]} position={[-0.4, 0.25, 0.4]} castShadow><meshStandardMaterial color="#FFD700" metalness={0.8} /></Cylinder>
                <Cylinder args={[0.04, 0.02, 0.5]} position={[0.4, 0.25, 0.4]} castShadow><meshStandardMaterial color="#FFD700" metalness={0.8} /></Cylinder>
            </group>

            {/* Lamp (Top) */}
            <Cylinder args={[0.05, 0.05, 0.4]} position={[0, 1.3, 0]} castShadow>
                <meshStandardMaterial color="#FFD700" metalness={1.0} roughness={0.2} />
            </Cylinder>
            <Cylinder args={[0.25, 0.25, 0.3]} position={[0, 1.6, 0]}>
                <meshStandardMaterial color="#FFF9C4" transparent opacity={0.9} />
            </Cylinder>
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
