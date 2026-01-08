import React, { useMemo, useState } from 'react';
import { Box, Cylinder, Text, Sphere } from '@react-three/drei';
import { makeWoodTexture, makeStoneTexture } from '../core/AssetLoader';

export function GiftShop(props: any & { onSignClick?: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    const woodTex = useMemo(() => {
        const t = makeWoodTexture();
        t.repeat.set(2, 2);
        return t;
    }, []);

    const stoneTex = useMemo(() => {
        const t = makeStoneTexture();
        t.repeat.set(3, 2);
        return t;
    }, []);

    // Vibrant shop colors
    const wallColor = "#fff3e0";      // Warm cream
    const accentColor = "#ff7043";    // Coral orange
    const roofColor = "#5d4037";      // Rich brown
    const awningColor = "#ef5350";    // Red awning
    const trimColor = "#4e342e";      // Dark brown trim

    return (
        <group {...props}>
            {/* ========== FOUNDATION ========== */}
            <Box args={[14, 0.4, 12]} position={[0, 0.2, 0]} castShadow receiveShadow>
                <meshStandardMaterial map={stoneTex} color="#a1887f" roughness={0.9} />
            </Box>

            {/* ========== MAIN BUILDING STRUCTURE ========== */}
            <group position={[0, 0.4, 0]}>
                {/* Main Walls */}
                <Box args={[13.6, 5, 11.6]} position={[0, 2.5, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color={wallColor} roughness={0.6} />
                </Box>

                {/* Wood Accent Strips */}
                <Box args={[14, 0.3, 0.1]} position={[0, 5, 5.85]} castShadow>
                    <meshStandardMaterial color={trimColor} />
                </Box>
                <Box args={[14, 0.3, 0.1]} position={[0, 0.15, 5.85]} castShadow>
                    <meshStandardMaterial color={trimColor} />
                </Box>

                {/* Corner Pillars */}
                {[[-6.5, -5.5], [6.5, -5.5], [-6.5, 5.5], [6.5, 5.5]].map((pos, i) => (
                    <Box key={i} args={[0.4, 5.2, 0.4]} position={[pos[0], 2.6, pos[1]]} castShadow>
                        <meshStandardMaterial color={trimColor} />
                    </Box>
                ))}
            </group>

            {/* ========== STOREFRONT WINDOWS (FRONT) ========== */}
            <group position={[0, 2.5, 5.85]}>
                {/* Large Display Windows */}
                {[-3.5, 3.5].map((x, i) => (
                    <group key={i} position={[x, 0, 0]}>
                        <Box args={[3.5, 2.8, 0.15]} castShadow>
                            <meshStandardMaterial
                                color="#b3e5fc"
                                metalness={0.9}
                                roughness={0.1}
                                transparent
                                opacity={0.5}
                            />
                        </Box>
                        {/* Window Frame */}
                        <Box args={[3.7, 0.15, 0.2]} position={[0, 1.5, 0]} castShadow>
                            <meshStandardMaterial color={trimColor} />
                        </Box>
                        <Box args={[3.7, 0.15, 0.2]} position={[0, -1.5, 0]} castShadow>
                            <meshStandardMaterial color={trimColor} />
                        </Box>
                        <Box args={[0.15, 2.8, 0.2]} position={[-1.85, 0, 0]} castShadow>
                            <meshStandardMaterial color={trimColor} />
                        </Box>
                        <Box args={[0.15, 2.8, 0.2]} position={[1.85, 0, 0]} castShadow>
                            <meshStandardMaterial color={trimColor} />
                        </Box>
                    </group>
                ))}

                {/* Display Items in Windows */}
                {[-3.5, 3.5].map((x, i) => (
                    <group key={`display-${i}`} position={[x, -0.8, -0.3]}>
                        {/* Gift boxes */}
                        <Box args={[0.5, 0.5, 0.5]} position={[-0.8, 0, 0]} castShadow>
                            <meshStandardMaterial color="#e91e63" />
                        </Box>
                        <Box args={[0.4, 0.4, 0.4]} position={[0, 0.1, 0]} castShadow>
                            <meshStandardMaterial color="#9c27b0" />
                        </Box>
                        <Box args={[0.6, 0.35, 0.6]} position={[0.8, 0, 0]} castShadow>
                            <meshStandardMaterial color="#2196f3" />
                        </Box>
                        {/* Ribbon on boxes */}
                        <Box args={[0.05, 0.5, 0.52]} position={[-0.8, 0, 0]} castShadow>
                            <meshStandardMaterial color="#ffd700" />
                        </Box>
                    </group>
                ))}
            </group>

            {/* ========== ENTRANCE OPENING (Dynamic Door Added by Scene) ========== */}
            <group position={[0, 1.8, 5.9]}>
                {/* JUST THE FRAME - Door is removed */}
                {/* Horizontal Header */}
                <Box args={[2.6, 0.2, 0.3]} position={[0, 1.7, 0]} castShadow>
                    <meshStandardMaterial color="#4e342e" />
                </Box>
                {/* Vertical Jambs */}
                <Box args={[0.2, 3.4, 0.3]} position={[-1.3, 0, 0]} castShadow>
                    <meshStandardMaterial color="#4e342e" />
                </Box>
                <Box args={[0.2, 3.4, 0.3]} position={[1.3, 0, 0]} castShadow>
                    <meshStandardMaterial color="#4e342e" />
                </Box>
            </group>

            {/* ========== AWNING ========== */}
            <group position={[0, 4.5, 7]}>
                {/* Main Awning */}
                <Box args={[12, 0.15, 3]} rotation={[0.15, 0, 0]} castShadow>
                    <meshStandardMaterial color={awningColor} />
                </Box>
                {/* Awning Stripes */}
                {[-4, -2, 0, 2, 4].map((x, i) => (
                    <Box key={i} args={[1.5, 0.17, 3.05]} position={[x, 0.01, 0]} rotation={[0.15, 0, 0]}>
                        <meshStandardMaterial color="#ffffff" />
                    </Box>
                ))}
                {/* Awning Valance */}
                <Box args={[12, 0.4, 0.1]} position={[0, -0.25, 1.4]} castShadow>
                    <meshStandardMaterial color={awningColor} />
                </Box>
            </group>

            {/* ========== ROOF ========== */}
            <group position={[0, 5.5, 0]}>
                <Box args={[14.5, 0.4, 12.5]} castShadow receiveShadow>
                    <meshStandardMaterial color={roofColor} roughness={0.7} />
                </Box>
                {/* Roof Trim */}
                <Box args={[15, 0.2, 0.3]} position={[0, 0.1, 6.3]} castShadow>
                    <meshStandardMaterial color={trimColor} />
                </Box>
            </group>

            {/* ========== SIGNAGE ========== */}
            <group
                position={[0, 6.2, 6]}
                onPointerEnter={() => { setIsHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerLeave={() => { setIsHovered(false); document.body.style.cursor = 'auto'; }}
                onPointerDown={(e) => { e.stopPropagation(); props.onSignClick?.(); }}
            >
                {/* Sign Board */}
                <Box args={[6, 1.5, 0.3]} castShadow>
                    <meshStandardMaterial color={isHovered ? "#ff8a65" : accentColor} roughness={0.3} />
                </Box>
                {/* Sign Text */}
                <Text
                    position={[0, 0.1, 0.2]}
                    fontSize={0.6}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.04}
                    outlineColor="#000000"
                >
                    GIFT SHOP
                </Text>
                <Text
                    position={[0, -0.5, 0.2]}
                    fontSize={0.2}
                    color="#fff8e1"
                >
                    TOYS • FOOD • ACCESSORIES
                </Text>

                {/* Decorative Shopping Bag Icon */}
                <group position={[-2.5, 0, 0.2]}>
                    <Box args={[0.5, 0.6, 0.1]}>
                        <meshStandardMaterial color="#ffffff" />
                    </Box>
                    <Cylinder args={[0.15, 0.15, 0.4, 8]} position={[0, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
                        <meshStandardMaterial color="#ffffff" />
                    </Cylinder>
                </group>
            </group>

            {/* ========== EXTERIOR DECORATIONS ========== */}
            {/* Potted Plants */}
            {[[-5, 6.5], [5, 6.5]].map((pos, i) => (
                <group key={i} position={[pos[0], 0.4, pos[1]]}>
                    <Cylinder args={[0.4, 0.35, 0.6, 12]} position={[0, 0.3, 0]} castShadow>
                        <meshStandardMaterial color="#6d4c41" />
                    </Cylinder>
                    <Sphere args={[0.5, 8, 8]} position={[0, 0.8, 0]} castShadow>
                        <meshStandardMaterial color="#43a047" />
                    </Sphere>
                </group>
            ))}

            {/* Welcome Mat */}
            <Box args={[3, 0.05, 1.5]} position={[0, 0.43, 7]} receiveShadow>
                <meshStandardMaterial color="#795548" roughness={1} />
            </Box>

            {/* ========== LIGHTING ========== */}
            <pointLight position={[0, 4, 6]} intensity={1.5} color="#fff8e1" distance={12} />
            <pointLight position={[5, 4, 3]} intensity={0.8} color="#fff" distance={8} />
            <pointLight position={[-5, 4, 3]} intensity={0.8} color="#fff" distance={8} />
        </group>
    );
}
