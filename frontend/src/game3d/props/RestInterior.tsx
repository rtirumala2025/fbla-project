import React from 'react';
import { Box, Sphere } from '@react-three/drei';
import { ActivityGuide } from './ActivityGuide';

export function RestInterior() {
    return (
        <group position={[0, 0, 0]}>
            {/* Soft Carpet Floor */}
            <Box args={[10, 0.2, 10]} position={[0, 0.1, 0]}>
                <meshStandardMaterial color="#e0d5c0" roughness={1} />
            </Box>

            {/* Cozy Beds */}
            <group position={[0, 0.2, 0]}>
                {[[-2.5, -2], [2.5, -2], [0, 2]].map((pos, i) => (
                    <group key={i} position={[pos[0], 0.1, pos[1]]}>
                        <Box args={[2.5, 0.4, 2.5]} radius={0.2}>
                            <meshStandardMaterial color="#aa88cc" roughness={0.9} />
                        </Box>
                        <Box args={[2.2, 0.1, 2.2]} position={[0, 0.25, 0]}>
                            <meshStandardMaterial color="#ffffff" />
                        </Box>
                    </group>
                ))}
            </group>

            {/* Rest Guide */}
            <ActivityGuide
                position={[0, 1, 0]}
                name="Siesta"
                message="Shhh... it's quiet time. A deep sleep here will fully restore your energy and health."
                color="#8866aa"
            />

            {/* Night Sky Projector effect */}
            <group position={[0, 4, 0]}>
                {Array.from({ length: 30 }).map((_, i) => (
                    <Sphere key={i} args={[0.02]} position={[(Math.random() - 0.5) * 8, (Math.random() - 0.5) * 1, (Math.random() - 0.5) * 8]}>
                        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
                    </Sphere>
                ))}
            </group>

            <pointLight position={[0, 4, 0]} intensity={0.8} color="#aaaaff" distance={12} />
            <ambientLight intensity={0.2} />
        </group>
    );
}
