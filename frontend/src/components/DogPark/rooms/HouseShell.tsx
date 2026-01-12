/**
 * HouseShell.tsx
 * 
 * Static 3D background environment - "Warm, Cozy, Cartoon Realism" style.
 * Art Pass: Warm cream walls, polished oak floors, colorful furniture.
 */

import React from 'react';
import { Box } from '@react-three/drei';

interface HouseShellProps {
    room?: 'living' | 'kitchen' | 'bathroom' | 'closet';
}

// Color palette for cozy home
const COLORS = {
    warmCream: '#FDF5E6',      // Walls
    polishedOak: '#E1C699',    // Floor
    darkWood: '#8B4513',       // Shelves, furniture
    white: '#FFFFFF',          // Trim, baseboards
    navyCabinet: '#2C3E50',    // Kitchen cabinets
    marble: '#D3D3D3',         // Countertops
    stainlessSteel: '#C0C0C0', // Fridge
    skyBlue: '#87CEEB',        // Window
};

export function HouseShell({ room = 'living' }: HouseShellProps) {
    return (
        <group position={[0, 0, -3]}>
            {/* === MASSIVE FLOOR (fills horizon) === */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0, 0]}
                receiveShadow
            >
                <planeGeometry args={[50, 50]} />
                <meshStandardMaterial color={COLORS.polishedOak} roughness={0.4} />
            </mesh>

            {/* === CEILING (prevents seeing void) === */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 6.5, -5]}>
                <planeGeometry args={[50, 40]} />
                <meshStandardMaterial color={COLORS.white} />
            </mesh>

            {/* === BACK WALL WITH ARCHWAY === */}
            <BackWallWithArch />

            {/* === DISTANT KITCHEN (Left side through arch) === */}
            <DistantKitchen />

            {/* === DISTANT DINING (Right side) === */}
            <DistantDining />

            {/* === LIVING ROOM WALL DECORATIONS === */}
            <LivingRoomDecor />

            {/* === SIDE WALLS (for enclosure feel) === */}
            <SideWalls />
        </group>
    );
}

// Back wall with archway opening on the left
function BackWallWithArch() {
    const wallDepth = 0.15;

    return (
        <group position={[0, 3, -6]}>
            {/* Main back wall - RIGHT section (solid) */}
            <Box args={[8, 6, wallDepth]} position={[4, 0, 0]} receiveShadow castShadow>
                <meshStandardMaterial color={COLORS.warmCream} />
            </Box>

            {/* Main back wall - LEFT section above arch */}
            <Box args={[6, 2, wallDepth]} position={[-5, 2, 0]} receiveShadow castShadow>
                <meshStandardMaterial color={COLORS.warmCream} />
            </Box>

            {/* Arch frame - Left pillar */}
            <Box args={[0.5, 4, wallDepth + 0.1]} position={[-7.75, -1, 0]} receiveShadow castShadow>
                <meshStandardMaterial color={COLORS.warmCream} />
            </Box>

            {/* Arch frame - Right pillar */}
            <Box args={[0.5, 4, wallDepth + 0.1]} position={[-2.25, -1, 0]} receiveShadow castShadow>
                <meshStandardMaterial color={COLORS.warmCream} />
            </Box>

            {/* Arch top */}
            <Box args={[5.5, 0.5, wallDepth + 0.1]} position={[-5, 1, 0]} receiveShadow castShadow>
                <meshStandardMaterial color={COLORS.warmCream} />
            </Box>

            {/* Baseboard - White trim */}
            <Box args={[16, 0.3, 0.2]} position={[0, -2.85, 0.1]}>
                <meshStandardMaterial color={COLORS.white} />
            </Box>

            {/* Crown molding at top */}
            <Box args={[16, 0.2, 0.15]} position={[0, 2.9, 0.1]}>
                <meshStandardMaterial color={COLORS.white} />
            </Box>
        </group>
    );
}

// Distant kitchen visible through the archway - Navy cabinets, marble counters
function DistantKitchen() {
    return (
        <group position={[-5, 0, -10]}>
            {/* Kitchen floor (light tile) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 2]} receiveShadow>
                <planeGeometry args={[8, 6]} />
                <meshStandardMaterial color="#F5F5F5" roughness={0.3} />
            </mesh>

            {/* Kitchen back wall */}
            <Box args={[8, 5, 0.1]} position={[0, 2.5, -1]} receiveShadow>
                <meshStandardMaterial color={COLORS.warmCream} />
            </Box>

            {/* Lower cabinets - Navy Blue */}
            <Box args={[5, 1.2, 0.6]} position={[0, 0.6, -0.5]} castShadow receiveShadow>
                <meshStandardMaterial color={COLORS.navyCabinet} />
            </Box>

            {/* Marble countertop */}
            <Box args={[5.2, 0.08, 0.7]} position={[0, 1.24, -0.5]} castShadow>
                <meshStandardMaterial color={COLORS.marble} roughness={0.2} metalness={0.1} />
            </Box>

            {/* Upper cabinets - Navy Blue */}
            <Box args={[2, 1, 0.4]} position={[-1.2, 3.5, -0.7]} castShadow>
                <meshStandardMaterial color={COLORS.navyCabinet} />
            </Box>
            <Box args={[2, 1, 0.4]} position={[1.2, 3.5, -0.7]} castShadow>
                <meshStandardMaterial color={COLORS.navyCabinet} />
            </Box>

            {/* Cabinet handles (gold accents) */}
            <Box args={[0.3, 0.04, 0.06]} position={[-1.2, 3.2, -0.45]}>
                <meshStandardMaterial color="#D4AF37" metalness={0.7} roughness={0.3} />
            </Box>
            <Box args={[0.3, 0.04, 0.06]} position={[1.2, 3.2, -0.45]}>
                <meshStandardMaterial color="#D4AF37" metalness={0.7} roughness={0.3} />
            </Box>

            {/* Stainless Steel Fridge */}
            <Box args={[1.2, 3.5, 1]} position={[3, 1.75, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={COLORS.stainlessSteel} metalness={0.6} roughness={0.2} />
            </Box>
            {/* Freezer door line */}
            <Box args={[1.1, 0.02, 0.02]} position={[3, 2.8, 0.52]}>
                <meshStandardMaterial color="#A0A0A0" />
            </Box>
            {/* Fridge handles */}
            <Box args={[0.04, 0.8, 0.08]} position={[2.45, 2, 0.55]}>
                <meshStandardMaterial color={COLORS.stainlessSteel} metalness={0.8} roughness={0.1} />
            </Box>
            <Box args={[0.04, 0.5, 0.08]} position={[2.45, 3.3, 0.55]}>
                <meshStandardMaterial color={COLORS.stainlessSteel} metalness={0.8} roughness={0.1} />
            </Box>
        </group>
    );
}

// Distant dining area (right side)
function DistantDining() {
    return (
        <group position={[5, 0, -8]}>
            {/* Dining Table - Rich wood */}
            <Box args={[2.5, 0.12, 1.5]} position={[0, 1, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={COLORS.darkWood} roughness={0.5} />
            </Box>
            {/* Table legs */}
            {[[-1, -0.5], [1, -0.5], [-1, 0.5], [1, 0.5]].map(([x, z], i) => (
                <Box key={i} args={[0.1, 1, 0.1]} position={[x, 0.5, z]} castShadow>
                    <meshStandardMaterial color={COLORS.darkWood} />
                </Box>
            ))}

            {/* Chairs with cushion color accent */}
            {[-0.8, 0.8].map((x, i) => (
                <group key={i} position={[x, 0, 1.2]}>
                    {/* Seat */}
                    <Box args={[0.55, 0.08, 0.55]} position={[0, 0.6, 0]} castShadow>
                        <meshStandardMaterial color={COLORS.darkWood} />
                    </Box>
                    {/* Cushion */}
                    <Box args={[0.48, 0.06, 0.48]} position={[0, 0.68, 0]} castShadow>
                        <meshStandardMaterial color="#E57373" /> {/* Soft red cushion */}
                    </Box>
                    {/* Back */}
                    <Box args={[0.55, 0.9, 0.08]} position={[0, 1.05, -0.24]} castShadow>
                        <meshStandardMaterial color={COLORS.darkWood} />
                    </Box>
                </group>
            ))}

            {/* Centerpiece - Vase with flowers */}
            <Box args={[0.15, 0.3, 0.15]} position={[0, 1.2, 0]} castShadow>
                <meshStandardMaterial color="#4A90A4" /> {/* Teal vase */}
            </Box>
            <Box args={[0.25, 0.2, 0.25]} position={[0, 1.45, 0]}>
                <meshStandardMaterial color="#90EE90" /> {/* Flowers/greenery */}
            </Box>
        </group>
    );
}

// Living room wall decorations (shelves, window)
function LivingRoomDecor() {
    return (
        <group position={[3, 3, -5.8]}>
            {/* === LARGE WINDOW === */}
            <group position={[0, 0.5, 0]}>
                {/* Window glass (warm sunset glow - high emissive for bloom) */}
                <Box args={[3, 2.5, 0.05]}>
                    <meshStandardMaterial
                        color="#FFE4B5"
                        emissive="#FFD700"
                        emissiveIntensity={2.0}
                        toneMapped={false}
                    />
                </Box>
                {/* Window frame - outer (white) */}
                <Box args={[3.3, 0.18, 0.12]} position={[0, 1.34, 0.03]}>
                    <meshStandardMaterial color={COLORS.white} />
                </Box>
                <Box args={[3.3, 0.18, 0.12]} position={[0, -1.34, 0.03]}>
                    <meshStandardMaterial color={COLORS.white} />
                </Box>
                <Box args={[0.18, 2.86, 0.12]} position={[-1.56, 0, 0.03]}>
                    <meshStandardMaterial color={COLORS.white} />
                </Box>
                <Box args={[0.18, 2.86, 0.12]} position={[1.56, 0, 0.03]}>
                    <meshStandardMaterial color={COLORS.white} />
                </Box>
                {/* Cross frame mullions */}
                <Box args={[3, 0.1, 0.1]} position={[0, 0, 0.05]}>
                    <meshStandardMaterial color={COLORS.white} />
                </Box>
                <Box args={[0.1, 2.5, 0.1]} position={[0, 0, 0.05]}>
                    <meshStandardMaterial color={COLORS.white} />
                </Box>
            </group>

            {/* === FLOATING SHELVES === */}
            <group position={[-4.5, -0.5, 0]}>
                {/* Shelf 1 - Dark rich wood */}
                <Box args={[1.6, 0.12, 0.35]} position={[0, 0.8, 0.2]} castShadow receiveShadow>
                    <meshStandardMaterial color={COLORS.darkWood} roughness={0.6} />
                </Box>
                {/* Shelf 2 */}
                <Box args={[1.6, 0.12, 0.35]} position={[0, -0.4, 0.2]} castShadow receiveShadow>
                    <meshStandardMaterial color={COLORS.darkWood} roughness={0.6} />
                </Box>

                {/* Books on top shelf */}
                <Box args={[0.12, 0.35, 0.18]} position={[-0.5, 1.08, 0.22]} castShadow>
                    <meshStandardMaterial color="#1565C0" /> {/* Blue book */}
                </Box>
                <Box args={[0.10, 0.32, 0.18]} position={[-0.35, 1.06, 0.22]} castShadow>
                    <meshStandardMaterial color="#C62828" /> {/* Red book */}
                </Box>
                <Box args={[0.11, 0.34, 0.18]} position={[-0.2, 1.07, 0.22]} castShadow>
                    <meshStandardMaterial color="#2E7D32" /> {/* Green book */}
                </Box>
                <Box args={[0.09, 0.30, 0.18]} position={[-0.06, 1.05, 0.22]} castShadow>
                    <meshStandardMaterial color="#F9A825" /> {/* Yellow book */}
                </Box>

                {/* Plant on top shelf */}
                <Box args={[0.22, 0.22, 0.22]} position={[0.4, 1.02, 0.22]} castShadow>
                    <meshStandardMaterial color="#8D6E63" /> {/* Terracotta pot */}
                </Box>
                <Box args={[0.25, 0.30, 0.15]} position={[0.4, 1.28, 0.22]} castShadow>
                    <meshStandardMaterial color="#4CAF50" /> {/* Plant leaves */}
                </Box>

                {/* Picture frame on bottom shelf */}
                <Box args={[0.35, 0.28, 0.04]} position={[-0.3, -0.12, 0.28]} castShadow>
                    <meshStandardMaterial color={COLORS.darkWood} />
                </Box>
                <Box args={[0.28, 0.22, 0.02]} position={[-0.3, -0.12, 0.32]}>
                    <meshStandardMaterial color="#FFE4C4" /> {/* Photo inside */}
                </Box>

                {/* Small decor on bottom shelf */}
                <Box args={[0.12, 0.18, 0.12]} position={[0.3, -0.21, 0.25]} castShadow>
                    <meshStandardMaterial color="#E91E63" /> {/* Pink candle */}
                </Box>
            </group>
        </group>
    );
}

// Side walls for enclosure - Extended to fill peripheral vision
function SideWalls() {
    return (
        <group>
            {/* Left wall - Main */}
            <Box args={[0.2, 7, 30]} position={[-10, 3.5, -8]} receiveShadow>
                <meshStandardMaterial color={COLORS.warmCream} />
            </Box>
            {/* Left wall - Far extension */}
            <mesh rotation={[0, Math.PI / 2, 0]} position={[-12, 3.5, 0]}>
                <planeGeometry args={[25, 7]} />
                <meshStandardMaterial color={COLORS.warmCream} side={2} />
            </mesh>
            {/* Left baseboard */}
            <Box args={[0.25, 0.35, 30]} position={[-9.9, 0.18, -8]}>
                <meshStandardMaterial color={COLORS.white} />
            </Box>

            {/* Right wall - Main */}
            <Box args={[0.2, 7, 30]} position={[10, 3.5, -8]} receiveShadow>
                <meshStandardMaterial color={COLORS.warmCream} />
            </Box>
            {/* Right wall - Far extension */}
            <mesh rotation={[0, -Math.PI / 2, 0]} position={[12, 3.5, 0]}>
                <planeGeometry args={[25, 7]} />
                <meshStandardMaterial color={COLORS.warmCream} side={2} />
            </mesh>
            {/* Right baseboard */}
            <Box args={[0.25, 0.35, 30]} position={[9.9, 0.18, -8]}>
                <meshStandardMaterial color={COLORS.white} />
            </Box>

            {/* Back wall extension (far back) */}
            <Box args={[30, 7, 0.2]} position={[0, 3.5, -18]} receiveShadow>
                <meshStandardMaterial color={COLORS.warmCream} />
            </Box>
        </group>
    );
}

export default HouseShell;
