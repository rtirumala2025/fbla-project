import React from 'react';
import { Box, Cylinder, Sphere, Text, Cone } from '@react-three/drei';
import { ActivityGuide } from './ActivityGuide';
import { makeWoodTexture } from '../core/AssetLoader';

export function PetHouseInterior() {
    const woodTex = React.useMemo(() => makeWoodTexture(), []);

    return (
        <group position={[0, 0, 0]}>
            {/* ========== FLOOR ========== */}
            <Box args={[10, 0.2, 8]} position={[0, 0.1, 0]}>
                <meshStandardMaterial map={woodTex} color="#8d6e63" roughness={0.8} />
            </Box>

            {/* Center Rug */}
            <Box args={[5, 0.05, 4]} position={[0, 0.22, 0]} receiveShadow>
                <meshStandardMaterial color="#c5cae9" roughness={1} />
            </Box>
            {/* Rug Border */}
            <Box args={[5.3, 0.04, 4.3]} position={[0, 0.2, 0]} receiveShadow>
                <meshStandardMaterial color="#7986cb" roughness={1} />
            </Box>

            {/* ========== HOME GUIDE ========== */}
            <ActivityGuide
                position={[0, 1.2, 2]}
                name="Home"
                message="Welcome home! Rest here to restore your energy. This is your pet's safe space where all rest is FREE!"
                color="#8d6e63"
            />

            {/* ========== LIVING AREA (Front) ========== */}
            <group position={[0, 0.2, 1.5]}>
                {/* Pet Couch/Sofa */}
                <group position={[-2.5, 0, 0]}>
                    {/* Couch Base */}
                    <Box args={[2.5, 0.6, 1.2]} position={[0, 0.3, 0]} castShadow>
                        <meshStandardMaterial color="#7e57c2" roughness={0.9} />
                    </Box>
                    {/* Couch Back */}
                    <Box args={[2.5, 0.8, 0.3]} position={[0, 0.7, -0.45]} castShadow>
                        <meshStandardMaterial color="#7e57c2" />
                    </Box>
                    {/* Armrests */}
                    <Box args={[0.25, 0.5, 1]} position={[-1.1, 0.55, 0]} castShadow>
                        <meshStandardMaterial color="#5e35b1" />
                    </Box>
                    <Box args={[0.25, 0.5, 1]} position={[1.1, 0.55, 0]} castShadow>
                        <meshStandardMaterial color="#5e35b1" />
                    </Box>
                    {/* Cushions */}
                    <Box args={[0.8, 0.15, 0.8]} position={[-0.5, 0.65, 0]}>
                        <meshStandardMaterial color="#b39ddb" />
                    </Box>
                    <Box args={[0.8, 0.15, 0.8]} position={[0.5, 0.65, 0]}>
                        <meshStandardMaterial color="#d1c4e9" />
                    </Box>
                </group>

                {/* Side Table */}
                <group position={[2.5, 0, 0]}>
                    <Cylinder args={[0.4, 0.4, 0.5, 16]} position={[0, 0.25, 0]} castShadow>
                        <meshStandardMaterial color="#5d4037" />
                    </Cylinder>
                    <Cylinder args={[0.5, 0.5, 0.05, 16]} position={[0, 0.52, 0]}>
                        <meshStandardMaterial color="#6d4c41" />
                    </Cylinder>
                    {/* Lamp on table */}
                    <Cylinder args={[0.08, 0.1, 0.3, 12]} position={[0, 0.7, 0]} castShadow>
                        <meshStandardMaterial color="#795548" />
                    </Cylinder>
                    <Cone args={[0.2, 0.25, 12]} position={[0, 0.95, 0]}>
                        <meshStandardMaterial color="#fff8e1" emissive="#fff8e1" emissiveIntensity={0.3} />
                    </Cone>
                </group>
            </group>

            {/* ========== BEDROOM AREA (Back Left) ========== */}
            <group position={[-3, 0.2, -2]}>
                {/* Large Pet Bed */}
                <Box args={[3, 0.4, 2.5]} position={[0, 0.2, 0]} castShadow>
                    <meshStandardMaterial color="#5c6bc0" roughness={0.9} />
                </Box>
                {/* Bed Rim */}
                <Box args={[3.2, 0.6, 0.3]} position={[0, 0.3, -1.1]} castShadow>
                    <meshStandardMaterial color="#3f51b5" />
                </Box>
                <Box args={[0.3, 0.6, 2.5]} position={[-1.45, 0.3, 0]} castShadow>
                    <meshStandardMaterial color="#3f51b5" />
                </Box>
                <Box args={[0.3, 0.6, 2.5]} position={[1.45, 0.3, 0]} castShadow>
                    <meshStandardMaterial color="#3f51b5" />
                </Box>
                {/* Pillow */}
                <Box args={[1.5, 0.25, 0.8]} position={[0, 0.5, -0.6]} castShadow>
                    <meshStandardMaterial color="#e8eaf6" />
                </Box>
                {/* Blanket */}
                <Box args={[2.5, 0.1, 1.5]} position={[0, 0.45, 0.3]}>
                    <meshStandardMaterial color="#9fa8da" />
                </Box>

                {/* "Zzz" Sleep indicator */}
                <Text
                    position={[0, 1.2, 0]}
                    fontSize={0.4}
                    color="#7986cb"
                    anchorX="center"
                    fillOpacity={0.7}
                >
                    💤 Sleep Here
                </Text>

                {/* Nightstand */}
                <group position={[2, 0, -0.8]}>
                    <Box args={[0.6, 0.5, 0.6]} position={[0, 0.25, 0]} castShadow>
                        <meshStandardMaterial color="#5d4037" />
                    </Box>
                    {/* Alarm Clock */}
                    <Box args={[0.2, 0.15, 0.1]} position={[0, 0.55, 0]}>
                        <meshStandardMaterial color="#f44336" />
                    </Box>
                </group>
            </group>

            {/* ========== FOOD AREA (Back Right) ========== */}
            <group position={[3, 0.2, -2]}>
                {/* Food Bowl */}
                <Cylinder args={[0.4, 0.35, 0.2, 16]} position={[-0.5, 0.1, 0]} castShadow>
                    <meshStandardMaterial color="#f44336" />
                </Cylinder>
                {/* Food inside bowl */}
                <Cylinder args={[0.32, 0.32, 0.1, 16]} position={[-0.5, 0.15, 0]}>
                    <meshStandardMaterial color="#8d6e63" />
                </Cylinder>

                {/* Water Bowl */}
                <Cylinder args={[0.4, 0.35, 0.2, 16]} position={[0.5, 0.1, 0]} castShadow>
                    <meshStandardMaterial color="#2196f3" />
                </Cylinder>
                {/* Water inside bowl */}
                <Cylinder args={[0.32, 0.32, 0.08, 16]} position={[0.5, 0.14, 0]}>
                    <meshStandardMaterial color="#64b5f6" transparent opacity={0.8} />
                </Cylinder>

                {/* Bowl Mat */}
                <Box args={[2, 0.02, 1]} position={[0, 0.01, 0]} receiveShadow>
                    <meshStandardMaterial color="#78909c" />
                </Box>

                {/* Food Label */}
                <Text
                    position={[0, 0.6, 0]}
                    fontSize={0.15}
                    color="#5d4037"
                    anchorX="center"
                >
                    🍖 Food & Water
                </Text>
            </group>

            {/* ========== TOY STORAGE (Front Right) ========== */}
            <group position={[3.5, 0.2, 1.5]}>
                {/* Toy Box */}
                <Box args={[1.5, 0.8, 1]} position={[0, 0.4, 0]} castShadow>
                    <meshStandardMaterial color="#ff7043" />
                </Box>
                {/* Toys spilling out */}
                <Sphere args={[0.15]} position={[-0.3, 0.9, 0.2]}>
                    <meshStandardMaterial color="#4caf50" />
                </Sphere>
                <Sphere args={[0.12]} position={[0.2, 0.85, 0.3]}>
                    <meshStandardMaterial color="#2196f3" />
                </Sphere>
                {/* Rope toy */}
                <Cylinder args={[0.06, 0.06, 0.5, 8]} position={[0.4, 0.9, -0.1]} rotation={[0.5, 0, 0.3]}>
                    <meshStandardMaterial color="#795548" />
                </Cylinder>

                {/* Toy Label */}
                <Text
                    position={[0, 1.1, 0.5]}
                    fontSize={0.12}
                    color="#e65100"
                    anchorX="center"
                >
                    🧸 Toys
                </Text>
            </group>

            {/* ========== WALLS/DECOR ========== */}
            {/* Picture Frames on "Wall" */}
            <group position={[0, 2.5, -3.8]}>
                {/* Frame 1 */}
                <Box args={[1.2, 1, 0.1]} position={[-2, 0, 0]} castShadow>
                    <meshStandardMaterial color="#5d4037" />
                </Box>
                <Box args={[1, 0.8, 0.05]} position={[-2, 0, 0.05]}>
                    <meshStandardMaterial color="#fff8e1" />
                </Box>

                {/* Frame 2 */}
                <Box args={[1.5, 1, 0.1]} position={[0.5, 0, 0]} castShadow>
                    <meshStandardMaterial color="#5d4037" />
                </Box>
                <Box args={[1.3, 0.8, 0.05]} position={[0.5, 0, 0.05]}>
                    <meshStandardMaterial color="#e3f2fd" />
                </Box>

                {/* Frame 3 */}
                <Box args={[0.8, 0.8, 0.1]} position={[2.5, 0, 0]} castShadow>
                    <meshStandardMaterial color="#5d4037" />
                </Box>
                <Box args={[0.6, 0.6, 0.05]} position={[2.5, 0, 0.05]}>
                    <meshStandardMaterial color="#fce4ec" />
                </Box>
            </group>

            {/* Window with Curtains */}
            <group position={[-4.8, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
                {/* Window */}
                <Box args={[2, 1.5, 0.1]}>
                    <meshStandardMaterial color="#b3e5fc" transparent opacity={0.4} />
                </Box>
                {/* Curtains */}
                <Box args={[0.4, 1.8, 0.05]} position={[-0.9, 0, 0.05]}>
                    <meshStandardMaterial color="#7986cb" />
                </Box>
                <Box args={[0.4, 1.8, 0.05]} position={[0.9, 0, 0.05]}>
                    <meshStandardMaterial color="#7986cb" />
                </Box>
            </group>

            {/* ========== LIGHTING ========== */}
            {/* Warm cozy lighting */}
            <pointLight position={[0, 4, 0]} intensity={1.5} color="#fff8e1" distance={12} />
            <pointLight position={[-3, 2, -2]} intensity={0.8} color="#c5cae9" distance={6} />
            <pointLight position={[2.5, 1.5, 1.5]} intensity={0.5} color="#fff" distance={5} />
            <ambientLight intensity={0.4} color="#e8eaf6" />
        </group>
    );
}
