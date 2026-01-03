import React, { useMemo, useState } from 'react';
import { Box, Cylinder, Text } from '@react-three/drei';
import { makeWoodTexture, makeStoneTexture, makeShingleTexture } from '../core/AssetLoader';

export function ParkHubBuilding(props: any & { onSignClick?: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    // Memoize textures
    const woodTex = useMemo(() => {
        const t = makeWoodTexture();
        t.repeat.set(2, 2);
        return t;
    }, []);
    const stoneTex = useMemo(() => {
        const t = makeStoneTexture();
        t.repeat.set(2, 1);
        return t;
    }, []);
    const shingleTex = useMemo(() => {
        const t = makeShingleTexture();
        t.repeat.set(4, 2);
        return t;
    }, []);

    const wallColor = "#a68b76";
    const trimColor = "#4a3b2f";

    return (
        <group {...props}>
            {/* ========== FOUNDATION (Stone) ========== */}
            <Box args={[8.2, 0.6, 8.2]} position={[0, 0.3, 0]} castShadow receiveShadow>
                <meshStandardMaterial map={stoneTex} color="#aaaaaa" roughness={0.9} />
            </Box>

            {/* ========== MAIN STRUCTURE (Wood) ========== */}
            <group position={[0, 0.6, 0]}>
                {/* Back Wall */}
                <Box args={[8, 3.2, 0.2]} position={[0, 1.6, -3.9]} castShadow receiveShadow>
                    <meshStandardMaterial map={woodTex} color={wallColor} />
                </Box>
                {/* Side Walls */}
                <Box args={[0.2, 3.2, 8]} position={[-3.9, 1.6, 0]} castShadow receiveShadow>
                    <meshStandardMaterial map={woodTex} color={wallColor} />
                </Box>
                <Box args={[0.2, 3.2, 8]} position={[3.9, 1.6, 0]} castShadow receiveShadow>
                    <meshStandardMaterial map={woodTex} color={wallColor} />
                </Box>
                {/* Front Walls */}
                <Box args={[3, 3.2, 0.2]} position={[-2.5, 1.6, 3.9]} castShadow receiveShadow>
                    <meshStandardMaterial map={woodTex} color={wallColor} />
                </Box>
                <Box args={[3, 3.2, 0.2]} position={[2.5, 1.6, 3.9]} castShadow receiveShadow>
                    <meshStandardMaterial map={woodTex} color={wallColor} />
                </Box>
                <Box args={[2, 1, 0.2]} position={[0, 2.7, 3.9]} castShadow receiveShadow>
                    <meshStandardMaterial map={woodTex} color={wallColor} />
                </Box>

                {/* Corner Posts (Trim) */}
                {[[-3.95, -3.95], [3.95, -3.95], [-3.95, 3.95], [3.95, 3.95]].map((pos, i) => (
                    <Box key={i} args={[0.3, 3.3, 0.3]} position={[pos[0], 1.6, pos[1]]} castShadow>
                        <meshStandardMaterial color={trimColor} roughness={0.7} />
                    </Box>
                ))}
            </group>

            {/* ========== PORCH ========== */}
            <group position={[0, 0, 5.5]}>
                <Box args={[10, 0.2, 3.2]} position={[0, 0.4, 0]} castShadow receiveShadow>
                    <meshStandardMaterial map={woodTex} color="#5d4037" />
                </Box>
                {/* Railing */}
                <Box args={[10, 0.1, 0.1]} position={[0, 1.3, 1.5]} castShadow>
                    <meshStandardMaterial color={trimColor} />
                </Box>
                {[[-4.9, 1.5], [4.9, 1.5], [0, 1.5]].map((pos, i) => (
                    <Box key={i} args={[0.1, 0.9, 0.1]} position={[pos[0], 0.85, pos[1]]} castShadow>
                        <meshStandardMaterial color={trimColor} />
                    </Box>
                ))}
                {/* Pillars */}
                <Cylinder args={[0.12, 0.12, 3.8, 8]} position={[-4.8, 2.2, 1.4]} castShadow>
                    <meshStandardMaterial color={trimColor} />
                </Cylinder>
                <Cylinder args={[0.12, 0.12, 3.8, 8]} position={[4.8, 2.2, 1.4]} castShadow>
                    <meshStandardMaterial color={trimColor} />
                </Cylinder>
            </group>

            {/* ========== ROOF (Shingles & Overhangs) ========== */}
            <group position={[0, 3.8, 0]}>
                {/* Main Roof */}
                <group position={[0, 1.2, 0]}>
                    <Box args={[10, 0.3, 6]} position={[0, 0, -2.8]} rotation={[0.5, 0, 0]} castShadow receiveShadow>
                        <meshStandardMaterial map={shingleTex} color="#888888" />
                    </Box>
                    <Box args={[10, 0.3, 6]} position={[0, 0, 2.8]} rotation={[-0.5, 0, 0]} castShadow receiveShadow>
                        <meshStandardMaterial map={shingleTex} color="#888888" />
                    </Box>
                    {/* Ridge Cap */}
                    <Box args={[10.1, 0.2, 0.4]} position={[0, 1.5, 0]} castShadow>
                        <meshStandardMaterial color={trimColor} />
                    </Box>
                </group>

                {/* Front Gable detail */}
                <Box args={[4, 1.4, 0.1]} position={[0, 0.2, 4.05]} rotation={[0, 0, 0]} castShadow>
                    <meshStandardMaterial map={woodTex} color={wallColor} />
                </Box>
            </group>

            {/* ========== WINDOW FRAMES ========== */}
            {[[-2.5, 0], [2.5, 0]].map((pos, i) => (
                <group key={i} position={[pos[0], 2.4, 4.01]}>
                    {/* Glass */}
                    <Box args={[2.5, 2, 0.05]} castShadow>
                        <meshStandardMaterial color="#88ccff" transparent opacity={0.4} metalness={0.9} roughness={0.1} />
                    </Box>
                    {/* Frame */}
                    <Box args={[2.7, 0.1, 0.15]} position={[0, 1, 0]} castShadow><meshStandardMaterial color={trimColor} /></Box>
                    <Box args={[2.7, 0.1, 0.15]} position={[0, -1, 0]} castShadow><meshStandardMaterial color={trimColor} /></Box>
                    <Box args={[0.1, 2.1, 0.15]} position={[1.3, 0, 0]} castShadow><meshStandardMaterial color={trimColor} /></Box>
                    <Box args={[0.1, 2.1, 0.15]} position={[-1.3, 0, 0]} castShadow><meshStandardMaterial color={trimColor} /></Box>
                </group>
            ))}

            {/* ========== CLICKABLE SIGN ========== */}
            <group
                position={[0, 4, 6.8]}
                onPointerEnter={() => { setIsHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerLeave={() => { setIsHovered(false); document.body.style.cursor = 'auto'; }}
                onPointerDown={(e) => { e.stopPropagation(); props.onSignClick?.(); }}
            >
                <Box args={[4.2, 1, 0.2]} castShadow>
                    <meshStandardMaterial color={isHovered ? "#9eb23b" : "#7b8f2a"} />
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
                    PARK HUB
                </Text>
            </group>
        </group>
    );
}
