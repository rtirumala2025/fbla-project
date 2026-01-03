import React, { useMemo, useState } from 'react';
import { Box, Text } from '@react-three/drei';
import { makeStoneTexture, makeWoodTexture } from '../core/AssetLoader';

export function AgilityTrainingCenter(props: any & { onSignClick?: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    const stoneTex = useMemo(() => {
        const t = makeStoneTexture();
        t.repeat.set(4, 3);
        return t;
    }, []);

    const woodTex = useMemo(() => {
        const t = makeWoodTexture();
        t.repeat.set(2, 1);
        return t;
    }, []);

    const wallColor = "#eceff1"; // Clean industrial white/grey
    const accentColor = "#ff6f00"; // Deep energy orange
    const frameColor = "#546e7a"; // Blue-grey steel

    return (
        <group {...props}>
            {/* ========== FOUNDATION ========== */}
            <Box args={[14, 0.4, 10]} position={[0, 0.2, 0]} receiveShadow>
                <meshStandardMaterial map={stoneTex} color="#cfd8dc" />
            </Box>

            {/* ========== MAIN HALL STRUCTURE ========== */}
            <group position={[0, 0.4, 0]}>
                {/* Main Walls with Vertical Groove Detail */}
                <Box args={[13.6, 4.5, 9.6]} position={[0, 2.25, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color={wallColor} roughness={0.4} />
                </Box>

                {/* Large Industrial Windows (Frosted Glass) */}
                <group position={[0, 2.5, 4.85]}>
                    <Box args={[4, 2.5, 0.1]} position={[-3.5, 0, 0]} castShadow>
                        <meshStandardMaterial color="#b3e5fc" roughness={0.2} metalness={0.8} transparent opacity={0.6} />
                    </Box>
                    <Box args={[4, 2.5, 0.1]} position={[3.5, 0, 0]} castShadow>
                        <meshStandardMaterial color="#b3e5fc" roughness={0.2} metalness={0.8} transparent opacity={0.6} />
                    </Box>
                </group>

                {/* Steel Columns */}
                {[[-6.9, -5.1], [6.9, -5.1], [-6.9, 5.1], [6.9, 5.1]].map((pos, i) => (
                    <Box key={i} args={[0.5, 4.8, 0.5]} position={[pos[0], 2.4, pos[1]]} castShadow>
                        <meshStandardMaterial color={frameColor} metalness={0.7} />
                    </Box>
                ))}

                {/* Roof Truss Detail (Exterior) */}
                <Box args={[14.2, 0.4, 0.4]} position={[0, 4.4, 4.8]} castShadow>
                    <meshStandardMaterial color={accentColor} />
                </Box>
            </group>

            {/* ========== ROOF (Curved/Hangar Style) ========== */}
            <group position={[0, 4.9, 0]}>
                <Box args={[14.2, 0.2, 10.2]} castShadow receiveShadow>
                    <meshStandardMaterial color="#455a64" roughness={0.6} />
                </Box>
                {/* Ventilators */}
                <Box args={[12, 0.6, 2]} position={[0, 0.4, 0]} castShadow>
                    <meshStandardMaterial color="#546e7a" />
                </Box>
                {/* Grates */}
                <Box args={[11.8, 0.65, 0.1]} position={[0, 0.4, 1]} castShadow>
                    <meshStandardMaterial color="#333" />
                </Box>
            </group>

            {/* ========== SIGNAGE ========== */}
            <group
                position={[0, 5.4, 5.1]}
                onPointerEnter={() => setIsHovered(true)}
                onPointerLeave={() => setIsHovered(false)}
                onPointerDown={(e) => { e.stopPropagation(); props.onSignClick?.(); }}
            >
                <Box args={[6, 1.2, 0.2]} castShadow>
                    <meshStandardMaterial color={isHovered ? "#37474f" : frameColor} />
                </Box>
                {/* Accent stripe */}
                <Box args={[6, 0.1, 0.22]} position={[0, -0.4, 0]}><meshStandardMaterial color={accentColor} /></Box>

                <Text
                    position={[0, 0.1, 0.12]}
                    fontSize={0.5}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.03}
                >
                    AGILITY CENTER
                </Text>
            </group>

            {/* ========== PROPS ========== */}
            {/* Entrance Ramp */}
            <group position={[0, 0, 5.5]} rotation={[0.2, 0, 0]}>
                <Box args={[3, 0.1, 2]} receiveShadow>
                    <meshStandardMaterial color="#cfd8dc" roughness={1} />
                </Box>
            </group>

            <pointLight position={[0, 6, 5]} intensity={1} color="#fff" distance={8} />
        </group>
    );
}
