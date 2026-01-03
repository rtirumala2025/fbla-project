import React, { useMemo, useState } from 'react';
import { Box, Text, Cylinder } from '@react-three/drei';
import { Bench } from './Bench';
import { makeWoodTexture, makeShingleTexture, makeStoneTexture } from '../core/AssetLoader';

export function RestShelter(props: any & { onSignClick?: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    const woodTex = useMemo(() => {
        const t = makeWoodTexture();
        t.repeat.set(2, 4);
        return t;
    }, []);
    const shingleTex = useMemo(() => {
        const t = makeShingleTexture();
        t.repeat.set(3, 2);
        return t;
    }, []);
    const stoneTex = useMemo(() => makeStoneTexture(), []);

    const woodColor = "#8d6e63"; // Warm medium brown
    const postColor = "#5d4037"; // Darker structural wood

    return (
        <group {...props}>
            {/* ========== STONE PLINTH FOUNDATION ========== */}
            <Box args={[11, 0.6, 8]} position={[0, 0.3, 0]} castShadow receiveShadow>
                <meshStandardMaterial map={stoneTex} color="#a1887f" />
            </Box>
            {/* Decking detail */}
            <Box args={[10.6, 0.05, 7.6]} position={[0, 0.61, 0]} receiveShadow>
                <meshStandardMaterial map={woodTex} color="#a1887f" />
            </Box>

            {/* ========== TIMBER FRAME STRUCTURE ========== */}
            <group position={[0, 0.6, 0]}>
                {/* 4 Corner Posts */}
                {[[-4.8, -3.5], [4.8, -3.5], [-4.8, 3.5], [4.8, 3.5]].map((pos, i) => (
                    <group key={i} position={[pos[0], 0, pos[1]]}>
                        {/* Stone Base */}
                        <Box args={[0.6, 0.8, 0.6]} position={[0, 0.4, 0]} castShadow>
                            <meshStandardMaterial map={stoneTex} color="#795548" />
                        </Box>
                        {/* Wood Column */}
                        <Box args={[0.35, 3.2, 0.35]} position={[0, 2.4, 0]} castShadow>
                            <meshStandardMaterial map={woodTex} color={postColor} />
                        </Box>
                        {/* Fancy Angled Bracing */}
                        <Box args={[0.2, 1.2, 0.2]} position={[0.5, 3.4, 0]} rotation={[0, 0, -0.7]} castShadow>
                            <meshStandardMaterial color={postColor} />
                        </Box>
                        <Box args={[0.2, 1.2, 0.2]} position={[0, 3.4, 0.5]} rotation={[0.7, 0, 0]} castShadow>
                            <meshStandardMaterial color={postColor} />
                        </Box>
                    </group>
                ))}
            </group>

            {/* ========== ROOF (Open Gable Pavilion) ========== */}
            <group position={[0, 4.4, 0]}>
                {/* Main Ridge Beam */}
                <Box args={[12, 0.4, 0.2]} position={[0, 1.5, 0]} castShadow><meshStandardMaterial color={postColor} /></Box>

                {/* Pitched Roof Panels */}
                <group rotation={[0, 0, 0]}>
                    <Box args={[12, 0.15, 6]} position={[0, 0.6, -2.5]} rotation={[0.45, 0, 0]} castShadow receiveShadow>
                        <meshStandardMaterial map={shingleTex} color="#5d4037" />
                    </Box>
                    <Box args={[12, 0.15, 6]} position={[0, 0.6, 2.5]} rotation={[-0.45, 0, 0]} castShadow receiveShadow>
                        <meshStandardMaterial map={shingleTex} color="#5d4037" />
                    </Box>
                </group>

                {/* Decorative End Trusses */}
                <group position={[-5.8, 0.8, 0]}>
                    <Box args={[0.1, 1.4, 0.1]} position={[0, 0, 0]}><meshStandardMaterial color={postColor} /></Box>
                    <Box args={[0.1, 1.4, 4]} rotation={[0.45, 0, 0]} position={[0, 0, -1]}><meshStandardMaterial color={postColor} /></Box>
                </group>
                <group position={[5.8, 0.8, 0]}>
                    <Box args={[0.1, 1.4, 0.1]} position={[0, 0, 0]}><meshStandardMaterial color={postColor} /></Box>
                </group>
            </group>

            {/* ========== INTERIOR ========== */}
            {/* Back Wall (Partial for privacy but open air) */}
            <group position={[0, 0.6, -3.5]}>
                <Box args={[6, 2.5, 0.2]} position={[0, 1.25, 0]} castShadow>
                    <meshStandardMaterial map={woodTex} color={woodColor} />
                </Box>
                {/* Notice Board on Wall */}
                <Box args={[2, 1.2, 0.05]} position={[0, 1.5, 0.15]} castShadow>
                    <meshStandardMaterial color="#d7ccc8" />
                </Box>
            </group>

            {/* Benches */}
            <Bench position={[-2.5, 0.7, -1]} rotation={0.5} />
            <Bench position={[2.5, 0.7, 1]} rotation={-2.5} />

            {/* ========== SIGNAGE ========== */}
            <group
                position={[4.2, 2.5, 3.8]} // Hanging sign on corner
                onPointerEnter={() => setIsHovered(true)}
                onPointerLeave={() => setIsHovered(false)}
                onPointerDown={(e) => { e.stopPropagation(); props.onSignClick?.(); }}
            >
                <Box args={[0.1, 0.8, 0.1]} position={[0, 0.5, 0]}><meshStandardMaterial color="#333" /></Box>
                <Box args={[3, 0.8, 0.15]} castShadow>
                    <meshStandardMaterial map={woodTex} color={isHovered ? "#5d4037" : "#8d6e63"} />
                </Box>
                <Text
                    position={[0, 0, 0.1]}
                    fontSize={0.35}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.03}
                >
                    REST AREA
                </Text>
            </group>

            <pointLight position={[0, 3.5, 0]} intensity={1.5} color="#fff8e1" distance={10} />
        </group>
    );
}
