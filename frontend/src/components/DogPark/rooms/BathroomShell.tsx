/**
 * BathroomShell.tsx - Grounded Bathroom Environment
 * 
 * Features: Infinite foundation, thick solid walls, seamless sky/floor horizon
 */

import React from 'react';

export function BathroomShell() {
    // Colors
    const wallColor = "#FFFFFF";      // Pure white tile
    const floorColor = "#B3E5FC";     // Distinct cyan tile
    const ceilingColor = "#FAFAFA";   // Off-white
    const worldBaseColor = "#E8E8E8"; // Soft grey ground beneath
    const skyColor = "#E0F7FA";       // Matches floor for seamless horizon

    // Room dimensions
    const roomWidth = 12;
    const roomDepth = 10;
    const roomHeight = 7;
    const wallThickness = 1;

    return (
        <group>
            {/* === BACKGROUND COLOR (Sky/Atmosphere) === */}
            <color attach="background" args={[skyColor]} />

            {/* === FOG (Softens distant edges into background) === */}
            <fog attach="fog" args={[skyColor, 15, 35]} />

            {/* === INFINITE FOUNDATION (World Base) === */}
            <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color={worldBaseColor} roughness={1} />
            </mesh>

            {/* === FLOOR - Distinct Cyan Tile === */}
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[roomWidth, roomDepth]} />
                <meshStandardMaterial color={floorColor} roughness={0.15} metalness={0.05} />
            </mesh>

            {/* === BACK WALL - THICK SOLID === */}
            <mesh position={[0, roomHeight / 2, -roomDepth / 2 - wallThickness / 2]} receiveShadow castShadow>
                <boxGeometry args={[roomWidth + wallThickness * 2, roomHeight, wallThickness]} />
                <meshStandardMaterial color={wallColor} roughness={0.1} />
            </mesh>

            {/* === LEFT WALL - THICK SOLID === */}
            <mesh position={[-roomWidth / 2 - wallThickness / 2, roomHeight / 2, 0]} receiveShadow castShadow>
                <boxGeometry args={[wallThickness, roomHeight, roomDepth]} />
                <meshStandardMaterial color={wallColor} roughness={0.1} />
            </mesh>

            {/* === RIGHT WALL - THICK SOLID === */}
            <mesh position={[roomWidth / 2 + wallThickness / 2, roomHeight / 2, 0]} receiveShadow castShadow>
                <boxGeometry args={[wallThickness, roomHeight, roomDepth]} />
                <meshStandardMaterial color={wallColor} roughness={0.1} />
            </mesh>

            {/* === CEILING === */}
            <mesh position={[0, roomHeight, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[roomWidth, roomDepth]} />
                <meshStandardMaterial color={ceilingColor} roughness={0.9} />
            </mesh>

            {/* === LIGHTING - Cool White Overhead === */}
            <pointLight position={[0, roomHeight - 0.5, 0]} intensity={1.2} color="#F5FFFA" castShadow distance={20} />
            <pointLight position={[0, roomHeight - 0.5, 2]} intensity={0.6} color="#E0FFFF" />

            {/* === DECORATIVE TILE TRIM (Horizontal Accent Line) === */}
            <mesh position={[0, 2, -roomDepth / 2 + 0.1]} receiveShadow>
                <boxGeometry args={[roomWidth - 0.5, 0.15, 0.05]} />
                <meshStandardMaterial color="#80DEEA" roughness={0.2} />
            </mesh>

            {/* === BASEBOARD (Floor-Wall Transition) === */}
            <mesh position={[0, 0.1, -roomDepth / 2 + 0.1]} receiveShadow>
                <boxGeometry args={[roomWidth, 0.2, 0.1]} />
                <meshStandardMaterial color="#ECEFF1" roughness={0.3} />
            </mesh>
            <mesh position={[-roomWidth / 2 + 0.1, 0.1, 0]} receiveShadow>
                <boxGeometry args={[0.1, 0.2, roomDepth]} />
                <meshStandardMaterial color="#ECEFF1" roughness={0.3} />
            </mesh>
            <mesh position={[roomWidth / 2 - 0.1, 0.1, 0]} receiveShadow>
                <boxGeometry args={[0.1, 0.2, roomDepth]} />
                <meshStandardMaterial color="#ECEFF1" roughness={0.3} />
            </mesh>
        </group>
    );
}

export default BathroomShell;
