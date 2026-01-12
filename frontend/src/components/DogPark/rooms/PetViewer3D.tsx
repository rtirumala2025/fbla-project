/**
 * PetViewer3D.tsx
 * 
 * Uses the SAME 3D pet models as the main game (DogModel, CatModel, PandaModel).
 * Wraps them with a static idle state for display in room views.
 */

import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
// import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { PetGame2PetType, PetGame2State, PetBreed } from '../../../game3d/core/SceneManager';
import type { EquippedAccessory } from '../../../game3d/core/BehaviourSystem';
import { DogModel } from '../../../game3d/pets/DogModel';
import { CatModel } from '../../../game3d/pets/CatModel';
import { PandaModel } from '../../../game3d/pets/PandaModel';
import type { RoomType } from './RoomSwitcher';
import { RoomStage } from './RoomStage';


interface PetViewer3DProps {
    petType: PetGame2PetType;
    breed?: PetBreed;
    accessories?: EquippedAccessory[];
    interactive?: boolean; // Enable OrbitControls
    size?: number; // Container size in pixels
    currentRoom?: RoomType;
}

// Create a static idle state for the viewer (no movement)
function createIdleState(breed: PetBreed): PetGame2State {
    return {
        breed,
        currentPosition: [0, 0, 0] as [number, number, number],
        interaction: { kind: 'idle' },
        cameraMode: 'follow',
        vfx: [],
        navigationState: {
            target: null,
            startPosition: [0, 0, 0] as [number, number, number],
            endPosition: [0, 0, 0] as [number, number, number],
            progress: 0,
        },
        indoorLocation: null,
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
                <group scale={1.1} position={[0, -0.05, 0]} rotation={[0, Math.PI, 0]}>
                    <CatModel
                        state={state}
                        onPetTap={noopFn}
                        accessories={accessories}
                    />
                </group>
            );
        case 'panda':
            return (
                <group scale={1.1} position={[0, -0.05, 0]} rotation={[0, Math.PI, 0]}>
                    <PandaModel
                        state={state}
                        onPetTap={noopFn}
                        accessories={accessories}
                    />
                </group>
            );
        default:
            return (
                <group scale={1.2} position={[0, -0.05, 0]} rotation={[0, -0.6, 0]}>
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
    size, // Optional - if not provided, fills parent container
    currentRoom = 'living',
}: PetViewer3DProps) {
    // If size is provided, use fixed dimensions; otherwise fill parent
    const containerStyle: React.CSSProperties = size
        ? { width: size, height: size }
        : { position: 'absolute', inset: 0, width: '100%', height: '100%' };

    return (
        <div style={containerStyle}>
            <Canvas
                camera={{ position: [0, 3, 9], fov: 45 }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
                shadows
            >
                <Suspense fallback={null}>
                    {/* Warm Cozy Lighting */}
                    <hemisphereLight intensity={0.7} color="#FFFAF0" groundColor="#FFD700" />
                    <ambientLight intensity={0.2} color="#FFF8DC" />
                    <directionalLight
                        position={[8, 12, 6]}
                        intensity={1.2}
                        color="#FFF5E1"
                        castShadow
                        shadow-mapSize={[2048, 2048]}
                        shadow-camera-far={40}
                        shadow-camera-left={-12}
                        shadow-camera-right={12}
                        shadow-camera-top={12}
                        shadow-camera-bottom={-12}
                        shadow-bias={-0.0001}
                        shadow-radius={10}
                    />
                    {/* Warm fill from window side */}
                    <directionalLight position={[-4, 6, 2]} intensity={0.4} color="#FFE4B5" />



                    {/* Room Stage */}
                    <RoomStage room={currentRoom} />


                    {/* The actual pet model from main game */}
                    <PetModelViewer
                        petType={petType}
                        breed={breed}
                        accessories={accessories}
                    />

                    {/* Controls - Strictly Locked Viewport */}
                    {interactive && (
                        <OrbitControls
                            enablePan={false}
                            enableZoom={false}
                            // Strict horizontal clamp (~17 degrees)
                            minAzimuthAngle={-0.3}
                            maxAzimuthAngle={0.3}
                            // Vertical: Keep looking at the dog
                            minPolarAngle={1.2}
                            maxPolarAngle={1.5}
                            autoRotate={false}
                            enableDamping
                            dampingFactor={0.08}
                        />
                    )}

                    {/* Post-Processing: Dreamy Bloom */}
                    {/* Post-Processing removed due to runtime error */}{/*
                    <EffectComposer>
                        <Bloom
                            intensity={0.5}
                            luminanceThreshold={0.9}
                            luminanceSmoothing={0.9}
                            mipmapBlur
                        />
                    </EffectComposer>
                    */}

                </Suspense>
            </Canvas>
        </div>
    );
}

export default PetViewer3D;

