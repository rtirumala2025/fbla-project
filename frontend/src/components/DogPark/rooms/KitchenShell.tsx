import React from 'react';
import { ContactShadows } from '@react-three/drei';

/**
 * KitchenShell - Proper 4-Panel Construction
 * 
 * CONSTRUCTION STRATEGY:
 * - Back Wall (Green): Built from 4 separate panels to create a physical window HOLE.
 * - Window Hole: Located at x=3, y=5.
 * - Left Wall: Extended depth to seal the camera view.
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
                <planeGeometry args={[3.4, 2.4]} />
                <meshPhysicalMaterial
                    color="#E3F2FD" // Very light blue tint
                    metalness={0.1}
                    roughness={0.0}
                    transmission={0.95} // High transparency
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
    const WALL_THICKNESS = 0.5;

    // WINDOW HOLE COORDINATES
    // Target Center: x=3, y=5
    // Target Size: Width 4, Height 3
    // Holes Edges: Left=1, Right=5, Bottom=3.5, Top=6.5

    // PANEL A: LEFT HUGE WALL (From -10 to 1)
    // Width = 11, Center X = -4.5
    const PANEL_A_WIDTH = 11;
    const PANEL_A_X = -4.5;

    // PANEL B: RIGHT STRIP (From 5 to 10)
    // Width = 5, Center X = 7.5
    const PANEL_B_WIDTH = 5;
    const PANEL_B_X = 7.5;

    // PANEL C: TOP HEADER (From 1 to 5, Above y=6.5)
    // Height = 10 - 6.5 = 3.5. Center Y = 8.25
    const PANEL_C_HEIGHT = 3.5;
    const PANEL_C_Y = 8.25;

    // PANEL D: BOTTOM APRON (From 1 to 5, Below y=3.5)
    // Height = 3.5. Center Y = 1.75
    const PANEL_D_HEIGHT = 3.5;
    const PANEL_D_Y = 1.75;


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
                {/* Panel A: Left Huge Wall */}
                <mesh position={[PANEL_A_X, 5, WALL_Z]} receiveShadow>
                    <boxGeometry args={[PANEL_A_WIDTH, 10, WALL_THICKNESS]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                {/* Panel B: Right Strip */}
                <mesh position={[PANEL_B_X, 5, WALL_Z]} receiveShadow>
                    <boxGeometry args={[PANEL_B_WIDTH, 10, WALL_THICKNESS]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                {/* Panel C: Top Header */}
                <mesh position={[3, PANEL_C_Y, WALL_Z]} receiveShadow>
                    <boxGeometry args={[4, PANEL_C_HEIGHT, WALL_THICKNESS]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                {/* Panel D: Bottom Apron */}
                <mesh position={[3, PANEL_D_Y, WALL_Z]} receiveShadow>
                    <boxGeometry args={[4, PANEL_D_HEIGHT, WALL_THICKNESS]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                {/* === THE WINDOW (Fills the Hole) === */}
                <KitchenWindowFrame position={[3, 5, WALL_Z]} />
            </group>


            {/* === 4. SIDE WALLS (Sealed Room) === */}
            {/* Left Wall: Extended Depth to 15, Positioned at Z=0 to cover whole side */}
            <mesh position={[-10, 5, 0]} receiveShadow>
                <boxGeometry args={[WALL_THICKNESS, 10, 15]} />
                <meshStandardMaterial color={wallColor} roughness={0.9} />
            </mesh>
            {/* Right Wall */}
            <mesh position={[10, 5, 0]} receiveShadow>
                <boxGeometry args={[WALL_THICKNESS, 10, 15]} />
                <meshStandardMaterial color={wallColor} roughness={0.9} />
            </mesh>


            {/* === 5. TRIM & FINISHES === */}
            {/* Baseboards (Back Wall) */}
            <mesh position={[-4.5, 0.25, WALL_Z + 0.3]} receiveShadow>
                <boxGeometry args={[11, 0.5, 0.1]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>
            <mesh position={[7.5, 0.25, WALL_Z + 0.3]} receiveShadow>
                <boxGeometry args={[5, 0.5, 0.1]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>
            <mesh position={[3, 0.25, WALL_Z + 0.3]} receiveShadow>
                <boxGeometry args={[4, 0.5, 0.1]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* Baseboards (Side Walls) */}
            <mesh position={[-9.7, 0.25, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <boxGeometry args={[15, 0.5, 0.1]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>
            <mesh position={[9.7, 0.25, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <boxGeometry args={[15, 0.5, 0.1]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* Crown Molding */}
            <mesh position={[0, 9.75, WALL_Z + 0.3]}>
                <boxGeometry args={[21, 0.5, 0.15]} />
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

