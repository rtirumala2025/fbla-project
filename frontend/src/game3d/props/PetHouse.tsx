import React, { useMemo, useState } from 'react';
import { Box, Cylinder, Text, Sphere, Cone } from '@react-three/drei';
import { makeWoodTexture, makeShingleTexture, makeStoneTexture } from '../core/AssetLoader';

export function PetHouse(props: any & { onSignClick?: () => void; petName?: string }) {
    const [isHovered, setIsHovered] = useState(false);

    const woodTex = useMemo(() => {
        const t = makeWoodTexture();
        t.repeat.set(3, 2);
        return t;
    }, []);

    const shingleTex = useMemo(() => {
        const t = makeShingleTexture();
        t.repeat.set(4, 3);
        return t;
    }, []);

    const stoneTex = useMemo(() => {
        const t = makeStoneTexture();
        t.repeat.set(2, 1);
        return t;
    }, []);

    // Cozy home colors
    const wallColor = "#fff8e1";      // Warm cream
    const woodColor = "#8d6e63";      // Warm brown
    const roofColor = "#5d4037";      // Dark brown shingles
    const trimColor = "#4e342e";      // Dark trim
    const doorColor = "#6d4c41";      // Door color

    const petName = props.petName || "Pet";

    return (
        <group {...props}>
            {/* ========== FOUNDATION ========== */}
            <Box args={[12, 0.5, 10]} position={[0, 0.25, 0]} castShadow receiveShadow>
                <meshStandardMaterial map={stoneTex} color="#9e9e9e" roughness={0.9} />
            </Box>

            {/* ========== MAIN HOUSE STRUCTURE ========== */}
            <group position={[0, 0.5, 0]}>
                {/* Main Walls */}
                <Box args={[11.5, 4.5, 9.5]} position={[0, 2.25, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color={wallColor} roughness={0.7} />
                </Box>

                {/* Wood Siding Strips (Horizontal) */}
                {[1, 2, 3, 4].map((y, i) => (
                    <Box key={i} args={[11.6, 0.08, 9.6]} position={[0, y, 0]}>
                        <meshStandardMaterial color={woodColor} transparent opacity={0.3} />
                    </Box>
                ))}

                {/* Corner Posts */}
                {[[-5.5, -4.5], [5.5, -4.5], [-5.5, 4.5], [5.5, 4.5]].map((pos, i) => (
                    <Box key={i} args={[0.4, 4.7, 0.4]} position={[pos[0], 2.35, pos[1]]} castShadow>
                        <meshStandardMaterial color={trimColor} />
                    </Box>
                ))}
            </group>

            {/* ========== FRONT PORCH ========== */}
            <group position={[0, 0.5, 5.5]}>
                {/* Porch Floor */}
                <Box args={[8, 0.2, 3]} position={[0, 0.1, 0]} castShadow receiveShadow>
                    <meshStandardMaterial map={woodTex} color={woodColor} />
                </Box>

                {/* Porch Pillars */}
                {[-3.5, 3.5].map((x, i) => (
                    <group key={i} position={[x, 0, 1.2]}>
                        <Cylinder args={[0.15, 0.2, 3, 12]} position={[0, 1.5, 0]} castShadow>
                            <meshStandardMaterial color="#fff" />
                        </Cylinder>
                        {/* Pillar Base */}
                        <Box args={[0.5, 0.3, 0.5]} position={[0, 0.15, 0]}>
                            <meshStandardMaterial color="#e0e0e0" />
                        </Box>
                    </group>
                ))}

                {/* Porch Roof */}
                <Box args={[8.5, 0.2, 3.5]} position={[0, 3.1, 0.3]} castShadow>
                    <meshStandardMaterial map={shingleTex} color={roofColor} />
                </Box>

                {/* Steps */}
                <Box args={[3, 0.2, 0.8]} position={[0, -0.15, 2]} castShadow receiveShadow>
                    <meshStandardMaterial map={stoneTex} color="#bdbdbd" />
                </Box>
                <Box args={[3.5, 0.2, 0.8]} position={[0, -0.35, 2.7]} castShadow receiveShadow>
                    <meshStandardMaterial map={stoneTex} color="#9e9e9e" />
                </Box>
            </group>

            {/* ========== FRONT DOOR ========== */}
            <group position={[0, 2.2, 4.8]}>
                {/* Door Frame Only - Door removed for dynamic interaction */}
                <Box args={[2.2, 3.4, 0.2]} position={[0, 0, 0]} castShadow>
                    <meshStandardMaterial color={trimColor} />
                </Box>
            </group>

            {/* ========== WINDOWS ========== */}
            {/* Front Windows */}
            {[-3.5, 3.5].map((x, i) => (
                <group key={i} position={[x, 2.8, 4.8]}>
                    <Box args={[1.8, 1.8, 0.15]} castShadow>
                        <meshStandardMaterial color={trimColor} />
                    </Box>
                    <Box args={[1.5, 1.5, 0.1]} position={[0, 0, 0.05]}>
                        <meshStandardMaterial color="#b3e5fc" transparent opacity={0.5} metalness={0.7} />
                    </Box>
                    {/* Window Cross */}
                    <Box args={[1.6, 0.08, 0.12]} position={[0, 0, 0.08]}>
                        <meshStandardMaterial color={trimColor} />
                    </Box>
                    <Box args={[0.08, 1.6, 0.12]} position={[0, 0, 0.08]}>
                        <meshStandardMaterial color={trimColor} />
                    </Box>
                    {/* Window Sill */}
                    <Box args={[2, 0.1, 0.3]} position={[0, -0.95, 0.1]} castShadow>
                        <meshStandardMaterial color="#e0e0e0" />
                    </Box>
                    {/* Flower Box */}
                    <Box args={[1.8, 0.3, 0.25]} position={[0, -1.15, 0.1]} castShadow>
                        <meshStandardMaterial color="#6d4c41" />
                    </Box>
                    {/* Flowers */}
                    {[-0.5, 0, 0.5].map((fx, fi) => (
                        <Sphere key={fi} args={[0.12]} position={[fx, -1, 0.15]}>
                            <meshStandardMaterial color={['#e91e63', '#ffeb3b', '#9c27b0'][fi]} />
                        </Sphere>
                    ))}
                </group>
            ))}

            {/* Side Windows */}
            {[[-5.8, 0], [5.8, 0]].map((pos, i) => (
                <group key={i} position={[pos[0], 2.8, pos[1]]} rotation={[0, i === 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
                    <Box args={[1.5, 1.5, 0.15]} castShadow>
                        <meshStandardMaterial color={trimColor} />
                    </Box>
                    <Box args={[1.2, 1.2, 0.1]} position={[0, 0, 0.05]}>
                        <meshStandardMaterial color="#b3e5fc" transparent opacity={0.5} metalness={0.7} />
                    </Box>
                </group>
            ))}

            {/* ========== ROOF ========== */}
            <group position={[0, 5, 0]}>
                {/* Main Pitched Roof */}
                <Box args={[13, 0.3, 6]} position={[0, 1.2, -2]} rotation={[-0.4, 0, 0]} castShadow receiveShadow>
                    <meshStandardMaterial map={shingleTex} color={roofColor} />
                </Box>
                <Box args={[13, 0.3, 6]} position={[0, 1.2, 2]} rotation={[0.4, 0, 0]} castShadow receiveShadow>
                    <meshStandardMaterial map={shingleTex} color={roofColor} />
                </Box>

                {/* Ridge Cap */}
                <Box args={[13.5, 0.25, 0.5]} position={[0, 2.3, 0]} castShadow>
                    <meshStandardMaterial color={trimColor} />
                </Box>

                {/* Gable Ends */}
                <Cone args={[0.2, 0.5, 4]} position={[-6.3, 2.3, 0]} rotation={[0, 0, 0]}>
                    <meshStandardMaterial color={trimColor} />
                </Cone>
                <Cone args={[0.2, 0.5, 4]} position={[6.3, 2.3, 0]} rotation={[0, 0, 0]}>
                    <meshStandardMaterial color={trimColor} />
                </Cone>
            </group>

            {/* ========== CHIMNEY ========== */}
            <group position={[3.5, 6, -2]}>
                <Box args={[1.2, 2, 1]} position={[0, 1, 0]} castShadow>
                    <meshStandardMaterial color="#b71c1c" />
                </Box>
                {/* Chimney Cap */}
                <Box args={[1.4, 0.15, 1.2]} position={[0, 2.1, 0]} castShadow>
                    <meshStandardMaterial color="#424242" />
                </Box>
                {/* Smoke particles would go here in a real implementation */}
            </group>

            {/* ========== HOUSE SIGN ========== */}
            <group
                position={[0, 4.8, 7]}
                onPointerEnter={() => { setIsHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerLeave={() => { setIsHovered(false); document.body.style.cursor = 'auto'; }}
                onPointerDown={(e) => { e.stopPropagation(); props.onSignClick?.(); }}
            >
                {/* Sign Post */}
                <Cylinder args={[0.1, 0.1, 1.5, 8]} position={[0, -0.75, 0]} castShadow>
                    <meshStandardMaterial color={trimColor} />
                </Cylinder>
                {/* Sign Board */}
                <Box args={[3.5, 1, 0.15]} castShadow>
                    <meshStandardMaterial
                        map={woodTex}
                        color={isHovered ? "#a1887f" : woodColor}
                        roughness={0.8}
                    />
                </Box>
                {/* Sign Text */}
                <Text
                    position={[0, 0.15, 0.1]}
                    fontSize={0.35}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.03}
                    outlineColor="#3e2723"
                >
                    {`${petName}'s House`}
                </Text>
                <Text
                    position={[0, -0.25, 0.1]}
                    fontSize={0.15}
                    color="#ffecb3"
                >
                    HOME SWEET HOME
                </Text>

                {/* Heart Decoration */}
                <Sphere args={[0.12]} position={[-1.4, 0.15, 0.1]}>
                    <meshStandardMaterial color="#e91e63" />
                </Sphere>
                <Sphere args={[0.12]} position={[1.4, 0.15, 0.1]}>
                    <meshStandardMaterial color="#e91e63" />
                </Sphere>
            </group>

            {/* ========== MAILBOX ========== */}
            <group position={[5, 0.5, 6]}>
                <Cylinder args={[0.08, 0.08, 1.2, 8]} position={[0, 0.6, 0]} castShadow>
                    <meshStandardMaterial color="#5d4037" />
                </Cylinder>
                <Box args={[0.5, 0.35, 0.3]} position={[0, 1.35, 0]} castShadow>
                    <meshStandardMaterial color="#1565c0" />
                </Box>
                {/* Flag */}
                <Box args={[0.02, 0.2, 0.15]} position={[0.27, 1.4, 0]}>
                    <meshStandardMaterial color="#f44336" />
                </Box>
            </group>

            {/* ========== EXTERIOR DECORATIONS ========== */}
            {/* Garden Path to Door */}
            {[0, 1, 2].map((i) => (
                <Box key={i} args={[1.5, 0.05, 0.8]} position={[0, 0.28, 7 + i * 1]} receiveShadow>
                    <meshStandardMaterial map={stoneTex} color="#9e9e9e" />
                </Box>
            ))}

            {/* Bushes */}
            {[[-5.5, 5], [5.5, 5], [-5.5, -4], [5.5, -4]].map((pos, i) => (
                <Sphere key={i} args={[0.8, 8, 8]} position={[pos[0], 0.9, pos[1]]} castShadow>
                    <meshStandardMaterial color="#388e3c" />
                </Sphere>
            ))}

            {/* Welcome Mat */}
            <Box args={[2, 0.03, 1]} position={[0, 0.53, 6.5]} receiveShadow>
                <meshStandardMaterial color="#795548" roughness={1} />
            </Box>

            {/* ========== LIGHTING ========== */}
            {/* Porch Light */}
            <group position={[2, 3.5, 5.5]}>
                <Box args={[0.3, 0.4, 0.2]} castShadow>
                    <meshStandardMaterial color="#333" />
                </Box>
                <Sphere args={[0.12]} position={[0, -0.1, 0.1]}>
                    <meshStandardMaterial color="#fff8e1" emissive="#fff8e1" emissiveIntensity={0.5} />
                </Sphere>
                <pointLight position={[0, 0, 0.5]} intensity={1} color="#fff8e1" distance={8} />
            </group>

            <pointLight position={[0, 5, 5]} intensity={0.8} color="#fff" distance={10} />
            <pointLight position={[0, 3, 0]} intensity={0.5} color="#fff8e1" distance={8} />
        </group>
    );
}
