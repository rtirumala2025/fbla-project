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


// Living Room: Bed, Nightstand, Lamp, Rug
function LivingRoomProps({ onSwitchRoom }: { onSwitchRoom?: (room: any) => void }) {
    return (
        <group>
            {/* Large Round Rug - CENTERED (Just above floor) */}
            <Cylinder args={[3.2, 3.2, 0.08, 64]} position={[0, 0.02, 0]} receiveShadow>
                <meshStandardMaterial color="#E1F5FE" />
            </Cylinder>

            {/* The Bed - TUCKED LEFT */}
            <group position={[-2.5, 0, -1]} rotation={[0, 0.2, 0]}>
                {/* Frame: Height 0.35 -> Y = 0.175 (Bottom at 0) */}
                <RoundedBox args={[2.2, 0.35, 2.2]} position={[0, 0.175, 0]} radius={0.08} smoothness={4} castShadow receiveShadow>
                    <meshStandardMaterial color="#5D4037" />
                </RoundedBox>
                {/* Mattress: Height 0.25 -> Mounted on top of 0.35 -> Center Y = 0.35 + (0.25/2) = 0.475 */}
                <RoundedBox args={[2, 0.25, 2]} position={[0, 0.475, 0]} radius={0.12} smoothness={4} castShadow>
                    <meshStandardMaterial color="#FFF8E1" />
                </RoundedBox>
                {/* Duvet (Navy Blue) - Folded across bottom 2/3 */}
                <RoundedBox args={[1.9, 0.15, 1.4]} position={[0, 0.55, 0.25]} radius={0.08} smoothness={4} castShadow>
                    <meshStandardMaterial color="#1A237E" />
                </RoundedBox>
                {/* Pillow - Tilted for 'tossed' look */}
                <RoundedBox args={[1.6, 0.25, 0.5]} position={[0, 0.725, -0.7]} rotation={[0, 0, 0.09]} radius={0.1} smoothness={4} castShadow>
                    <meshStandardMaterial color="#C62828" />
                </RoundedBox>
            </group>

            {/* Nightstand - NEXT TO BED */}
            <group position={[-4, 0, -1.5]}>
                {/* Height 0.55 -> Y = 0.275 */}
                <RoundedBox args={[0.6, 0.55, 0.6]} position={[0, 0.275, 0]} radius={0.06} smoothness={4} castShadow receiveShadow>
                    <meshStandardMaterial color="#8D6E63" />
                </RoundedBox>
                <Cylinder args={[0.06, 0.1, 0.2]} position={[0, 0.65, 0]}>
                    <meshStandardMaterial color="#3E2723" />
                </Cylinder>
                <Cylinder args={[0.18, 0.25, 0.25]} position={[0, 0.85, 0]}>
                    <meshStandardMaterial
                        color="#FFF59D"
                        emissive="#FFF59D"
                        emissiveIntensity={2.5}
                        toneMapped={false}
                    />
                </Cylinder>
            </group>

            {/* KITCHEN BACKGROUND (Interactive) */}
            <group position={[2, 0, -2.5]} rotation={[0, -0.1, 0]}>
                {/* === SMART FRIDGE === */}
                <group
                    position={[1.5, 0, 0]}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onSwitchRoom) onSwitchRoom('kitchen');
                    }}
                    onPointerOver={() => document.body.style.cursor = 'pointer'}
                    onPointerOut={() => document.body.style.cursor = 'auto'}
                >
                    {/* Kickplate */}
                    <RoundedBox args={[1.2, 0.2, 0.9]} position={[0, 0.1, 0]} radius={0.02} smoothness={4}>
                        <meshStandardMaterial color="#212121" />
                    </RoundedBox>

                    {/* Main Fridge Door (Bottom) - Height 3.0 */}
                    <RoundedBox args={[1.18, 3.0, 0.95]} position={[0, 1.7, 0]} radius={0.05} smoothness={4} castShadow>
                        <meshStandardMaterial color="#B0B0B0" metalness={0.7} roughness={0.15} />
                    </RoundedBox>
                    {/* Main Handle (Cylinder) */}
                    <Cylinder args={[0.03, 0.03, 0.7]} rotation={[0, 0, Math.PI / 2]} position={[-0.48, 2.2, 0.5]}>
                        <meshStandardMaterial color="#E0E0E0" metalness={0.9} roughness={0.1} />
                    </Cylinder>
                    {/* Water Dispenser (Black Rectangle) */}
                    <RoundedBox args={[0.3, 0.5, 0.05]} position={[0.2, 1.8, 0.48]} radius={0.02} smoothness={4}>
                        <meshStandardMaterial color="#1A1A1A" />
                    </RoundedBox>

                    {/* Freezer Door (Top) - Height 1.2, Gap 0.05 from main */}
                    <RoundedBox args={[1.18, 1.2, 0.95]} position={[0, 3.85, 0]} radius={0.05} smoothness={4} castShadow>
                        <meshStandardMaterial color="#B8B8B8" metalness={0.7} roughness={0.15} />
                    </RoundedBox>
                    {/* Freezer Handle (Cylinder) */}
                    <Cylinder args={[0.03, 0.03, 0.5]} rotation={[0, 0, Math.PI / 2]} position={[-0.48, 3.6, 0.5]}>
                        <meshStandardMaterial color="#E0E0E0" metalness={0.9} roughness={0.1} />
                    </Cylinder>
                </group>

                {/* Cabinets 
                     Kickplate Height: 0.2 -> Y = 0.1
                     Cabinet Height: 1.2 -> Y = 0.2 + 0.6 = 0.8
                 */}
                <RoundedBox args={[2, 1.2, 0.8]} position={[-0.5, 0.8, 0]} radius={0.05} smoothness={4} castShadow>
                    <meshStandardMaterial color="#1A237E" />
                </RoundedBox>
                {/* Kickplate (Base) */}
                <RoundedBox args={[1.8, 0.2, 0.7]} position={[-0.5, 0.1, 0.05]} radius={0.02} smoothness={4}>
                    <meshStandardMaterial color="#212121" />
                </RoundedBox>
                {/* Countertop (Overhang) */}
                <RoundedBox args={[2.2, 0.08, 0.9]} position={[-0.5, 1.45, 0.05]} radius={0.02} smoothness={4}>
                    <meshStandardMaterial color="#D3D3D3" />
                </RoundedBox>
                {/* Wall Cabinets */}
                <RoundedBox args={[2, 1, 0.5]} position={[-0.5, 3, -0.2]} radius={0.05} smoothness={4} castShadow>
                    <meshStandardMaterial color="#1A237E" />
                </RoundedBox>
            </group>


            {/* Clutter: Stack of Books - Center Table ish */}
            <group position={[1.5, 0, 1.2]} rotation={[0, 0.4, 0]}>
                <RoundedBox args={[0.4, 0.08, 0.3]} position={[0, 0.04, 0]} radius={0.02} smoothness={4} castShadow>
                    <meshStandardMaterial color="#E57373" />
                </RoundedBox>
                <RoundedBox args={[0.38, 0.08, 0.28]} position={[0, 0.12, 0.02]} rotation={[0, -0.2, 0]} radius={0.02} smoothness={4} castShadow>
                    <meshStandardMaterial color="#64B5F6" />
                </RoundedBox>
            </group>

            {/* Potted Plant in corner (Left Corner) */}
            <group position={[-4, 0, -0.5]}>
                <Cylinder args={[0.3, 0.25, 0.5]} position={[0, 0.25, 0]} castShadow>
                    <meshStandardMaterial color="#8D6E63" />
                </Cylinder>
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
