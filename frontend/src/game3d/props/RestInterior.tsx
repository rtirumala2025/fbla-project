import React from 'react';
import { Box, Sphere, Cylinder, Text, Cone } from '@react-three/drei';
import { ActivityGuide } from './ActivityGuide';

export function RestInterior() {
    return (
        <group position={[0, 0, 0]}>
            {/* ========== SOFT CARPET FLOOR ========== */}
            <Box args={[12, 0.2, 10]} position={[0, 0.1, 0]}>
                <meshStandardMaterial color="#303f9f" roughness={1} />
            </Box>
            {/* Plush Rug Center */}
            <Box args={[8, 0.05, 6]} position={[0, 0.22, 0]} receiveShadow>
                <meshStandardMaterial color="#5c6bc0" roughness={1} />
            </Box>

            {/* ========== PRIVATE SLEEPING PODS ========== */}
            <group position={[0, 0.2, 0]}>
                {[[-3.5, -2], [3.5, -2], [0, 2]].map((pos, i) => (
                    <group key={i} position={[pos[0], 0, pos[1]]}>
                        {/* Bed Base */}
                        <Box args={[3, 0.5, 3]} position={[0, 0.25, 0]} castShadow>
                            <meshStandardMaterial color="#1a237e" />
                        </Box>
                        {/* Mattress */}
                        <Box args={[2.8, 0.2, 2.8]} position={[0, 0.55, 0]}>
                            <meshStandardMaterial color="#e8eaf6" />
                        </Box>
                        {/* Curtains/Privacy Screen */}
                        <Box args={[0.1, 2, 3]} position={[-1.55, 1, 0]}><meshStandardMaterial color="#3949ab" transparent opacity={0.6} /></Box>
                        <Box args={[0.1, 2, 3]} position={[1.55, 1, 0]}><meshStandardMaterial color="#3949ab" transparent opacity={0.6} /></Box>

                        {/* Personal Lamp */}
                        <group position={[1.2, 0.5, 1.2]}>
                            <Cylinder args={[0.05, 0.05, 1, 8]} position={[0, 0.5, 0]}><meshStandardMaterial color="#333" /></Cylinder>
                            <Cone args={[0.2, 0.3, 12]} position={[0, 1.1, 0]}>
                                <meshStandardMaterial color="#fff8e1" emissive="#fff8e1" emissiveIntensity={0.5} />
                            </Cone>
                            <pointLight position={[0, 1.1, 0]} intensity={0.5} color="#fff8e1" distance={4} />
                        </group>
                    </group>
                ))}
            </group>

            {/* ========== RELAXATION FEATURE (Aquarium) ========== */}
            <group position={[0, 0.2, -4.5]}>
                <Box args={[5, 2.5, 0.8]} position={[0, 1.25, 0]} castShadow>
                    <meshStandardMaterial color="#263238" />
                </Box>
                {/* Water Area */}
                <Box args={[4.6, 1.8, 0.6]} position={[0, 1.35, 0.15]}>
                    <meshStandardMaterial color="#00bcd4" transparent opacity={0.4} emissive="#00bcd4" emissiveIntensity={0.2} />
                </Box>
                {/* Fish (Small Spheres) */}
                {Array.from({ length: 8 }).map((_, i) => (
                    <Sphere key={i} args={[0.05]} position={[
                        (Math.random() - 0.5) * 4,
                        0.8 + Math.random() * 1,
                        0.2
                    ]}>
                        <meshStandardMaterial color={['#ff9800', '#f48fb1', '#fff'][i % 3]} />
                    </Sphere>
                ))}
            </group>

            {/* ========== AMBIENT EFFECTS ========== */}
            {/* Floating "Sleep Particles" */}
            <group position={[0, 3, 0]}>
                {Array.from({ length: 40 }).map((_, i) => (
                    <Sphere key={i} args={[0.02]} position={[
                        (Math.random() - 0.5) * 10,
                        (Math.random() - 0.5) * 2,
                        (Math.random() - 0.5) * 8
                    ]}>
                        <meshStandardMaterial color="#9fa8da" emissive="#9fa8da" emissiveIntensity={1.5} transparent opacity={0.6} />
                    </Sphere>
                ))}
            </group>

            {/* ========== REST GUIDE ========== */}
            <ActivityGuide
                position={[-4, 1, 3]}
                name="Snoozie"
                message="Deep breaths... the aquarium is so calming, isn't it? Take a nap in any pod to feel 100% again."
                color="#7986cb"
            />

            {/* ========== LIGHTING ========== */}
            <pointLight position={[0, 5, 0]} intensity={1.2} color="#c5cae9" distance={15} />
            <pointLight position={[0, 2, -4]} intensity={1} color="#00bcd4" distance={8} />
            <ambientLight intensity={0.3} />
        </group>
    );
}
