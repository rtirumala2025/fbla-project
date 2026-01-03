import React, { useMemo, useState } from 'react';
import { Box, Text } from '@react-three/drei';
import { makeStoneTexture } from '../core/AssetLoader';

export function AgilityTrainingCenter(props: any & { onSignClick?: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    const floorTex = useMemo(() => {
        const t = makeStoneTexture();
        t.repeat.set(4, 4);
        return t;
    }, []);

    const metalColor = "#b0b6bc";
    const frameColor = "#50565c";
    const accentColor = "#ffaa00"; // Caution orange

    return (
        <group {...props}>
            {/* ========== CONCRETE SLAB ========== */}
            <Box args={[14.2, 0.4, 10.2]} position={[0, 0.2, 0]} receiveShadow>
                <meshStandardMaterial map={floorTex} color="#bbbbbb" />
            </Box>

            {/* ========== HANGER STRUCTURE ========== */}
            <group position={[0, 0.4, 0]}>
                {/* Back Wall */}
                <Box args={[14, 4.2, 0.2]} position={[0, 2.1, -4.9]} castShadow receiveShadow>
                    <meshStandardMaterial color={metalColor} metalness={0.6} roughness={0.3} />
                </Box>
                {/* Side Walls */}
                <Box args={[0.2, 4.2, 10]} position={[-6.9, 2.1, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color={metalColor} metalness={0.6} roughness={0.3} />
                </Box>
                <Box args={[0.2, 4.2, 10]} position={[6.9, 2.1, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color={metalColor} metalness={0.6} roughness={0.3} />
                </Box>

                {/* Front Facade (Modern open look) */}
                <Box args={[4, 4.2, 0.2]} position={[-5, 2.1, 4.9]} castShadow receiveShadow>
                    <meshStandardMaterial color={metalColor} metalness={0.6} roughness={0.3} />
                </Box>
                <Box args={[4, 4.2, 0.2]} position={[5, 2.1, 4.9]} castShadow receiveShadow>
                    <meshStandardMaterial color={metalColor} metalness={0.6} roughness={0.3} />
                </Box>
                <Box args={[6, 1, 0.2]} position={[0, 3.7, 4.9]} castShadow receiveShadow>
                    <meshStandardMaterial color={metalColor} metalness={0.6} roughness={0.3} />
                </Box>

                {/* Visible Structural Girders (Steel) */}
                {[[-6.8, -4.8], [6.8, -4.8], [-6.8, 4.8], [6.8, 4.8]].map((pos, i) => (
                    <Box key={i} args={[0.4, 4.4, 0.4]} position={[pos[0], 2.2, pos[1]]} castShadow>
                        <meshStandardMaterial color={frameColor} metalness={0.8} />
                    </Box>
                ))}
                {/* Roof Girders */}
                {Array.from({ length: 3 }).map((_, i) => (
                    <Box key={i} args={[13.8, 0.2, 0.2]} position={[0, 4.1, -4 + i * 4]} castShadow>
                        <meshStandardMaterial color={frameColor} metalness={0.8} />
                    </Box>
                ))}
            </group>

            {/* ========== ROOF (Arched look with Boxes) ========== */}
            <group position={[0, 4.7, 0]}>
                <Box args={[14.4, 0.15, 6]} position={[0, 0.55, -2.2]} rotation={[0.2, 0, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color={frameColor} metalness={0.5} />
                </Box>
                <Box args={[14.4, 0.15, 6]} position={[0, 0.55, 2.2]} rotation={[-0.2, 0, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color={frameColor} metalness={0.5} />
                </Box>
                {/* Center Skylight Panel */}
                <Box args={[14, 0.05, 2.5]} position={[0, 0.9, 0]} castShadow>
                    <meshStandardMaterial color="#88ccff" transparent opacity={0.3} metalness={0.9} />
                </Box>
            </group>

            {/* ========== SIGNAGE ========== */}
            <group
                position={[0, 5.2, 5.2]}
                onPointerEnter={() => setIsHovered(true)}
                onPointerLeave={() => setIsHovered(false)}
                onPointerDown={(e) => { e.stopPropagation(); props.onSignClick?.(); }}
            >
                <Box args={[5, 1, 0.2]} castShadow>
                    <meshStandardMaterial color={isHovered ? accentColor : frameColor} />
                </Box>
                <Text
                    position={[0, 0, 0.12]}
                    fontSize={0.45}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.04}
                    outlineColor="#000000"
                >
                    AGILITY CENTER
                </Text>
            </group>

            <pointLight position={[0, 4, 0]} intensity={2} color="#ccf" distance={15} />
            {/* Caution tape detail */}
            <Box args={[14.1, 0.1, 0.05]} position={[0, 1.2, 5.05]}><meshStandardMaterial color={accentColor} /></Box>
        </group>
    );
}
