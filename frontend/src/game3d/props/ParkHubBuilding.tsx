import React, { useState } from 'react';
import { Box, Cylinder, Text } from '@react-three/drei';

export function ParkHubBuilding(props: any & { onSignClick?: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <group {...props}>
            {/* ========== FOUNDATION & FLOOR ========== */}
            <Box args={[8, 0.3, 8]} position={[0, 0.15, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#6e5a4e" roughness={0.9} />
            </Box>

            {/* ========== MAIN STRUCTURE ========== */}
            {/* Back Wall */}
            <Box args={[8, 3.5, 0.2]} position={[0, 1.9, -3.9]} castShadow receiveShadow>
                <meshStandardMaterial color="#5e4a3c" roughness={0.8} />
            </Box>
            {/* Side Walls */}
            <Box args={[0.2, 3.5, 8]} position={[-3.9, 1.9, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#5e4a3c" roughness={0.8} />
            </Box>
            <Box args={[0.2, 3.5, 8]} position={[3.9, 1.9, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#5e4a3c" roughness={0.8} />
            </Box>

            {/* Front Wall (Split for Entrance) */}
            <Box args={[3, 3.5, 0.2]} position={[-2.5, 1.9, 3.9]} castShadow receiveShadow>
                <meshStandardMaterial color="#5e4a3c" roughness={0.8} />
            </Box>
            <Box args={[3, 3.5, 0.2]} position={[2.5, 1.9, 3.9]} castShadow receiveShadow>
                <meshStandardMaterial color="#5e4a3c" roughness={0.8} />
            </Box>
            <Box args={[2, 1, 0.2]} position={[0, 3.15, 3.9]} castShadow receiveShadow>
                <meshStandardMaterial color="#5e4a3c" roughness={0.8} />
            </Box>

            {/* ========== PORCH AREA ========== */}
            <Box args={[10, 0.2, 3]} position={[0, 0.1, 5.5]} castShadow receiveShadow>
                <meshStandardMaterial color="#8b4513" roughness={0.8} />
            </Box>
            {/* Porch Pillars */}
            <Cylinder args={[0.1, 0.1, 3.5, 12]} position={[-4.5, 1.9, 6.5]} castShadow>
                <meshStandardMaterial color="#3d2b1f" />
            </Cylinder>
            <Cylinder args={[0.1, 0.1, 3.5, 12]} position={[4.5, 1.9, 6.5]} castShadow>
                <meshStandardMaterial color="#3d2b1f" />
            </Cylinder>

            {/* ========== ROOF ========== */}
            <group position={[0, 3.6, 0]}>
                <Box args={[8.5, 0.25, 5]} position={[0, 0.8, -2.5]} rotation={[0.4, 0, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color="#2d4a22" roughness={0.6} />
                </Box>
                <Box args={[8.5, 0.25, 5]} position={[0, 0.8, 2.5]} rotation={[-0.4, 0, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color="#2d4a22" roughness={0.6} />
                </Box>
            </group>

            {/* ========== WINDOWS ========== */}
            <Box args={[2.5, 2, 0.05]} position={[-2.5, 1.8, 3.95]} castShadow>
                <meshStandardMaterial color="#88ccff" transparent opacity={0.3} metalness={0.9} roughness={0.1} />
            </Box>
            <Box args={[2.5, 2, 0.05]} position={[2.5, 1.8, 3.95]} castShadow>
                <meshStandardMaterial color="#88ccff" transparent opacity={0.3} metalness={0.9} roughness={0.1} />
            </Box>

            {/* ========== SIGNAGE ========== */}
            <group
                position={[0, 3.8, 6.6]}
                onPointerEnter={() => {
                    setIsHovered(true);
                    document.body.style.cursor = 'pointer';
                }}
                onPointerLeave={() => {
                    setIsHovered(false);
                    document.body.style.cursor = 'auto';
                }}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    props.onSignClick?.();
                }}
            >
                <Box args={[4, 0.8, 0.15]} castShadow>
                    <meshStandardMaterial color={isHovered ? "#9eb23b" : "#7b8f2a"} />
                </Box>
                <Text
                    position={[0, 0, 0.1]}
                    fontSize={0.4}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.03}
                    outlineColor="#000000"
                >
                    PARK HUB
                </Text>
            </group>
        </group>
    );
}
