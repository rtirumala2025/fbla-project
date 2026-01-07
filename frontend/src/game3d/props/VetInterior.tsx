import React from 'react';
import { Box, Cylinder, Text, Sphere } from '@react-three/drei';
import { ActivityGuide } from './ActivityGuide';

export function VetInterior() {
    return (
        <group position={[0, 0, 0]}>
            {/* ========== STERILE FLOOR ========== */}
            <Box args={[10, 0.2, 10]} position={[0, 0.1, 0]}>
                <meshStandardMaterial color="#eceff1" roughness={0.3} metalness={0.1} />
            </Box>
            {/* Floor Logo */}
            <group position={[0, 0.2, 0]}>
                <Box args={[1, 0.05, 0.2]}><meshStandardMaterial color="#f44336" /></Box>
                <Box args={[0.2, 0.05, 1]}><meshStandardMaterial color="#f44336" /></Box>
            </group>

            {/* ========== EXAM TABLE (Center) ========== */}
            <group position={[0, 0.2, 0]}>
                {/* Heavy Base */}
                <Box args={[2, 0.8, 1.2]} position={[0, 0.4, 0]}>
                    <meshStandardMaterial color="#cfd8dc" metalness={0.5} roughness={0.2} />
                </Box>
                {/* Table Top */}
                <Box args={[2.5, 0.1, 1.5]} position={[0, 0.85, 0]} castShadow>
                    <meshStandardMaterial color="#ffffff" metalness={0.3} roughness={0.1} />
                </Box>
                {/* Scale Display */}
                <Box args={[0.4, 0.3, 0.1]} position={[0, 1, -0.6]} rotation={[-0.3, 0, 0]}>
                    <meshStandardMaterial color="#263238" />
                </Box>
                <Text position={[0, 1, -0.54]} fontSize={0.1} color="#00ff00" rotation={[-0.3, 0, 0]}>
                    12.4 kg
                </Text>
            </group>

            {/* ========== DIAGNOSTICS AREA (Back Wall) ========== */}
            <group position={[0, 0.2, -4.5]}>
                {/* Countertop */}
                <Box args={[8, 1, 1.5]} position={[0, 0.5, 0.3]} castShadow>
                    <meshStandardMaterial color="#cfd8dc" />
                </Box>
                <Box args={[8.2, 0.1, 1.6]} position={[0, 1, 0.3]}><meshStandardMaterial color="#fff" /></Box>

                {/* Medical Monitors */}
                <group position={[-2, 1.1, 0.3]}>
                    <Box args={[1.2, 0.8, 0.1]} castShadow><meshStandardMaterial color="#263238" /></Box>
                    <Box args={[1, 0.6, 0.05]} position={[0, 0, 0.05]}>
                        <meshStandardMaterial color="#000" emissive="#00bcd4" emissiveIntensity={0.5} />
                    </Box>
                    <Text position={[0, 0.45, 0.05]} fontSize={0.1} color="#fff">Heart Rate</Text>
                </group>

                {/* X-Ray Viewer */}
                <group position={[1, 1.1, 0.3]}>
                    <Box args={[1.5, 1, 0.1]} castShadow><meshStandardMaterial color="#333" /></Box>
                    <Box args={[1.3, 0.8, 0.05]} position={[0, 0, 0.05]}>
                        <meshStandardMaterial color="#b3e5fc" emissive="#b3e5fc" emissiveIntensity={0.3} />
                    </Box>
                    <Text position={[0, 0, 0.1]} fontSize={0.08} color="#000" anchorX="center">
                        Skeleton Scan\n[ OK ]
                    </Text>
                </group>

                {/* Microscope & Supplies */}
                <group position={[3.2, 1.1, 0.5]}>
                    <Cylinder args={[0.05, 0.05, 0.4, 8]} position={[0, 0.2, 0]}><meshStandardMaterial color="#333" /></Cylinder>
                    <Box args={[0.2, 0.1, 0.3]} position={[0, 0, 0]}><meshStandardMaterial color="#333" /></Box>
                    {/* Test Tubes */}
                    {[-0.3, -0.15, 0, 0.15].map(x => (
                        <Cylinder key={x} args={[0.03, 0.03, 0.2, 8]} position={[x - 0.5, 0.1, 0.2]}>
                            <meshStandardMaterial color="#e1f5fe" transparent opacity={0.6} />
                        </Cylinder>
                    ))}
                </group>
            </group>

            {/* ========== PHARMACY STORAGE (Left Wall) ========== */}
            <group position={[-4.5, 0.2, 0]}>
                <Box args={[1, 3.5, 6]} position={[0, 1.75, 0]} castShadow>
                    <meshStandardMaterial color="#f5f5f5" />
                </Box>
                {/* Glass Doors */}
                <Box args={[0.1, 3.2, 5.8]} position={[0.5, 1.75, 0]}>
                    <meshStandardMaterial color="#b3e5fc" transparent opacity={0.3} metalness={0.9} />
                </Box>
                {/* Bottle Props (Simple Spheres/Cylinders) */}
                {[0, 1, 2, 3].map(y => (
                    [[-2, -1, 0, 1, 2]].map(zArr => (
                        zArr.map(z => (
                            <Cylinder key={`${y}-${z}`} args={[0.08, 0.08, 0.2, 8]} position={[0.3, 0.8 + y * 0.7, z * 0.8]}>
                                <meshStandardMaterial color={['#f44336', '#4caf50', '#2196f3', '#ff9800'][(y + z) % 4]} />
                            </Cylinder>
                        ))
                    ))
                ))}
            </group>

            {/* ========== WAITING AREA (Right Wall) ========== */}
            <group position={[4, 0.2, 1]}>
                {/* Chairs */}
                {[-1.5, 0, 1.5].map((z, i) => (
                    <group key={i} position={[0, 0, z]}>
                        <Box args={[0.8, 0.1, 0.8]} position={[0, 0.4, 0]}><meshStandardMaterial color="#2196f3" /></Box>
                        <Box args={[0.1, 1, 0.8]} position={[0.4, 0.8, 0]}><meshStandardMaterial color="#2196f3" /></Box>
                        <Cylinder args={[0.05, 0.05, 0.4, 8]} position={[-0.3, 0.2, 0.3]}><meshStandardMaterial color="#333" /></Cylinder>
                        <Cylinder args={[0.05, 0.05, 0.4, 8]} position={[-0.3, 0.2, -0.3]}><meshStandardMaterial color="#333" /></Cylinder>
                    </group>
                ))}
            </group>

            {/* ========== MEDICAL GUIDE ========== */}
            <ActivityGuide
                position={[-2.5, 1.2, -3]}
                name="Dr. Pawson"
                message="Checking the vitals now... everything looks healthy so far! Let's do a quick scan of the paws."
                color="#00bcd4"
            />

            {/* ========== LIGHTING ========== */}
            <pointLight position={[0, 4, 0]} intensity={2} color="#f0faff" distance={15} />
            <pointLight position={[3, 3, -4]} intensity={1} color="#fff" distance={8} />
            <ambientLight intensity={0.5} />
        </group>
    );
}
