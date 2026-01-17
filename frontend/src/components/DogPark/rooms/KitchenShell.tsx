import React from 'react';
import { ContactShadows } from '@react-three/drei';

/**
 * KitchenShell - Proper Kitchen Architecture
 * 
 * CONSTRUCTION:
 * - Back Wall: Z = -4.5, built from 4 PANELS to create window hole
 * - Side Walls: Extended forward to seal the room
 * - Window: Real gap with glass inside
 * - Lighting: Ceiling light for kitchen ambiance
 */

// === COMPONENT: Kitchen Window (Inside the hole) ===
function KitchenWindowFrame({ position }: { position: [number, number, number] }) {
    const trimColor = "#FFFFFF";

    return (
        <group position={position}>
            {/* Outer Frame (sits inside the wall gap) */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[4.2, 3.7, 0.15]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* Inner Frame (creates depth) */}
            <mesh position={[0, 0, 0.08]}>
                <boxGeometry args={[3.6, 3.2, 0.1]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* Glass Pane */}
            <mesh position={[0, 0, 0.05]}>
                <planeGeometry args={[3.4, 3.0]} />
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

            {/* Mullions (Cross pattern) */}
            <mesh position={[0, 0, 0.12]}>
                <boxGeometry args={[0.08, 3.0, 0.05]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0.12]}>
                <boxGeometry args={[3.4, 0.08, 0.05]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* Window Sill (Bottom ledge) */}
            <mesh position={[0, -1.95, 0.2]}>
                <boxGeometry args={[4.5, 0.2, 0.5]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>
        </group>
    );
}

export function KitchenShell() {
    const wallColor = "#C8E6C9"; // Sage Green
    const trimColor = "#FFFFFF"; // Clean White
    const floorColor = "#F5F5F5"; // White Tile

    // Kitchen-specific Z coordinates
    const WALL_Z = -4.5;
    const WALL_THICKNESS = 0.5;

    // Window gap coordinates (x from 1 to 5, y from 3.5 to 7)
    const WIN_LEFT = 1;
    const WIN_RIGHT = 5;
    const WIN_BOTTOM = 3.5;
    const WIN_TOP = 7;
    const WIN_CENTER_X = (WIN_LEFT + WIN_RIGHT) / 2; // 3
    const WIN_CENTER_Y = (WIN_BOTTOM + WIN_TOP) / 2; // 5.25

    return (
        <group>
            {/* === 1. THE FLOOR (White Tile - Shiny) === */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[30, 20]} />
                <meshStandardMaterial color={floorColor} roughness={0.1} metalness={0.05} />
            </mesh>
            <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.5} far={10} color="#000000" />

            {/* Tile Grid Lines */}
            <gridHelper args={[30, 15, "#E0E0E0", "#E0E0E0"]} position={[0, 0.005, 0]} />

            {/* === 2. THE SKY (Behind Window Hole) === */}
            <mesh position={[WIN_CENTER_X, WIN_CENTER_Y, WALL_Z - 1]}>
                <planeGeometry args={[8, 6]} />
                <meshBasicMaterial color="#87CEEB" />
            </mesh>

            {/* === 3. THE BACK WALL (4 PANELS with Window Hole) === */}
            <group>
                {/* Panel A: LEFT MAIN WALL (x = -10 to WIN_LEFT) */}
                {/* Width = WIN_LEFT - (-10) = 11, Center = (-10 + 1) / 2 = -4.5 */}
                <mesh position={[-4.5, 4.5, WALL_Z]} receiveShadow>
                    <boxGeometry args={[11, 9, WALL_THICKNESS]} />
                    <meshStandardMaterial color={wallColor} roughness={0.95} />
                </mesh>

                {/* Panel B: RIGHT STRIP (x = WIN_RIGHT to 10) */}
                {/* Width = 10 - 5 = 5, Center = (5 + 10) / 2 = 7.5 */}
                <mesh position={[7.5, 4.5, WALL_Z]} receiveShadow>
                    <boxGeometry args={[5, 9, WALL_THICKNESS]} />
                    <meshStandardMaterial color={wallColor} roughness={0.95} />
                </mesh>

                {/* Panel C: TOP HEADER (above window, x = WIN_LEFT to WIN_RIGHT) */}
                {/* Width = 4, Height = 9 - 7 = 2, Center Y = (7 + 9) / 2 = 8 */}
                <mesh position={[WIN_CENTER_X, 8, WALL_Z]} receiveShadow>
                    <boxGeometry args={[4, 2, WALL_THICKNESS]} />
                    <meshStandardMaterial color={wallColor} roughness={0.95} />
                </mesh>

                {/* Panel D: BOTTOM SILL (below window, x = WIN_LEFT to WIN_RIGHT) */}
                {/* Width = 4, Height = 3.5, Center Y = 3.5 / 2 = 1.75 */}
                <mesh position={[WIN_CENTER_X, 1.75, WALL_Z]} receiveShadow>
                    <boxGeometry args={[4, 3.5, WALL_THICKNESS]} />
                    <meshStandardMaterial color={wallColor} roughness={0.95} />
                </mesh>

                {/* === THE WINDOW (Inside the gap) === */}
                <KitchenWindowFrame position={[WIN_CENTER_X, WIN_CENTER_Y, WALL_Z + 0.1]} />
            </group>

            {/* === 4. SIDE WALLS (Extended Forward to Seal Room) === */}
            {/* Left Wall: From z = -4.5 to z = 6 (depth = 10.5) */}
            <mesh position={[-10, 4.5, 0.75]} receiveShadow>
                <boxGeometry args={[WALL_THICKNESS, 9, 11]} />
                <meshStandardMaterial color={wallColor} roughness={0.95} />
            </mesh>
            {/* Right Wall */}
            <mesh position={[10, 4.5, 0.75]} receiveShadow>
                <boxGeometry args={[WALL_THICKNESS, 9, 11]} />
                <meshStandardMaterial color={wallColor} roughness={0.95} />
            </mesh>

            {/* === 5. BASEBOARDS === */}
            {/* Back Wall Baseboard (Left of window) */}
            <mesh position={[-4.5, 0.15, WALL_Z + 0.3]} receiveShadow>
                <boxGeometry args={[11.2, 0.3, 0.1]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>
            {/* Back Wall Baseboard (Right of window) */}
            <mesh position={[7.5, 0.15, WALL_Z + 0.3]} receiveShadow>
                <boxGeometry args={[5.2, 0.3, 0.1]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>
            {/* Left Wall Baseboard */}
            <mesh position={[-9.85, 0.15, 0.75]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <boxGeometry args={[11, 0.3, 0.1]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>
            {/* Right Wall Baseboard */}
            <mesh position={[9.85, 0.15, 0.75]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <boxGeometry args={[11, 0.3, 0.1]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* === 6. CROWN MOLDING === */}
            <mesh position={[0, 8.85, WALL_Z + 0.3]}>
                <boxGeometry args={[20.5, 0.3, 0.12]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* === 7. CEILING === */}
            <mesh position={[0, 9, 0.75]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[20, 12]} />
                <meshStandardMaterial color="#F5F5F5" side={2} />
            </mesh>

            {/* === 8. KITCHEN CEILING LIGHT === */}
            <pointLight
                position={[0, 8, -1]}
                intensity={0.8}
                color="#FFF8E1"
                distance={15}
                decay={2}
            />
            {/* Light Fixture (Visual) */}
            <mesh position={[0, 8.5, -1]}>
                <cylinderGeometry args={[0.3, 0.4, 0.15, 16]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
            </mesh>
            <mesh position={[0, 8.35, -1]}>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshBasicMaterial color="#FFFDE7" />
            </mesh>
        </group>
    );
}
