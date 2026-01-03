import React, { useState } from 'react';
import { Box, Cylinder, Text } from '@react-three/drei';
import { Bench } from './Bench';
import { LampPost } from './LampPost';

export function RestShelter(props: any & { onSignClick?: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <group {...props}>
            {/* ========== RUSTIC REST STOP (OUTDOOR) ========== */}

            {/* Wooden Deck Floor - INTEGRATED */}
            <Box args={[12, 0.2, 10]} position={[0, 0.1, 0]} receiveShadow>
                <meshStandardMaterial color="#6e5a4e" roughness={0.9} />
            </Box>

            {/* Corner Posts (Rustic Logs) */}
            {[[-5.5, 4.5], [5.5, 4.5], [-5.5, -4.5], [5.5, -4.5]].map(([x, z], i) => (
                <Cylinder key={i} args={[0.15, 0.15, 3.2, 8]} position={[x, 1.6, z]} castShadow>
                    <meshStandardMaterial color="#5e5044" roughness={0.9} />
                </Cylinder>
            ))}

            {/* Rustic Beam Frame (No solid roof, just rails for natural feel) */}
            <Box args={[12, 0.15, 0.15]} position={[0, 3.2, 4.5]} castShadow>
                <meshStandardMaterial color="#5e5044" roughness={0.9} />
            </Box>
            <Box args={[12, 0.15, 0.15]} position={[0, 3.2, -4.5]} castShadow>
                <meshStandardMaterial color="#5e5044" roughness={0.9} />
            </Box>
            <Box args={[0.15, 0.15, 10]} position={[5.5, 3.2, 0]} castShadow>
                <meshStandardMaterial color="#5e5044" roughness={0.9} />
            </Box>
            <Box args={[0.15, 0.15, 10]} position={[-5.5, 3.2, 0]} castShadow>
                <meshStandardMaterial color="#5e5044" roughness={0.9} />
            </Box>

            {/* Weathered Wooden Sign - CLICKABLE */}
            <group
                position={[0, 3.6, 4.6]}
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
                <Box args={[4.2, 0.8, 0.1]} castShadow>
                    <meshStandardMaterial color={isHovered ? "#9e8e7e" : "#7e6d5d"} roughness={0.9} />
                </Box>
                <Text
                    position={[0, 0, 0.06]}
                    fontSize={0.3}
                    color={isHovered ? "#ffffdd" : "#eeeeee"}
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.02}
                    outlineColor="#000000"
                >
                    REST & RELAXATION
                </Text>
            </group>

            {/* Integrated Seating (Bench) */}
            <Bench position={[0, 0.2, -2]} rotation={0} />

            {/* Rustic Water Station (Replacing the medical table) */}
            <group position={[-4, 0.1, 0]}>
                <Box args={[1.5, 0.5, 1.5]} position={[0, 0.25, 0]} castShadow>
                    <meshStandardMaterial color="#5e5044" roughness={0.9} />
                </Box>
                <group position={[0, 0.6, 0]}>
                    <Cylinder args={[0.25, 0.2, 0.15, 32]} castShadow>
                        <meshStandardMaterial color="#b0b0b0" roughness={0.3} metalness={0.8} />
                    </Cylinder>
                    <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[0.22, 32]} />
                        <meshStandardMaterial color="#306090" roughness={0.1} transparent opacity={0.8} />
                    </mesh>
                </group>
            </group>

            {/* Potted Trail Plant */}
            <group position={[4.5, 0.1, 3]}>
                <Cylinder args={[0.3, 0.25, 0.5, 8]} position={[0, 0.25, 0]} castShadow>
                    <meshStandardMaterial color="#5e5044" roughness={0.9} />
                </Cylinder>
                <mesh position={[0, 0.7, 0]} castShadow>
                    <sphereGeometry args={[0.4, 8, 8]} />
                    <meshStandardMaterial color="#228b22" roughness={0.7} />
                </mesh>
            </group>

            {/* Warm Lantern Light */}
            <group position={[-5.5, 3, 0]}>
                <pointLight intensity={1.5} distance={12} color="#ffa500" />
            </group>
        </group>
    );
}
