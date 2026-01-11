/**
 * PetViewer3D.tsx
 * 
 * Uses the SAME 3D pet models as the main game (DogModel, CatModel, PandaModel).
 * Wraps them with a static idle state for display in room views.
 */

import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { PetGame2PetType, PetGame2State, PetBreed } from '../../../game3d/core/SceneManager';
import type { EquippedAccessory } from '../../../game3d/core/BehaviourSystem';
import { DogModel } from '../../../game3d/pets/DogModel';
import { CatModel } from '../../../game3d/pets/CatModel';
import { PandaModel } from '../../../game3d/pets/PandaModel';

interface PetViewer3DProps {
    petType: PetGame2PetType;
    breed?: PetBreed;
    accessories?: EquippedAccessory[];
    interactive?: boolean; // Enable OrbitControls
    size?: number; // Container size in pixels
}

// Create a static idle state for the viewer (no movement)
function createIdleState(breed: PetBreed): PetGame2State {
    return {
        breed,
        currentPosition: [0, 0, 0] as [number, number, number],
        interaction: { kind: 'idle' },
        navigationState: {
            target: null,
            isNavigating: false,
            startPosition: [0, 0, 0] as [number, number, number],
            endPosition: null,
            progress: 0,
        },
        activityZone: null,
    };
}

// Wrapper that renders the pet model in viewer mode
function PetModelViewer({
    petType,
    breed,
    accessories,
}: {
    petType: PetGame2PetType;
    breed: PetBreed;
    accessories: EquippedAccessory[];
}) {
    const state = useMemo(() => createIdleState(breed), [breed]);
    const noopFn = useMemo(() => () => { }, []);
    const targetRef = useRef(new THREE.Vector3());
    const isMovingRef = useRef(false);
    const rotationRef = useRef(new THREE.Quaternion());

    // Pick the right model based on pet type
    switch (petType) {
        case 'cat':
            return (
                <group scale={0.6} position={[0, -0.3, 0]}>
                    <CatModel
                        state={state}
                        onPetTap={noopFn}
                        accessories={accessories}
                    />
                </group>
            );
        case 'panda':
            return (
                <group scale={0.6} position={[0, -0.3, 0]}>
                    <PandaModel
                        state={state}
                        onPetTap={noopFn}
                        accessories={accessories}
                    />
                </group>
            );
        default:
            return (
                <group scale={0.7} position={[0, -0.4, 0]}>
                    <DogModel
                        state={state}
                        onPetTap={noopFn}
                        targetRef={targetRef}
                        isMovingRef={isMovingRef}
                        rotationRef={rotationRef}
                        accessories={accessories}
                    />
                </group>
            );
    }
}

export function PetViewer3D({
    petType,
    breed = 'labrador',
    accessories = [],
    interactive = false,
    size = 260,
}: PetViewer3DProps) {
    return (
        <div style={{ width: size, height: size }}>
            <Canvas
                camera={{ position: [0, 0.5, 2], fov: 40 }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
            >
                <Suspense fallback={null}>
                    {/* Lighting - Match main game lighting */}
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[3, 5, 2]} intensity={0.8} />
                    <directionalLight position={[-2, 3, -1]} intensity={0.3} />

                    {/* The actual pet model from main game */}
                    <PetModelViewer
                        petType={petType}
                        breed={breed}
                        accessories={accessories}
                    />

                    {/* Controls for Closet (drag to rotate) */}
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
