import React from 'react';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

/**
 * KitchenShell - Compact L-Shaped Kitchen Layout
 * 
 * ROOM DIMENSIONS (User Mandated):
 * - Room Width: 10 units (x=-5 to x=5)
 * - Left Wall: x = -5
 * - Right Wall: x = 5
 * - Back Wall: z = -4.5
 * 
 * 4-PANEL WINDOW CONSTRUCTION:
 * - Left Panel: x=-3.5, w=3 => Range [-5, -2]
 * - Right Panel: x=3.5, w=3 => Range [2, 5]
 * - Top Panel: x=0, y=8.5, h=3 => Range y[7, 10]
 * - Bottom Panel: x=0, y=1.5, h=3 => Range y[0, 3]
 * - Resulting Hole: x[-2, 2], y[3, 7] => Center (0, 5), Size 4x4.
 */

export function KitchenShell() {
    const wallColor = "#C8E6C9"; // Sage Green
    const trimColor = "#FFFFFF"; // Baseboards
    const floorColor = "#F5F5F5"; // Tiles

    return (
        <group>
            {/* === 1. FLOOR === */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[20, 20]} />
                <meshStandardMaterial color={floorColor} roughness={0.1} metalness={0.1} />
            </mesh>
            <ContactShadows resolution={1024} scale={15} blur={2} opacity={0.5} far={10} color="#000000" />

            {/* Tile Grid */}
            <gridHelper args={[20, 10, "#E0E0E0", "#E0E0E0"]} position={[0, 0.005, 0]} />


            {/* === 2. BACK WALL (4-PIECE PUZZLE for Window Gap) === */}
            <group>
                {/* 1. Left Wall Panel */}
                <mesh position={[-3.5, 5, -4.5]} receiveShadow>
                    <boxGeometry args={[3, 10, 0.5]} />
                    <meshStandardMaterial color={wallColor} />
                </mesh>

                {/* 2. Right Wall Panel */}
                <mesh position={[3.5, 5, -4.5]} receiveShadow>
                    <boxGeometry args={[3, 10, 0.5]} />
                    <meshStandardMaterial color={wallColor} />
                </mesh>

                {/* 3. Top Header (Strip above window) */}
                <mesh position={[0, 8.5, -4.5]} receiveShadow>
                    <boxGeometry args={[4, 3, 0.5]} />
                    <meshStandardMaterial color={wallColor} />
                </mesh>

                {/* 4. Bottom Apron (Strip below window) */}
                <mesh position={[0, 1.5, -4.5]} receiveShadow>
                    <boxGeometry args={[4, 3, 0.5]} />
                    <meshStandardMaterial color={wallColor} />
                </mesh>
            </group>


            {/* === 3. THE WINDOW (Centered at x=0) === */}
            <group position={[0, 5, -4.5]}>
                {/* Glass Pane - Simple Transparent Material */}
                <mesh position={[0, 0, 0.3]}>
                    <planeGeometry args={[3.8, 3.8]} />
                    <meshBasicMaterial
                        color="#87CEEB"
                        transparent={true}
                        opacity={0.3}
                        side={THREE.DoubleSide}
                    />
                </mesh>

                {/* Window Frame - 4 strips */}
                <mesh position={[-1.9, 0, 0.3]}> <boxGeometry args={[0.2, 4, 0.2]} /> <meshStandardMaterial color="#FFF" /> </mesh>
                <mesh position={[1.9, 0, 0.3]}> <boxGeometry args={[0.2, 4, 0.2]} /> <meshStandardMaterial color="#FFF" /> </mesh>
                <mesh position={[0, 1.9, 0.3]}> <boxGeometry args={[4, 0.2, 0.2]} /> <meshStandardMaterial color="#FFF" /> </mesh>
                <mesh position={[0, -1.9, 0.3]}> <boxGeometry args={[4, 0.2, 0.2]} /> <meshStandardMaterial color="#FFF" /> </mesh>
            </group>


            {/* === 4. THE VIEW (Backyard) === */}
            <group>
                {/* Sky Plane (Far Back at z=-20) */}
                <mesh position={[0, 5, -20]}>
                    <planeGeometry args={[30, 20]} />
                    <meshBasicMaterial color="#87CEEB" />
                </mesh>

                {/* Ground/Grass Plane (Outside, lowered to y=-0.5 to avoid floor clipping) */}
                <mesh position={[0, -0.5, -12]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[30, 15]} />
                    <meshBasicMaterial color="#4CAF50" />
                </mesh>
            </group>


            {/* === 5. SIDE WALLS (Narrower Room: x=-5 to x=5) === */}
            {/* Left Wall */}
            <mesh position={[-5.25, 5, 0]} receiveShadow>
                <boxGeometry args={[0.5, 10, 15]} />
                <meshStandardMaterial color={wallColor} />
            </mesh>
            {/* Right Wall */}
            <mesh position={[5.25, 5, 0]} receiveShadow>
                <boxGeometry args={[0.5, 10, 15]} />
                <meshStandardMaterial color={wallColor} />
            </mesh>

            {/* === 6. TRIM (Baseboards) === */}
            {/* Back wall baseboards */}
            <mesh position={[-3.5, 0.15, -4.2]}> <boxGeometry args={[3, 0.3, 0.1]} /> <meshStandardMaterial color={trimColor} /> </mesh>
            <mesh position={[3.5, 0.15, -4.2]}> <boxGeometry args={[3, 0.3, 0.1]} /> <meshStandardMaterial color={trimColor} /> </mesh>
            <mesh position={[0, 0.15, -4.2]}> <boxGeometry args={[4, 0.3, 0.1]} /> <meshStandardMaterial color={trimColor} /> </mesh>

            {/* Side wall baseboards */}
            <mesh position={[-5, 0.15, 0]} rotation={[0, Math.PI / 2, 0]}> <boxGeometry args={[15, 0.3, 0.1]} /> <meshStandardMaterial color={trimColor} /> </mesh>
            <mesh position={[5, 0.15, 0]} rotation={[0, Math.PI / 2, 0]}> <boxGeometry args={[15, 0.3, 0.1]} /> <meshStandardMaterial color={trimColor} /> </mesh>

            {/* Light */}
            <pointLight position={[0, 8, -2]} intensity={0.8} />
        </group>
    );
}
