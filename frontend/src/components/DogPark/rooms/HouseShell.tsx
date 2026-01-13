/**
 * HouseShell.tsx
 * 
 * Static 3D background environment - "Warm, Cozy, Cartoon Realism" style.
 * Art Pass: Warm cream walls, polished oak floors, colorful furniture.
 */

import React from 'react';
import { Box, Sphere, RoundedBox } from '@react-three/drei';

interface HouseShellProps {
    room?: 'living' | 'kitchen' | 'bathroom' | 'closet';
}

// Color palette for cozy home
const COLORS = {
    warmCream: '#FDF5E6',      // Walls
    polishedOak: '#5D4037',    // Floor - Rich Dark Walnut
    darkWood: '#8B4513',       // Shelves, furniture
    white: '#FFFFFF',          // Trim, baseboards
    navyCabinet: '#1A237E',    // Kitchen cabinets - Deep Navy
    marble: '#D3D3D3',         // Countertops
    stainlessSteel: '#C0C0C0', // Fridge
    skyBlue: '#B0E0E6',        // Window - Soft Sky Blue
};

export function HouseShell({ room = 'living' }: HouseShellProps) {
    return (
        <group position={[0, 0, -3]}>
            {/* === ZONED FLOOR === */}
            {/* Living Floor (Left) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-15, 0, 0]} receiveShadow>
                <planeGeometry args={[45, 60]} />
                <meshStandardMaterial color={COLORS.polishedOak} roughness={0.4} />
            </mesh>
            {/* Kitchen Floor (Right - Tile) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[22.5, 0, 0]} receiveShadow>
                <planeGeometry args={[30, 60]} />
                <meshStandardMaterial color="#E0E0E0" roughness={0.2} metalness={0.1} />
            </mesh>

            {/* === CEILING === */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 8, 0]}>
                <planeGeometry args={[50, 40]} />
                <meshStandardMaterial color="#F5F5F5" side={2} />
            </mesh>

            {/* === ENCLOSED WALLS === */}
            <BackWall />
            <LeftWall />
            <RightWall />

            {/* === KITCHEN ZONE (Right Side - Compressed) === */}
            <group position={[3, 0, -2]}>
                <KitchenCabinets />
                <DistantDining position={[0, 0, -4]} scale={0.8} />
            </group>
        </group>
    );
}

function BackWall() {
    return (
        <group position={[0, 4, -8]}>
            <RoundedBox args={[40, 8, 0.2]} position={[0, 0, 0]} radius={0.05} smoothness={4} receiveShadow castShadow>
                <meshStandardMaterial color={COLORS.warmCream} />
            </RoundedBox>
            {/* Baseboard */}
            <RoundedBox args={[40, 0.3, 0.25]} position={[0, -3.85, 0.1]} radius={0.02} smoothness={4}>
                <meshStandardMaterial color={COLORS.white} />
            </RoundedBox>
        </group>
    );
}

function LeftWall() {
    return (
        <group position={[-20, 4, 0]} rotation={[0, Math.PI / 2, 0]}>
            <RoundedBox args={[30, 8, 0.2]} position={[0, 0, 0]} radius={0.05} smoothness={4} receiveShadow castShadow>
                <meshStandardMaterial color={COLORS.warmCream} />
            </RoundedBox>

            {/* Window moved to Left Wall */}
            <group position={[0, 0.5, 0.15]}>
                <Window />
            </group>

            {/* Baseboard */}
            <RoundedBox args={[30, 0.3, 0.25]} position={[0, -3.85, 0.1]} radius={0.02} smoothness={4}>
                <meshStandardMaterial color={COLORS.white} />
            </RoundedBox>
        </group>
    );
}

function RightWall() {
    return (
        <group position={[20, 4, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <RoundedBox args={[30, 8, 0.2]} position={[0, 0, 0]} radius={0.05} smoothness={4} receiveShadow castShadow>
                <meshStandardMaterial color={COLORS.warmCream} />
            </RoundedBox>
            {/* Baseboard */}
            <RoundedBox args={[30, 0.3, 0.25]} position={[0, -3.85, 0.1]} radius={0.02} smoothness={4}>
                <meshStandardMaterial color={COLORS.white} />
            </RoundedBox>
        </group>
    );
}

function Window() {
    return (
        <group>
            {/* Window glass */}
            <RoundedBox args={[3, 2.5, 0.05]} radius={0.05} smoothness={4}>
                <meshStandardMaterial color={COLORS.skyBlue} transparent opacity={0.6} roughness={0.1} />
            </RoundedBox>

            {/* Frame Cross */}
            <RoundedBox args={[0.1, 2.5, 0.1]} position={[0, 0, 0.06]} radius={0.02} smoothness={4}>
                <meshStandardMaterial color={COLORS.white} />
            </RoundedBox>
            <RoundedBox args={[3, 0.1, 0.1]} position={[0, 0.3, 0.06]} radius={0.02} smoothness={4}>
                <meshStandardMaterial color={COLORS.white} />
            </RoundedBox>

            {/* Outer Frame */}
            <RoundedBox args={[3.4, 0.2, 0.15]} position={[0, 1.3, 0.05]} radius={0.05} smoothness={4}>
                <meshStandardMaterial color={COLORS.white} />
            </RoundedBox>
            <RoundedBox args={[3.4, 0.2, 0.15]} position={[0, -1.3, 0.05]} radius={0.05} smoothness={4}>
                <meshStandardMaterial color={COLORS.white} />
            </RoundedBox>
            <RoundedBox args={[0.2, 2.7, 0.15]} position={[-1.6, 0.0, 0.05]} radius={0.05} smoothness={4}>
                <meshStandardMaterial color={COLORS.white} />
            </RoundedBox>
            <RoundedBox args={[0.2, 2.7, 0.15]} position={[1.6, 0.0, 0.05]} radius={0.05} smoothness={4}>
                <meshStandardMaterial color={COLORS.white} />
            </RoundedBox>
        </group>
    );
}

// Breakfast bar removed

function KitchenCabinets() {
    return (
        <group>
            {/* Lower cabinets */}
            <RoundedBox args={[1.2, 1.2, 5]} position={[6, 0.6, 0]} radius={0.08} smoothness={4} castShadow receiveShadow>
                <meshStandardMaterial color={COLORS.navyCabinet} />
            </RoundedBox>
            {/* Countertop */}
            <RoundedBox args={[1.3, 0.08, 5.2]} position={[6, 1.24, 0]} radius={0.02} smoothness={4} castShadow>
                <meshStandardMaterial color={COLORS.marble} />
            </RoundedBox>

            {/* Fridge */}
            <RoundedBox args={[1.4, 3.8, 1.6]} position={[6, 1.9, -4]} radius={0.1} smoothness={4} castShadow>
                <meshStandardMaterial color={COLORS.stainlessSteel} />
            </RoundedBox>
        </group>
    );
}

function DistantDining({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
    return (
        <group position={position} scale={scale}>
            {/* Simplified Table */}
            <RoundedBox args={[3, 0.12, 1.8]} position={[0, 1, 0]} radius={0.05} castShadow>
                <meshStandardMaterial color={COLORS.darkWood} />
            </RoundedBox>
            {/* Simplified Chair */}
            <group position={[0, 0, 1.5]}>
                <RoundedBox args={[0.8, 0.08, 0.8]} position={[0, 0.6, 0]} radius={0.05} castShadow>
                    <meshStandardMaterial color={COLORS.darkWood} />
                </RoundedBox>
                <RoundedBox args={[0.7, 0.06, 0.7]} position={[0, 0.68, 0]} radius={0.03}>
                    <meshStandardMaterial color="#E57373" />
                </RoundedBox>
            </group>
        </group>
    );
}

// Living room wall decorations (shelves, window)
function LivingRoomDecor() {
    return (
        <group position={[3, 3, -5.8]}>
            {/* === LARGE WINDOW === */}
            {/* === LARGE WINDOW === */}
            <group position={[0, 0.5, 0]}>
                {/* Window glass (Soft Sky Blue, Transparent) */}
                <RoundedBox args={[3, 2.5, 0.05]} radius={0.05} smoothness={4}>
                    <meshStandardMaterial
                        color={COLORS.skyBlue}
                        transparent
                        opacity={0.6}
                        roughness={0.1}
                    />
                </RoundedBox>

                {/* Window Frame: White Cross */}
                {/* Vertical Mullion */}
                <RoundedBox args={[0.15, 2.5, 0.1]} position={[0, 0, 0.06]} radius={0.02} smoothness={4}>
                    <meshStandardMaterial color={COLORS.white} />
                </RoundedBox>
                {/* Horizontal Mullion */}
                <RoundedBox args={[3, 0.15, 0.1]} position={[0, 0.5, 0.06]} radius={0.02} smoothness={4}>
                    <meshStandardMaterial color={COLORS.white} />
                </RoundedBox>

                {/* Outer Frame (Top/Bottom/Sides) */}
                <RoundedBox args={[3.3, 0.15, 0.12]} position={[0, 1.32, 0.03]} radius={0.05} smoothness={4}>
                    <meshStandardMaterial color={COLORS.white} />
                </RoundedBox>
                <RoundedBox args={[3.3, 0.15, 0.12]} position={[0, -1.32, 0.03]} radius={0.05} smoothness={4}>
                    <meshStandardMaterial color={COLORS.white} />
                </RoundedBox>
                <RoundedBox args={[0.15, 2.8, 0.12]} position={[-1.58, 0, 0.03]} radius={0.05} smoothness={4}>
                    <meshStandardMaterial color={COLORS.white} />
                </RoundedBox>
                <RoundedBox args={[0.15, 2.8, 0.12]} position={[1.58, 0, 0.03]} radius={0.05} smoothness={4}>
                    <meshStandardMaterial color={COLORS.white} />
                </RoundedBox>

                {/* Window Sill (Shelf at bottom) */}
                <RoundedBox args={[3.6, 0.1, 0.4]} position={[0, -1.35, 0.15]} radius={0.05} smoothness={4} castShadow>
                    <meshStandardMaterial color={COLORS.white} />
                </RoundedBox>
            </group>

            {/* === FLOATING SHELVES === */}
            <group position={[-4.5, -0.5, 0]}>
                {/* Shelf 1 - Dark rich wood */}
                <RoundedBox args={[1.6, 0.12, 0.35]} position={[0, 0.8, 0.2]} radius={0.06} smoothness={4} castShadow receiveShadow>
                    <meshStandardMaterial color={COLORS.darkWood} roughness={0.6} />
                </RoundedBox>
                {/* Shelf 2 */}
                <RoundedBox args={[1.6, 0.12, 0.35]} position={[0, -0.4, 0.2]} radius={0.06} smoothness={4} castShadow receiveShadow>
                    <meshStandardMaterial color={COLORS.darkWood} roughness={0.6} />
                </RoundedBox>

                {/* Books on top shelf */}
                <RoundedBox args={[0.12, 0.35, 0.18]} position={[-0.5, 1.08, 0.22]} radius={0.02} smoothness={4} castShadow>
                    <meshStandardMaterial color="#1565C0" /> {/* Blue book */}
                </RoundedBox>
                <RoundedBox args={[0.10, 0.32, 0.18]} position={[-0.35, 1.06, 0.22]} radius={0.02} smoothness={4} castShadow>
                    <meshStandardMaterial color="#C62828" /> {/* Red book */}
                </RoundedBox>
                <RoundedBox args={[0.11, 0.34, 0.18]} position={[-0.2, 1.07, 0.22]} radius={0.02} smoothness={4} castShadow>
                    <meshStandardMaterial color="#2E7D32" /> {/* Green book */}
                </RoundedBox>
                <RoundedBox args={[0.09, 0.30, 0.18]} position={[-0.06, 1.05, 0.22]} radius={0.02} smoothness={4} castShadow>
                    <meshStandardMaterial color="#F9A825" /> {/* Yellow book */}
                </RoundedBox>

                {/* Plant on top shelf */}
                <RoundedBox args={[0.22, 0.22, 0.22]} position={[0.4, 1.02, 0.22]} radius={0.05} smoothness={4} castShadow>
                    <meshStandardMaterial color="#8D6E63" /> {/* Terracotta pot */}
                </RoundedBox>
                <RoundedBox args={[0.25, 0.30, 0.15]} position={[0.4, 1.28, 0.22]} radius={0.05} smoothness={4} castShadow>
                    <meshStandardMaterial color="#4CAF50" /> {/* Plant leaves */}
                </RoundedBox>

                {/* Picture frame on bottom shelf */}
                <RoundedBox args={[0.35, 0.28, 0.04]} position={[-0.3, -0.12, 0.28]} radius={0.02} smoothness={4} castShadow>
                    <meshStandardMaterial color={COLORS.darkWood} />
                </RoundedBox>
                <RoundedBox args={[0.28, 0.22, 0.02]} position={[-0.3, -0.12, 0.32]} radius={0.01} smoothness={4}>
                    <meshStandardMaterial color="#FFE4C4" /> {/* Photo inside */}
                </RoundedBox>

                {/* Small decor on bottom shelf */}
                <RoundedBox args={[0.12, 0.18, 0.12]} position={[0.3, -0.21, 0.25]} radius={0.04} smoothness={4} castShadow>
                    <meshStandardMaterial color="#E91E63" /> {/* Pink candle */}
                </RoundedBox>
            </group>
        </group>
    );
}

// Side walls removed in favor of explicit LeftWall/RightWall functions above

export default HouseShell;
