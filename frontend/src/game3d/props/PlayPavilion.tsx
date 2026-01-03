import React, { useState } from 'react';
import { Box, Cylinder, Text } from '@react-three/drei';

export function PlayPavilion(props: any & { onSignClick?: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <group {...props}>
            {/* 4 Corner Support Pillars (Resized to 8x8 footprint) */}
            <Cylinder args={[0.15, 0.15, 3.2, 16]} position={[-4, 1.6, -4]} castShadow>
                <meshStandardMaterial color="#8b4513" roughness={0.8} />
            </Cylinder>
            <Cylinder args={[0.15, 0.15, 3.2, 16]} position={[4, 1.6, -4]} castShadow>
                <meshStandardMaterial color="#8b4513" roughness={0.8} />
            </Cylinder>
            <Cylinder args={[0.15, 0.15, 3.2, 16]} position={[-4, 1.6, 4]} castShadow>
                <meshStandardMaterial color="#8b4513" roughness={0.8} />
            </Cylinder>
            <Cylinder args={[0.15, 0.15, 3.2, 16]} position={[4, 1.6, 4]} castShadow>
                <meshStandardMaterial color="#8b4513" roughness={0.8} />
            </Cylinder>

            {/* Roof Structure */}
            <Box args={[8.5, 0.2, 8.5]} position={[0, 3.2, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#cd853f" roughness={0.8} />
            </Box>

            {/* Signage */}
            <Text
                position={[0, 3.6, 4.1]}
                fontSize={0.6}
                color={isHovered ? "#ff8c00" : "#654321"}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.05}
                onPointerEnter={() => setIsHovered(true)}
                onPointerLeave={() => setIsHovered(false)}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    props.onSignClick?.();
                }}
            >
                PLAY AREA
            </Text>

            <pointLight position={[0, 3, 0]} intensity={1.2} distance={10} color="#fffacd" />
        </group>
    );
}
