import React from 'react';
import { ContactShadows } from '@react-three/drei';

/**
 * KitchenShell - Kitchen-Specific Architectural Assembly
 * 
 * DESIGN:
 * - Floor: White Marble/Tile
 * - Walls: Sage Green (#C8E6C9)
 * - Windows: Clean white trim, NO drapes
 * - Doors: French doors with silver/chrome hardware
 */

// === REUSABLE COMPONENT: Clean Kitchen Window ===
function KitchenWindow({ position }: { position: [number, number, number] }) {
    const trimColor = "#FFFFFF";

    return (
        <group position={position}>
            {/* THE CASING */}
            <mesh position={[0, -0.25, 0.1]}>
                <boxGeometry args={[4.5, 7.0, 0.25]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* INNER FRAME */}
            <mesh position={[0, -0.25, 0.15]}>
                <boxGeometry args={[4, 6.5, 0.15]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* THE GLASS */}
            <mesh position={[0, -0.25, 0.12]}>
                <planeGeometry args={[3.4, 5.9]} />
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

            {/* MULLIONS */}
            <mesh position={[0, -0.25, 0.18]}>
                <boxGeometry args={[0.12, 6.1, 0.08]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>
            <mesh position={[0, -0.25, 0.18]}>
                <boxGeometry args={[3.6, 0.12, 0.08]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* WINDOW SILL */}
            <mesh position={[0, -3.65, 0.2]}>
                <boxGeometry args={[4.8, 0.3, 0.5]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* NOTE: DRAPES AND RODS REMOVED FOR KITCHEN AESTHETIC */}
        </group>
    );
}

// === REUSABLE COMPONENT: French Door Panel (Kitchen Style) ===
function DoorPanel({ position, handleSide }: { position: [number, number, number], handleSide: 'left' | 'right' }) {
    const trimColor = "#FFFFFF";
    const handleX = handleSide === 'left' ? 0.4 : -0.4;
    const hardwareColor = "#B0BEC5"; // Silver/Chrome for Kitchen

    return (
        <group position={position}>
            {/* FRAME */}
            <mesh position={[-1.1, 0, 0]}>
                <boxGeometry args={[0.25, 7.5, 0.15]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>
            <mesh position={[1.1, 0, 0]}>
                <boxGeometry args={[0.25, 7.5, 0.15]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>
            <mesh position={[0, 3.6, 0]}>
                <boxGeometry args={[2.45, 0.3, 0.15]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>
            <mesh position={[0, -3.4, 0]}>
                <boxGeometry args={[2.45, 0.7, 0.15]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>
            <mesh position={[0, -1.2, 0]}>
                <boxGeometry args={[2.45, 0.2, 0.15]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* GLASS */}
            <mesh position={[0, 1.2, 0.02]}>
                <planeGeometry args={[1.9, 4.3]} />
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
            <mesh position={[0, -2.5, 0.02]}>
                <planeGeometry args={[1.9, 1.5]} />
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

            {/* HARDWARE (Silver/Chrome) */}
            <group position={[handleX, -2.8, 0.12]}>
                <mesh>
                    <boxGeometry args={[0.15, 0.4, 0.03]} />
                    <meshStandardMaterial color={hardwareColor} metalness={0.6} roughness={0.2} />
                </mesh>
                <mesh position={[0, 0, 0.06]} rotation={[0, 0, handleSide === 'left' ? 0.3 : -0.3]}>
                    <boxGeometry args={[0.35, 0.08, 0.08]} />
                    <meshStandardMaterial color="#CFD8DC" metalness={0.8} roughness={0.2} />
                </mesh>
            </group>
        </group>
    );
}

export function KitchenShell() {
    const wallColor = "#C8E6C9"; // Sage Green
    const trimColor = "#FFFFFF"; // Clean White
    const floorColor = "#F5F5F5"; // White Marble/Tile

    const WALL_Z = -8.00;
    const TRIM_Z = -7.95;

    return (
        <group>
            {/* === 1. THE FLOOR (White Tile/Marble) === */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[50, 50]} />
                <meshStandardMaterial color={floorColor} roughness={0.1} metalness={0.1} />
            </mesh>
            <ContactShadows resolution={1024} scale={30} blur={2} opacity={0.5} far={10} color="#000000" />

            {/* Optional: Add a simple grid to represent tiles */}
            <gridHelper args={[50, 25, "#E0E0E0", "#E0E0E0"]} position={[0, 0, 0]} rotation={[0, 0, 0]} />

            {/* === 2. THE BALCONY (Outdoor Floor) === */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -12]} receiveShadow>
                <planeGeometry args={[20, 4]} />
                <meshStandardMaterial color="#4A3728" roughness={0.7} />
            </mesh>

            {/* === 3. THE SKY === */}
            <mesh position={[0, 8, -12]}>
                <planeGeometry args={[60, 40]} />
                <meshBasicMaterial color="#87CEEB" />
            </mesh>

            {/* === 4. THE BACK WALL === */}
            <group position={[0, 0, 0]}>
                {/* Wall Panels */}
                <mesh position={[-14.875, 5, WALL_Z]} receiveShadow>
                    <boxGeometry args={[6.25, 10, 0.8]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>
                <mesh position={[-5.225, 5, WALL_Z]} receiveShadow>
                    <boxGeometry args={[4.05, 10, 0.8]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>
                <mesh position={[5.225, 5, WALL_Z]} receiveShadow>
                    <boxGeometry args={[4.05, 10, 0.8]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>
                <mesh position={[14.875, 5, WALL_Z]} receiveShadow>
                    <boxGeometry args={[6.25, 10, 0.8]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                {/* Openings/Headers */}
                <mesh position={[0, 8.25, WALL_Z]} receiveShadow>
                    <boxGeometry args={[6.4, 1.5, 0.8]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>
                <mesh position={[-3.0, 4.25, WALL_Z]} receiveShadow>
                    <boxGeometry args={[0.6, 9, 0.8]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>
                <mesh position={[3.0, 4.25, WALL_Z]} receiveShadow>
                    <boxGeometry args={[0.6, 9, 0.8]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>
                <mesh position={[0, 10.5, WALL_Z]} receiveShadow>
                    <boxGeometry args={[36, 3, 0.8]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                {/* Windows */}
                <KitchenWindow position={[-9.5, 5, TRIM_Z]} />
                <KitchenWindow position={[9.5, 5, TRIM_Z]} />

                {/* French Doors */}
                <group position={[0, 4.2, TRIM_Z]}>
                    <mesh position={[0, 4, 0.1]}>
                        <boxGeometry args={[6.4, 0.5, 0.3]} />
                        <meshStandardMaterial color={trimColor} roughness={0.2} />
                    </mesh>
                    <mesh position={[-3.0, 0, 0.1]}>
                        <boxGeometry args={[0.6, 8.5, 0.3]} />
                        <meshStandardMaterial color={trimColor} roughness={0.2} />
                    </mesh>
                    <mesh position={[3.0, 0, 0.1]}>
                        <boxGeometry args={[0.6, 8.5, 0.3]} />
                        <meshStandardMaterial color={trimColor} roughness={0.2} />
                    </mesh>
                    <mesh position={[0, -4.1, 0.15]}>
                        <boxGeometry args={[6.4, 0.3, 0.4]} />
                        <meshStandardMaterial color={trimColor} roughness={0.2} />
                    </mesh>
                    <DoorPanel position={[-1.35, 0, 0.15]} handleSide="right" />
                    <DoorPanel position={[1.35, 0, 0.15]} handleSide="left" />
                    <mesh position={[0, 0, 0.18]}>
                        <boxGeometry args={[0.15, 8, 0.12]} />
                        <meshStandardMaterial color={trimColor} roughness={0.2} />
                    </mesh>
                </group>

                {/* Baseboard */}
                <mesh position={[-10, 0.15, TRIM_Z + 0.45]} receiveShadow>
                    <boxGeometry args={[14, 0.3, 0.12]} />
                    <meshStandardMaterial color={trimColor} roughness={0.2} />
                </mesh>
                <mesh position={[10, 0.15, TRIM_Z + 0.45]} receiveShadow>
                    <boxGeometry args={[14, 0.3, 0.12]} />
                    <meshStandardMaterial color={trimColor} roughness={0.2} />
                </mesh>

                {/* Crown Molding */}
                <mesh position={[0, 11.85, TRIM_Z + 0.45]}>
                    <boxGeometry args={[36, 0.3, 0.15]} />
                    <meshStandardMaterial color={trimColor} roughness={0.2} />
                </mesh>
            </group>

            {/* === 5. SIDE WALLS === */}
            <mesh position={[-18, 7, 0]} receiveShadow>
                <boxGeometry args={[1, 14, 30]} />
                <meshStandardMaterial color={wallColor} roughness={0.9} />
            </mesh>
            <mesh position={[18, 7, 0]} receiveShadow>
                <boxGeometry args={[1, 14, 30]} />
                <meshStandardMaterial color={wallColor} roughness={0.9} />
            </mesh>

            {/* === 6. CEILING === */}
            <mesh position={[0, 14, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[36, 30]} />
                <meshStandardMaterial color="#F5F5F5" side={2} />
            </mesh>
        </group>
    );
}
