import React, { useState } from 'react';
import { Box, Text } from '@react-three/drei';
import { AgilityCourse } from './AgilityCourse';

export function AgilityFacility(props: any & { onSignClick?: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <group {...props}>
            {/* ========== EXTERIOR ========== */

                {/* Main Building Structure - Modern Gymnasium (Rescaled to 22x22x6) */ }
            {/* Back Wall */}
            <Box args={[22, 6, 0.3]} position={[0, 3, -11]} castShadow receiveShadow>
                <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
            </Box>

            {/* Side Walls */}
            <Box args={[0.3, 6, 22]} position={[-11, 3, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
            </Box>
            <Box args={[0.3, 6, 22]} position={[11, 3, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
            </Box>

            {/* Front Wall with Glass Windows */}
            <Box args={[8, 6, 0.3]} position={[-7, 3, 11]} castShadow receiveShadow>
                <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
            </Box>
            <Box args={[8, 6, 0.3]} position={[7, 3, 11]} castShadow receiveShadow>
                <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
            </Box>

            {/* Glass Window Panel */}
            <Box args={[6, 4, 0.1]} position={[0, 4, 11]} castShadow receiveShadow>
                <meshStandardMaterial color="#87ceeb" transparent opacity={0.3} roughness={0.1} metalness={0.9} />
            </Box>

            {/* Metal Roof with Slope */}
            <Box args={[23, 0.2, 23]} position={[0, 6.2, 0]} rotation={[0.03, 0, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#555555" roughness={0.4} metalness={0.8} />
            </Box>

            {/* Entrance Doors (Resized) */}
            <Box args={[1.5, 4.5, 0.2]} position={[-0.9, 2.25, 11.2]} castShadow>
                <meshStandardMaterial color="#2a2a2a" roughness={0.5} />
            </Box>
            <Box args={[1.5, 4.5, 0.2]} position={[0.9, 2.25, 11.2]} castShadow>
                <meshStandardMaterial color="#2a2a2a" roughness={0.5} />
            </Box>

            {/* Exterior Signage - CLICKABLE */}
            <Text
                position={[0, 7.2, 11.4]}
                rotation={[0, 0, 0]}
                fontSize={isHovered ? 1.35 : 1.2}
                color={isHovered ? "#ffff00" : "#ffffff"}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.1}
                outlineColor="#000000"
                onPointerEnter={(e) => {
                    e.stopPropagation();
                    setIsHovered(true);
                    document.body.style.cursor = 'pointer';
                }}
                onPointerLeave={(e) => {
                    e.stopPropagation();
                    setIsHovered(false);
                    document.body.style.cursor = 'auto';
                }}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    props.onSignClick?.();
                }}
            >
                AGILITY TRAINING
            </Text>

            {/* ========== INTERIOR ========== */}

            {/* Rubber Safety Flooring (Rescaled) */}
            <Box args={[21, 0.1, 21]} position={[0, 0.05, 0]} receiveShadow>
                <meshStandardMaterial color="#4a5568" roughness={0.8} />
            </Box>

            {/* Agility Equipment (reusing existing component, rescaled to fit) */}
            <AgilityCourse position={[0, 0, -2]} scale={1.1} />

            {/* Storage Cabinets - Right Wall */}
            <Box args={[2, 1.5, 0.8]} position={[9.5, 0.75, -7]} castShadow>
                <meshStandardMaterial color="#8b4513" roughness={0.7} />
            </Box>
            <Box args={[2, 1.5, 0.8]} position={[9.5, 0.75, -4]} castShadow>
                <meshStandardMaterial color="#8b4513" roughness={0.7} />
            </Box>

            {/* Trophy Shelf - Back Wall */}
            <Box args={[6, 0.2, 0.6]} position={[-6, 4, -10.5]} castShadow>
                <meshStandardMaterial color="#d2691e" roughness={0.6} />
            </Box>

            {/* Trophies (Smaller) */}
            <mesh position={[-7.5, 4.35, -10.5]} castShadow>
                <cylinderGeometry args={[0.15, 0.2, 0.5, 8]} />
                <meshStandardMaterial color="#ffd700" roughness={0.2} metalness={0.9} />
            </mesh>
            <mesh position={[-6, 4.35, -10.5]} castShadow>
                <cylinderGeometry args={[0.15, 0.2, 0.5, 8]} />
                <meshStandardMaterial color="#ffd700" roughness={0.2} metalness={0.9} />
            </mesh>
            <mesh position={[-4.5, 4.35, -10.5]} castShadow>
                <cylinderGeometry args={[0.15, 0.2, 0.5, 8]} />
                <meshStandardMaterial color="#ffd700" roughness={0.2} metalness={0.9} />
            </mesh>

            {/* Viewing Benches - Left Wall */}
            <Box args={[0.8, 0.3, 4]} position={[-9.5, 0.4, 4]} castShadow>
                <meshStandardMaterial color="#654321" roughness={0.7} />
            </Box>
            <Box args={[0.8, 0.3, 4]} position={[-9.5, 0.4, -4]} castShadow>
                <meshStandardMaterial color="#654321" roughness={0.7} />
            </Box>

            {/* Overhead LED Lighting Strips */}
            <Box args={[14, 0.15, 0.8]} position={[0, 5.8, 0]} castShadow>
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
            </Box>
            <pointLight position={[0, 5, 0]} intensity={1.5} distance={30} color="#ffffff" />
            <pointLight position={[-6, 5, -6]} intensity={1.2} distance={20} color="#ffffff" />
            <pointLight position={[6, 5, 6]} intensity={1.2} distance={20} color="#ffffff" />
        </group>
    );
}
