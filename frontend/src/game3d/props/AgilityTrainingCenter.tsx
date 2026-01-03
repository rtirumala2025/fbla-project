import React, { useState } from 'react';
import { Box, Cylinder, Text } from '@react-three/drei';

export function AgilityTrainingCenter(props: any & { onSignClick?: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <group {...props}>
            {/* ========== MAIN HANGER STRUCTURE ========== */}
            {/* Floor Slab */}
            <Box args={[14, 0.4, 10]} position={[0, 0.2, 0]} receiveShadow>
                <meshStandardMaterial color="#7a7a7a" roughness={0.8} />
            </Box>

            {/* Structure Walls (Downsized to 4.5m height) */}
            <Box args={[14, 4.5, 0.2]} position={[0, 2.45, -4.9]} castShadow receiveShadow>
                <meshStandardMaterial color="#b0b0b0" roughness={0.7} />
            </Box>
            <Box args={[0.2, 4.5, 10]} position={[-6.9, 2.45, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#b0b0b0" roughness={0.7} />
            </Box>
            <Box args={[0.2, 4.5, 10]} position={[6.9, 2.45, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#b0b0b0" roughness={0.7} />
            </Box>

            {/* Front Wall with Wide Openings */}
            <Box args={[3.5, 4.5, 0.2]} position={[-5.25, 2.45, 4.9]} castShadow receiveShadow>
                <meshStandardMaterial color="#b0b0b0" roughness={0.7} />
            </Box>
            <Box args={[3.5, 4.5, 0.2]} position={[5.25, 2.45, 4.9]} castShadow receiveShadow>
                <meshStandardMaterial color="#b0b0b0" roughness={0.7} />
            </Box>
            <Box args={[7, 1.3, 0.2]} position={[0, 4.05, 4.9]} castShadow receiveShadow>
                <meshStandardMaterial color="#b0b0b0" roughness={0.7} />
            </Box>

            {/* Roof Panels */}
            <group position={[0, 4.6, 0]}>
                <Box args={[14.5, 0.2, 6]} position={[0, 0.8, -2.5]} rotation={[0.3, 0, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color="#445566" roughness={0.5} metalness={0.6} />
                </Box>
                <Box args={[14.5, 0.2, 6]} position={[0, 0.8, 2.5]} rotation={[-0.3, 0, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color="#445566" roughness={0.5} metalness={0.6} />
                </Box>
            </group>

            {/* ========== SIGNAGE ========== */}
            <group
                position={[0, 5.5, 5]}
                onPointerEnter={() => setIsHovered(true)}
                onPointerLeave={() => setIsHovered(false)}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    props.onSignClick?.();
                }}
            >
                <Box args={[6, 1.2, 0.15]} castShadow>
                    <meshStandardMaterial color={isHovered ? "#5a7a5a" : "#3e5a3e"} />
                </Box>
                <Text
                    position={[0, 0, 0.1]}
                    fontSize={0.5}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.04}
                    outlineColor="#000000"
                >
                    AGILITY CENTER
                </Text>
            </group>

            <pointLight position={[0, 4, 0]} intensity={2.5} distance={15} color="#e0f0ff" />
        </group>
    );
}
