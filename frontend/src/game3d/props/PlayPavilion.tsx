import React, { useState } from 'react';
import { Box, Cylinder, Text, Sphere } from '@react-three/drei';

export function PlayPavilion(props: any & { onSignClick?: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    const pillarColor = "#4a90e2"; // Friendly Blue
    const roofColor = "#f5a623";   // Sunny Orange
    const floorColor = "#7ed321";  // Grass Green Rubber

    return (
        <group {...props}>
            {/* ========== SOFT RUBBER FLOOR ========== */}
            <Box args={[8.2, 0.4, 8.2]} position={[0, 0.2, 0]} receiveShadow>
                <meshStandardMaterial color={floorColor} roughness={0.8} />
            </Box>

            {/* ========== STRUCTURE ========== */}
            {/* 4 Corner Support Pillars (Detailed) */}
            {[[-3.8, -3.8], [3.8, -3.8], [-3.8, 3.8], [3.8, 3.8]].map((pos, i) => (
                <group key={i} position={[pos[0], 0.4, pos[1]]}>
                    <Cylinder args={[0.2, 0.2, 3.2, 16]} position={[0, 1.6, 0]} castShadow>
                        <meshStandardMaterial color={pillarColor} metalness={0.2} roughness={0.5} />
                    </Cylinder>
                    {/* Pillar Cap */}
                    <Sphere args={[0.3, 16, 16]} position={[0, 3.2, 0]} castShadow>
                        <meshStandardMaterial color="#d0021b" />
                    </Sphere>
                </group>
            ))}

            {/* Cross Beams */}
            <Box args={[8, 0.2, 0.2]} position={[0, 3.4, 3.8]} castShadow><meshStandardMaterial color={pillarColor} /></Box>
            <Box args={[8, 0.2, 0.2]} position={[0, 3.4, -3.8]} castShadow><meshStandardMaterial color={pillarColor} /></Box>
            <Box args={[0.2, 0.2, 8]} position={[3.8, 3.4, 0]} castShadow><meshStandardMaterial color={pillarColor} /></Box>
            <Box args={[0.2, 0.2, 8]} position={[-3.8, 3.4, 0]} castShadow><meshStandardMaterial color={pillarColor} /></Box>

            {/* ========== ROOF (Tensioned Fabric / Circus Look) ========== */}
            <group position={[0, 3.6, 0]}>
                <Cylinder args={[0, 5, 2, 8]} position={[0, 1, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color={roofColor} side={2} roughness={0.7} />
                </Cylinder>
                {/* Center Pole */}
                <Cylinder args={[0.1, 0.1, 3, 8]} position={[0, 1.5, 0]} castShadow>
                    <meshStandardMaterial color="#ffffff" />
                </Cylinder>
                <Sphere args={[0.2, 16, 16]} position={[0, 3, 0]}>
                    <meshStandardMaterial color="#ffd700" />
                </Sphere>
            </group>

            {/* ========== SIGNAGE ========== */}
            <group
                position={[0, 4.4, 4.2]}
                onPointerEnter={() => setIsHovered(true)}
                onPointerLeave={() => setIsHovered(false)}
                onPointerDown={(e) => { e.stopPropagation(); props.onSignClick?.(); }}
            >
                <Box args={[3.2, 0.8, 0.2]} castShadow>
                    <meshStandardMaterial color={isHovered ? "#ffffff" : "#f8e71c"} />
                </Box>
                <Text
                    position={[0, 0, 0.12]}
                    fontSize={0.4}
                    color="#4a4a4a"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.02}
                >
                    PLAY AREA
                </Text>
            </group>

            <pointLight position={[0, 3, 0]} intensity={1.5} color="#fff" distance={10} />

            {/* Small colorful balls on floor */}
            {Array.from({ length: 6 }).map((_, i) => (
                <Sphere key={i} args={[0.15]} position={[(Math.random() - 0.5) * 6, 0.55, (Math.random() - 0.5) * 6]} castShadow>
                    <meshStandardMaterial color={['#d0021b', '#f5a623', '#4a90e2', '#7ed321'][i % 4]} />
                </Sphere>
            ))}
        </group>
    );
}
