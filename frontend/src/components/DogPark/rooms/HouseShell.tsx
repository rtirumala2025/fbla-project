import React from 'react';
import { ContactShadows } from '@react-three/drei';

/**
 * HouseShellV2 - High-Poly Architectural Assembly
 * 
 * ARCHITECTURE SPEC:
 * - Back Wall: Z = -8 (global)
 * - Trim/Millwork: Z = -7.9 to -7.8 (forward to avoid z-fighting)
 * - Sky: Z = -12 (behind wall, uses meshBasicMaterial for glow)
 * 
 * MATERIALS ("Toll Brothers" Look):
 * - Wall Paint: Matte Grey (roughness: 0.9)
 * - Trim/Millwork: Semi-Gloss White (roughness: 0.2)
 * - Glass: Full Transmission (transmission: 0.95, roughness: 0.0)
 */

// === REUSABLE COMPONENT: Casement Window ===
function CasementWindow({ position }: { position: [number, number, number] }) {
    const trimColor = "#FFFFFF";

    return (
        <group position={position}>
            {/* THE CASING (Thick outer frame, pops out z+0.1 from wall) */}
            <mesh position={[0, 0, 0.1]}>
                <boxGeometry args={[4.5, 6.5, 0.25]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* INNER FRAME (Creates depth/reveal) */}
            <mesh position={[0, 0, 0.15]}>
                <boxGeometry args={[4, 6, 0.15]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* THE GLASS (Transparent, set inside the frame) */}
            <mesh position={[0, 0, 0.12]}>
                <planeGeometry args={[3.4, 5.4]} />
                <meshPhysicalMaterial
                    color="#E8F4FD"
                    metalness={0.0}
                    roughness={0.0}
                    transmission={0.95}
                    thickness={0.2}
                    transparent={true}
                    side={2}
                />
            </mesh>

            {/* MULLIONS (3D Grid Bars - 4 pane look) */}
            {/* Vertical Center Bar */}
            <mesh position={[0, 0, 0.18]}>
                <boxGeometry args={[0.12, 5.6, 0.08]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>
            {/* Horizontal Center Bar */}
            <mesh position={[0, 0, 0.18]}>
                <boxGeometry args={[3.6, 0.12, 0.08]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* WINDOW SILL (Bottom ledge) */}
            <mesh position={[0, -3.4, 0.2]}>
                <boxGeometry args={[4.8, 0.2, 0.4]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>
        </group>
    );
}

// === REUSABLE COMPONENT: French Door Panel ===
function DoorPanel({ position, handleSide }: { position: [number, number, number], handleSide: 'left' | 'right' }) {
    const trimColor = "#FFFFFF";
    const handleX = handleSide === 'left' ? 0.4 : -0.4;

    return (
        <group position={position}>
            {/* STILE & RAIL FRAME (Wood border around glass) */}
            {/* Outer Stile (Vertical sides) */}
            <mesh position={[-1.1, 0, 0]}>
                <boxGeometry args={[0.25, 7.5, 0.15]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>
            <mesh position={[1.1, 0, 0]}>
                <boxGeometry args={[0.25, 7.5, 0.15]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* Top Rail */}
            <mesh position={[0, 3.6, 0]}>
                <boxGeometry args={[2.45, 0.3, 0.15]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* Bottom Rail (Thicker for door look) */}
            <mesh position={[0, -3.4, 0]}>
                <boxGeometry args={[2.45, 0.7, 0.15]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* Lock Rail (Middle horizontal for authenticity) */}
            <mesh position={[0, -1.2, 0]}>
                <boxGeometry args={[2.45, 0.2, 0.15]} />
                <meshStandardMaterial color={trimColor} roughness={0.2} />
            </mesh>

            {/* GLASS PANES (Two panes per door - upper and lower) */}
            {/* Upper Pane */}
            <mesh position={[0, 1.2, 0.02]}>
                <planeGeometry args={[1.9, 4.3]} />
                <meshPhysicalMaterial
                    color="#E8F4FD"
                    metalness={0.0}
                    roughness={0.0}
                    transmission={0.95}
                    thickness={0.2}
                    transparent={true}
                    side={2}
                />
            </mesh>
            {/* Lower Pane */}
            <mesh position={[0, -2.5, 0.02]}>
                <planeGeometry args={[1.9, 1.5]} />
                <meshPhysicalMaterial
                    color="#E8F4FD"
                    metalness={0.0}
                    roughness={0.0}
                    transmission={0.95}
                    thickness={0.2}
                    transparent={true}
                    side={2}
                />
            </mesh>

            {/* DOOR HANDLE (Gold, at WAIST HEIGHT: y=-2.8 relative = ~0.9m from floor) */}
            <group position={[handleX, -2.8, 0.12]}>
                {/* Backplate */}
                <mesh>
                    <boxGeometry args={[0.15, 0.4, 0.03]} />
                    <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.1} />
                </mesh>
                {/* Lever Handle */}
                <mesh position={[0, 0, 0.06]} rotation={[0, 0, handleSide === 'left' ? 0.3 : -0.3]}>
                    <boxGeometry args={[0.35, 0.08, 0.08]} />
                    <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.1} />
                </mesh>
                {/* Knob End */}
                <mesh position={[handleSide === 'left' ? 0.18 : -0.18, 0, 0.06]}>
                    <sphereGeometry args={[0.06]} />
                    <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.1} />
                </mesh>
            </group>
        </group>
    );
}

// === MAIN COMPONENT ===
export function HouseShellV2() {
    const wallColor = "#9E9E9E"; // Matte Grey
    const trimColor = "#FFFFFF"; // Semi-Gloss White

    return (
        <group>
            {/* === 1. THE FLOOR (Honey Oak) === */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[50, 50]} />
                <meshStandardMaterial color="#C4A484" roughness={0.1} metalness={0.1} />
            </mesh>
            <ContactShadows resolution={1024} scale={30} blur={2} opacity={0.5} far={10} color="#000000" />

            {/* === 2. THE SKY (Glowing Background) === */}
            {/* Z = -12 (well behind wall), meshBasicMaterial for daylight glow */}
            <mesh position={[0, 8, -12]}>
                <planeGeometry args={[60, 40]} />
                <meshBasicMaterial color="#87CEEB" />
            </mesh>

            {/* === 3. THE BACK WALL COMPLEX (Z = -8) === */}
            <group position={[0, 0, -8]}>

                {/* --- WALL PANELS (Matte Grey, roughness: 0.9) --- */}
                {/* Left Panel (x=-10 to x=-4.5) */}
                <mesh position={[-7.25, 5, 0]} receiveShadow>
                    <boxGeometry args={[5.5, 10, 0.8]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                {/* Right Panel (x=4.5 to x=10) */}
                <mesh position={[7.25, 5, 0]} receiveShadow>
                    <boxGeometry args={[5.5, 10, 0.8]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                {/* Top Header (Full width, above all openings) */}
                <mesh position={[0, 10.5, 0]} receiveShadow>
                    <boxGeometry args={[20, 3, 0.8]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                {/* Center Pillars (Between windows and door) */}
                <mesh position={[-3.25, 5, 0]} receiveShadow>
                    <boxGeometry args={[1, 10, 0.8]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>
                <mesh position={[3.25, 5, 0]} receiveShadow>
                    <boxGeometry args={[1, 10, 0.8]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                {/* --- LEFT WINDOW (Casement Style) --- */}
                <CasementWindow position={[-7.25, 5, 0]} />

                {/* --- RIGHT WINDOW (Casement Style) --- */}
                <CasementWindow position={[7.25, 5, 0]} />

                {/* --- FRENCH DOORS (The Centerpiece) --- */}
                <group position={[0, 4.2, 0]}>
                    {/* OUTER FRAME (Heavy trim surrounding doorway) */}
                    {/* Top Transom Frame */}
                    <mesh position={[0, 4, 0.1]}>
                        <boxGeometry args={[6, 0.5, 0.3]} />
                        <meshStandardMaterial color={trimColor} roughness={0.2} />
                    </mesh>
                    {/* Left Jamb */}
                    <mesh position={[-2.85, 0, 0.1]}>
                        <boxGeometry args={[0.35, 8.5, 0.3]} />
                        <meshStandardMaterial color={trimColor} roughness={0.2} />
                    </mesh>
                    {/* Right Jamb */}
                    <mesh position={[2.85, 0, 0.1]}>
                        <boxGeometry args={[0.35, 8.5, 0.3]} />
                        <meshStandardMaterial color={trimColor} roughness={0.2} />
                    </mesh>
                    {/* Threshold (Floor level) */}
                    <mesh position={[0, -4.1, 0.15]}>
                        <boxGeometry args={[6, 0.3, 0.4]} />
                        <meshStandardMaterial color={trimColor} roughness={0.2} />
                    </mesh>

                    {/* LEFT DOOR PANEL */}
                    <DoorPanel position={[-1.35, 0, 0.15]} handleSide="right" />

                    {/* RIGHT DOOR PANEL */}
                    <DoorPanel position={[1.35, 0, 0.15]} handleSide="left" />

                    {/* CENTER ASTRAGAL (Vertical bar between doors) */}
                    <mesh position={[0, 0, 0.18]}>
                        <boxGeometry args={[0.15, 8, 0.12]} />
                        <meshStandardMaterial color={trimColor} roughness={0.2} />
                    </mesh>
                </group>

                {/* --- BASEBOARD TRIM --- */}
                <mesh position={[-7.25, 0.15, 0.45]} receiveShadow>
                    <boxGeometry args={[5.5, 0.3, 0.12]} />
                    <meshStandardMaterial color={trimColor} roughness={0.2} />
                </mesh>
                <mesh position={[7.25, 0.15, 0.45]} receiveShadow>
                    <boxGeometry args={[5.5, 0.3, 0.12]} />
                    <meshStandardMaterial color={trimColor} roughness={0.2} />
                </mesh>

                {/* --- CROWN MOLDING --- */}
                <mesh position={[0, 11.85, 0.45]}>
                    <boxGeometry args={[20, 0.3, 0.15]} />
                    <meshStandardMaterial color={trimColor} roughness={0.2} />
                </mesh>

            </group>

            {/* === 4. SIDE WALLS === */}
            <mesh position={[-12, 7, 0]} receiveShadow>
                <boxGeometry args={[1, 14, 30]} />
                <meshStandardMaterial color={wallColor} roughness={0.9} />
            </mesh>
            <mesh position={[12, 7, 0]} receiveShadow>
                <boxGeometry args={[1, 14, 30]} />
                <meshStandardMaterial color={wallColor} roughness={0.9} />
            </mesh>

            {/* === 5. CEILING === */}
            <mesh position={[0, 14, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[30, 30]} />
                <meshStandardMaterial color="#F5F5F5" side={2} />
            </mesh>

        </group>
    );
}

// Backwards compatibility export
export { HouseShellV2 as HouseShell };
