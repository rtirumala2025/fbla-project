import React from 'react';
import { Box, Cylinder, Text } from '@react-three/drei';
import { Bench } from './Bench';
import { LampPost } from './LampPost';

export function RestShelter(props: any) {
    return (
        <group {...props}>
            {/* ========== STRUCTURE ========== */}

            {/* Wooden Deck Floor - Wrap-around Porch (Resized to 18x15x4.5) */}
            <Box args={[18, 0.3, 15]} position={[0, 0.15, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#d2691e" roughness={0.8} />
            </Box>

            {/* Back Wall */}
            <Box args={[18, 4.5, 0.3]} position={[0, 2.25, -7.5]} castShadow receiveShadow>
                <meshStandardMaterial color="#8b4513" roughness={0.7} />
            </Box>

            {/* Side Walls (partial) */}
            <Box args={[0.3, 4.5, 9]} position={[-9, 2.25, -3]} castShadow receiveShadow>
                <meshStandardMaterial color="#8b4513" roughness={0.7} />
            </Box>
            <Box args={[0.3, 4.5, 9]} position={[9, 2.25, -3]} castShadow receiveShadow>
                <meshStandardMaterial color="#8b4513" roughness={0.7} />
            </Box>

            {/* Front Support Posts */}
            <Box args={[0.3, 4.5, 0.3]} position={[-7, 2.25, 1.5]} castShadow>
                <meshStandardMaterial color="#654321" roughness={0.8} />
            </Box>
            <Box args={[0.3, 4.5, 0.3]} position={[7, 2.25, 1.5]} castShadow>
                <meshStandardMaterial color="#654321" roughness={0.8} />
            </Box>

            {/* Porch Railing */}
            <Box args={[18, 0.1, 0.1]} position={[0, 1, 1.5]} castShadow>
                <meshStandardMaterial color="#a0522d" roughness={0.7} />
            </Box>

            {/* Pitched Roof (Resized) */}
            <Box args={[19.5, 0.25, 9]} position={[0, 5, -2.5]} rotation={[0.3, 0, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#701717" roughness={0.6} />
            </Box>
            <Box args={[19.5, 0.25, 9]} position={[0, 5, -2.5]} rotation={[-0.3, 0, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#701717" roughness={0.6} />
            </Box>

            {/* Exterior Signage on Front Roof Beam - FACING OUTWARD */}
            <Text
                position={[0, 5.8, 1.5]}
                rotation={[0, 0, 0]} // Face outward (Z+)
                fontSize={1}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.08}
                outlineColor="#000000"
            >
                REST & RELAXATION
            </Text>

            {/* ========== INTERIOR FURNISHINGS ========== */}

            {/* Multiple Benches (Slightly downscaled) */}
            <Bench position={[-6, 0.3, -4]} rotation={[0, 0, 0]} />
            <Bench position={[6, 0.3, -4]} rotation={[0, Math.PI, 0]} />

            {/* Small Table with Water Bowls */}
            <Box args={[1.5, 0.6, 0.8]} position={[0, 0.6, -2]} castShadow>
                <meshStandardMaterial color="#8b4513" roughness={0.7} />
            </Box>

            {/* Water Bowls on Table */}
            <group position={[0, 1, -2]}>
                <Cylinder args={[0.2, 0.15, 0.12, 32]} position={[0, 0, 0]} castShadow>
                    <meshStandardMaterial color="#b0b0b0" roughness={0.3} metalness={0.8} />
                </Cylinder>
                <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.18, 32]} />
                    <meshStandardMaterial color="#306090" roughness={0.1} transparent opacity={0.8} />
                </mesh>
            </group>

            {/* Potted Plant */}
            <group position={[7.5, 0.3, 1.5]}>
                <Cylinder args={[0.3, 0.25, 0.45, 16]} position={[0, 0.225, 0]} castShadow>
                    <meshStandardMaterial color="#8b4513" roughness={0.7} />
                </Cylinder>
                <mesh position={[0, 0.65, 0]} castShadow>
                    <sphereGeometry args={[0.35, 8, 8]} />
                    <meshStandardMaterial color="#228b22" roughness={0.7} />
                </mesh>
            </group>

            {/* Interior Lighting */}
            <pointLight position={[0, 4, -2]} intensity={1.5} distance={20} color="#ffa500" />
        </group>
    );
}
