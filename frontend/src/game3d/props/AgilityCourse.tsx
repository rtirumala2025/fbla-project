import React from 'react';
import { Cylinder, Box } from '@react-three/drei';

export function AgilityCourse(props: any) {
    return (
        <group {...props}>
            {/* 1. WEAVE POLES (Linear Agility) */}
            <group position={[-5, 0, 0]}>
                {Array.from({ length: 6 }).map((_, i) => (
                    <group key={i} position={[0, 0, i * 1.5]}>
                        {/* Pole */}
                        <Cylinder args={[0.05, 0.05, 1.2, 16]} position={[0, 0.6, 0]} castShadow receiveShadow>
                            <meshStandardMaterial color={i % 2 === 0 ? "#ff4040" : "#ffffff"} roughness={0.3} />
                        </Cylinder>
                        {/* Base */}
                        <Cylinder args={[0.15, 0.15, 0.05, 16]} position={[0, 0.025, 0]} receiveShadow>
                            <meshStandardMaterial color="#333" />
                        </Cylinder>
                    </group>
                ))}
            </group>

            {/* 2. HURDLES (Jumping) */}
            <group position={[0, 0, 3]} rotation={[0, Math.PI / 4, 0]}>
                <Hurdle position={[0, 0, 0]} height={0.4} color="#4080ff" />
                <Hurdle position={[0, 0, 2]} height={0.6} color="#ffaa00" />
                <Hurdle position={[0, 0, 4]} height={0.8} color="#4080ff" />
            </group>

            {/* 3. A-FRAME RAMP (Climbing) */}
            <group position={[4, 0, 0]} rotation={[0, -Math.PI / 6, 0]}>
                {/* Left Ramp */}
                <Box args={[1.5, 0.1, 3]} position={[-1.4, 0.75, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow receiveShadow>
                    <meshStandardMaterial color="#ffd700" roughness={0.6} />
                </Box>
                {/* Right Ramp */}
                <Box args={[1.5, 0.1, 3]} position={[1.4, 0.75, 0]} rotation={[0, 0, Math.PI / 4]} castShadow receiveShadow>
                    <meshStandardMaterial color="#ffd700" roughness={0.6} />
                </Box>
                {/* Contact Zones (Safety Paint) */}
                <Box args={[1.5, 0.12, 0.8]} position={[-2.2, 0.2, 0]} rotation={[0, 0, -Math.PI / 4]} receiveShadow>
                    <meshStandardMaterial color="#ff4040" />
                </Box>
                <Box args={[1.5, 0.12, 0.8]} position={[2.2, 0.2, 0]} rotation={[0, 0, Math.PI / 4]} receiveShadow>
                    <meshStandardMaterial color="#ff4040" />
                </Box>
            </group>
        </group>
    );
}

function Hurdle({ position, height, color }: { position: [number, number, number], height: number, color: string }) {
    return (
        <group position={position}>
            {/* Side Posts */}
            <Cylinder args={[0.04, 0.04, height + 0.2, 16]} position={[-0.8, (height + 0.2) / 2, 0]} castShadow>
                <meshStandardMaterial color="#ffffff" />
            </Cylinder>
            <Cylinder args={[0.04, 0.04, height + 0.2, 16]} position={[0.8, (height + 0.2) / 2, 0]} castShadow>
                <meshStandardMaterial color="#ffffff" />
            </Cylinder>

            {/* Cross Bar */}
            <Cylinder args={[0.03, 0.03, 1.6, 16]} position={[0, height, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <meshStandardMaterial color={color} />
            </Cylinder>
        </group>
    )
}
