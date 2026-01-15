import React from 'react';
import { ContactShadows } from '@react-three/drei';

/**
 * HouseShellV2 - French Doors Edition
 * 
 * GEOMETRY RULES ENFORCED:
 * - Back Wall Z: -6.0 (5+ meters behind furniture at z=0)
 * - Sky Plane Z: -10.0 (behind the wall)
 * - Composite Wall: 4 separate Box geometries with gap for doors/windows
 * - No boolean subtraction
 */
export function HouseShellV2() {
    // --- MATERIALS ---
    const wallColor = "#B0B0A5"; // Revere Pewter
    const trimColor = "#FFFFFF"; // Crisp White

    return (
        <group>
            {/* === 1. THE FLOOR (Honey Oak) === */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[50, 50]} />
                <meshStandardMaterial color="#C4A484" roughness={0.1} metalness={0.1} />
            </mesh>

            {/* Grounding Shadows */}
            <ContactShadows resolution={1024} scale={30} blur={2} opacity={0.5} far={10} color="#000000" />

            {/* === 2. THE BACK WALL COMPLEX === */}
            {/* CRITICAL: Positioned at Z = -6.0 (BEHIND all furniture) */}
            <group position={[0, 0, -6]}>

                {/* --- A. COMPOSITE WALL PANELS (4 Box Geometries with Gap) --- */}

                {/* LEFT PANEL: From x=-15 to x=-4 (width=11, centered at x=-9.5) */}
                <mesh position={[-9.5, 6, 0]} receiveShadow>
                    <boxGeometry args={[11, 12, 1]} />
                    <meshStandardMaterial color={wallColor} roughness={0.8} />
                </mesh>

                {/* RIGHT PANEL: From x=4 to x=15 (width=11, centered at x=9.5) */}
                <mesh position={[9.5, 6, 0]} receiveShadow>
                    <boxGeometry args={[11, 12, 1]} />
                    <meshStandardMaterial color={wallColor} roughness={0.8} />
                </mesh>

                {/* TOP HEADER: Spans full width above the door opening (y=10 to y=14) */}
                <mesh position={[0, 11, 0]} receiveShadow>
                    <boxGeometry args={[30, 4, 1]} />
                    <meshStandardMaterial color={wallColor} roughness={0.8} />
                </mesh>

                {/* BOTTOM SILL: Under the door (y=0 to y=0.5) */}
                <mesh position={[0, 0.25, 0]} receiveShadow>
                    <boxGeometry args={[8, 0.5, 1]} />
                    <meshStandardMaterial color={wallColor} roughness={0.8} />
                </mesh>

                {/* --- B. THE FRENCH DOORS (In the Gap) --- */}
                {/* Door Frame (White Trim) */}
                <group position={[0, 5, 0.3]}>
                    {/* Outer Frame */}
                    <mesh>
                        <boxGeometry args={[8.5, 9.5, 0.3]} />
                        <meshStandardMaterial color={trimColor} roughness={0.2} />
                    </mesh>

                    {/* Left Glass Pane */}
                    <mesh position={[-2, 0, 0.1]}>
                        <boxGeometry args={[3.5, 8.5, 0.1]} />
                        <meshPhysicalMaterial
                            color="#E3F2FD"
                            metalness={0.1}
                            roughness={0.0}
                            transmission={0.9}
                            thickness={0.5}
                        />
                    </mesh>

                    {/* Right Glass Pane */}
                    <mesh position={[2, 0, 0.1]}>
                        <boxGeometry args={[3.5, 8.5, 0.1]} />
                        <meshPhysicalMaterial
                            color="#E3F2FD"
                            metalness={0.1}
                            roughness={0.0}
                            transmission={0.9}
                            thickness={0.5}
                        />
                    </mesh>

                    {/* Center Divider */}
                    <mesh position={[0, 0, 0.15]}>
                        <boxGeometry args={[0.3, 9, 0.2]} />
                        <meshStandardMaterial color={trimColor} roughness={0.2} />
                    </mesh>

                    {/* Door Handles */}
                    <mesh position={[-0.5, 0, 0.3]}>
                        <sphereGeometry args={[0.12]} />
                        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
                    </mesh>
                    <mesh position={[0.5, 0, 0.3]}>
                        <sphereGeometry args={[0.12]} />
                        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
                    </mesh>
                </group>

                {/* --- C. WAINSCOTING (White Trim on Side Walls) --- */}
                <mesh position={[-9.5, 2, 0.55]} receiveShadow>
                    <boxGeometry args={[11, 4, 0.15]} />
                    <meshStandardMaterial color={trimColor} roughness={0.2} />
                </mesh>
                <mesh position={[9.5, 2, 0.55]} receiveShadow>
                    <boxGeometry args={[11, 4, 0.15]} />
                    <meshStandardMaterial color={trimColor} roughness={0.2} />
                </mesh>

            </group>

            {/* === 3. THE SKY (Behind Everything) === */}
            {/* CRITICAL: Positioned at Z = -10.0 */}
            <mesh position={[0, 8, -10]}>
                <planeGeometry args={[60, 40]} />
                <meshBasicMaterial color="#87CEEB" />
            </mesh>

            {/* === 4. SIDE WALLS (Enclosing the Room) === */}
            {/* Left Wall */}
            <mesh position={[-12, 7, 0]} receiveShadow>
                <boxGeometry args={[1, 14, 30]} />
                <meshStandardMaterial color={wallColor} roughness={0.8} />
            </mesh>

            {/* Right Wall */}
            <mesh position={[12, 7, 0]} receiveShadow>
                <boxGeometry args={[1, 14, 30]} />
                <meshStandardMaterial color={wallColor} roughness={0.8} />
            </mesh>

            {/* === 5. THE CEILING === */}
            <mesh position={[0, 14, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[30, 30]} />
                <meshStandardMaterial color="#F5F5F5" side={2} />
            </mesh>

        </group>
    );
}

// Keep old export for backwards compatibility
export { HouseShellV2 as HouseShell };
