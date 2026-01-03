import React, { useState } from 'react';
import { Box, Cylinder, Text } from '@react-three/drei';
import { CareSupplies } from './CareSupplies';

export function VetClinic(props: any & { onSignClick?: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <group {...props}>
            {/* ========== RUSTIC CARE STATION (OUTDOOR) ========== */}

            {/* Wooden Platform Base */}
            <Box args={[14, 0.2, 10]} position={[0, 0.1, 0]} receiveShadow>
                <meshStandardMaterial color="#6e5a4e" roughness={0.9} />
            </Box>

            {/* Support Posts (Corner Logs) */}
            {[[-6.5, 4.5], [6.5, 4.5], [-6.5, -4.5], [6.5, -4.5]].map(([x, z], i) => (
                <Cylinder key={i} args={[0.15, 0.15, 3.5, 8]} position={[x, 1.75, z]} castShadow>
                    <meshStandardMaterial color="#5e5044" roughness={0.9} />
                </Cylinder>
            ))}

            {/* Rustic Roof Rails (No solid roof) */}
            <Box args={[14, 0.15, 0.15]} position={[0, 3.5, 4.5]} castShadow>
                <meshStandardMaterial color="#5e5044" roughness={0.9} />
            </Box>
            <Box args={[14, 0.15, 0.15]} position={[0, 3.5, -4.5]} castShadow>
                <meshStandardMaterial color="#5e5044" roughness={0.9} />
            </Box>
            <Box args={[0.15, 0.15, 10]} position={[6.5, 3.5, 0]} castShadow>
                <meshStandardMaterial color="#5e5044" roughness={0.9} />
            </Box>
            <Box args={[0.15, 0.15, 10]} position={[-6.5, 3.5, 0]} castShadow>
                <meshStandardMaterial color="#5e5044" roughness={0.9} />
            </Box>

            {/* Weathered Wooden Sign - CLICKABLE */}
            <group
                position={[0, 4, 4.6]}
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
                <Box args={[4, 0.8, 0.1]} castShadow>
                    <meshStandardMaterial color={isHovered ? "#9e8e7e" : "#7e6d5d"} roughness={0.9} />
                </Box>
                <Text
                    position={[0, 0, 0.06]}
                    fontSize={0.35}
                    color={isHovered ? "#ffffdd" : "#eeeeee"}
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.02}
                    outlineColor="#000000"
                >
                    CARE STATION
                </Text>
            </group>

            {/* Interior Elements (Converted to Rustic) */}

            {/* Wooden Exam Table */}
            <group position={[0, 0, -2]}>
                <Box args={[2.5, 0.8, 1.2]} position={[0, 0.6, 0]} castShadow>
                    <meshStandardMaterial color="#6e5a4e" roughness={0.9} />
                </Box>
                {/* Rubber Mat on Table */}
                <Box args={[2.1, 0.02, 0.9]} position={[0, 1.01, 0]} receiveShadow>
                    <meshStandardMaterial color="#333333" roughness={0.8} />
                </Box>
            </group>

            {/* Log Storage Bin for Care Supplies */}
            <group position={[-4, 0, -3]}>
                <Box args={[3, 1, 2]} position={[0, 0.5, 0]} castShadow>
                    <meshStandardMaterial color="#5e5044" roughness={0.9} />
                </Box>
                <CareSupplies position={[0, 1.1, 0]} scale={1.2} />
            </group>

            {/* Rustic Bench for Waiting Area */}
            <group position={[4, 0, 3]} rotation={[0, -Math.PI / 4, 0]}>
                <Box args={[3, 0.2, 0.8]} position={[0, 0.4, 0]} castShadow>
                    <meshStandardMaterial color="#6e5a4e" roughness={0.9} />
                </Box>
                <Box args={[3, 0.8, 0.1]} position={[0, 0.8, 0.4]} castShadow>
                    <meshStandardMaterial color="#6e5a4e" roughness={0.9} />
                </Box>
                {/* Legs */}
                <Box args={[0.2, 0.4, 0.2]} position={[-1.3, 0.2, -0.3]} castShadow>
                    <meshStandardMaterial color="#5e5044" />
                </Box>
                <Box args={[0.2, 0.4, 0.2]} position={[1.3, 0.2, -0.3]} castShadow>
                    <meshStandardMaterial color="#5e5044" />
                </Box>
            </group>

            {/* Small Lantern Hook (Replacing fluorescent light) */}
            <group position={[6.5, 3.2, 0]}>
                <Cylinder args={[0.02, 0.02, 0.6]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.3]} castShadow>
                    <meshStandardMaterial color="#333333" />
                </Cylinder>
                <pointLight position={[0, -0.4, 0.5]} intensity={1.5} distance={10} color="#ffccaa" />
            </group>
        </group>
    );
}
