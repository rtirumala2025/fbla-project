/**
 * BathroomShell.tsx - White Tile Bathroom Environment Shell
 * 
 * A clean, bright bathroom with white tile walls and cyan/aqua floor.
 */

import React from 'react';

export function BathroomShell() {
    // Colors
    const wallColor = "#FFFFFF";      // Pure white tile
    const floorColor = "#B3E5FC";     // Distinct cyan tile (more visible)
    const ceilingColor = "#FAFAFA";   // Off-white

    // Room dimensions
    const roomWidth = 10;
    const roomDepth = 8;
    const roomHeight = 6;
    const wallThickness = 0.25;

    return (
        <group>
            {/* === FLOOR - Distinct Cyan Tile === */}
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[roomWidth, roomDepth]} />
                <meshStandardMaterial color={floorColor} roughness={0.15} metalness={0.05} />
            </mesh>

            {/* === BACK WALL - White Tile === */}
            <mesh position={[0, roomHeight / 2, -roomDepth / 2]} receiveShadow>
                <boxGeometry args={[roomWidth, roomHeight, wallThickness]} />
                <meshStandardMaterial color={wallColor} roughness={0.1} />
            </mesh>

            {/* === LEFT WALL === */}
            <mesh position={[-roomWidth / 2, roomHeight / 2, 0]} receiveShadow>
                <boxGeometry args={[wallThickness, roomHeight, roomDepth]} />
                <meshStandardMaterial color={wallColor} roughness={0.1} />
            </mesh>

            {/* === RIGHT WALL === */}
            <mesh position={[roomWidth / 2, roomHeight / 2, 0]} receiveShadow>
                <boxGeometry args={[wallThickness, roomHeight, roomDepth]} />
                <meshStandardMaterial color={wallColor} roughness={0.1} />
            </mesh>

            {/* === CEILING === */}
            <mesh position={[0, roomHeight, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[roomWidth, roomDepth]} />
                <meshStandardMaterial color={ceilingColor} roughness={0.9} />
            </mesh>

            {/* === LIGHTING - Cool White Overhead === */}
            <pointLight position={[0, roomHeight - 0.5, 0]} intensity={1.2} color="#F5FFFA" castShadow distance={15} />
            <pointLight position={[0, roomHeight - 0.5, 2]} intensity={0.6} color="#E0FFFF" />

            {/* === DECORATIVE TILE ACCENTS === */}
            {/* Horizontal tile trim line */}
            <mesh position={[0, 2, -roomDepth / 2 + 0.15]} receiveShadow>
                <boxGeometry args={[roomWidth - 0.5, 0.15, 0.05]} />
                <meshStandardMaterial color="#B2EBF2" roughness={0.2} />
            </mesh>
        </group>
    );
}

export default BathroomShell;
