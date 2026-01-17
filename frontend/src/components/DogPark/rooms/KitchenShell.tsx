import React from 'react';
import { ContactShadows } from '@react-three/drei';

/**
 * KitchenShell - Fixed 4-Panel Construction
 * 
 * CONSTRUCTION STRATEGY (User Mandated):
 * - Wall Z = -4.5
 * - Left Panel: x=-6, w=14 => Range [-13, 1]
 * - Right Panel: x=8, w=6 => Range [5, 11]
 * - Top Panel: x=3, y=8.5, h=3 => Range y[7, 10]
 * - Bottom Panel: x=3, y=1.5, h=3 => Range y[0, 3]
 * - Resulting Hole: x[1, 5], y[3, 7] => Center (3, 5), Size 4x4.
 */

export function KitchenShell() {
    const wallColor = "#C8E6C9"; // Sage Green
    const trimColor = "#FFFFFF"; // Baseboards
    const floorColor = "#F5F5F5"; // Tiles

    return (
        <group>
            {/* === 1. FLOOR === */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[40, 40]} />
                <meshStandardMaterial color={floorColor} roughness={0.1} metalness={0.1} />
            </mesh>
            <ContactShadows resolution={1024} scale={30} blur={2} opacity={0.5} far={10} color="#000000" />

            {/* Tile Grid */}
            <gridHelper args={[40, 20, "#E0E0E0", "#E0E0E0"]} position={[0, 0.005, 0]} />


            {/* === 2. BACK WALL (4-PIECE PUZZLE) === */}
            <group>
                {/* 1. Left Wall Panel (Huge Green Wall) */}
                <mesh position={[-6, 5, -4.5]} receiveShadow>
                    <boxGeometry args={[14, 10, 1]} />
                    <meshStandardMaterial color={wallColor} />
                </mesh>

                {/* 2. Right Wall Panel (Narrow Green Wall) */}
                <mesh position={[8, 5, -4.5]} receiveShadow>
                    <boxGeometry args={[6, 10, 1]} />
                    <meshStandardMaterial color={wallColor} />
                </mesh>

                {/* 3. Top Header (Strip above window) */}
                <mesh position={[3, 8.5, -4.5]} receiveShadow>
                    <boxGeometry args={[4, 3, 1]} />
                    <meshStandardMaterial color={wallColor} />
                </mesh>

                {/* 4. Bottom Apron (Strip below window) */}
                <mesh position={[3, 1.5, -4.5]} receiveShadow>
                    <boxGeometry args={[4, 3, 1]} />
                    <meshStandardMaterial color={wallColor} />
                </mesh>
            </group>


            {/* === 3. THE WINDOW (Transparency Fix) === */}
            <group position={[3, 5, -4.5]}>
                {/* Glass Pane */}
                <mesh>
                    <planeGeometry args={[3.8, 3.8]} />
                    <meshPhysicalMaterial
                        transparent
                        opacity={0.3}
                        transmission={0.9}
                        roughness={0}
                        color="#E3F2FD"
                    />
                </mesh>

                {/* Simple Frame */}
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[4.0, 4.0, 0.4]} />
                    <meshStandardMaterial color="#FFFFFF" wireframe={false} />
                    {/* Note: Box overlaps edges to seal gap */}
                    {/* Actually, let's make it a frame shape if we can, or just thin strips */}
                </mesh>
                {/* Re-doing frame as 4 strips to avoid blocking glass */}
                <mesh position={[-1.9, 0, 0.1]}> <boxGeometry args={[0.2, 4, 0.2]} /> <meshStandardMaterial color="#FFF" /> </mesh>
                <mesh position={[1.9, 0, 0.1]}> <boxGeometry args={[0.2, 4, 0.2]} /> <meshStandardMaterial color="#FFF" /> </mesh>
                <mesh position={[0, 1.9, 0.1]}> <boxGeometry args={[4, 0.2, 0.2]} /> <meshStandardMaterial color="#FFF" /> </mesh>
                <mesh position={[0, -1.9, 0.1]}> <boxGeometry args={[4, 0.2, 0.2]} /> <meshStandardMaterial color="#FFF" /> </mesh>
            </group>


            {/* === 4. THE VIEW (Backyard) === */}
            <group>
                {/* Sky Plane (Far Back) */}
                <mesh position={[0, 5, -15]}>
                    <planeGeometry args={[50, 30]} />
                    <meshBasicMaterial color="#87CEEB" />
                </mesh>

                {/* Ground/Grass Plane (Outside) */}
                <mesh position={[0, 0, -10]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[50, 20]} />
                    <meshBasicMaterial color="#4CAF50" />
                </mesh>
            </group>


            {/* === 5. SIDE WALLS (Sealing the Room) === */}
            {/* Left Wall */}
            <mesh position={[-13.5, 5, 0]} receiveShadow>
                <boxGeometry args={[1, 10, 20]} />
                <meshStandardMaterial color={wallColor} />
            </mesh>
            {/* Right Wall */}
            <mesh position={[11.5, 5, 0]} receiveShadow>
                <boxGeometry args={[1, 10, 20]} />
                <meshStandardMaterial color={wallColor} />
            </mesh>

            {/* === 6. TRIM (Baseboards) === */}
            <mesh position={[-6, 0.25, -4]}> <boxGeometry args={[14, 0.5, 0.1]} /> <meshStandardMaterial color={trimColor} /> </mesh>
            <mesh position={[8, 0.25, -4]}> <boxGeometry args={[6, 0.5, 0.1]} /> <meshStandardMaterial color={trimColor} /> </mesh>
            <mesh position={[3, 0.25, -4]}> <boxGeometry args={[4, 0.5, 0.1]} /> <meshStandardMaterial color={trimColor} /> </mesh>

            {/* Light */}
            <pointLight position={[0, 8, -2]} intensity={0.8} />
        </group>
    );
}
