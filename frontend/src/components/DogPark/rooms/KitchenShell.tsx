import React from 'react';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

/**
 * KitchenShell - GEOMETRY LOCKED
 * 
 * MATERIAL OVERRIDE:
 * - Wall Color: #FAFAFA (Off-White) - FORCED
 * - Roughness: 0.8 (Matte Plaster)
 * - NO SAGE GREEN ALLOWED
 */

export function KitchenShell() {
    // === MATERIAL OVERRIDE: FORCED COLORS ===
    const wallColor = "#FAFAFA"; // OFF-WHITE (NOT SAGE GREEN)
    const trimColor = "#FFFFFF";
    const floorColor = "#F5F5F5";
    const woodColor = "#8D6E63";

    return (
        <group>
            {/* === 1. FLOOR === */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[20, 20]} />
                <meshStandardMaterial color={floorColor} roughness={0.3} metalness={0.05} />
            </mesh>
            <ContactShadows resolution={1024} scale={15} blur={2} opacity={0.5} far={10} color="#000000" />

            {/* Tile Grid */}
            <gridHelper args={[20, 10, "#E0E0E0", "#E0E0E0"]} position={[0, 0.005, 0]} />


            {/* === 2. BACK WALL (4-PIECE PUZZLE for Window Gap) === */}
            <group>
                {/* 1. Left Wall Panel - FORCED WHITE */}
                <mesh position={[-3.5, 5, -4.5]} receiveShadow>
                    <boxGeometry args={[3, 10, 0.5]} />
                    <meshStandardMaterial color={wallColor} roughness={0.8} />
                </mesh>

                {/* 2. Right Wall Panel - FORCED WHITE */}
                <mesh position={[3.5, 5, -4.5]} receiveShadow>
                    <boxGeometry args={[3, 10, 0.5]} />
                    <meshStandardMaterial color={wallColor} roughness={0.8} />
                </mesh>

                {/* 3. Top Header - FORCED WHITE */}
                <mesh position={[0, 8.5, -4.5]} receiveShadow>
                    <boxGeometry args={[4, 3, 0.5]} />
                    <meshStandardMaterial color={wallColor} roughness={0.8} />
                </mesh>

                {/* 4. Bottom Apron - FORCED WHITE */}
                <mesh position={[0, 1.5, -4.5]} receiveShadow>
                    <boxGeometry args={[4, 3, 0.5]} />
                    <meshStandardMaterial color={wallColor} roughness={0.8} />
                </mesh>
            </group>


            {/* === 3. THE WINDOW === */}
            <group position={[0, 5, -4.5]}>
                {/* Glass Pane */}
                <mesh position={[0, 0, 0.3]}>
                    <planeGeometry args={[3.8, 3.8]} />
                    <meshBasicMaterial
                        color="#AEC6CF"
                        transparent
                        opacity={0.3}
                        side={THREE.DoubleSide}
                    />
                </mesh>

                {/* Window Frame */}
                <mesh position={[-1.9, 0, 0.35]}> <boxGeometry args={[0.15, 4, 0.15]} /> <meshStandardMaterial color="#FFF" /> </mesh>
                <mesh position={[1.9, 0, 0.35]}> <boxGeometry args={[0.15, 4, 0.15]} /> <meshStandardMaterial color="#FFF" /> </mesh>
                <mesh position={[0, 1.9, 0.35]}> <boxGeometry args={[4, 0.15, 0.15]} /> <meshStandardMaterial color="#FFF" /> </mesh>
                <mesh position={[0, -1.9, 0.35]}> <boxGeometry args={[4, 0.15, 0.15]} /> <meshStandardMaterial color="#FFF" /> </mesh>

                {/* Cross Muntins */}
                <mesh position={[0, 0, 0.35]}> <boxGeometry args={[0.08, 3.8, 0.08]} /> <meshStandardMaterial color="#FFF" /> </mesh>
                <mesh position={[0, 0, 0.35]}> <boxGeometry args={[3.8, 0.08, 0.08]} /> <meshStandardMaterial color="#FFF" /> </mesh>

                {/* Window Sill */}
                <mesh position={[0, -2.1, 0.6]} castShadow>
                    <boxGeometry args={[4.2, 0.15, 0.6]} />
                    <meshStandardMaterial color={woodColor} roughness={0.7} />
                </mesh>
            </group>


            {/* === 4. THE VIEW (Backyard) === */}
            <group>
                {/* Sky */}
                <mesh position={[0, 6, -15]}>
                    <planeGeometry args={[40, 25]} />
                    <meshBasicMaterial color="#87CEEB" />
                </mesh>

                {/* Clouds */}
                <mesh position={[-5, 10, -14]}>
                    <planeGeometry args={[6, 2]} />
                    <meshBasicMaterial color="#FFFFFF" transparent opacity={0.7} />
                </mesh>
                <mesh position={[6, 9, -14.5]}>
                    <planeGeometry args={[5, 1.5]} />
                    <meshBasicMaterial color="#FFFFFF" transparent opacity={0.6} />
                </mesh>

                {/* Grass */}
                <mesh position={[0, -0.3, -10]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[40, 12]} />
                    <meshBasicMaterial color="#4CAF50" />
                </mesh>

                {/* Trees */}
                <mesh position={[-4, 2, -12]}>
                    <sphereGeometry args={[1.5, 8, 8]} />
                    <meshBasicMaterial color="#2E7D32" />
                </mesh>
                <mesh position={[5, 2.5, -13]}>
                    <sphereGeometry args={[2, 8, 8]} />
                    <meshBasicMaterial color="#388E3C" />
                </mesh>
            </group>


            {/* === 5. SIDE WALLS - FORCED WHITE === */}
            <mesh position={[-5.25, 5, 0]} receiveShadow>
                <boxGeometry args={[0.5, 10, 15]} />
                <meshStandardMaterial color={wallColor} roughness={0.8} />
            </mesh>
            <mesh position={[5.25, 5, 0]} receiveShadow>
                <boxGeometry args={[0.5, 10, 15]} />
                <meshStandardMaterial color={wallColor} roughness={0.8} />
            </mesh>

            {/* === 6. TRIM === */}
            <mesh position={[-3.5, 0.15, -4.2]}> <boxGeometry args={[3, 0.3, 0.1]} /> <meshStandardMaterial color={trimColor} /> </mesh>
            <mesh position={[3.5, 0.15, -4.2]}> <boxGeometry args={[3, 0.3, 0.1]} /> <meshStandardMaterial color={trimColor} /> </mesh>
            <mesh position={[0, 0.15, -4.2]}> <boxGeometry args={[4, 0.3, 0.1]} /> <meshStandardMaterial color={trimColor} /> </mesh>
            <mesh position={[-5, 0.15, 0]} rotation={[0, Math.PI / 2, 0]}> <boxGeometry args={[15, 0.3, 0.1]} /> <meshStandardMaterial color={trimColor} /> </mesh>
            <mesh position={[5, 0.15, 0]} rotation={[0, Math.PI / 2, 0]}> <boxGeometry args={[15, 0.3, 0.1]} /> <meshStandardMaterial color={trimColor} /> </mesh>

            {/* === 7. CEILING === */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 10, 0]} receiveShadow>
                <planeGeometry args={[20, 20]} />
                <meshStandardMaterial color="#FFFFFF" roughness={1} side={THREE.DoubleSide} />
            </mesh>

            {/* === 8. CEILING LIGHT FIXTURE === */}
            <group position={[0, 9.8, -2]}>
                {/* Light Fixture Base (Dome) */}
                <mesh castShadow>
                    <sphereGeometry args={[0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
                </mesh>
                {/* Light Fixture Rim */}
                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[0.4, 0.4, 0.05, 24]} />
                    <meshStandardMaterial color="#CFD8DC" metalness={0.8} roughness={0.2} />
                </mesh>
                {/* Warm Kitchen Dome Light */}
                <pointLight position={[0, -0.3, 0]} intensity={0.8} color="#FFF9C4" />
            </group>

            {/* Additional Ambient Lights */}
            <pointLight position={[0, 8, -2]} intensity={0.5} />
            <pointLight position={[-3, 6, 0]} intensity={0.3} />
        </group>
    );
}
