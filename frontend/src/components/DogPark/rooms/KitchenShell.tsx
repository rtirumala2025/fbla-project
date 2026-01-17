import React from 'react';
import { ContactShadows } from '@react-three/drei';

/**
 * KitchenShell - Compact Kitchen Architecture
 * 
 * DESIGN:
 * - Back Wall: Z = -4.5 (Smaller room depth)
 * - No French Doors - Solid Wall
 * - Single Sink Window at eye level
 * - Floor: White Tile
 * - Walls: Sage Green
 */

// === COMPONENT: Horizontal Sink Window ===
function SinkWindow({ position }: { position: [number, number, number] }) {
    const trimColor = "#FFFFFF";

    return (
        <group position={position}>
            {/* THE CASING */}
            <mesh position={[0, 0, 0.08]}>
                <boxGeometry args={[3.5, 2.2, 0.2]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* INNER FRAME */}
            <mesh position={[0, 0, 0.12]}>
                <boxGeometry args={[3.0, 1.8, 0.12]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* THE GLASS */}
            <mesh position={[0, 0, 0.1]}>
                <planeGeometry args={[2.6, 1.5]} />
                <meshPhysicalMaterial
                    color="#E8F4FD"
                    metalness={0.0}
                    roughness={0.0}
                    transmission={1.0}
                    thickness={0.2}
                    transparent={true}
                    side={2}
                />
            </mesh>

            {/* MULLIONS (Cross pattern) */}
            <mesh position={[0, 0, 0.14]}>
                <boxGeometry args={[0.08, 1.6, 0.06]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0.14]}>
                <boxGeometry args={[2.8, 0.08, 0.06]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* WINDOW SILL */}
            <mesh position={[0, -1.15, 0.15]}>
                <boxGeometry args={[3.8, 0.2, 0.4]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>
        </group>
    );
}

export function KitchenShell() {
    const wallColor = "#C8E6C9"; // Sage Green
    const trimColor = "#FFFFFF"; // Clean White
    const floorColor = "#F5F5F5"; // White Tile

    // Kitchen-specific Z coordinates (Smaller room)
    const WALL_Z = -4.5;
    const TRIM_Z = -4.45;

    return (
        <group>
            {/* === 1. THE FLOOR (White Tile) === */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[30, 20]} />
                <meshStandardMaterial color={floorColor} roughness={0.1} metalness={0.05} />
            </mesh>
            <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.5} far={10} color="#000000" />

            {/* Tile Grid Lines */}
            <gridHelper args={[30, 15, "#E0E0E0", "#E0E0E0"]} position={[0, 0.005, 0]} />

            {/* === 2. THE SKY (Behind Window) === */}
            <mesh position={[2, 5, WALL_Z - 2]}>
                <planeGeometry args={[10, 8]} />
                <meshBasicMaterial color="#87CEEB" />
            </mesh>

            {/* === 3. THE BACK WALL (Solid - No Doors) === */}
            <group position={[0, 0, 0]}>
                {/* Main Solid Wall Panel */}
                <mesh position={[0, 4.5, WALL_Z]} receiveShadow>
                    <boxGeometry args={[16, 9, 0.5]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                {/* Wall Above Window */}
                <mesh position={[2, 7.5, WALL_Z]} receiveShadow>
                    <boxGeometry args={[4, 3, 0.5]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                {/* Wall Below Window */}
                <mesh position={[2, 2.5, WALL_Z]} receiveShadow>
                    <boxGeometry args={[4, 5, 0.5]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                {/* Wall Left of Window */}
                <mesh position={[-4, 4.5, WALL_Z]} receiveShadow>
                    <boxGeometry args={[8, 9, 0.5]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                {/* Wall Right of Window */}
                <mesh position={[6.5, 4.5, WALL_Z]} receiveShadow>
                    <boxGeometry args={[5, 9, 0.5]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                {/* === SINK WINDOW (Horizontal, Eye Level) === */}
                <SinkWindow position={[2, 5, TRIM_Z]} />

                {/* === TRIM === */}
                {/* Baseboard */}
                <mesh position={[0, 0.15, TRIM_Z + 0.3]} receiveShadow>
                    <boxGeometry args={[16, 0.3, 0.1]} />
                    <meshStandardMaterial color={trimColor} roughness={0.2} />
                </mesh>

                {/* Crown Molding */}
                <mesh position={[0, 8.85, TRIM_Z + 0.3]}>
                    <boxGeometry args={[16, 0.3, 0.12]} />
                    <meshStandardMaterial color={trimColor} roughness={0.2} />
                </mesh>
            </group>

            {/* === 4. SIDE WALLS (Closer for smaller room) === */}
            <mesh position={[-8, 4.5, -2]} receiveShadow>
                <boxGeometry args={[0.5, 9, 8]} />
                <meshStandardMaterial color={wallColor} roughness={0.9} />
            </mesh>
            <mesh position={[8, 4.5, -2]} receiveShadow>
                <boxGeometry args={[0.5, 9, 8]} />
                <meshStandardMaterial color={wallColor} roughness={0.9} />
            </mesh>

            {/* === 5. CEILING === */}
            <mesh position={[0, 9, -2]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[16, 10]} />
                <meshStandardMaterial color="#F5F5F5" side={2} />
            </mesh>
        </group>
    );
}
