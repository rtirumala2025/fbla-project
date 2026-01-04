import React from 'react';
import { Box, Sphere, Cylinder } from '@react-three/drei';
import { ActivityGuide } from './ActivityGuide';

export function PlayInterior() {
    return (
        <group position={[0, 0, 0]}>
            {/* Play Mat Floor */}
            <Box args={[12, 0.2, 12]} position={[0, 0.1, 0]}>
                <meshStandardMaterial color="#44aaee" roughness={0.8} />
            </Box>

            {/* Ball Pit (Simple Sphere collection) */}
            <group position={[-3, 0.2, -3]}>
                <Box args={[4, 0.5, 4]} position={[0, 0.25, 0]}>
                    <meshStandardMaterial color="#fff" transparent opacity={0.3} />
                </Box>
                {Array.from({ length: 20 }).map((_, i) => (
                    <Sphere key={i} args={[0.2]} position={[(Math.random() - 0.5) * 3, 0.2, (Math.random() - 0.5) * 3]}>
                        <meshStandardMaterial color={['#f44', '#4f4', '#44f', '#ff4'][i % 4]} />
                    </Sphere>
                ))}
            </group>

            {/* Activity Guide */}
            <ActivityGuide
                position={[3, 1.2, -2]}
                name="Buddy"
                message="Let's have some fun! I've got plenty of toys here. Want to jump into the ball pit?"
                color="#ffcc00"
            />

            {/* Toy Chest */}
            <group position={[4, 0.2, 4]}>
                <Box args={[2, 1, 1.5]} position={[0, 0.5, 0]}>
                    <meshStandardMaterial color="#8b4513" />
                </Box>
                <Box args={[2.1, 0.2, 1.6]} position={[0, 1.1, 0]} rotation={[0.4, 0, 0]}>
                    <meshStandardMaterial color="#8b4513" />
                </Box>
            </group>

            <pointLight position={[0, 4, 0]} intensity={2} color="#fff" />
        </group>
    );
}
