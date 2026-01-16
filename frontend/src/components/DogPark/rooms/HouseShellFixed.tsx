import React from 'react';
import { ContactShadows } from '@react-three/drei';

/**
 * HouseShellFixed - High-Poly Architectural Assembly
 * 
 * ARCHITECTURE SPEC:
 * - Back Wall: Z = -8.00 (global)
 * - Trim/Millwork: Z = -7.95 (forward 5cm to avoid z-fighting)
 * - Sky: Z = -12 (behind wall)
 * - Balcony Floor: Z = -10
 * 
 * MATERIALS:
 * - Wall Paint: Matte Grey (roughness: 0.9)
 * - Trim/Millwork: Semi-Gloss White (roughness: 0.2)
 * - Glass: Full Transmission (transmission: 1.0, roughness: 0.0)
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
                    transmission={1.0}
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
                    transmission={1.0}
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
                    transmission={1.0}
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
export function HouseShellFixed() {
    const wallColor = "#9E9E9E"; // Matte Grey
    const trimColor = "#FFFFFF"; // Semi-Gloss White

    // Z-coordinates
    const WALL_Z = -8.00;
    const TRIM_Z = -7.95; // 5cm offset for Z-fighting fix

    return (
        <group>
            {/* === 1. THE FLOOR (Honey Oak) === */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[50, 50]} />
                <meshStandardMaterial color="#C4A484" roughness={0.1} metalness={0.1} />
            </mesh>
            <ContactShadows resolution={1024} scale={30} blur={2} opacity={0.5} far={10} color="#000000" />

            {/* === 2. THE BALCONY (Outdoor Floor - Dark Wood) === */}
            {/* Fixes the "Void" door issue - doors open to visible outdoor floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -12]} receiveShadow>
                <planeGeometry args={[20, 4]} />
                <meshStandardMaterial color="#4A3728" roughness={0.7} />
            </mesh>

            {/* Balcony Railing - Iron with vertical pickets */}
            <group position={[0, 0.5, -14]}>
                {/* Top Rail */}
                <mesh position={[0, 0.8, 0]}>
                    <boxGeometry args={[20, 0.08, 0.08]} />
                    <meshStandardMaterial color="#2C2C2C" metalness={0.8} roughness={0.3} />
                </mesh>
                {/* Bottom Rail */}
                <mesh position={[0, 0.1, 0]}>
                    <boxGeometry args={[20, 0.06, 0.06]} />
                    <meshStandardMaterial color="#2C2C2C" metalness={0.8} roughness={0.3} />
                </mesh>
                {/* Vertical Pickets (spaced every 1 unit) */}
                {[-9, -7, -5, -3, -1, 1, 3, 5, 7, 9].map((x) => (
                    <mesh key={x} position={[x, 0.45, 0]}>
                        <boxGeometry args={[0.05, 0.8, 0.05]} />
                        <meshStandardMaterial color="#2C2C2C" metalness={0.8} roughness={0.3} />
                    </mesh>
                ))}
                {/* Corner Posts */}
                <mesh position={[-10, 0.45, 0]}>
                    <boxGeometry args={[0.1, 1, 0.1]} />
                    <meshStandardMaterial color="#2C2C2C" metalness={0.8} roughness={0.3} />
                </mesh>
                <mesh position={[10, 0.45, 0]}>
                    <boxGeometry args={[0.1, 1, 0.1]} />
                    <meshStandardMaterial color="#2C2C2C" metalness={0.8} roughness={0.3} />
                </mesh>
            </group>

            {/* === 3. THE SKY (Glowing Background) === */}
            {/* Z = -12 (well behind wall), meshBasicMaterial for daylight glow */}
            <mesh position={[0, 8, -12]}>
                <planeGeometry args={[60, 40]} />
                <meshBasicMaterial color="#87CEEB" />
            </mesh>

            {/* === 4. THE BACK WALL COMPLEX === */}
            <group position={[0, 0, 0]}> {/* Group at origin, using absolute Z for components */}

                {/* --- WALL SEGMENTATION (Fixes Missing Windows) --- */}

                {/* 1. Far Left Panel (x = -15, width 6) - Covers corner */}
                <mesh position={[-15, 5, WALL_Z]} receiveShadow>
                    <boxGeometry args={[6, 10, 0.8]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                {/* GAP 1: Left Window (x = -12 to -7) */}

                {/* 2. Mid Left Pillar (x = -5.5, width 3) - Between window and door */}
                <mesh position={[-5.5, 5, WALL_Z]} receiveShadow>
                    <boxGeometry args={[3, 10, 0.8]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                {/* GAP 2: French Doors (x = -4 to 4) */}

                {/* 3. Mid Right Pillar (x = 5.5, width 3) - Between door and window */}
                <mesh position={[5.5, 5, WALL_Z]} receiveShadow>
                    <boxGeometry args={[3, 10, 0.8]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                {/* GAP 3: Right Window (x = 7 to 12) */}

                {/* 4. Far Right Panel (x = 15, width 6) */}
                <mesh position={[15, 5, WALL_Z]} receiveShadow>
                    <boxGeometry args={[6, 10, 0.8]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>

                {/* Top Header (Full width, above all openings) */}
                <mesh position={[0, 10.5, WALL_Z]} receiveShadow>
                    <boxGeometry args={[36, 3, 0.8]} />
                    <meshStandardMaterial color={wallColor} roughness={0.9} />
                </mesh>


                {/* --- TRIM & MILLWORK (Applied at TRIM_Z = -7.95) --- */}

                {/* --- LEFT WINDOW (Center of Gap 1: x = -9.5) --- */}
                {/* Gap 1 is -12 to -7. Center is -9.5 */}
                <CasementWindow position={[-9.5, 5, TRIM_Z]} />

                {/* --- RIGHT WINDOW (Center of Gap 3: x = 9.5) --- */}
                {/* Gap 3 is 7 to 12. Center is 9.5 */}
                <CasementWindow position={[9.5, 5, TRIM_Z]} />

                {/* --- FRENCH DOORS (Center of Gap 2: x = 0) --- */}
                <group position={[0, 4.2, TRIM_Z]}>
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
                {/* Must be broken up to not cross door opening */}
                {/* Left side */}
                <mesh position={[-10, 0.15, TRIM_Z + 0.45]} receiveShadow>
                    {/* Width approx covering Left Panel + Gap 1 + Mid Left Pillar */}
                    {/* x=-15 to x=-4. Gap starts at -4. Length = 11? */}
                    {/* Let's just place generic long pieces for now, user didn't specify segmenting baseboards but logical to stop at door */}
                    <boxGeometry args={[14, 0.3, 0.12]} />
                    <meshStandardMaterial color={trimColor} roughness={0.2} />
                </mesh>
                {/* Right side */}
                <mesh position={[10, 0.15, TRIM_Z + 0.45]} receiveShadow>
                    <boxGeometry args={[14, 0.3, 0.12]} />
                    <meshStandardMaterial color={trimColor} roughness={0.2} />
                </mesh>

                {/* --- CROWN MOLDING --- */}
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
