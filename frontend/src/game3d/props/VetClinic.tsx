import React, { useMemo, useState } from 'react';
import { Box, Cylinder, Text } from '@react-three/drei';
import { CareSupplies } from './CareSupplies';
import { makeStoneTexture, makeWoodTexture } from '../core/AssetLoader';

export function VetClinic(props: any & { onSignClick?: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    const stoneTex = useMemo(() => {
        const t = makeStoneTexture();
        t.repeat.set(3, 2);
        return t;
    }, []);

    const woodTex = useMemo(() => {
        const t = makeWoodTexture();
        t.repeat.set(2, 1);
        return t;
    }, []);

    // Palette: Clean Medical + Warm Wood
    const wallColor = "#ffffff";
    const accentColor = "#4db6ac"; // Medical Teal
    const roofColor = "#37474f";
    const woodColor = "#8d6e63";

    return (
        <group {...props}>
            {/* ========== FOUNDATION ========== */}
            <Box args={[9, 0.4, 9]} position={[0, 0.2, 0]} castShadow receiveShadow>
                <meshStandardMaterial map={stoneTex} color="#cfd8dc" />
            </Box>

            {/* ========== MAIN STRUCTURE ========== */}
            <group position={[0, 0.4, 0]}>
                {/* Main Mass - Clean White */}
                <Box args={[8.5, 3.5, 8.5]} position={[0, 1.75, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color={wallColor} />
                </Box>

                {/* Wood Accent Panel (Entrance) */}
                <Box args={[4, 3.5, 0.1]} position={[0, 1.75, 4.26]} castShadow receiveShadow>
                    <meshStandardMaterial map={woodTex} color={woodColor} />
                </Box>

                {/* Medical Cross Detail (Inset) */}
                <group position={[3, 2.5, 4.3]} scale={0.4}>
                    <Box args={[1, 3, 0.2]} castShadow><meshStandardMaterial color={accentColor} /></Box>
                    <Box args={[3, 1, 0.2]} castShadow><meshStandardMaterial color={accentColor} /></Box>
                </group>
            </group>

            {/* ========== ROOF (Overhanging Flat Modern) ========== */}
            <group position={[0, 4, 0]}>
                <Box args={[10, 0.4, 10]} castShadow receiveShadow>
                    <meshStandardMaterial color={roofColor} roughness={0.5} />
                </Box>
                {/* Skylight Bubble */}
                <Box args={[3, 0.3, 3]} position={[0, 0.25, 0]} castShadow>
                    <meshStandardMaterial color="#81d4fa" metalness={0.8} roughness={0.1} />
                </Box>
            </group>

            {/* ========== ENTRANCE & WINDOWS ========== */}
            <group position={[0, 0.4, 4.26]}>
                {/* Double Glass Doors */}
                <Box args={[2.2, 2.4, 0.1]} position={[0, 1.2, 0]} castShadow>
                    <meshStandardMaterial color="#b3e5fc" metalness={0.9} roughness={0.1} transparent opacity={0.7} />
                </Box>
                <Box args={[2.4, 0.1, 0.2]} position={[0, 2.45, 0]} castShadow><meshStandardMaterial color="#333" /></Box>
                <Box args={[0.1, 2.4, 0.1]} position={[0, 1.2, 0]} castShadow><meshStandardMaterial color="#333" /></Box>
            </group>

            {/* Large Side Window */}
            <group position={[-4.26, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
                <Box args={[4, 2, 0.1]} castShadow>
                    <meshStandardMaterial color="#b3e5fc" metalness={0.9} roughness={0.1} transparent opacity={0.6} />
                </Box>
                <Box args={[4.2, 0.2, 0.2]} position={[0, 1.1, 0]} castShadow><meshStandardMaterial color="#333" /></Box>
                <Box args={[4.2, 0.2, 0.2]} position={[0, -1.1, 0]} castShadow><meshStandardMaterial color="#333" /></Box>
            </group>

            {/* ========== SIGNAGE ========== */}
            <group
                position={[-2.5, 3, 5.1]} // Stick out from wall
                onPointerEnter={() => setIsHovered(true)}
                onPointerLeave={() => setIsHovered(false)}
                onPointerDown={(e) => { e.stopPropagation(); props.onSignClick?.(); }}
            >
                <Box args={[3.5, 0.8, 0.1]} castShadow>
                    <meshStandardMaterial color={isHovered ? "#263238" : accentColor} />
                </Box>
                <Text
                    position={[0, 0, 0.06]}
                    fontSize={0.35}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.02}
                >
                    VET CLINIC
                </Text>
            </group>

            {/* ========== PROPS ========== */}
            <CareSupplies position={[2.5, 0.4, 3]} scale={0.6} />
            <Box args={[0.8, 1.2, 0.8]} position={[-3, 1, 5.5]} castShadow>
                <meshStandardMaterial color="#cfd8dc" />
            </Box>
            <Cylinder args={[0.3, 0.3, 0.1]} position={[-3, 1.65, 5.5]}>
                <meshStandardMaterial color="#333" />
            </Cylinder> {/* Trash can lid */}

        </group>
    );
}
