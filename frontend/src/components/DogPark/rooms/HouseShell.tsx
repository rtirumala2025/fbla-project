/**
 * HouseShell.tsx
 * 
 * Static 3D background environment - "Warm, Cozy, Cartoon Realism" style.
 * Art Pass: Warm cream walls, polished oak floors, colorful furniture.
 */

import React from 'react';
import { Box, Sphere, RoundedBox, Cylinder } from '@react-three/drei';

interface HouseShellProps {
    room?: 'living' | 'kitchen' | 'bathroom' | 'closet';
    onSwitchRoom?: (room: any) => void;
}

// Standard Palette (Kitchen/Bath)
const COLORS = {
    warmCream: '#E0EEE0',      // Walls - Soft Sage Green
    polishedOak: '#5D4037',    // Floor - Rich Dark Walnut
    darkWood: '#5D4037',       // Wainscoting/Furniture match
    white: '#FFFFFF',          // Trim, baseboards
    navyCabinet: '#1A237E',    // Kitchen cabinets
    marble: '#D3D3D3',         // Countertops
    stainlessSteel: '#C0C0C0', // Fridge
    skyBlue: '#B0E0E6',        // Window - Soft Sky Blue
};

// Luxury Color Palette - "Toll Brothers" Aesthetic
const LUXURY_COLORS = {
    Walls: "#CBC5B9", // Revere Pewter / Greige
    Floor: "#D2B48C", // Honey Oak (Glossy)
    Trim: "#FFFFFF",  // High Gloss White
    ArtFrame: "#2C2C2C", // Matte Black Frame
    SconceGold: "#FDD835", // Brass
};

export function HouseShell({ room = 'living', onSwitchRoom }: HouseShellProps) {
    return (
        <group position={[0, 0, 0]}>
            {/* === ZONED FLOOR (Glossy Honey Oak) === */}
            <RoundedBox args={[16, 0.5, 16]} position={[0, -0.25, 0]} radius={0} smoothness={1} receiveShadow>
                <meshStandardMaterial color="#D4C4A8" roughness={0.1} metalness={0.1} />
            </RoundedBox>

            {/* === CEILING (Sealed at top of walls) === */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, 0]}>
                <planeGeometry args={[16, 16]} />
                <meshStandardMaterial color="#FFFFFF" side={2} />
            </mesh>

            {/* === PENDANT LIGHT === */}
            <group position={[0, 5, 0]}>
                <Cylinder args={[0.02, 0.02, 1.5]} position={[0, -0.75, 0]}>
                    <meshStandardMaterial color="#212121" />
                </Cylinder>
                <Cylinder args={[0.05, 0.4, 0.3]} position={[0, -1.5, 0]}>
                    <meshStandardMaterial color={LUXURY_COLORS.Trim} side={2} />
                </Cylinder>
                <Sphere args={[0.15]} position={[0, -1.6, 0]}>
                    <meshStandardMaterial color="#FFF59D" emissive="#FFF59D" emissiveIntensity={2} />
                </Sphere>
            </group>

            {/* === ENCLOSED WALLS (Shoebox) === */}
            <BackWall />
            <LeftWall />
            <RightWall />

            {/* FIDDLE LEAF FIG (Corner x=5, z=-3) */}
            <group position={[5, 0, -3]}>
                {/* Pot */}
                <Cylinder args={[0.4, 0.3, 0.6]} position={[0, 0.3, 0]}>
                    <meshStandardMaterial color="#3E2723" />
                </Cylinder>
                {/* Stem */}
                <Cylinder args={[0.05, 0.05, 3]} position={[0, 1.5, 0]}>
                    <meshStandardMaterial color="#5D4037" />
                </Cylinder>
                {/* Leaves */}
                {[0, 1, 2, 3].map(i => (
                    <group key={i} position={[0, 1.5 + i * 0.4, 0]} rotation={[0, i * 1.5, 0.5]}>
                        <mesh scale={[1, 0.1, 1.5]} position={[0, 0, 0.5]}>
                            <sphereGeometry args={[0.3, 8, 8]} />
                            <meshStandardMaterial color="#2E7D32" />
                        </mesh>
                    </group>
                ))}
            </group>
        </group>
    );
}

function BackWall() {
    return (
        <group position={[0, 5, -2.2]}>
            {/* Upper Wall (Greige) */}
            <RoundedBox args={[12, 8.5, 0.5]} position={[0, 0.75, 0]} radius={0.05} smoothness={4} receiveShadow castShadow>
                <meshStandardMaterial color={LUXURY_COLORS.Walls} roughness={0.9} />
            </RoundedBox>
            {/* High Wainscoting (White) - Height 3.0 */}
            <RoundedBox args={[12, 3.0, 0.6]} position={[0, -3.5, 0]} radius={0.02} smoothness={4} receiveShadow>
                <meshStandardMaterial color={LUXURY_COLORS.Trim} />
            </RoundedBox>
            {/* Baseboard separation/detail */}
            <RoundedBox args={[12, 0.1, 0.65]} position={[0, -2.0, 0]} radius={0.01}>
                <meshStandardMaterial color={LUXURY_COLORS.Trim} />
            </RoundedBox>

            {/* Crown Molding (Top) */}
            <RoundedBox args={[12, 0.5, 0.6]} position={[0, 4.75, 0]} radius={0.02} smoothness={4}>
                <meshStandardMaterial color={LUXURY_COLORS.Trim} />
            </RoundedBox>

            {/* STATEMENT ART (Focal Point High) */}
            <group position={[0, 4.5, 0.3]}>
                {/* Frame (Matte Black) */}
                <RoundedBox args={[3.5, 2.5, 0.1]} position={[0, 0, 0]} radius={0.05}>
                    <meshStandardMaterial color={LUXURY_COLORS.ArtFrame} roughness={0.9} />
                </RoundedBox>
                {/* Canvas (Deep Navy/Charcoal) */}
                <RoundedBox args={[3.3, 2.3, 0.12]} position={[0, 0, 0]} radius={0.01}>
                    <meshStandardMaterial color="#102030" roughness={0.8} />
                </RoundedBox>
                {/* Gold Accent (Abstract) */}
                <mesh position={[0, 0, 0.08]}>
                    <boxGeometry args={[1.5, 0.2, 0.05]} />
                    <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.2} />
                </mesh>
            </group>

            {/* SCONCES (Above Nightstands x=-2.5, x=2.5) */}
            {/* Sconce Left */}
            <group position={[-2.5, 2, 0.3]}>
                <Cylinder args={[0.1, 0.1, 0.2]} rotation={[Math.PI / 2, 0, 0]}><meshStandardMaterial color={LUXURY_COLORS.SconceGold} /></Cylinder>
                <Sphere args={[0.2]} position={[0, -0.2, 0.2]}><meshStandardMaterial color="#FFF9C4" emissive="#FFF9C4" emissiveIntensity={0.5} /></Sphere>
            </group>
            {/* Sconce Right */}
            <group position={[2.5, 2, 0.3]}>
                <Cylinder args={[0.1, 0.1, 0.2]} rotation={[Math.PI / 2, 0, 0]}><meshStandardMaterial color={LUXURY_COLORS.SconceGold} /></Cylinder>
                <Sphere args={[0.2]} position={[0, -0.2, 0.2]}><meshStandardMaterial color="#FFF9C4" emissive="#FFF9C4" emissiveIntensity={0.5} /></Sphere>
            </group>
        </group>
    );
}

function LeftWall() {
    return (
        <group position={[-6, 5, 0]} rotation={[0, Math.PI / 2, 0]}>
            {/* Upper Wall */}
            <RoundedBox args={[12, 8.5, 0.5]} position={[0, 0.75, 0]} radius={0.05} smoothness={4} receiveShadow castShadow>
                <meshStandardMaterial color={LUXURY_COLORS.Walls} roughness={0.9} />
            </RoundedBox>
            {/* Wainscoting - Height 3.0 */}
            <RoundedBox args={[12, 3.0, 0.6]} position={[0, -3.5, 0]} radius={0.02} smoothness={4} receiveShadow>
                <meshStandardMaterial color={LUXURY_COLORS.Trim} />
            </RoundedBox>
            {/* Crown Molding */}
            <RoundedBox args={[12, 0.5, 0.6]} position={[0, 4.75, 0]} radius={0.02} smoothness={4}>
                <meshStandardMaterial color={LUXURY_COLORS.Trim} />
            </RoundedBox>
            {/* CLEAN - NO DECOR */}
        </group>
    );
}


function RightWall() {
    return (
        <group position={[6, 5, 0]} rotation={[0, -Math.PI / 2, 0]}>
            {/* Upper Wall */}
            <RoundedBox args={[12, 8.5, 0.5]} position={[0, 0.75, 0]} radius={0.05} smoothness={4} receiveShadow castShadow>
                <meshStandardMaterial color={LUXURY_COLORS.Walls} roughness={0.9} />
            </RoundedBox>
            {/* Wainscoting - Height 3.0 */}
            <RoundedBox args={[12, 3.0, 0.6]} position={[0, -3.5, 0]} radius={0.02} smoothness={4} receiveShadow>
                <meshStandardMaterial color={LUXURY_COLORS.Trim} />
            </RoundedBox>
            {/* Crown Molding */}
            <RoundedBox args={[12, 0.5, 0.6]} position={[0, 4.75, 0]} radius={0.02} smoothness={4}>
                <meshStandardMaterial color={LUXURY_COLORS.Trim} />
            </RoundedBox>
            {/* CLEAN - Plant is added in main stage */}
        </group>
    );
}

export default HouseShell;
