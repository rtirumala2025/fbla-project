import React from 'react';
import { Box, Cylinder, Text, Sphere } from '@react-three/drei';
import { ActivityGuide } from './ActivityGuide';
import { makeWoodTexture, makeStoneTexture } from '../core/AssetLoader';

export function ParkHubInterior() {
    const woodTex = React.useMemo(() => makeWoodTexture(), []);
    const stoneTex = React.useMemo(() => makeStoneTexture(), []);

    return (
        <group position={[0, 0, 0]}>
            {/* ========== POLISHED FLOOR ========== */}
            <Box args={[12, 0.2, 10]} position={[0, 0.1, 0]}>
                <meshStandardMaterial map={stoneTex} color="#bdbdbd" roughness={0.2} metalness={0.1} />
            </Box>

            {/* ========== RECEPTION & TERMINALS ========== */}
            <group position={[0, 0.2, -3]}>
                {/* Main Desk */}
                <Box args={[6, 1, 1.2]} position={[0, 0.5, 0]} castShadow>
                    <meshStandardMaterial color="#455a64" />
                </Box>
                <Box args={[6.2, 0.1, 1.3]} position={[0, 1.05, 0]}><meshStandardMaterial color="#ffffff" metalness={0.6} roughness={0.1} /></Box>

                {/* Information Terminals */}
                {[[-2, 0], [0, 0], [2, 0]].map((pos, i) => (
                    <group key={i} position={[pos[0], 1.1, pos[1]]}>
                        <Box args={[0.8, 0.5, 0.1]} rotation={[-0.4, 0, 0]} castShadow>
                            <meshStandardMaterial color="#263238" />
                        </Box>
                        <Box args={[0.7, 0.4, 0.05]} position={[0, 0, 0.05]} rotation={[-0.4, 0, 0]}>
                            <meshStandardMaterial color="#01579b" emissive="#01579b" emissiveIntensity={0.5} />
                        </Box>
                        <Text position={[0, 0, 0.1]} fontSize={0.06} color="#fff" rotation={[-0.4, 0, 0]}>
                            {['ACCOUNT', 'PARK MAP', 'STATS'][i]}
                        </Text>
                    </group>
                ))}
            </group>

            {/* ========== PARK INFO WALL ========== */}
            <group position={[0, 3, -4.9]}>
                {/* Large Map Display */}
                <Box args={[4, 3, 0.1]} position={[-2.5, 0, 0]} castShadow>
                    <meshStandardMaterial color="#333" />
                </Box>
                <Box args={[3.8, 2.8, 0.05]} position={[-2.5, 0, 0.06]}>
                    <meshStandardMaterial color="#81c784" transparent opacity={0.8} />
                </Box>
                <Text position={[-2.5, 1.6, 0.1]} fontSize={0.2} color="#fff">DOG PARK OVERVIEW</Text>

                {/* Leaderboard Board */}
                <Box args={[3, 4, 0.1]} position={[2.5, -0.5, 0]} castShadow>
                    <meshStandardMaterial map={woodTex} color="#5d4037" />
                </Box>
                <Text position={[2.5, 1.2, 0.1]} fontSize={0.2} color="#ffd700">TOP PETS</Text>
                <Text position={[2.5, -0.5, 0.1]} fontSize={0.12} color="#fff" anchorX="center">
                    🏆 Buster - 9999 pts\n🥈 Mittens - 8500 pts\n🥉 Spike - 7200 pts\n4. Fluffy - 6100 pts\n5. Shadow - 5400 pts
                </Text>
            </group>

            {/* ========== LOUNGE AREA ========== */}
            <group position={[4, 0.2, 2]}>
                {/* Corner Sofa */}
                <Box args={[3, 0.6, 1]} position={[0, 0.3, 0]} castShadow><meshStandardMaterial color="#546e7a" /></Box>
                <Box args={[1, 0.6, 2.5]} position={[-1, 0.3, 1.25]} castShadow><meshStandardMaterial color="#546e7a" /></Box>
                {/* Backrest */}
                <Box args={[3, 0.8, 0.2]} position={[0, 0.7, -0.4]}><meshStandardMaterial color="#546e7a" /></Box>

                {/* Coffee Table */}
                <Cylinder args={[0.6, 0.6, 0.05, 16]} position={[-0.5, 0.45, 1.5]}>
                    <meshStandardMaterial color="#fff" metalness={0.8} roughness={0.2} />
                </Cylinder>
            </group>

            {/* ========== ADVISOR GUIDE ========== */}
            <ActivityGuide
                position={[2.5, 1.2, -1.5]}
                name="Manager Max"
                message="Welcome to the Hub! You can see the community leaderboard here. Keep interacting with your pet to climb the ranks!"
                color="#0288d1"
            />

            {/* ========== DECORATIONS ========== */}
            {/* Potted Plant */}
            <group position={[-4.5, 0.2, 4]}>
                <Cylinder args={[0.3, 0.2, 0.5, 12]} position={[0, 0.25, 0]}><meshStandardMaterial color="#795548" /></Cylinder>
                <Sphere args={[0.5, 8, 8]} position={[0, 0.8, 0]} scale={[1, 1.5, 1]}><meshStandardMaterial color="#2e7d32" /></Sphere>
            </group>

            {/* ========== LIGHTING ========== */}
            <pointLight position={[0, 5, 0]} intensity={2.5} color="#fff" distance={20} />
            <pointLight position={[-4, 3, -4]} intensity={1} color="#e3f2fd" distance={10} />
            <ambientLight intensity={0.5} />
        </group>
    );
}
