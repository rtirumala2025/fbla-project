import React from 'react';
import { Box, Cylinder, Text } from '@react-three/drei';
import { CareSupplies } from './CareSupplies';

export function VetClinic(props: any) {
    return (
        <group {...props}>
            {/* ========== EXTERIOR ========== */}

            {/* Main Building - Medical Clinic Aesthetic (Resized to 18x18x5) */}
            {/* Back Wall */}
            <Box args={[18, 5, 0.3]} position={[0, 2.5, -9]} castShadow receiveShadow>
                <meshStandardMaterial color="#f5f5f5" roughness={0.7} />
            </Box>

            {/* Side Walls with Teal Accent */}
            <Box args={[0.3, 5, 18]} position={[-9, 2.5, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#f5f5f5" roughness={0.7} />
            </Box>
            <Box args={[0.3, 0.6, 18]} position={[-9, 4.7, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#20b2aa" roughness={0.6} />
            </Box>
            <Box args={[0.3, 5, 18]} position={[9, 2.5, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#f5f5f5" roughness={0.7} />
            </Box>
            <Box args={[0.3, 0.6, 18]} position={[9, 4.7, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#20b2aa" roughness={0.6} />
            </Box>

            {/* Front Wall with Windows (Resized) */}
            <Box args={[6, 5, 0.3]} position={[-6, 2.5, 9]} castShadow receiveShadow>
                <meshStandardMaterial color="#f5f5f5" roughness={0.7} />
            </Box>
            <Box args={[6, 5, 0.3]} position={[6, 2.5, 9]} castShadow receiveShadow>
                <meshStandardMaterial color="#f5f5f5" roughness={0.7} />
            </Box>

            {/* Large Front Window Panel */}
            <Box args={[6, 3.5, 0.1]} position={[0, 3.25, 9]} castShadow receiveShadow>
                <meshStandardMaterial color="#e0f7fa" transparent opacity={0.4} roughness={0.1} metalness={0.8} />
            </Box>

            {/* Red Cross Medical Symbol (Above Entrance) */}
            <Box args={[0.8, 0.25, 0.1]} position={[0, 5.5, 9.1]} castShadow>
                <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.3} />
            </Box>
            <Box args={[0.25, 0.8, 0.1]} position={[0, 5.5, 9.1]} castShadow>
                <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.3} />
            </Box>

            {/* Flat Roof */}
            <Box args={[19, 0.2, 19]} position={[0, 5.1, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#d3d3d3" roughness={0.8} />
            </Box>

            {/* Entrance Door */}
            <Box args={[2, 4, 0.2]} position={[0, 2, 9.1]} castShadow>
                <meshStandardMaterial color="#20b2aa" roughness={0.5} />
            </Box>

            {/* Exterior Signage - MOVED TO FRONT AND FACING OUTWARD */}
            <Text
                position={[0, 6.2, 9.2]}
                rotation={[0, 0, 0]} // Face outward (Z+)
                fontSize={1}
                color="#20b2aa"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.08}
                outlineColor="#ffffff"
            >
                VETERINARY CARE
            </Text>

            {/* ========== INTERIOR ========== */}

            {/* Tile Flooring - Checkerboard Pattern (Resized) */}
            <Box args={[17, 0.05, 17]} position={[0, 0.025, 0]} receiveShadow>
                <meshStandardMaterial color="#e8e8e8" roughness={0.3} />
            </Box>

            {/* Exam Table - Center */}
            <Box args={[1.5, 0.6, 0.9]} position={[0, 0.7, -2]} castShadow>
                <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.9} />
            </Box>
            <Cylinder args={[0.1, 0.1, 0.6, 16]} position={[0, 0.3, -2]} castShadow>
                <meshStandardMaterial color="#888888" roughness={0.3} metalness={0.8} />
            </Cylinder>

            {/* Medical Cabinets with Care Supplies (Slightly downscaled) */}
            <CareSupplies position={[-7, 0, -7]} scale={1.3} />

            {/* Wall Cabinets */}
            <Box args={[4, 1.8, 0.6]} position={[6, 1.5, -8]} castShadow>
                <meshStandardMaterial color="#ffffff" roughness={0.5} />
            </Box>
            <Box args={[4, 1.8, 0.6]} position={[-6, 1.5, -8]} castShadow>
                <meshStandardMaterial color="#ffffff" roughness={0.5} />
            </Box>

            {/* Counter and Sink */}
            <Box args={[6, 0.6, 1]} position={[0, 0.7, -7.5]} castShadow>
                <meshStandardMaterial color="#4a4a4a" roughness={0.6} />
            </Box>
            <Cylinder args={[0.2, 0.2, 0.2]} position={[-1.5, 1.1, -7.5]} castShadow>
                <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.9} />
            </Cylinder>

            {/* Waiting Area Bench (Smaller) */}
            <Box args={[3.5, 0.3, 0.8]} position={[-6, 0.4, 6]} castShadow>
                <meshStandardMaterial color="#20b2aa" roughness={0.6} />
            </Box>
            <Box args={[3.5, 1, 0.2]} position={[-6, 0.8, 6.4]} castShadow>
                <meshStandardMaterial color="#20b2aa" roughness={0.6} />
            </Box>

            {/* Overhead Fluorescent Lighting */}
            <Box args={[10, 0.15, 1.2]} position={[0, 4.6, 0]} castShadow>
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
            </Box>
            <pointLight position={[0, 4, 0]} intensity={2} distance={25} color="#fffaf0" />
            <pointLight position={[-6, 4, -6]} intensity={1.5} distance={18} color="#fffaf0" />
            <pointLight position={[6, 4, 6]} intensity={1.5} distance={18} color="#fffaf0" />
        </group>
    );
}
