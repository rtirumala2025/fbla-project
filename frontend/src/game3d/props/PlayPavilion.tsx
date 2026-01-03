import React, { useState } from 'react';
import { Box, Cylinder, Text, Sphere, Cone } from '@react-three/drei';

export function PlayPavilion(props: any & { onSignClick?: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    const pillarColor = "#1e88e5"; // Vivid Blue
    const roofColor = "#ffb300";   // Amber/Gold
    const floorColor = "#4caf50";  // Grass Green

    return (
        <group {...props}>
            {/* ========== SOFT RUBBER FLOOR ========== */}
            <Cylinder args={[6, 6, 0.4, 32]} position={[0, 0.2, 0]} receiveShadow>
                <meshStandardMaterial color={floorColor} roughness={0.9} />
            </Cylinder>
            {/* Border Ring */}
            <Cylinder args={[6.2, 6.2, 0.2, 32]} position={[0, 0.1, 0]}>
                <meshStandardMaterial color="#388e3c" />
            </Cylinder>

            {/* ========== STRUCTURE (Circus Tent Style) ========== */}
            {/* Center Pole */}
            <Cylinder args={[0.25, 0.25, 6, 16]} position={[0, 3, 0]} castShadow>
                <meshStandardMaterial color="#fdd835" metalness={0.3} />
            </Cylinder>

            {/* Outer Poles */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
                const angle = (i / 6) * Math.PI * 2;
                const x = Math.cos(angle) * 5;
                const z = Math.sin(angle) * 5;
                return (
                    <group key={i} position={[x, 0, z]}>
                        <Cylinder args={[0.15, 0.15, 3.5, 12]} position={[0, 1.75, 0]} castShadow>
                            <meshStandardMaterial color={pillarColor} />
                        </Cylinder>
                        <Sphere args={[0.25]} position={[0, 3.5, 0]} castShadow><meshStandardMaterial color="#e53935" /></Sphere>
                    </group>
                )
            })}

            {/* ========== CANOPY ========== */}
            <group position={[0, 4.5, 0]}>
                {/* Main Cone Canopy */}
                <Cone args={[6.5, 2.5, 32, 1, true]} position={[0, 0, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color={roofColor} side={2} roughness={0.6} />
                </Cone>
                {/* Stripes (simulated with torus rings or just a topper) */}
                <Cone args={[1.5, 1, 16]} position={[0, 1.4, 0]}>
                    <meshStandardMaterial color="#e53935" />
                </Cone>
                <Sphere args={[0.4]} position={[0, 2, 0]}><meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.5} /></Sphere>
            </group>

            {/* Tension Cables (Visual only) */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
                const angle = (i / 6) * Math.PI * 2;
                return (
                    <Box key={i} args={[5.2, 0.05, 0.05]} position={[Math.cos(angle) * 2.5, 3.4, Math.sin(angle) * 2.5]} rotation={[0, -angle, 0.15]} >
                        <meshStandardMaterial color="#333" />
                    </Box>
                )
            })}


            {/* ========== SIGNAGE ========== */}
            <group
                position={[0, 3.5, 5]}
                onPointerEnter={() => setIsHovered(true)}
                onPointerLeave={() => setIsHovered(false)}
                onPointerDown={(e) => { e.stopPropagation(); props.onSignClick?.(); }}
            >
                <Box args={[3.2, 0.8, 0.15]} castShadow>
                    <meshStandardMaterial color={isHovered ? "#ffffff" : "#fbc02d"} />
                </Box>
                <Text
                    position={[0, 0, 0.1]}
                    fontSize={0.4}
                    color="#e65100"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.02}
                    outlineColor="#fff"
                >
                    PLAY AREA
                </Text>
            </group>

            {/* ========== INTERACTIVE PROPS ========== */}
            {/* Ball Pit */}
            <group position={[-2.5, 0.4, 1.5]}>
                <Box args={[2.5, 0.6, 2.5]} position={[0, 0.3, 0]} castShadow>
                    <meshStandardMaterial color="#ff7043" />
                </Box>
                {/* Balls */}
                {Array.from({ length: 15 }).map((_, i) => (
                    <Sphere key={i} args={[0.15]} position={[(Math.random() - 0.5) * 2, 0.7, (Math.random() - 0.5) * 2]}>
                        <meshStandardMaterial color={['#f44336', '#2196f3', '#ffeb3b'][i % 3]} />
                    </Sphere>
                ))}
            </group>

            {/* Slide Mockup */}
            <group position={[2.5, 0, -1.5]} rotation={[0, -0.5, 0]}>
                <Box args={[1, 1.5, 1]} position={[0, 0.75, 1]}><meshStandardMaterial color="#42a5f5" /></Box>
                <Box args={[1, 0.1, 3]} position={[0, 0.75, -0.5]} rotation={[0.4, 0, 0]}><meshStandardMaterial color="#90caf9" /></Box>
            </group>

            <pointLight position={[0, 3, 0]} intensity={1.5} color="#fff" distance={10} />
        </group>
    );
}
