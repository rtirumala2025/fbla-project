import React from 'react';
import { ContactShadows } from '@react-three/drei';

export function HouseShell() {
    return (
        <group>
            {/* --- 1. THE FLOOR (Honey Oak) --- */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                {/* Make floor huge (50x50) to prevent running out of floor */}
                <planeGeometry args={[50, 50]} />
                <meshStandardMaterial
                    color="#C4A484"
                    roughness={0.1}
                    metalness={0.1}
                />
            </mesh>

            {/* Grounding Shadows */}
            <ContactShadows resolution={1024} scale={30} blur={2} opacity={0.5} far={10} color="#000000" />

            {/* --- 2. THE WALLS (Solid Construction) --- */}
            {/* Wall Settings: Height=14 (Tall), Thickness=1 (Solid) */}

            {/* A. BACK WALL (The Canvas) */}
            <group position={[0, 7, -5.5]}>
                {/* Main Wall Paint (Revere Pewter) */}
                <mesh receiveShadow>
                    {/* Width 30 (Wide enough to cover corners) */}
                    <boxGeometry args={[30, 14, 1]} />
                    <meshStandardMaterial color="#B0B0A5" roughness={0.8} />
                </mesh>

                {/* Wainscoting (Thick White Trim) */}
                <mesh position={[0, -4.5, 0.6]} receiveShadow>
                    {/* Height 5 (Tall luxury trim), Depth 0.2 (Pops out) */}
                    <boxGeometry args={[30, 5, 0.2]} />
                    <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
                </mesh>

                {/* Crown Molding (Top Trim) */}
                <mesh position={[0, 6.5, 0.6]}>
                    <boxGeometry args={[30, 1, 0.2]} />
                    <meshStandardMaterial color="#FFFFFF" />
                </mesh>
            </group>

            {/* B. SIDE WALLS (Enclosing the Room) */}
            {/* Left Wall */}
            <mesh position={[-12, 7, 0]} receiveShadow>
                {/* Thick solid block to block light leaks */}
                <boxGeometry args={[1, 14, 30]} />
                <meshStandardMaterial color="#B0B0A5" />
            </mesh>

            {/* Right Wall */}
            <mesh position={[12, 7, 0]} receiveShadow>
                <boxGeometry args={[1, 14, 30]} />
                <meshStandardMaterial color="#B0B0A5" />
            </mesh>

            {/* --- 3. THE CEILING (Seals the Box) --- */}
            <mesh position={[0, 14, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[30, 30]} />
                <meshStandardMaterial color="#F5F5F5" side={2} /> {/* Double sided white */}
            </mesh>

        </group>
    );
}
