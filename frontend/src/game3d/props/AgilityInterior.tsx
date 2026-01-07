import React from 'react';
import { Box, Text, Cylinder, Sphere } from '@react-three/drei';
import { ActivityGuide } from './ActivityGuide';
import { makeWoodTexture } from '../core/AssetLoader';

export function AgilityInterior() {
    const woodTex = React.useMemo(() => makeWoodTexture(), []);

    return (
        <group position={[0, 0, 0]}>
            {/* ========== FLOOR & MARKINGS ========== */}
            <Box args={[12, 0.2, 12]} position={[0, 0.1, 0]}>
                <meshStandardMaterial color="#1a1a1a" roughness={1} />
            </Box>
            {/* Lane Markings */}
            {[[-4, 0], [0, 0], [4, 0]].map((pos, i) => (
                <Box key={i} args={[0.15, 0.05, 11]} position={[pos[0], 0.2, pos[1]]}>
                    <meshStandardMaterial color="#fdd835" emissive="#fdd835" emissiveIntensity={0.2} />
                </Box>
            ))}

            {/* ========== TRAINING EQUIPMENT ========== */}

            {/* Mini Weave Poles (Left Lane) */}
            <group position={[-4, 0.2, -3]}>
                {[0, 1.5, 3, 4.5].map((z) => (
                    <group key={z} position={[0, 0, z]}>
                        <Cylinder args={[0.08, 0.08, 1.5, 12]} position={[0, 0.75, 0]}>
                            <meshStandardMaterial color="#fb8c00" />
                        </Cylinder>
                        <Box args={[0.4, 0.1, 0.4]} position={[0, 0.05, 0]}>
                            <meshStandardMaterial color="#333" />
                        </Box>
                    </group>
                ))}
                <Text position={[0, 2, 2.25]} fontSize={0.2} color="#fb8c00">WEAVE SECTION</Text>
            </group>

            {/* Interior Hurdle (Center Lane) */}
            <group position={[0, 0.2, 0]}>
                <Box args={[0.1, 1, 0.1]} position={[-1.5, 0.5, 0]}><meshStandardMaterial color="#333" /></Box>
                <Box args={[0.1, 1, 0.1]} position={[1.5, 0.5, 0]}><meshStandardMaterial color="#333" /></Box>
                <Cylinder args={[0.05, 0.05, 3, 12]} position={[0, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <meshStandardMaterial color="#e53935" />
                </Cylinder>
                <Text position={[0, 1.5, 0]} fontSize={0.2} color="#e53935">JUMP 01</Text>
            </group>

            {/* Mini A-Frame (Right Lane) */}
            <group position={[4, 0.2, -1]}>
                <Box args={[2, 2, 0.1]} position={[0, 0.8, -0.6]} rotation={[0.4, 0, 0]}>
                    <meshStandardMaterial color="#43a047" />
                </Box>
                <Box args={[2, 2, 0.1]} position={[0, 0.8, 0.6]} rotation={[-0.4, 0, 0]}>
                    <meshStandardMaterial color="#43a047" />
                </Box>
                {/* Cleats */}
                {[-0.5, 0, 0.5].map(y => (
                    <Box key={y} args={[1.8, 0.05, 0.05]} position={[0, 1.2 + y, 0.5 - y * 0.2]} rotation={[-0.4, 0, 0]}>
                        <meshStandardMaterial color="#2e7d32" />
                    </Box>
                ))}
            </group>

            {/* ========== AMENITIES ========== */}

            {/* Water Station */}
            <group position={[5, 0.2, 5]}>
                <Cylinder args={[0.6, 0.6, 1.2, 16]} position={[0, 0.6, 0]} castShadow>
                    <meshStandardMaterial color="#90caf9" transparent opacity={0.6} metalness={0.5} />
                </Cylinder>
                <Box args={[0.7, 0.1, 0.7]} position={[0, 1.25, 0]}><meshStandardMaterial color="#333" /></Box>
                <Text position={[0, 1.8, 0]} fontSize={0.15} color="#2196f3">HYDRATION</Text>
                {/* Bowl */}
                <Cylinder args={[0.3, 0.25, 0.2, 16]} position={[0, 0, -1]}>
                    <meshStandardMaterial color="#757575" metalness={0.8} />
                </Cylinder>
            </group>

            {/* Gym Storage */}
            <group position={[-5, 0.2, 4]}>
                <Box args={[1.5, 2, 0.8]} position={[0, 1, 0]} castShadow>
                    <meshStandardMaterial map={woodTex} color="#5d4037" />
                </Box>
                {/* Mats */}
                <Box args={[1.2, 0.2, 0.6]} position={[0, 0.3, 0.1]}><meshStandardMaterial color="#1e88e5" /></Box>
                <Box args={[1.2, 0.2, 0.6]} position={[0, 0.6, 0.1]}><meshStandardMaterial color="#7e57c2" /></Box>
            </group>

            {/* ========== INFO & GUIDE ========== */}

            {/* Instructor Guide */}
            <ActivityGuide
                position={[0, 1.2, -5]}
                name="Coach Barkley"
                message="Focus on those weave poles! Speed is good, but precision is what wins the blue ribbon. Ready for another set?"
                color="#e53935"
            />

            {/* Achievement Wall */}
            <group position={[0, 3, -5.9]}>
                <Box args={[6, 3, 0.05]} position={[0, 0, 0]}>
                    <meshStandardMaterial color="#37474f" />
                </Box>
                <Text position={[0, 1.2, 0.06]} fontSize={0.3} color="#fdd835">LEGENDS OF AGILITY</Text>
                {/* Trophy Icons (Small Spheres) */}
                {[-2, -1, 0, 1, 2].map((x) => (
                    <Sphere key={x} args={[0.15]} position={[x, 0.5, 0.1]}>
                        <meshStandardMaterial color="#ffc107" metalness={0.8} />
                    </Sphere>
                ))}
                {/* Fake Listing */}
                <Text position={[0, -0.5, 0.06]} fontSize={0.15} color="#fff" anchorX="center">
                    1. Zeus - 0:42\n2. Luna - 0:45\n3. Cooper - 0:48\n4. Bailey - 0:51
                </Text>
            </group>

            {/* ========== LIGHTING ========== */}
            <pointLight position={[0, 5, 0]} intensity={2} color="#fff" distance={20} />
            <pointLight position={[-4, 3, 4]} intensity={1} color="#fff1d0" distance={10} />
            <ambientLight intensity={0.4} />
        </group>
    );
}
