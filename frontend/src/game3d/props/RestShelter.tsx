import React, { useState } from 'react';
import { Box, Cylinder, Text } from '@react-three/drei';
import { Bench } from './Bench';

export function RestShelter(props: any & { onSignClick?: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <group {...props}>
            {/* Wooden Deck Floor (10x10) */}
            <Box args={[10, 0.2, 10]} position={[0, 0.1, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#d2691e" roughness={0.8} />
            </Box>

            {/* Back Wall (10x3.2) */}
            <Box args={[10, 3.2, 0.2]} position={[0, 1.7, -4.9]} castShadow receiveShadow>
                <meshStandardMaterial color="#8b4513" roughness={0.7} />
            </Box>

            {/* Front Supports */}
            <Box args={[0.2, 3.2, 0.2]} position={[-4, 1.7, 4]} castShadow>
                <meshStandardMaterial color="#654321" roughness={0.8} />
            </Box>
            <Box args={[0.2, 3.2, 0.2]} position={[4, 1.7, 4]} castShadow>
                <meshStandardMaterial color="#654321" roughness={0.8} />
            </Box>

            {/* Pitched Roof */}
            <group position={[0, 3.3, 0]}>
                <Box args={[11, 0.2, 6]} position={[0, 0.6, -2.5]} rotation={[0.4, 0, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color="#701717" roughness={0.6} />
                </Box>
                <Box args={[11, 0.2, 6]} position={[0, 0.6, 2.5]} rotation={[-0.4, 0, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color="#701717" roughness={0.6} />
                </Box>
            </group>

            {/* Signage */}
            <Text
                position={[0, 4.2, 4.2]}
                fontSize={0.6}
                color={isHovered ? "#ffff99" : "#ffffff"}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.06}
                onPointerEnter={() => setIsHovered(true)}
                onPointerLeave={() => setIsHovered(false)}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    props.onSignClick?.();
                }}
            >
                REST AREA
            </Text>

            {/* Bench */}
            <Bench position={[0, 0.2, -3]} rotation={0} />

            <pointLight position={[0, 3, -2]} intensity={1.5} distance={12} color="#ffa500" />
        </group>
    );
}
