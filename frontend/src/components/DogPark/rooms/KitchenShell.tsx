import React from 'react';
import { ContactShadows } from '@react-three/drei';

/**
 * KitchenShell - Proper 4-Panel Construction
 * 
 * CONSTRUCTION STRATEGY:
 * - Back Wall (Green): Built from 4 separate panels to create a physical window HOLE.
 * - Left Panel: x = -7, Width = 16
 * - Right Panel: x = 10, Width = 10
 * - Top Header: x = 3, Width = 4
 * - Bottom Apron: x = 3, Width = 4
 * - Window Hole: x=3, y=5.
 * - Sky: Blue plane visible through the window hole.
 */

// === COMPONENT: Kitchen Window Group (Sits INSIDE the hole) ===
function KitchenWindowFrame({ position }: { position: [number, number, number] }) {
    const trimColor = "#FFFFFF";

    return (
        <group position={position}>
            {/* Outer Box Frame (Lines the hole) */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[4.2, 3.2, 0.4]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* Inner Sash Frame */}
            <mesh position={[0, 0, 0.05]}>
                <boxGeometry args={[3.6, 2.6, 0.15]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* The GLASS (Transparent & Shiny) */}
            <mesh position={[0, 0, 0.05]}>
                <planeGeometry args={[3.8, 2.8]} />
                <meshPhysicalMaterial
                    color="#E3F2FD" // Very light blue tint
                    metalness={0.1}
                    roughness={0.0}
                    transmission={1.0} // Fully transparent
                    thickness={0.1}
                    transparent={true}
                    opacity={0.3} // Fallback opacity
                    side={2}
                />
            </mesh>

            {/* Mullions (Cross Bars) */}
            <mesh position={[0, 0, 0.13]}>
                <boxGeometry args={[0.08, 2.6, 0.05]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0.13]}>
                <boxGeometry args={[3.6, 0.08, 0.05]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* Window Sill (Bottom Ledge) */}
            <mesh position={[0, -1.8, 0.15]}>
                <boxGeometry args={[4.6, 0.3, 0.6]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>
        </group>
    );
}

export function KitchenShell() {
    const wallColor = "#C8E6C9"; // Sage Green
    const trimColor = "#FFFFFF"; // Clean White
    const floorColor = "#F5F5F5"; // White Tile

    // GEOMETRY CONSTANTS
    const WALL_Z = -4.5;
    const WALL_THICKNESS = 1.0; // Thick walls for depth

    // 4-PANEL CONSTRUCTION COORDINATES
    // Target Hole: x=3, y=5. Width=4, Height=3.5 (roughly)

    return (
        <group>
            {/* === 1. THE FLOOR (Shiny Tile) === */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[40, 40]} />
                <meshStandardMaterial color={floorColor} roughness={0.1} metalness={0.1} />
            </mesh>
            <ContactShadows resolution={1024} scale={30} blur={2} opacity={0.5} far={10} color="#000000" />

            {/* Tile Grid */}
            <gridHelper args={[40, 20, "#E0E0E0", "#E0E0E0"]} position={[0, 0.005, 0]} />


            {/* === 2. THE SKY (Visible Through Window) === */}
            {/* Placed at z=-10, visible through the physical hole */}
            <mesh position={[3, 5, -10]}>
                <planeGeometry args={[20, 15]} />
                <meshBasicMaterial color="#87CEEB" />
            </mesh>


            {/* === 3. THE BACK WALL (4-PANEL CONSTRUCTION) === */}
            <group>
                {/* Panel A: LEFT HUGE WALL (x=-7, Width 16) */}
                <mesh position={[-7, 5, WALL_Z]} receiveShadow>
                    <boxGeometry args={[16, 10, WALL_THICKNESS]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                {/* Panel B: RIGHT STRIP (x=10, Width 10) */}
                <mesh position={[10, 5, WALL_Z]} receiveShadow>
                    <boxGeometry args={[10, 10, WALL_THICKNESS]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                {/* Panel C: TOP HEADER (x=3, y=8.25, Width 4) */}
                <mesh position={[3, 8.25, WALL_Z]} receiveShadow>
                    <boxGeometry args={[4, 3.5, WALL_THICKNESS]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                {/* Panel D: BOTTOM APRON (x=3, y=1.75, Width 4) */}
                <mesh position={[3, 1.75, WALL_Z]} receiveShadow>
                    <boxGeometry args={[4, 3.5, WALL_THICKNESS]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                {/* === THE WINDOW (Fills the Hole) === */}
                <KitchenWindowFrame position={[3, 5, WALL_Z]} />
            </group>


            {/* === 4. SIDE WALLS (Sealed Room) === */}
            {/* Left Wall: Extended Depth to 15, Positioned at Z=0 to cover whole side */}
            <mesh position={[-15, 5, 0]} receiveShadow>
                <boxGeometry args={[WALL_THICKNESS, 10, 20]} />
                <meshStandardMaterial color={wallColor} roughness={0.9} />
            </mesh>
            {/* Right Wall */}
            <mesh position={[15, 5, 0]} receiveShadow>
                <boxGeometry args={[WALL_THICKNESS, 10, 20]} />
                <meshStandardMaterial color={wallColor} roughness={0.9} />
            </mesh>


            {/* === 5. TRIM & FINISHES === */}
            {/* Baseboards (Back Wall) */}
            <mesh position={[-7, 0.25, WALL_Z + 0.55]} receiveShadow>
                <boxGeometry args={[16, 0.5, 0.1]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>
            <mesh position={[10, 0.25, WALL_Z + 0.55]} receiveShadow>
                <boxGeometry args={[10, 0.5, 0.1]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>
            <mesh position={[3, 0.25, WALL_Z + 0.55]} receiveShadow>
                <boxGeometry args={[4, 0.5, 0.1]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* Crown Molding */}
            <mesh position={[0, 9.75, WALL_Z + 0.55]}>
                <boxGeometry args={[30, 0.5, 0.15]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>


            {/* === 6. LIGHTING === */}
            <pointLight
                position={[0, 8, -2]}
                intensity={0.9}
                color="#FFFDE7" // Warm Kitchen Light
                distance={15}
                decay={2}
                castShadow
            />
        </group>
    );
}
