import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Text, Sphere, Cylinder, Box } from '@react-three/drei';
import * as THREE from 'three';

export function ActivityGuide({
    position,
    name = "Scout",
    message = "Welcome! I'm here to help.",
    color = "#a3b18a"
}: {
    position: [number, number, number];
    name?: string;
    message?: string;
    color?: string;
}) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.getElapsedTime();
        groupRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.15;
        groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.1;
    });

    return (
        <group position={position} ref={groupRef}>
            {/* Floating Robot Body */}
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                {/* Head */}
                <Sphere args={[0.3, 32, 32]} position={[0, 0.4, 0]}>
                    <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} />
                </Sphere>
                {/* Eyes/Visor */}
                <Box args={[0.4, 0.1, 0.25]} position={[0, 0.45, 0.2]}>
                    <meshStandardMaterial color="#333" emissive="#00eeff" emissiveIntensity={2} />
                </Box>

                {/* Body */}
                <Cylinder args={[0.25, 0.15, 0.5, 32]} position={[0, 0, 0]}>
                    <meshStandardMaterial color={color} metalness={0.8} roughness={0.1} />
                </Cylinder>

                {/* Floating Arms */}
                {[-0.4, 0.4].map((x, i) => (
                    <Sphere key={i} args={[0.08]} position={[x, 0.1, 0]}>
                        <meshStandardMaterial color={color} metalness={0.9} />
                    </Sphere>
                ))}

                {/* Name Tag */}
                <Text
                    position={[0, 0.8, 0]}
                    fontSize={0.15}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.02}
                    outlineColor="#333"
                >
                    {name}
                </Text>
            </Float>

            {/* Talk Bubble (Simple 3D representation) */}
            <group position={[0.8, 0.6, 0]}>
                <Box args={[1.5, 0.6, 0.05]} position={[0, 0, 0]}>
                    <meshStandardMaterial color="white" opacity={0.9} transparent />
                </Box>
                <Text
                    position={[0, 0, 0.03]}
                    fontSize={0.1}
                    color="#333"
                    maxWidth={1.3}
                    anchorX="center"
                    anchorY="middle"
                >
                    {message}
                </Text>
            </group>

            {/* Static Base Glow */}
            <mesh position={[0, -position[1] + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.5, 32]} />
                <meshStandardMaterial color={color} transparent opacity={0.3} emissive={color} emissiveIntensity={2} />
            </mesh>
        </group>
    );
}
