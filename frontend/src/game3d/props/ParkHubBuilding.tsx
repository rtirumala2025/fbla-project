import React, { useMemo, useState } from 'react';
import { Box, Cylinder, Text, Sphere } from '@react-three/drei';
import { makeWoodTexture, makeStoneTexture, makeShingleTexture } from '../core/AssetLoader';

export function ParkHubBuilding(props: any & { onSignClick?: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    // Textures
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
    const roofTex = useMemo(() => {
        const t = makeShingleTexture();
        t.repeat.set(4, 2);
        return t;
    }, []);

    const glassColor = "#88ccff";
    const frameColor = "#2c2c2c";
    const wallColor = "#5d4037"; // Dark warm wood

    return (
        <group {...props}>
            {/* ========== FOUNDATION PLAZA DECK ========== */}
            {/* Elevated stone platform to ground the building */}
            <Box args={[12, 0.5, 12]} position={[0, 0.25, 0.5]} castShadow receiveShadow>
                <meshStandardMaterial map={stoneTex} color="#999999" roughness={0.9} />
            </Box>
            {/* Wooden top deck */}
            <Box args={[11.6, 0.1, 11.6]} position={[0, 0.55, 0.5]} receiveShadow>
                <meshStandardMaterial map={woodTex} color="#8b4513" />
            </Box>

            {/* ========== MAIN BUILDING STRUCTURE ========== */}
            <group position={[0, 0.6, 0]}>
                {/* Back Solid Wall */}
                <Box args={[10, 4, 0.3]} position={[0, 2, -4.5]} castShadow receiveShadow>
                    <meshStandardMaterial color={wallColor} map={woodTex} />
                </Box>
                {/* Side Solid Walls (Partial) */}
                <Box args={[0.3, 4, 3]} position={[-4.85, 2, -3]} castShadow receiveShadow>
                    <meshStandardMaterial color={wallColor} map={woodTex} />
                </Box>
                <Box args={[0.3, 4, 3]} position={[4.85, 2, -3]} castShadow receiveShadow>
                    <meshStandardMaterial color={wallColor} map={woodTex} />
                </Box>

                {/* ========== MODERN GLASS CURTAIN WALL (FRONT) ========== */}
                <group position={[0, 1.8, 2]}>
                    {/* Glass Panels */}
                    <Box args={[9.6, 3.6, 0.1]} castShadow>
                        <meshStandardMaterial color={glassColor} transparent opacity={0.3} metalness={0.9} roughness={0.1} />
                    </Box>
                    {/* Vertical Frames */}
                    {[-4.8, -2.4, 0, 2.4, 4.8].map((x, i) => (
                        <Box key={i} args={[0.15, 3.8, 0.2]} position={[x, 0.1, 0]} castShadow>
                            <meshStandardMaterial color={frameColor} />
                        </Box>
                    ))}
                    {/* Horizontal Frames */}
                    <Box args={[10, 0.15, 0.2]} position={[0, 1.8, 0]} castShadow><meshStandardMaterial color={frameColor} /></Box>
                    <Box args={[10, 0.15, 0.2]} position={[0, -1.8, 0]} castShadow><meshStandardMaterial color={frameColor} /></Box>
                </group>

                {/* ========== INTERIOR DETAILS (VISIBLE THROUGH GLASS) ========== */}
                {/* Reception/Info Bureau */}
                <group position={[0, 0, -1]}>
                    <Box args={[4, 1.1, 1.5]} position={[0, 0.55, 0]} castShadow>
                        <meshStandardMaterial color="#4a3b2f" roughness={0.7} />
                    </Box>
                    <Box args={[4.2, 0.1, 1.6]} position={[0, 1.1, 0]} castShadow>
                        <meshStandardMaterial color="#ffffff" metalness={0.5} />
                    </Box>
                    {/* Decorative Map on interior back wall */}
                    <Box args={[3, 2, 0.05]} position={[0, 2.5, -3.3]}>
                        <meshStandardMaterial color="#e8d5b5" />
                    </Box>
                    <pointLight position={[0, 3, 0]} intensity={1.5} color="#fff1d0" distance={10} />
                </group>
            </group>

            {/* ========== DRAMATIC SLOPING ROOF ========== */}
            <group position={[0, 4.4, 0]} rotation={[-0.15, 0, 0]}>
                {/* Massive roof plane providing shelter to the porch area */}
                <Box args={[13, 0.3, 13]} position={[0, 0.5, 1]} castShadow receiveShadow>
                    <meshStandardMaterial map={roofTex} color="#444444" />
                </Box>
                {/* Roof Trim */}
                <Box args={[13.2, 0.4, 0.2]} position={[0, 0.5, 7.5]} castShadow><meshStandardMaterial color={frameColor} /></Box>
                {/* Support Beams */}
                {[-6, 6].map((x, i) => (
                    <Box key={i} args={[0.3, 0.3, 13]} position={[x, 0.2, 1]} castShadow><meshStandardMaterial color={frameColor} /></Box>
                ))}
            </group>

            {/* ========== EXTERIOR AMENITIES ========== */}
            {/* Integrated Bench */}
            <group position={[0, 0.6, 5]}>
                <Box args={[6, 0.1, 1.2]} position={[0, 0.45, 0]} castShadow>
                    <meshStandardMaterial color="#8b4513" map={woodTex} />
                </Box>
                <Box args={[0.2, 0.45, 1.2]} position={[-2.9, 0.22, 0]} castShadow><meshStandardMaterial color={frameColor} /></Box>
                <Box args={[0.2, 0.45, 1.2]} position={[2.9, 0.22, 0]} castShadow><meshStandardMaterial color={frameColor} /></Box>
            </group>

            {/* Info Kiosk (Smaller detailed prop) */}
            <group position={[-4, 0.6, 5]} rotation={[0, 0.5, 0]}>
                <Box args={[0.8, 1.2, 0.2]} position={[0, 0.6, 0]} castShadow>
                    <meshStandardMaterial color={frameColor} />
                </Box>
                <Box args={[0.9, 0.6, 0.1]} position={[0, 1.2, 0.1]} rotation={[-0.5, 0, 0]}>
                    <meshStandardMaterial color="#ffffff" />
                </Box>
            </group>

            {/* ========== MODERN PARK HUB SIGN ========== */}
            <group
                position={[0, 5.8, 7.6]}
                onPointerEnter={() => { setIsHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerLeave={() => { setIsHovered(false); document.body.style.cursor = 'auto'; }}
                onPointerDown={(e) => { e.stopPropagation(); props.onSignClick?.(); }}
            >
                <Box args={[5, 1.2, 0.25]} castShadow>
                    <meshStandardMaterial color={isHovered ? "#9eb23b" : "#7b8f2a"} roughness={0.3} metalness={0.2} />
                </Box>
                <Text
                    position={[0, 0, 0.15]}
                    fontSize={0.5}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.04}
                    outlineColor="#000000"
                >
                    PARK CENTER
                </Text>
                <Text
                    position={[0, -0.4, 0.15]}
                    fontSize={0.15}
                    color="#dddddd"
                >
                    VISITOR INFORMATION
                </Text>
            </group>

            {/* Atmosphere: Warm night lights (if needed) but also daytime glow */}
            <pointLight position={[5, 4, 5]} intensity={0.5} color="#fff" distance={8} />
            <pointLight position={[-5, 4, 5]} intensity={0.5} color="#fff" distance={8} />
        </group>
    );
}
