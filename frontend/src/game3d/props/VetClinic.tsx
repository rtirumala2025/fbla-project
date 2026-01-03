import React, { useState } from 'react';
import { Box, Cylinder, Text } from '@react-three/drei';
import { CareSupplies } from './CareSupplies';

export function VetClinic(props: any & { onSignClick?: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <group {...props}>
            {/* ========== EXTERIOR ========== */}

            {/* Main Building (Resized to 10x10x3.2) */}
            {/* Back Wall */}
            <Box args={[10, 3.2, 0.2]} position={[0, 1.6, -5]} castShadow receiveShadow>
                <meshStandardMaterial color="#f5f5f5" roughness={0.7} />
            </Box>
            {/* Trim */}
            <Box args={[10, 0.4, 0.25]} position={[0, 3, -5]} castShadow>
                <meshStandardMaterial color="#20b2aa" roughness={0.6} />
            </Box>

            {/* Side Walls */}
            <Box args={[0.2, 3.2, 10]} position={[-5, 1.6, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#f5f5f5" roughness={0.7} />
            </Box>
            <Box args={[0.2, 0.4, 10]} position={[-5, 3, 0]} castShadow>
                <meshStandardMaterial color="#20b2aa" roughness={0.6} />
            </Box>
            <Box args={[0.2, 3.2, 10]} position={[5, 1.6, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#f5f5f5" roughness={0.7} />
            </Box>
            <Box args={[0.2, 0.4, 10]} position={[5, 3, 0]} castShadow>
                <meshStandardMaterial color="#20b2aa" roughness={0.6} />
            </Box>

            {/* Front Wall */}
            <Box args={[4.4, 3.2, 0.2]} position={[-2.8, 1.6, 5]} castShadow receiveShadow>
                <meshStandardMaterial color="#f5f5f5" roughness={0.7} />
            </Box>
            <Box args={[4.4, 3.2, 0.2]} position={[2.8, 1.6, 5]} castShadow receiveShadow>
                <meshStandardMaterial color="#f5f5f5" roughness={0.7} />
            </Box>
            <Box args={[1.2, 1, 0.2]} position={[0, 2.7, 5]} castShadow receiveShadow>
                <meshStandardMaterial color="#f5f5f5" roughness={0.7} />
            </Box>

            {/* Entrance Door (Proportionate: 1.2 x 2.2) */}
            <Box args={[1.2, 2.2, 0.1]} position={[0, 1.1, 5.05]} castShadow>
                <meshStandardMaterial color="#20b2aa" roughness={0.5} />
            </Box>

            {/* Roof */}
            <Box args={[10.5, 0.1, 10.5]} position={[0, 3.25, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#d3d3d3" roughness={0.8} />
            </Box>

            {/* Signage */}
            <Text
                position={[0, 3.8, 5.1]}
                fontSize={0.6}
                color={isHovered ? "#00ffff" : "#20b2aa"}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.05}
                onPointerEnter={() => setIsHovered(true)}
                onPointerLeave={() => setIsHovered(false)}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    props.onSignClick?.();
                }}
            >
                VET CARE
            </Text>

            {/* ========== INTERIOR ========== */}
            {/* Exam Table (Proportionate) */}
            <Box args={[1.2, 0.5, 0.7]} position={[0, 0.25, -1]} castShadow>
                <meshStandardMaterial color="#c0c0c0" metalness={0.9} />
            </Box>

            {/* Supplies */}
            <CareSupplies position={[-3.5, 0, -3.5]} scale={0.8} />

            <pointLight position={[0, 2.8, 0]} intensity={2} color="#fffaf0" />
        </group>
    );
}
