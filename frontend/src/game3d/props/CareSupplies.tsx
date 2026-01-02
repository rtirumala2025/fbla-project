import React from 'react';
import { Box, Cylinder, Sphere } from '@react-three/drei';

export function CareSupplies(props: any) {
    return (
        <group {...props}>
            {/* 1. FIRST AID KIT (Health Care) - Placed on top of something usually, acts as standalone prop here */}
            <group position={[0, 0, 0]}>
                {/* Box */}
                <Box args={[0.35, 0.15, 0.25]} position={[0, 0.075, 0]} castShadow>
                    <meshStandardMaterial color="#cc0000" roughness={0.3} />
                </Box>
                {/* Handle */}
                <Box args={[0.08, 0.04, 0.02]} position={[0, 0.17, 0]} castShadow>
                    <meshStandardMaterial color="#eee" />
                </Box>
                {/* White Cross Symbol */}
                <Box args={[0.12, 0.04, 0.26]} position={[0, 0.08, 0]}>
                    <meshStandardMaterial color="#ffffff" />
                </Box>
                <Box args={[0.04, 0.12, 0.26]} position={[0, 0.08, 0]}>
                    <meshStandardMaterial color="#ffffff" />
                </Box>
            </group>

            {/* 2. PREMIUM DOG FOOD BAG (Supply Cost) */}
            <group position={[0.6, 0.25, 0.2]} rotation={[0, -0.4, 0.1]}>
                <Box args={[0.4, 0.6, 0.2]} castShadow>
                    <meshStandardMaterial color="#8B4513" roughness={0.8} />
                </Box>
                {/* Label */}
                <Box args={[0.3, 0.2, 0.21]} position={[0, 0.1, 0]}>
                    <meshStandardMaterial color="#f0e68c" />
                </Box>
            </group>

            {/* 3. TOY BIN (Toy Purchases) */}
            <group position={[-0.7, 0, 0.3]} rotation={[0, 0.2, 0]}>
                {/* Crate - Simplified */}
                <Box args={[0.6, 0.25, 0.4]} position={[0, 0.125, 0]} castShadow>
                    <meshStandardMaterial color="#654321" />
                </Box>
                {/* Inner Content (Balls) */}
                <Sphere args={[0.08]} position={[-0.15, 0.2, 0]} castShadow><meshStandardMaterial color="#ff0000" /></Sphere>
                <Sphere args={[0.08]} position={[0.15, 0.2, -0.05]} castShadow><meshStandardMaterial color="#00ff00" /></Sphere>
                <Sphere args={[0.08]} position={[0, 0.2, 0.1]} castShadow><meshStandardMaterial color="#0000ff" /></Sphere>
                <Cylinder args={[0.1, 0.1, 0.02]} position={[0.1, 0.22, 0.1]} rotation={[0.4, 0, 0]}><meshStandardMaterial color="#ff00ff" /></Cylinder>
            </group>
        </group>
    );
}
