import React, { useMemo, useState } from 'react';
import { Box, Text } from '@react-three/drei';
import { CareSupplies } from './CareSupplies';
import { makeWoodTexture, makeStoneTexture } from '../core/AssetLoader';

export function VetClinic(props: any & { onSignClick?: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    const stoneTex = useMemo(() => {
        const t = makeStoneTexture();
        t.repeat.set(3, 1);
        return t;
    }, []);

    const wallColor = "#f0f2f5";
    const accentColor = "#20b2aa"; // Teal
    const frameColor = "#444444";

    return (
        <group {...props}>
            {/* ========== FOUNDATION (Stone) ========== */}
            <Box args={[10.4, 0.4, 10.4]} position={[0, 0.2, 0]} castShadow receiveShadow>
                <meshStandardMaterial map={stoneTex} color="#bbbbbb" />
            </Box>

            {/* ========== MAIN BUILDING ========== */}
            <group position={[0, 0.4, 0]}>
                {/* Back & Side Walls */}
                <Box args={[10, 3.2, 0.2]} position={[0, 1.6, -4.9]} castShadow receiveShadow>
                    <meshStandardMaterial color={wallColor} />
                </Box>
                <Box args={[0.2, 3.2, 10]} position={[-4.9, 1.6, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color={wallColor} />
                </Box>
                <Box args={[0.2, 3.2, 10]} position={[4.9, 1.6, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color={wallColor} />
                </Box>

                {/* Front Walls */}
                <Box args={[4.2, 3.2, 0.2]} position={[-2.9, 1.6, 4.9]} castShadow receiveShadow>
                    <meshStandardMaterial color={wallColor} />
                </Box>
                <Box args={[4.2, 3.2, 0.2]} position={[2.9, 1.6, 4.9]} castShadow receiveShadow>
                    <meshStandardMaterial color={wallColor} />
                </Box>
                <Box args={[1.6, 1, 0.2]} position={[0, 2.7, 4.9]} castShadow receiveShadow>
                    <meshStandardMaterial color={wallColor} />
                </Box>

                {/* Decorative Horizontal Trim (Teal) */}
                <Box args={[10.2, 0.5, 10.2]} position={[0, 3, 0]} castShadow>
                    <meshStandardMaterial color={accentColor} roughness={0.5} metalness={0.2} />
                </Box>

                {/* Vertical Corner Details */}
                {[[-4.95, -4.95], [4.95, -4.95], [-4.95, 4.95], [4.95, 4.95]].map((pos, i) => (
                    <Box key={i} args={[0.3, 3.4, 0.3]} position={[pos[0], 1.6, pos[1]]} castShadow>
                        <meshStandardMaterial color={frameColor} />
                    </Box>
                ))}
            </group>

            {/* ========== WINDOWS & DOORS ========== */}
            {/* Main Entrance (Proportionate) */}
            <group position={[0, 0.4, 5.01]}>
                {/* Glass Door */}
                <Box args={[1.6, 2.2, 0.05]} position={[0, 1.1, 0]} castShadow>
                    <meshStandardMaterial color="#88ccff" transparent opacity={0.6} metalness={0.8} />
                </Box>
                {/* Door Frame */}
                <Box args={[1.8, 0.1, 0.2]} position={[0, 2.2, 0]} castShadow><meshStandardMaterial color={frameColor} /></Box>
                <Box args={[0.1, 2.3, 0.2]} position={[0.85, 1.1, 0]} castShadow><meshStandardMaterial color={frameColor} /></Box>
                <Box args={[0.1, 2.3, 0.2]} position={[-0.85, 1.1, 0]} castShadow><meshStandardMaterial color={frameColor} /></Box>
            </group>

            {/* Large Front Window */}
            <group position={[-2.9, 1.5, 5.01]}>
                <Box args={[3, 1.8, 0.05]} castShadow>
                    <meshStandardMaterial color="#88ccff" transparent opacity={0.4} />
                </Box>
                <Box args={[3.2, 0.1, 0.2]} position={[0, 0.9, 0]} castShadow><meshStandardMaterial color={frameColor} /></Box>
                <Box args={[3.2, 0.1, 0.2]} position={[0, -0.9, 0]} castShadow><meshStandardMaterial color={frameColor} /></Box>
            </group>

            {/* ========== ROOF ========== */}
            <Box args={[10.6, 0.2, 10.6]} position={[0, 3.9, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#d0d6dd" metalness={0.5} roughness={0.3} />
            </Box>
            {/* Roof-top HVAC/Details */}
            <group position={[-2, 4.1, -2]}>
                <Box args={[1.2, 0.8, 1.2]} castShadow>
                    <meshStandardMaterial color="#aaaaaa" metalness={0.6} />
                </Box>
                {/* Fan detail */}
                <Cylinder args={[0.4, 0.4, 0.1, 12]} position={[0, 0.45, 0]}>
                    <meshStandardMaterial color="#333333" />
                </Cylinder>
            </group>
            <Box args={[0.5, 0.5, 0.5]} position={[3, 4.25, 2]} castShadow>
                <meshStandardMaterial color="#888888" />
            </Box>

            {/* ========== SIGNAGE ========== */}
            <group
                position={[0, 4.4, 5.2]}
                onPointerEnter={() => setIsHovered(true)}
                onPointerLeave={() => setIsHovered(false)}
                onPointerDown={(e) => { e.stopPropagation(); props.onSignClick?.(); }}
            >
                <Box args={[4, 0.8, 0.2]} castShadow>
                    <meshStandardMaterial color={isHovered ? "#333333" : frameColor} />
                </Box>
                <Text
                    position={[0, 0, 0.12]}
                    fontSize={0.4}
                    color={isHovered ? accentColor : "#ffffff"}
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.03}
                >
                    VET CLINIC
                </Text>
            </group>

            {/* ========== INTERIOR PROPS ========== */}
            <group position={[0, 0.4, 0]}>
                {/* Stainless Exam Table */}
                <Box args={[1.4, 0.9, 0.8]} position={[0, 0.45, -1]} castShadow>
                    <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
                </Box>
            </group>

            <CareSupplies position={[-3.5, 0.4, -3.5]} scale={0.7} />

            <pointLight position={[0, 3, 0]} intensity={1.5} color="#eef" distance={12} />
        </group>
    );
}
