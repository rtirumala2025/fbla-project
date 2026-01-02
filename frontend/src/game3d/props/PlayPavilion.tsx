import React, { useState } from 'react';
import { Box, Cylinder, Text } from '@react-three/drei';

export function PlayPavilion(props: any & { onSignClick?: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <group {...props}>
            {/* ========== STRUCTURE ========== */}

            {/* 4 Corner Support Pillars (Resized to 15x15x4.5) */}
            <Cylinder args={[0.2, 0.2, 4.5, 16]} position={[-7.5, 2.25, -7.5]} castShadow>
                <meshStandardMaterial color="#8b4513" roughness={0.8} />
            </Cylinder>
            <Cylinder args={[0.2, 0.2, 4.5, 16]} position={[7.5, 2.25, -7.5]} castShadow>
                <meshStandardMaterial color="#8b4513" roughness={0.8} />
            </Cylinder>
            <Cylinder args={[0.2, 0.2, 4.5, 16]} position={[-7.5, 2.25, 7.5]} castShadow>
                <meshStandardMaterial color="#8b4513" roughness={0.8} />
            </Cylinder>
            <Cylinder args={[0.2, 0.2, 4.5, 16]} position={[7.5, 2.25, 7.5]} castShadow>
                <meshStandardMaterial color="#8b4513" roughness={0.8} />
            </Cylinder>

            {/* Wooden Beam Roof Structure - Cross Beams */}
            <Box args={[15, 0.3, 0.3]} position={[0, 4.5, -7.5]} rotation={[0, 0, 0.04]} castShadow>
                <meshStandardMaterial color="#a0522d" roughness={0.7} />
            </Box>
            <Box args={[15, 0.3, 0.3]} position={[0, 4.5, 0]} rotation={[0, 0, -0.04]} castShadow>
                <meshStandardMaterial color="#a0522d" roughness={0.7} />
            </Box>
            <Box args={[15, 0.3, 0.3]} position={[0, 4.5, 7.5]} rotation={[0, 0, 0.04]} castShadow>
                <meshStandardMaterial color="#a0522d" roughness={0.7} />
            </Box>

            {/* Perpendicular Beams */}
            <Box args={[0.3, 0.3, 15]} position={[-7.5, 4.5, 0]} castShadow>
                <meshStandardMaterial color="#a0522d" roughness={0.7} />
            </Box>
            <Box args={[0.3, 0.3, 15]} position={[0, 4.5, 0]} castShadow>
                <meshStandardMaterial color="#a0522d" roughness={0.7} />
            </Box>
            <Box args={[0.3, 0.3, 15]} position={[7.5, 4.5, 0]} castShadow>
                <meshStandardMaterial color="#a0522d" roughness={0.7} />
            </Box>

            {/* Roof Covering - Wood Planks */}
            <Box args={[15.5, 0.15, 15.5]} position={[0, 4.8, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#cd853f" roughness={0.8} />
            </Box>

            {/* Exterior Signage - CLICKABLE */}
            <Text
                position={[0, 5.2, 7.6]}
                rotation={[0, 0, 0]}
                fontSize={isHovered ? 1.15 : 1}
                color={isHovered ? "#ff8c00" : "#654321"}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.08}
                outlineColor="#ffffff"
                onPointerEnter={(e) => {
                    e.stopPropagation();
                    setIsHovered(true);
                    document.body.style.cursor = 'pointer';
                }}
                onPointerLeave={(e) => {
                    e.stopPropagation();
                    setIsHovered(false);
                    document.body.style.cursor = 'auto';
                }}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    props.onSignClick?.();
                }}
            >
                PLAY AREA
            </Text>

            {/* ========== INTERIOR (Open-Air) ========== */}

            {/* Natural Grass Floor (No special flooring - leave natural terrain) */}

            {/* Toy Storage Bins along Pillars (Smaller) */}
            <Box args={[1.2, 0.8, 1.2]} position={[-7.5, 0.4, -7.5]} castShadow>
                <meshStandardMaterial color="#8b4513" roughness={0.7} />
            </Box>
            <Box args={[1.2, 0.8, 1.2]} position={[7.5, 0.4, -7.5]} castShadow>
                <meshStandardMaterial color="#8b4513" roughness={0.7} />
            </Box>
            <Box args={[1.2, 0.8, 1.2]} position={[-7.5, 0.4, 7.5]} castShadow>
                <meshStandardMaterial color="#8b4513" roughness={0.7} />
            </Box>
            <Box args={[1.2, 0.8, 1.2]} position={[7.5, 0.4, 7.5]} castShadow>
                <meshStandardMaterial color="#8b4513" roughness={0.7} />
            </Box>

            {/* Toys on Ground (sample toys - existing toys will be placed by parent) */}
            <mesh position={[-3, 0.15, -2]} rotation={[0, 0.5, 0]} castShadow receiveShadow>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial color="#ff6b6b" roughness={0.4} />
            </mesh>
            <mesh position={[3, 0.15, 2]} rotation={[0, 1, 0]} castShadow receiveShadow>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial color="#4ecdc4" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.15, -3]} rotation={[0, 0.3, 0]} castShadow receiveShadow>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial color="#ffe66d" roughness={0.4} />
            </mesh>

            {/* Ambient Lighting (natural daylight) */}
            <pointLight position={[0, 4, 0]} intensity={1.2} distance={20} color="#fffacd" />
        </group>
    );
}
