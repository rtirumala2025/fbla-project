import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';

interface RoomStageProps {
    currentActivity: string;
    isSleeping: boolean;
}

export function RoomStage({ currentActivity, isSleeping }: RoomStageProps) {
    const dogRef = useRef<THREE.Group>(null);
    const zzzRef = useRef<THREE.Group>(null);

    // Animation Loop
    useFrame((state) => {
        // Floating Zzz Animation
        if (zzzRef.current && isSleeping) {
            zzzRef.current.position.y = 0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }

        // Dog Sleep Animation (Smooth Lerp)
        if (dogRef.current) {
            if (isSleeping) {
                // Go to Bed Position
                dogRef.current.position.lerp(new THREE.Vector3(0, 0.35, 0), 0.1);
                // Curl up (Scale Y down)
                dogRef.current.scale.lerp(new THREE.Vector3(0.9, 0.7, 0.9), 0.1);
            } else {
                // Wake up (Stand on Bed)
                dogRef.current.position.lerp(new THREE.Vector3(0, 0.25, 0), 0.1);
                dogRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
            }
        }
    });

    return (
        <group>
            {/* --- LAYER 1: The Paper-Thin Area Rug --- */}
            <mesh position={[0, 0.015, 0]} receiveShadow>
                {/* Width 7, Height 0.02 (Paper Thin), Depth 5 */}
                <boxGeometry args={[7, 0.02, 5]} />
                <meshStandardMaterial color="#F5F5F5" roughness={1.0} />
            </mesh>

            {/* --- LAYER 2: The Bed Stack --- */}
            <group position={[0, 0, 0]}>
                {/* A. The Cushion (Beige Fabric) - Sunken center for cozy look */}
                <mesh position={[0, 0.08, 0]} receiveShadow>
                    <cylinderGeometry args={[1.3, 1.4, 0.12, 32]} />
                    <meshStandardMaterial color="#F5F5DC" roughness={1.0} metalness={0} />
                </mesh>

                {/* B. The Donut Rim (Brown Leather) - Raised edge */}
                <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
                    <torusGeometry args={[1.5, 0.3, 16, 32]} />
                    <meshStandardMaterial color="#5D4037" roughness={0.6} />
                </mesh>
            </group>

            {/* --- LAYER 3: The Dog --- */}
            <group ref={dogRef} position={[0, 0.25, 0]}>
                {/* Placeholder Dog Geometry (Replace with your GLTF if you have one) */}
                {/* COMMENTED OUT to avoid duplication with PetModelViewer
                <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
                    <capsuleGeometry args={[0.3, 0.6, 4, 8]} />
                    <meshStandardMaterial color="#E0C097" />
                </mesh>
                <mesh position={[0, 0.7, 0.2]}>
                    <sphereGeometry args={[0.25]} />
                    <meshStandardMaterial color="#E0C097" />
                </mesh>
                */}
                {/* Zzz Text Group */}
                {isSleeping && (
                    <group ref={zzzRef} position={[0.5, 0.8, 0]}>
                        <Text fontSize={0.4} color="gold" anchorX="center" anchorY="middle">
                            Zzz
                        </Text>
                    </group>
                )}
            </group>

            {/* --- LAYER 4: The Nightstands (Legs Touch Rug) --- */}
            {/* Left Nightstand */}
            <group position={[-2.5, 0, 0]}>
                {/* Legs */}
                <mesh position={[0.3, 0.2, 0.3]} castShadow><cylinderGeometry args={[0.04, 0.02, 0.4]} /><meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.2} /></mesh>
                <mesh position={[-0.3, 0.2, 0.3]} castShadow><cylinderGeometry args={[0.04, 0.02, 0.4]} /><meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.2} /></mesh>
                <mesh position={[0.3, 0.2, -0.3]} castShadow><cylinderGeometry args={[0.04, 0.02, 0.4]} /><meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.2} /></mesh>
                <mesh position={[-0.3, 0.2, -0.3]} castShadow><cylinderGeometry args={[0.04, 0.02, 0.4]} /><meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.2} /></mesh>
                {/* Body */}
                <mesh position={[0, 0.6, 0]} castShadow>
                    <boxGeometry args={[1, 0.5, 1]} />
                    <meshStandardMaterial color="#3E2723" roughness={0.2} />
                </mesh>
                {/* Lamp */}
                <group position={[0, 0.85, 0]}>
                    <mesh><cylinderGeometry args={[0.05, 0.1, 0.1]} /><meshStandardMaterial color="gold" /></mesh>
                    <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.25, 0.15, 0.3]} /><meshStandardMaterial color="white" transparent opacity={0.9} /></mesh>
                    <pointLight intensity={0.5} color="#FFD700" distance={3} decay={2} />
                </group>
            </group>

            {/* Right Nightstand */}
            <group position={[2.5, 0, 0]}>
                {/* Legs */}
                <mesh position={[0.3, 0.2, 0.3]} castShadow><cylinderGeometry args={[0.04, 0.02, 0.4]} /><meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.2} /></mesh>
                <mesh position={[-0.3, 0.2, 0.3]} castShadow><cylinderGeometry args={[0.04, 0.02, 0.4]} /><meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.2} /></mesh>
                <mesh position={[0.3, 0.2, -0.3]} castShadow><cylinderGeometry args={[0.04, 0.02, 0.4]} /><meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.2} /></mesh>
                <mesh position={[-0.3, 0.2, -0.3]} castShadow><cylinderGeometry args={[0.04, 0.02, 0.4]} /><meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.2} /></mesh>
                {/* Body */}
                <mesh position={[0, 0.6, 0]} castShadow>
                    <boxGeometry args={[1, 0.5, 1]} />
                    <meshStandardMaterial color="#3E2723" roughness={0.2} />
                </mesh>
                {/* Lamp */}
                <group position={[0, 0.85, 0]}>
                    <mesh><cylinderGeometry args={[0.05, 0.1, 0.1]} /><meshStandardMaterial color="gold" /></mesh>
                    <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.25, 0.15, 0.3]} /><meshStandardMaterial color="white" transparent opacity={0.9} /></mesh>
                    <pointLight intensity={0.5} color="#FFD700" distance={3} decay={2} />
                </group>
            </group>

            {/* LAYER 5 DELETED: Wall Art removed for French Doors */}

            {/* --- LAYER 6: The Plant (Fixed Coordinates) --- */}
            <group position={[5, 0, -2]}>
                {/* Pot: Height 0.5, so y=0.25 puts it on floor */}
                <mesh position={[0, 0.25, 0]} castShadow>
                    <cylinderGeometry args={[0.4, 0.3, 0.5]} />
                    <meshStandardMaterial color="#8D6E63" /> {/* Terracotta */}
                </mesh>
                {/* Stem */}
                <mesh position={[0, 1.0, 0]}>
                    <cylinderGeometry args={[0.05, 0.05, 1.5]} />
                    <meshStandardMaterial color="#4E342E" />
                </mesh>
                {/* Leaves */}
                <mesh position={[0, 1.8, 0]}>
                    <sphereGeometry args={[0.7]} />
                    <meshStandardMaterial color="#2E7D32" roughness={0.8} />
                </mesh>
            </group>

        </group>
    );
}
