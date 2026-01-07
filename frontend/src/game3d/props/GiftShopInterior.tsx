import React from 'react';
import { Box, Cylinder, Text, Sphere } from '@react-three/drei';
import { ActivityGuide } from './ActivityGuide';
import { makeWoodTexture } from '../core/AssetLoader';

export function GiftShopInterior() {
    const woodTex = React.useMemo(() => makeWoodTexture(), []);

    return (
        <group position={[0, 0, 0]}>
            {/* ========== FLOOR ========== */}
            <Box args={[12, 0.2, 10]} position={[0, 0.1, 0]}>
                <meshStandardMaterial map={woodTex} color="#d7ccc8" roughness={0.8} />
            </Box>

            {/* ========== SHOP GUIDE ========== */}
            <ActivityGuide
                position={[0, 1.2, 3]}
                name="Shopkeeper"
                message="Welcome to the Gift Shop! Browse our toys, food, and accessories. Everything your pet could want!"
                color="#ff7043"
            />

            {/* ========== TOY SECTION (Left Side) ========== */}
            <group position={[-4, 0.2, -2]}>
                {/* Shelving Unit */}
                <Box args={[3, 3, 0.8]} position={[0, 1.5, 0]} castShadow>
                    <meshStandardMaterial color="#5d4037" />
                </Box>
                {/* Shelves */}
                {[0.5, 1.5, 2.5].map((y, i) => (
                    <Box key={i} args={[2.8, 0.1, 0.9]} position={[0, y, 0.1]}>
                        <meshStandardMaterial color="#8d6e63" />
                    </Box>
                ))}
                {/* Toy Items on Shelves */}
                {/* Balls */}
                <Sphere args={[0.2]} position={[-0.8, 0.8, 0.3]}>
                    <meshStandardMaterial color="#f44336" />
                </Sphere>
                <Sphere args={[0.2]} position={[-0.3, 0.8, 0.3]}>
                    <meshStandardMaterial color="#2196f3" />
                </Sphere>
                <Sphere args={[0.2]} position={[0.2, 0.8, 0.3]}>
                    <meshStandardMaterial color="#4caf50" />
                </Sphere>
                {/* Frisbees */}
                <Cylinder args={[0.3, 0.3, 0.05, 16]} position={[-0.5, 1.7, 0.3]} rotation={[0.3, 0, 0]}>
                    <meshStandardMaterial color="#ff9800" />
                </Cylinder>
                <Cylinder args={[0.3, 0.3, 0.05, 16]} position={[0.3, 1.7, 0.3]} rotation={[0.3, 0, 0]}>
                    <meshStandardMaterial color="#9c27b0" />
                </Cylinder>
                {/* Rope Toys (simplified) */}
                <Cylinder args={[0.08, 0.08, 0.8, 8]} position={[0, 2.7, 0.3]} rotation={[0, 0, Math.PI / 4]}>
                    <meshStandardMaterial color="#795548" />
                </Cylinder>

                {/* Section Sign */}
                <Text
                    position={[0, 3.2, 0.5]}
                    fontSize={0.25}
                    color="#ff5722"
                    anchorX="center"
                >
                    TOYS
                </Text>
            </group>

            {/* ========== FOOD SECTION (Right Side) ========== */}
            <group position={[4, 0.2, -2]}>
                {/* Refrigerator/Shelving */}
                <Box args={[3, 3.5, 1]} position={[0, 1.75, 0]} castShadow>
                    <meshStandardMaterial color="#90a4ae" metalness={0.3} />
                </Box>
                {/* Glass Door */}
                <Box args={[2.6, 3, 0.1]} position={[0, 1.75, 0.5]}>
                    <meshStandardMaterial color="#b3e5fc" transparent opacity={0.4} metalness={0.8} />
                </Box>
                {/* Food Items Inside */}
                {/* Food Bags */}
                <Box args={[0.5, 0.7, 0.3]} position={[-0.7, 0.6, 0]}>
                    <meshStandardMaterial color="#8d6e63" />
                </Box>
                <Box args={[0.5, 0.7, 0.3]} position={[0, 0.6, 0]}>
                    <meshStandardMaterial color="#a1887f" />
                </Box>
                <Box args={[0.5, 0.7, 0.3]} position={[0.7, 0.6, 0]}>
                    <meshStandardMaterial color="#6d4c41" />
                </Box>
                {/* Canned Food */}
                {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
                    <Cylinder key={i} args={[0.12, 0.12, 0.25, 12]} position={[x, 1.5, 0]}>
                        <meshStandardMaterial color={['#f44336', '#ff9800', '#4caf50', '#2196f3'][i]} />
                    </Cylinder>
                ))}
                {/* Treats Box */}
                <Box args={[0.4, 0.3, 0.4]} position={[0, 2.3, 0]}>
                    <meshStandardMaterial color="#ffeb3b" />
                </Box>

                {/* Section Sign */}
                <Text
                    position={[0, 3.6, 0.6]}
                    fontSize={0.25}
                    color="#4caf50"
                    anchorX="center"
                >
                    FOOD
                </Text>
            </group>

            {/* ========== ACCESSORY SECTION (Back Left) ========== */}
            <group position={[-3, 0.2, -4]}>
                {/* Display Rack */}
                <Cylinder args={[0.1, 0.1, 2.5, 8]} position={[0, 1.25, 0]} castShadow>
                    <meshStandardMaterial color="#333" />
                </Cylinder>
                {/* Rotating Display Arms */}
                {[0, 1, 2, 3].map((i) => {
                    const angle = (i / 4) * Math.PI * 2;
                    return (
                        <group key={i} position={[0, 1.5 + i * 0.3, 0]} rotation={[0, angle, 0]}>
                            <Box args={[1, 0.05, 0.05]} position={[0.5, 0, 0]}>
                                <meshStandardMaterial color="#666" />
                            </Box>
                            {/* Collar/Bandana hanging */}
                            <Cylinder args={[0.15, 0.12, 0.1, 12]} position={[0.9, -0.1, 0]}>
                                <meshStandardMaterial color={['#e91e63', '#2196f3', '#ff9800', '#9c27b0'][i]} />
                            </Cylinder>
                        </group>
                    );
                })}

                <Text
                    position={[0, 2.8, 0]}
                    fontSize={0.2}
                    color="#9c27b0"
                    anchorX="center"
                >
                    ACCESSORIES
                </Text>
            </group>

            {/* ========== HEALTH ITEMS (Back Right) ========== */}
            <group position={[3, 0.2, -4]}>
                {/* Medicine Cabinet */}
                <Box args={[2, 2, 0.6]} position={[0, 1, 0]} castShadow>
                    <meshStandardMaterial color="#eceff1" />
                </Box>
                {/* Cabinet Door */}
                <Box args={[1.8, 1.8, 0.1]} position={[0, 1, 0.3]}>
                    <meshStandardMaterial color="#b3e5fc" transparent opacity={0.5} />
                </Box>
                {/* Cross Symbol */}
                <group position={[0, 1, 0.4]}>
                    <Box args={[0.1, 0.5, 0.05]}>
                        <meshStandardMaterial color="#f44336" />
                    </Box>
                    <Box args={[0.5, 0.1, 0.05]}>
                        <meshStandardMaterial color="#f44336" />
                    </Box>
                </group>

                <Text
                    position={[0, 2.2, 0.4]}
                    fontSize={0.18}
                    color="#f44336"
                    anchorX="center"
                >
                    HEALTH
                </Text>
            </group>

            {/* ========== CHECKOUT COUNTER ========== */}
            <group position={[0, 0.2, 2]}>
                {/* Main Counter */}
                <Box args={[4, 1, 1.5]} position={[0, 0.5, 0]} castShadow>
                    <meshStandardMaterial color="#5d4037" />
                </Box>
                {/* Counter Top */}
                <Box args={[4.2, 0.1, 1.6]} position={[0, 1.05, 0]}>
                    <meshStandardMaterial color="#fff8e1" metalness={0.3} roughness={0.2} />
                </Box>

                {/* Cash Register */}
                <group position={[1.2, 1.1, 0]}>
                    <Box args={[0.6, 0.4, 0.5]} position={[0, 0.2, 0]} castShadow>
                        <meshStandardMaterial color="#37474f" />
                    </Box>
                    {/* Register Screen */}
                    <Box args={[0.4, 0.25, 0.05]} position={[0, 0.35, 0.25]} rotation={[-0.3, 0, 0]}>
                        <meshStandardMaterial color="#4fc3f7" emissive="#4fc3f7" emissiveIntensity={0.3} />
                    </Box>
                </group>

                {/* Receipt/Paper Roll */}
                <Cylinder args={[0.08, 0.08, 0.15, 12]} position={[1.5, 1.15, 0.3]} rotation={[0, 0, Math.PI / 2]}>
                    <meshStandardMaterial color="#fff" />
                </Cylinder>

                {/* Shopping Baskets */}
                <group position={[-1.5, 0, 0.8]}>
                    {[0, 0.3, 0.6].map((y, i) => (
                        <Box key={i} args={[0.5, 0.25, 0.4]} position={[0, 0.15 + y, 0]}>
                            <meshStandardMaterial color="#f44336" transparent opacity={0.8} />
                        </Box>
                    ))}
                </group>

                {/* "CHECKOUT" Sign */}
                <Text
                    position={[0, 1.6, 0]}
                    fontSize={0.25}
                    color="#ff7043"
                    anchorX="center"
                >
                    CHECKOUT
                </Text>
            </group>

            {/* ========== DECORATIVE ELEMENTS ========== */}
            {/* Hanging Sale Signs */}
            <group position={[0, 3.5, 0]}>
                <Box args={[1.5, 0.6, 0.1]} position={[-2, 0, 0]} rotation={[0, 0.2, 0]}>
                    <meshStandardMaterial color="#ffeb3b" />
                </Box>
                <Text position={[-2, 0, 0.1]} fontSize={0.2} color="#f44336" rotation={[0, 0.2, 0]}>
                    SALE!
                </Text>

                <Box args={[1.2, 0.5, 0.1]} position={[2.5, -0.3, 0]} rotation={[0, -0.15, 0]}>
                    <meshStandardMaterial color="#e1f5fe" />
                </Box>
                <Text position={[2.5, -0.3, 0.1]} fontSize={0.15} color="#0288d1" rotation={[0, -0.15, 0]}>
                    NEW!
                </Text>
            </group>

            {/* ========== LIGHTING ========== */}
            <pointLight position={[0, 4, 0]} intensity={2} color="#fff8e1" distance={15} />
            <pointLight position={[-4, 3, -2]} intensity={1} color="#fff" distance={8} />
            <pointLight position={[4, 3, -2]} intensity={1} color="#fff" distance={8} />
            <ambientLight intensity={0.5} />
        </group>
    );
}
