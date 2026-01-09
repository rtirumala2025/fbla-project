import React, { useMemo, useState } from 'react';
import { Box, Cylinder, Text, Sphere } from '@react-three/drei';
import { makeWoodTexture, makeStoneTexture } from '../core/AssetLoader';

export function Supermarket(props: any & { onSignClick?: () => void }) {
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

    // Supermarket colors - Green/Blue grocery theme
    const wallColor = "#e8f5e9";      // Light mint
    const accentColor = "#2e7d32";    // Forest green
    const roofColor = "#1976d2";      // Blue roof
    const awningColor = "#4caf50";    // Green awning
    const trimColor = "#1b5e20";      // Dark green trim

    return (
        <group {...props}>
            {/* ========== FOUNDATION ========== */}
            <Box args={[16, 0.4, 14]} position={[0, 0.2, 0]} castShadow receiveShadow>
                <meshStandardMaterial map={stoneTex} color="#90a4ae" roughness={0.9} />
            </Box>

            {/* ========== MAIN BUILDING STRUCTURE ========== */}
            <group position={[0, 0.4, 0]}>
                {/* Main Walls */}
                <Box args={[15.6, 6, 13.6]} position={[0, 3, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color={wallColor} roughness={0.6} />
                </Box>

                {/* Green Accent Strips */}
                <Box args={[16, 0.4, 0.1]} position={[0, 6, 6.85]} castShadow>
                    <meshStandardMaterial color={accentColor} />
                </Box>
                <Box args={[16, 0.4, 0.1]} position={[0, 0.2, 6.85]} castShadow>
                    <meshStandardMaterial color={accentColor} />
                </Box>

                {/* Corner Pillars */}
                {[[-7.5, -6.5], [7.5, -6.5], [-7.5, 6.5], [7.5, 6.5]].map((pos, i) => (
                    <Box key={i} args={[0.5, 6.2, 0.5]} position={[pos[0], 3.1, pos[1]]} castShadow>
                        <meshStandardMaterial color={trimColor} />
                    </Box>
                ))}
            </group>

            {/* ========== STOREFRONT WINDOWS (FRONT) ========== */}
            <group position={[0, 3, 6.85]}>
                {/* Large Display Windows */}
                {[-4, 4].map((x, i) => (
                    <group key={i} position={[x, 0, 0]}>
                        <Box args={[4, 3.5, 0.15]} castShadow>
                            <meshStandardMaterial
                                color="#e3f2fd"
                                metalness={0.8}
                                roughness={0.1}
                                transparent
                                opacity={0.5}
                            />
                        </Box>
                        {/* Window Frame */}
                        <Box args={[4.2, 0.15, 0.2]} position={[0, 1.85, 0]} castShadow>
                            <meshStandardMaterial color={trimColor} />
                        </Box>
                        <Box args={[4.2, 0.15, 0.2]} position={[0, -1.85, 0]} castShadow>
                            <meshStandardMaterial color={trimColor} />
                        </Box>
                    </group>
                ))}

                {/* Produce Display in Windows */}
                {[-4, 4].map((x, i) => (
                    <group key={`produce-${i}`} position={[x, -1.2, -0.3]}>
                        {/* Stacked cans/boxes */}
                        <Box args={[0.4, 0.5, 0.4]} position={[-1, 0, 0]} castShadow>
                            <meshStandardMaterial color="#f44336" />
                        </Box>
                        <Box args={[0.5, 0.4, 0.5]} position={[0, 0, 0]} castShadow>
                            <meshStandardMaterial color="#ff9800" />
                        </Box>
                        <Box args={[0.45, 0.6, 0.45]} position={[1, 0, 0]} castShadow>
                            <meshStandardMaterial color="#4caf50" />
                        </Box>
                        {/* Shopping bag */}
                        <Box args={[0.4, 0.5, 0.3]} position={[0.5, 0.5, 0]} castShadow>
                            <meshStandardMaterial color="#8d6e63" />
                        </Box>
                    </group>
                ))}
            </group>

            {/* ========== ENTRANCE (SLIDING DOORS STYLE) ========== */}
            <group position={[0, 2.2, 6.9]}>
                {/* Frame Header */}
                <Box args={[3.2, 0.25, 0.35]} position={[0, 2.2, 0]} castShadow>
                    <meshStandardMaterial color={trimColor} />
                </Box>
                {/* Vertical Jambs */}
                <Box args={[0.2, 4.4, 0.35]} position={[-1.6, 0, 0]} castShadow>
                    <meshStandardMaterial color={trimColor} />
                </Box>
                <Box args={[0.2, 4.4, 0.35]} position={[1.6, 0, 0]} castShadow>
                    <meshStandardMaterial color={trimColor} />
                </Box>
            </group>

            {/* ========== AWNING ========== */}
            <group position={[0, 5.5, 8]}>
                {/* Main Awning */}
                <Box args={[14, 0.2, 3.5]} rotation={[0.12, 0, 0]} castShadow>
                    <meshStandardMaterial color={awningColor} />
                </Box>
                {/* Awning Support Brackets */}
                {[-5, 0, 5].map((x, i) => (
                    <Box key={i} args={[0.15, 0.8, 2.5]} position={[x, -0.4, 0.5]} rotation={[0.12, 0, 0]}>
                        <meshStandardMaterial color={trimColor} />
                    </Box>
                ))}
            </group>

            {/* ========== ROOF ========== */}
            <group position={[0, 6.5, 0]}>
                <Box args={[16.5, 0.5, 14.5]} castShadow receiveShadow>
                    <meshStandardMaterial color={roofColor} roughness={0.6} />
                </Box>
                {/* Roof Edge Trim */}
                <Box args={[17, 0.25, 0.4]} position={[0, 0.15, 7.3]} castShadow>
                    <meshStandardMaterial color="#1565c0" />
                </Box>
            </group>

            {/* ========== SIGNAGE ========== */}
            <group
                position={[0, 7.5, 6.5]}
                onPointerEnter={() => { setIsHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerLeave={() => { setIsHovered(false); document.body.style.cursor = 'auto'; }}
                onPointerDown={(e) => { e.stopPropagation(); props.onSignClick?.(); }}
            >
                {/* Sign Board */}
                <Box args={[8, 1.8, 0.35]} castShadow>
                    <meshStandardMaterial color={isHovered ? "#43a047" : accentColor} roughness={0.3} />
                </Box>
                {/* Sign Text */}
                <Text
                    position={[0, 0.2, 0.2]}
                    fontSize={0.7}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.04}
                    outlineColor="#000000"
                >
                    SUPERMARKET
                </Text>
                <Text
                    position={[0, -0.5, 0.2]}
                    fontSize={0.22}
                    color="#c8e6c9"
                >
                    FOOD • TOYS • SUPPLIES
                </Text>

                {/* Shopping Cart Icon */}
                <group position={[-3.3, 0, 0.2]}>
                    <Box args={[0.6, 0.4, 0.1]}>
                        <meshStandardMaterial color="#ffffff" />
                    </Box>
                    <Cylinder args={[0.1, 0.1, 0.1, 8]} position={[-0.2, -0.3, 0]}>
                        <meshStandardMaterial color="#ffffff" />
                    </Cylinder>
                    <Cylinder args={[0.1, 0.1, 0.1, 8]} position={[0.2, -0.3, 0]}>
                        <meshStandardMaterial color="#ffffff" />
                    </Cylinder>
                </group>
            </group>

            {/* ========== EXTERIOR DECORATIONS ========== */}
            {/* Shopping Carts */}
            {[[-6, 7.5], [6, 7.5]].map((pos, i) => (
                <group key={i} position={[pos[0], 0.6, pos[1]]}>
                    <Box args={[0.8, 0.5, 0.5]} position={[0, 0.25, 0]} castShadow>
                        <meshStandardMaterial color="#9e9e9e" metalness={0.6} />
                    </Box>
                    <Cylinder args={[0.08, 0.08, 0.15, 8]} position={[-0.3, 0, 0.15]}>
                        <meshStandardMaterial color="#424242" />
                    </Cylinder>
                    <Cylinder args={[0.08, 0.08, 0.15, 8]} position={[0.3, 0, 0.15]}>
                        <meshStandardMaterial color="#424242" />
                    </Cylinder>
                </group>
            ))}

            {/* Welcome Mat */}
            <Box args={[3.5, 0.05, 2]} position={[0, 0.43, 8]} receiveShadow>
                <meshStandardMaterial color="#4caf50" roughness={1} />
            </Box>

            {/* ========== LIGHTING ========== */}
            <pointLight position={[0, 5, 7]} intensity={1.5} color="#fff8e1" distance={14} />
            <pointLight position={[6, 5, 4]} intensity={0.8} color="#fff" distance={10} />
            <pointLight position={[-6, 5, 4]} intensity={0.8} color="#fff" distance={10} />
        </group>
    );
}
