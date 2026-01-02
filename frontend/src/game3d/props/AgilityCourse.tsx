import React, { useMemo } from 'react';
import { Cylinder, Box } from '@react-three/drei';
import * as THREE from 'three';
import { makeWoodTexture } from '../core/AssetLoader';

export function AgilityCourse(props: any) {
    const woodTex = useMemo(() => {
        const t = makeWoodTexture();
        t.repeat.set(1, 4);
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
        return t;
    }, []);

    return (
        <group {...props}>
            {/* 1. WEAVE POLES (Weathered Wood and Metal) */}
            <group position={[-6, 0, 1]}>
                {Array.from({ length: 6 }).map((_, i) => {
                    // Subtle misalignment
                    const jitterX = (Math.random() - 0.5) * 0.05;
                    const jitterZ = (Math.random() - 0.5) * 0.05;
                    const lean = (Math.random() - 0.5) * 0.03;

                    return (
                        <group key={i} position={[jitterX, 0, i * 1.8 + jitterZ]} rotation={[lean, 0, lean]}>
                            {/* Mud/Dirt accumulation at base */}
                            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                                <circleGeometry args={[0.4, 8]} />
                                <meshStandardMaterial color="#5d4037" transparent opacity={0.6} />
                            </mesh>

                            {/* Wooden Base Post (partially buried) */}
                            <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
                                <boxGeometry args={[0.2, 0.3, 0.2]} />
                                <meshStandardMaterial map={woodTex} color="#5e5044" roughness={0.9} />
                            </mesh>

                            {/* Galvanized Metal Pole (Weathered) */}
                            <Cylinder args={[0.04, 0.04, 1.3, 12]} position={[0, 0.65, 0]} castShadow receiveShadow>
                                <meshStandardMaterial
                                    color="#aaaaaa"
                                    roughness={0.4}
                                    metalness={0.7}
                                    emissive="#222"
                                    emissiveIntensity={0.1}
                                />
                            </Cylinder>

                            {/* Faded Markings (Stripes) */}
                            <mesh position={[0, 1, 0]}>
                                <cylinderGeometry args={[0.041, 0.041, 0.15, 12]} />
                                <meshStandardMaterial color={i % 2 === 0 ? "#5a3a2a" : "#8a8a8a"} transparent opacity={0.7} />
                            </mesh>
                        </group>
                    );
                })}
            </group>

            {/* 2. FIELD HURDLES (Weathered Wood/Composite) */}
            <group position={[0, 0, 4]} rotation={[0, Math.PI / 6, 0]}>
                <Hurdle position={[0, 0, 0]} height={0.35} color="#5a7a5a" woodTex={woodTex} />
                <Hurdle position={[jitter(), 0, 2.2 + jitter()]} height={0.5} color="#7a5a5a" woodTex={woodTex} />
                <Hurdle position={[jitter(), 0, 4.4 + jitter()]} height={0.7} color="#5a7a5a" woodTex={woodTex} />
            </group>

            {/* 3. A-FRAME (Weathered Wood with Scuffed Rubber) */}
            <group position={[5, 0, -1]} rotation={[0, -Math.PI / 12, 0]}>
                {/* Mud Base */}
                <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1.5, 1]} receiveShadow>
                    <circleGeometry args={[2, 32]} />
                    <meshStandardMaterial color="#3a2a1a" transparent opacity={0.4} />
                </mesh>

                {/* Wood Frame */}
                {/* Left Side */}
                <group position={[-1.6, 0, 0]} rotation={[0, 0, -Math.PI / 3.5]}>
                    <Box args={[0.1, 3.2, 2]} position={[0, 1.6, 0]} castShadow receiveShadow>
                        <meshStandardMaterial map={woodTex} color="#6e5a4e" roughness={0.9} />
                    </Box>
                    {/* Scuffed Rubber Surface */}
                    <Box args={[0.05, 3, 1.8]} position={[0.08, 1.5, 0]} receiveShadow>
                        <meshStandardMaterial color="#333333" roughness={0.8} />
                    </Box>
                    {/* Wooden Cleats/Slats */}
                    {[0.5, 1, 1.5, 2, 2.5].map(y => (
                        <Box key={y} args={[0.1, 0.05, 1.8]} position={[0.15, y, 0]} castShadow>
                            <meshStandardMaterial map={woodTex} color="#4a3e35" />
                        </Box>
                    ))}
                </group>

                {/* Right Side */}
                <group position={[1.6, 0, 0]} rotation={[0, 0, Math.PI / 3.5]}>
                    <Box args={[0.1, 3.2, 2]} position={[0, 1.6, 0]} castShadow receiveShadow>
                        <meshStandardMaterial map={woodTex} color="#6e5a4e" roughness={0.9} />
                    </Box>
                    {/* Scuffed Rubber Surface */}
                    <Box args={[0.05, 3, 1.8]} position={[-0.08, 1.5, 0]} receiveShadow>
                        <meshStandardMaterial color="#333333" roughness={0.8} />
                    </Box>
                    {/* Wooden Cleats/Slats */}
                    {[0.5, 1, 1.5, 2, 2.5].map(y => (
                        <Box key={y} args={[0.1, 0.05, 1.8]} position={[-0.15, y, 0]} castShadow>
                            <meshStandardMaterial map={woodTex} color="#4a3e35" />
                        </Box>
                    ))}
                </group>

                {/* Top Hinge Plate (Rusted Metal) */}
                <Box args={[0.4, 0.1, 2.1]} position={[0, 2.6, 0]} castShadow>
                    <meshStandardMaterial color="#443322" roughness={0.6} metalness={0.8} />
                </Box>
            </group>
        </group>
    );
}

function jitter() {
    return (Math.random() - 0.5) * 0.1;
}

function Hurdle({ position, height, color, woodTex }: { position: [number, number, number], height: number, color: string, woodTex: any }) {
    return (
        <group position={position}>
            {/* Side Posts - Rough Wood */}
            <mesh position={[-1, height / 2 + 0.1, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.12, height + 0.4, 0.12]} />
                <meshStandardMaterial map={woodTex} color="#6e5a4e" roughness={0.9} />
            </mesh>
            <mesh position={[1, height / 2 + 0.1, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.12, height + 0.4, 0.12]} />
                <meshStandardMaterial map={woodTex} color="#6e5a4e" roughness={0.9} />
            </mesh>

            {/* Dirt at Posts */}
            <mesh position={[-1, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <circleGeometry args={[0.25, 8]} />
                <meshStandardMaterial color="#3a2a1a" transparent opacity={0.5} />
            </mesh>
            <mesh position={[1, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <circleGeometry args={[0.25, 8]} />
                <meshStandardMaterial color="#3a2a1a" transparent opacity={0.5} />
            </mesh>

            {/* Cross Bar - Weathered Metal Pipe */}
            <Cylinder args={[0.03, 0.03, 1.95, 12]} position={[0, height + 0.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <meshStandardMaterial
                    color={color}
                    roughness={0.5}
                    metalness={0.6}
                    emissive={color}
                    emissiveIntensity={0.05}
                />
            </Cylinder>

            {/* End Caps */}
            <mesh position={[-1, height + 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.04, 0.04, 0.1, 8]} />
                <meshStandardMaterial color="#444" />
            </mesh>
            <mesh position={[1, height + 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.04, 0.04, 0.1, 8]} />
                <meshStandardMaterial color="#444" />
            </mesh>
        </group>
    )
}
