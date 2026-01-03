import React, { useState } from 'react';
import { Box, Cylinder, Text } from '@react-three/drei';

export function PlayPavilion(props: any & { onSignClick?: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <group {...props}>
            {/* ========== RUSTIC PLAY AREA (OPEN) ========== */}

            {/* Support Pillars (Weathered Corner Logs) - Downsized to 10x10x3.5 */}
            {[[-5, 5], [5, 5], [-5, -5], [5, -5]].map(([x, z], i) => (
                <Cylinder key={i} args={[0.12, 0.12, 3.5, 8]} position={[x, 1.75, z]} castShadow>
                    <meshStandardMaterial color="#5e5044" roughness={0.9} />
                </Cylinder>
            ))}

            {/* Rustic Beam Structure (No solid roof, just cross-beams for vines/hanging toys) */}
            <Box args={[10, 0.12, 0.12]} position={[0, 3.4, 5]} castShadow>
                <meshStandardMaterial color="#5e5044" roughness={0.9} />
            </Box>
            <Box args={[10, 0.12, 0.12]} position={[0, 3.4, -5]} castShadow>
                <meshStandardMaterial color="#5e5044" roughness={0.9} />
            </Box>
            <Box args={[0.12, 0.12, 10]} position={[5, 3.4, 0]} castShadow>
                <meshStandardMaterial color="#5e5044" roughness={0.9} />
            </Box>
            <Box args={[0.12, 0.12, 10]} position={[-5, 3.4, 0]} castShadow>
                <meshStandardMaterial color="#5e5044" roughness={0.9} />
            </Box>

            {/* Weathered Wooden Sign - CLICKABLE */}
            <group
                position={[0, 3.8, 5.1]}
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
                <Box args={[3.2, 0.7, 0.1]} castShadow>
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
                    PLAY AREA
                </Text>
            </group>

            {/* Scattered Toys (Randomized Cluster) */}
            <group position={[0, 0, 0]}>
                {[1, 2, 3, 4, 5].map((_, i) => (
                    <mesh
                        key={i}
                        position={[(Math.random() - 0.5) * 4, 0.15, (Math.random() - 0.5) * 4]}
                        rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}
                        castShadow
                    >
                        {i % 2 === 0 ? <sphereGeometry args={[0.2 + Math.random() * 0.1, 16, 16]} /> : <boxGeometry args={[0.3, 0.3, 0.3]} />}
                        <meshStandardMaterial
                            color={["#ff6b6b", "#4ecdc4", "#ffe66d", "#1a535c", "#f7fff7"][i % 5]}
                            roughness={0.6}
                        />
                    </mesh>
                ))}
            </group>

            {/* Storage Log (Fallen log used for sitting or toy storage) */}
            <group position={[-3, 0.25, -3]} rotation={[0, Math.PI / 4, Math.PI / 2]}>
                <Cylinder args={[0.3, 0.3, 4, 8]} castShadow>
                    <meshStandardMaterial color="#5e5044" roughness={0.9} />
                </Cylinder>
            </group>

            {/* Subtle Fairy Lights (Replacing point light) */}
            <group position={[0, 3.2, 0]}>
                {[[-5, 5], [5, 5], [-5, -5], [5, -5]].map(([x, z], i) => (
                    <pointLight key={i} position={[x, 0, z]} intensity={0.5} distance={5} color="#fffacd" />
                ))}
            </group>
        </group>
    );
}
