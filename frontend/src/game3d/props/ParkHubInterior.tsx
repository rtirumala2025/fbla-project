import React from 'react';
import { Box, Cylinder, Text, Sphere } from '@react-three/drei';
import { ActivityGuide } from './ActivityGuide';
import { makeWoodTexture, makeStoneTexture } from '../core/AssetLoader';

export function ParkHubInterior() {
    const woodTex = React.useMemo(() => makeWoodTexture(), []);
    const stoneTex = React.useMemo(() => makeStoneTexture(), []);

    return (
        <group position={[0, 0, 0]}>
            {/* Floor */}
            <Box args={[10, 0.2, 10]} position={[0, 0.1, 0]}>
                <meshStandardMaterial map={woodTex} color="#5d4037" />
            </Box>

            {/* Reception Desk */}
            <group position={[0, 0.2, -3]}>
                <Box args={[4, 1, 1]} position={[0, 0.5, 0]}>
                    <meshStandardMaterial color="#2c1e1a" metalness={0.2} roughness={0.8} />
                </Box>
                <Box args={[4.2, 0.1, 1.2]} position={[0, 1, 0]}>
                    <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.2} />
                </Box>
            </group>

            {/* Guide Character */}
            <ActivityGuide
                position={[2, 1, -2.5]}
                name="Advisor"
                message="Welcome to the Park Hub! Check your balance and plan your pet's future here. Need help earning coins?"
            />

            {/* Interior Props: Shelves */}
            <group position={[-4, 0.2, -4]}>
                <Box args={[0.1, 4, 2]} position={[0, 2, 1]}><meshStandardMaterial color="#2c1e1a" /></Box>
                {[1, 2, 3].map(y => (
                    <Box key={y} args={[1.5, 0.1, 1.8]} position={[0.7, y, 1]}><meshStandardMaterial color="#4a3b2f" /></Box>
                ))}
            </group>

            {/* Small Waiting Area */}
            <group position={[-3, 0.2, 3]}>
                <Box args={[2, 0.5, 2]} position={[0, 0.25, 0]}><meshStandardMaterial color="#8b4513" /></Box>
            </group>

            {/* Lighting */}
            <pointLight position={[0, 4, 0]} intensity={2} color="#fff1d0" distance={15} />
            <ambientLight intensity={0.5} />
        </group>
    );
}
