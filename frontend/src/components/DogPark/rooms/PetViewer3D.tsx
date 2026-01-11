/**
 * PetViewer3D.tsx
 * 
 * Standalone 3D pet viewer with optional OrbitControls for rotation.
 * Used in room views to display the actual pet model with accessories.
 */

import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { PetGame2PetType, PetBreed } from '../../../game3d/core/SceneManager';
import type { EquippedAccessory } from '../../../game3d/core/BehaviourSystem';

// Simplified pet models for the viewer (no navigation, just idle animation)
interface SimplePetProps {
    breed: PetBreed;
    accessories: EquippedAccessory[];
}

// Simplified Dog for viewer - just the visual, idle breathing
function SimpleDog({ breed, accessories }: SimplePetProps) {
    const root = useRef<THREE.Group>(null);

    // DNA configs for different breeds
    const DNA: Record<PetBreed, { primary: string; secondary: string }> = {
        labrador: { primary: '#e3cca5', secondary: '#ebdcb8' },
        shepherd: { primary: '#966844', secondary: '#1a1a1a' },
        pug: { primary: '#d6c8b4', secondary: '#2b2622' },
    };

    const colors = DNA[breed] || DNA.labrador;

    const matBody = useMemo(() => new THREE.MeshStandardMaterial({
        color: colors.primary, roughness: 0.6, metalness: 0.02,
    }), [colors]);

    const matFace = useMemo(() => new THREE.MeshStandardMaterial({
        color: colors.secondary, roughness: 0.5, metalness: 0.03,
    }), [colors]);

    const matNose = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#1a1a1a', roughness: 0.25, metalness: 0.1,
    }), []);

    useFrame(({ clock }) => {
        if (root.current) {
            // Gentle breathing animation
            const t = clock.getElapsedTime();
            root.current.scale.y = 1 + Math.sin(t * 1.5) * 0.02;
            root.current.scale.x = 1 + Math.sin(t * 1.5) * 0.01;
        }
    });

    return (
        <group ref={root} position={[0, -0.3, 0]}>
            {/* Body */}
            <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]} material={matBody}>
                <capsuleGeometry args={[0.18, 0.35, 8, 16]} />
            </mesh>

            {/* Head */}
            <group position={[0, 0.55, 0.22]}>
                <mesh material={matFace}>
                    <sphereGeometry args={[0.18, 16, 16]} />
                </mesh>
                {/* Snout */}
                <mesh position={[0, -0.03, 0.14]} rotation={[0.1, 0, 0]} material={matFace}>
                    <capsuleGeometry args={[0.06, 0.1, 4, 8]} />
                </mesh>
                {/* Nose */}
                <mesh position={[0, -0.05, 0.22]} material={matNose}>
                    <sphereGeometry args={[0.035, 8, 8]} />
                </mesh>
                {/* Eyes */}
                <mesh position={[0.07, 0.05, 0.14]}>
                    <sphereGeometry args={[0.03, 8, 8]} />
                    <meshBasicMaterial color="#222" />
                </mesh>
                <mesh position={[-0.07, 0.05, 0.14]}>
                    <sphereGeometry args={[0.03, 8, 8]} />
                    <meshBasicMaterial color="#222" />
                </mesh>
                {/* Ears */}
                <mesh position={[0.12, 0.12, -0.02]} rotation={[0.3, 0, 0.4]} material={matBody}>
                    <boxGeometry args={[0.06, 0.15, 0.03]} />
                </mesh>
                <mesh position={[-0.12, 0.12, -0.02]} rotation={[0.3, 0, -0.4]} material={matBody}>
                    <boxGeometry args={[0.06, 0.15, 0.03]} />
                </mesh>
            </group>

            {/* Legs */}
            {[[0.1, 0, 0.12], [-0.1, 0, 0.12], [0.1, 0, -0.12], [-0.1, 0, -0.12]].map((pos, i) => (
                <mesh key={i} position={pos as [number, number, number]} material={matBody}>
                    <capsuleGeometry args={[0.04, 0.2, 4, 8]} />
                </mesh>
            ))}

            {/* Tail */}
            <mesh position={[0, 0.4, -0.25]} rotation={[-0.5, 0, 0]} material={matBody}>
                <capsuleGeometry args={[0.025, 0.15, 4, 6]} />
            </mesh>

            {/* Accessories */}
            {accessories.map(acc => {
                const accMat = new THREE.MeshStandardMaterial({ color: acc.color, roughness: 0.35, metalness: 0.15 });
                switch (acc.slot) {
                    case 'collar':
                        return (
                            <group key={acc.id} position={[0, 0.48, 0.15]}>
                                <mesh rotation={[Math.PI / 2, 0, 0]} material={accMat}>
                                    <torusGeometry args={[0.12, 0.018, 8, 20]} />
                                </mesh>
                                <mesh position={[0, -0.11, 0.02]} material={accMat}>
                                    <sphereGeometry args={[0.025, 6, 6]} />
                                </mesh>
                            </group>
                        );
                    case 'hat':
                        return (
                            <group key={acc.id} position={[0, 0.75, 0.2]}>
                                <mesh position={[0, 0.05, 0]} material={accMat}>
                                    <cylinderGeometry args={[0.06, 0.08, 0.08, 8]} />
                                </mesh>
                                <mesh material={accMat}>
                                    <cylinderGeometry args={[0.12, 0.12, 0.015, 12]} />
                                </mesh>
                            </group>
                        );
                    case 'bandana':
                        return (
                            <group key={acc.id} position={[0, 0.45, 0.18]}>
                                <mesh rotation={[0.3, 0, 0]} position={[0, -0.04, 0.05]} material={accMat}>
                                    <coneGeometry args={[0.08, 0.1, 3]} />
                                </mesh>
                            </group>
                        );
                    case 'glasses':
                        return (
                            <group key={acc.id} position={[0, 0.58, 0.35]}>
                                <mesh position={[0.05, 0, 0]}>
                                    <sphereGeometry args={[0.03, 8, 8]} />
                                    <meshStandardMaterial color="#1a1a1a" roughness={0.1} metalness={0.3} />
                                </mesh>
                                <mesh position={[-0.05, 0, 0]}>
                                    <sphereGeometry args={[0.03, 8, 8]} />
                                    <meshStandardMaterial color="#1a1a1a" roughness={0.1} metalness={0.3} />
                                </mesh>
                                <mesh rotation={[0, 0, Math.PI / 2]} material={accMat}>
                                    <capsuleGeometry args={[0.008, 0.04, 4, 4]} />
                                </mesh>
                            </group>
                        );
                    case 'back':
                        return (
                            <group key={acc.id} position={[0, 0.5, -0.1]}>
                                <mesh rotation={[-0.3, 0, 0]} position={[0, 0, -0.05]} material={accMat}>
                                    <boxGeometry args={[0.25, 0.015, 0.15]} />
                                </mesh>
                            </group>
                        );
                    default:
                        return null;
                }
            })}
        </group>
    );
}

// Simple Cat for viewer
function SimpleCat({ accessories }: SimplePetProps) {
    const root = useRef<THREE.Group>(null);

    useFrame(({ clock }) => {
        if (root.current) {
            const t = clock.getElapsedTime();
            root.current.scale.y = 1 + Math.sin(t * 1.8) * 0.015;
        }
    });

    return (
        <group ref={root} position={[0, -0.25, 0]}>
            <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <capsuleGeometry args={[0.14, 0.3, 8, 12]} />
                <meshStandardMaterial color="#8b8b8b" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.5, 0.15]}>
                <sphereGeometry args={[0.13, 12, 12]} />
                <meshStandardMaterial color="#9a9a9a" roughness={0.45} />
            </mesh>
            {/* Pointed ears */}
            <mesh position={[0.08, 0.62, 0.1]} rotation={[0, 0, 0.3]}>
                <coneGeometry args={[0.04, 0.08, 4]} />
                <meshStandardMaterial color="#8b8b8b" />
            </mesh>
            <mesh position={[-0.08, 0.62, 0.1]} rotation={[0, 0, -0.3]}>
                <coneGeometry args={[0.04, 0.08, 4]} />
                <meshStandardMaterial color="#8b8b8b" />
            </mesh>
        </group>
    );
}

// Simple Panda for viewer
function SimplePanda({ accessories }: SimplePetProps) {
    const root = useRef<THREE.Group>(null);

    useFrame(({ clock }) => {
        if (root.current) {
            const t = clock.getElapsedTime();
            root.current.scale.y = 1 + Math.sin(t * 1.2) * 0.02;
        }
    });

    return (
        <group ref={root} position={[0, -0.35, 0]}>
            <mesh position={[0, 0.4, 0]}>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshStandardMaterial color="#f5f5f5" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.7, 0.1]}>
                <sphereGeometry args={[0.18, 12, 12]} />
                <meshStandardMaterial color="#f5f5f5" roughness={0.5} />
            </mesh>
            {/* Black eye patches */}
            <mesh position={[0.06, 0.72, 0.22]}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[-0.06, 0.72, 0.22]}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            {/* Ears */}
            <mesh position={[0.12, 0.85, 0]}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[-0.12, 0.85, 0]}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
        </group>
    );
}

interface PetViewer3DProps {
    petType: PetGame2PetType;
    breed?: PetBreed;
    accessories?: EquippedAccessory[];
    interactive?: boolean; // Enable OrbitControls
    size?: number; // Container size in pixels
}

export function PetViewer3D({
    petType,
    breed = 'labrador',
    accessories = [],
    interactive = false,
    size = 200,
}: PetViewer3DProps) {
    const PetComponent = useMemo(() => {
        switch (petType) {
            case 'cat': return SimpleCat;
            case 'panda': return SimplePanda;
            default: return SimpleDog;
        }
    }, [petType]);

    return (
        <div style={{
            width: size,
            height: size,
            borderRadius: 16,
            overflow: 'hidden',
            background: 'rgba(20, 20, 30, 0.6)',
        }}>
            <Canvas
                camera={{ position: [0, 0.5, 1.5], fov: 45 }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
            >
                <Suspense fallback={null}>
                    {/* Lighting */}
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[2, 3, 2]} intensity={1} />
                    <directionalLight position={[-1, 2, -1]} intensity={0.3} />

                    {/* Pet */}
                    <PetComponent breed={breed} accessories={accessories} />

                    {/* Controls */}
                    {interactive && (
                        <OrbitControls
                            enablePan={false}
                            enableZoom={false}
                            minPolarAngle={Math.PI / 4}
                            maxPolarAngle={Math.PI / 2}
                            autoRotate={false}
                        />
                    )}
                </Suspense>
            </Canvas>
        </div>
    );
}

export default PetViewer3D;
