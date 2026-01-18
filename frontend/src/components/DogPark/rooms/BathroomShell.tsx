/**
 * BathroomShell.tsx - Grounded Bathroom Environment
 * 
 * Features: Infinite foundation, thick solid walls, seamless sky/floor horizon
 */

import React from 'react';

export function BathroomShell() {
    // Colors - INFINITY CYCLORAMA (All cyan = #E0F7FA)
    const INFINITY_COLOR = "#E0F7FA"; // ONE color for everything
    const wallColor = "#FFFFFF";      // Pure white tile
    const ceilingColor = "#FAFAFA";   // Off-white

    // Room dimensions
    const roomWidth = 12;
    const roomDepth = 10;
    const roomHeight = 7;
    const wallThickness = 1;

    return (
        <group>
            {/* === BACKGROUND COLOR (Infinity) === */}
            <color attach="background" args={[INFINITY_COLOR]} />

            {/* === FOG (Hides the seam - medium range) === */}
            <fog attach="fog" args={[INFINITY_COLOR, 10, 30]} />

            {/* === INFINITE FOUNDATION (UNLIT - matches background exactly) === */}
            <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[200, 200]} />
                <meshBasicMaterial color={INFINITY_COLOR} />
            </mesh>

            {/* === ROOM FLOOR (Same color for seamless blend) === */}
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[roomWidth, roomDepth]} />
                <meshStandardMaterial color={INFINITY_COLOR} roughness={0.15} metalness={0.05} />
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

            {/* === CEILING (Large to hide gaps) === */}
            <mesh position={[0, roomHeight, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[20, 20]} />
                <meshStandardMaterial color={ceilingColor} roughness={0.9} />
            </mesh>

            {/* === LIGHTING - Soft Ambient + Cool Overhead === */}
            <ambientLight intensity={0.8} color="#FFFFFF" />
            <pointLight position={[0, roomHeight - 0.5, 0]} intensity={1.0} color="#F5FFFA" castShadow distance={20} />
            <pointLight position={[0, roomHeight - 0.5, 2]} intensity={0.5} color="#E0FFFF" />

            {/* === DECORATIVE TILE TRIM (Horizontal Accent Line) === */}
            <mesh position={[0, 2, -roomDepth / 2 + 0.1]} receiveShadow>
                <boxGeometry args={[roomWidth - 0.5, 0.15, 0.05]} />
                <meshStandardMaterial color="#80DEEA" roughness={0.2} />
            </mesh>

            {/* === BASEBOARD (Floor-Wall Transition) - Thick & Visible === */}
            <mesh position={[0, 0.2, -roomDepth / 2 + 0.15]} receiveShadow castShadow>
                <boxGeometry args={[roomWidth, 0.4, 0.15]} />
                <meshStandardMaterial color="#ECEFF1" roughness={0.3} />
            </mesh>
            <mesh position={[-roomWidth / 2 + 0.15, 0.2, 0]} receiveShadow castShadow>
                <boxGeometry args={[0.15, 0.4, roomDepth]} />
                <meshStandardMaterial color="#ECEFF1" roughness={0.3} />
            </mesh>
            <mesh position={[roomWidth / 2 - 0.15, 0.2, 0]} receiveShadow castShadow>
                <boxGeometry args={[0.15, 0.4, roomDepth]} />
                <meshStandardMaterial color="#ECEFF1" roughness={0.3} />
            </mesh>
        </group>
    );
}

export default BathroomShell;
