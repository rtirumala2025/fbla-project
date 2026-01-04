import React from 'react';
import { Box, Cylinder } from '@react-three/drei';
import { ActivityGuide } from './ActivityGuide';

export function VetInterior() {
    return (
        <group position={[0, 0, 0]}>
            {/* Sterile Floor */}
            <Box args={[10, 0.2, 10]} position={[0, 0.1, 0]}>
                <meshStandardMaterial color="#f0f4f8" roughness={0.5} metalness={0.1} />
            </Box>

            {/* Exam Table */}
            <group position={[0, 0.2, 0]}>
                <Box args={[3, 0.8, 1.5]} position={[0, 0.4, 0]}>
                    <meshStandardMaterial color="#ffffff" metalness={0.2} />
                </Box>
                <Box args={[3.1, 0.1, 1.6]} position={[0, 0.85, 0]}>
                    <meshStandardMaterial color="#00a8ff" transparent opacity={0.6} />
                </Box>
            </group>

            {/* Medical Guide */}
            <ActivityGuide
                position={[-2.5, 1.2, -3]}
                name="Dr. Paw"
                message="Hello! Let's do a quick physical. Stand still while I run the health scan."
                color="#00a8ff"
            />

            {/* Medical Equipment */}
            <group position={[3, 0.2, -3]}>
                <Cylinder args={[0.4, 0.4, 3, 16]} position={[0, 1.5, 0]}>
                    <meshStandardMaterial color="#bbccdd" />
                </Cylinder>
                <Box args={[0.5, 1, 0.5]} position={[0, 2.5, 0.3]}>
                    <meshStandardMaterial color="#333" emissive="#00ff00" emissiveIntensity={0.5} />
                </Box>
            </group>

            <pointLight position={[0, 4, 0]} intensity={1.5} color="#eef" />
        </group>
    );
}
