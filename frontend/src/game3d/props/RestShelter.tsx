import React, { useMemo, useState } from 'react';
import { Box, Cylinder, Text } from '@react-three/drei';
import { Bench } from './Bench';
import { makeWoodTexture, makeShingleTexture, makeStoneTexture } from '../core/AssetLoader';

export function RestShelter(props: any & { onSignClick?: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    const woodTex = useMemo(() => {
        const t = makeWoodTexture();
        t.repeat.set(2, 2);
        return t;
    }, []);
    const shingleTex = useMemo(() => {
        const t = makeShingleTexture();
        t.repeat.set(3, 3);
        return t;
    }, []);
    const stoneTex = useMemo(() => makeStoneTexture(), []);

    const woodColor = "#8b4513";
    const postColor = "#5d4037";

    return (
        <group {...props}>
            {/* ========== DECK FOUNDATION ========== */}
            <Box args={[10.2, 0.4, 10.2]} position={[0, 0.2, 0]} castShadow receiveShadow>
                <meshStandardMaterial map={stoneTex} color="#999999" />
            </Box>
            <Box args={[10, 0.2, 10]} position={[0, 0.5, 0]} castShadow receiveShadow>
                <meshStandardMaterial map={woodTex} color={woodColor} />
            </Box>

            {/* ========== STRUCTURE ========== */}
            {/* Back Privacy Wall (Slatted) */}
            <group position={[0, 0.6, -4.8]}>
                {Array.from({ length: 12 }).map((_, i) => (
                    <Box key={i} args={[0.6, 3.2, 0.1]} position={[-4 + i * 0.72, 1.6, 0]} castShadow>
                        <meshStandardMaterial map={woodTex} color={woodColor} />
                    </Box>
                ))}
            </group>

            {/* Support Posts */}
            {[[-4.8, -4.8], [4.8, -4.8], [-4.8, 4.8], [4.8, 4.8], [0, 4.8], [0, -4.8]].map((pos, i) => (
                <Box key={i} args={[0.3, 3.8, 0.3]} position={[pos[0], 2, pos[1]]} castShadow>
                    <meshStandardMaterial color={postColor} />
                </Box>
            ))}

            {/* Railings */}
            <group position={[0, 0.6, 4.8]}>
                <Box args={[10, 0.1, 0.1]} position={[0, 1, 0]} castShadow><meshStandardMaterial color={postColor} /></Box>
                {Array.from({ length: 10 }).map((_, i) => (
                    <Box key={i} args={[0.1, 1, 0.1]} position={[-4.5 + i * 1, 0.5, 0]} castShadow>
                        <meshStandardMaterial color={postColor} />
                    </Box>
                ))}
            </group>

            {/* ========== ROOF (Pitched) ========== */}
            <group position={[0, 4.4, 0]}>
                <Box args={[11, 0.25, 6]} position={[0, 0.8, -2.8]} rotation={[0.45, 0, 0]} castShadow receiveShadow>
                    <meshStandardMaterial map={shingleTex} color="#7a4a4a" />
                </Box>
                <Box args={[11, 0.25, 6]} position={[0, 0.8, 2.8]} rotation={[-0.45, 0, 0]} castShadow receiveShadow>
                    <meshStandardMaterial map={shingleTex} color="#7a4a4a" />
                </Box>
                <Box args={[11.1, 0.2, 0.4]} position={[0, 1.7, 0]} castShadow>
                    <meshStandardMaterial color={postColor} />
                </Box>
            </group>

            {/* ========== SIGNAGE ========== */}
            <group
                position={[0, 5, 5.2]}
                onPointerEnter={() => setIsHovered(true)}
                onPointerLeave={() => setIsHovered(false)}
                onPointerDown={(e) => { e.stopPropagation(); props.onSignClick?.(); }}
            >
                <Box args={[3.5, 0.8, 0.2]} castShadow>
                    <meshStandardMaterial color={isHovered ? "#8b4513" : "#5d4037"} />
                </Box>
                <Text
                    position={[0, 0, 0.12]}
                    fontSize={0.4}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.04}
                    outlineColor="#000000"
                >
                    REST AREA
                </Text>
            </group>

            {/* ========== PROPS ========== */}
            <Bench position={[-2.5, 0.6, -3]} rotation={0} />
            <Bench position={[2.5, 0.6, -3]} rotation={0} />

            <pointLight position={[0, 3, 0]} intensity={1.5} color="#ffd" distance={10} />
        </group>
    );
}
