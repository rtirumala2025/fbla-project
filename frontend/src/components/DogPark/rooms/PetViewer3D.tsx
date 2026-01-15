/**
 * PetViewer3D.tsx
 * 
 * Uses the SAME 3D pet models as the main game (DogModel, CatModel, PandaModel).
 * Wraps them with a static idle state for display in room views.
 */

import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, SpotLight, PerspectiveCamera, Text } from '@react-three/drei';
// import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { PetGame2PetType, PetGame2State, PetBreed } from '../../../game3d/core/SceneManager';
import type { EquippedAccessory } from '../../../game3d/core/BehaviourSystem';
import { DogModel } from '../../../game3d/pets/DogModel';
import { CatModel } from '../../../game3d/pets/CatModel';
import { PandaModel } from '../../../game3d/pets/PandaModel';
import type { RoomType } from './RoomSwitcher';
import { RoomStage } from './RoomStage';
import { HouseShell } from './HouseShell';


interface PetViewer3DProps {
    petType: PetGame2PetType;
    breed?: PetBreed;
    accessories?: EquippedAccessory[];
    interactive?: boolean; // Enable OrbitControls
    size?: number; // Container size in pixels
    currentRoom?: RoomType;
    onSwitchRoom?: (room: any) => void;
    isSleeping?: boolean;
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
    isSleeping = false,
}: {
    petType: PetGame2PetType;
    breed: PetBreed;
    accessories: EquippedAccessory[];
    isSleeping?: boolean;
}) {
    const state = useMemo(() => createIdleState(breed), [breed]);
    const noopFn = useMemo(() => () => { }, []);
    const targetRef = useRef(new THREE.Vector3());
    const isMovingRef = useRef(false);
    const rotationRef = useRef(new THREE.Quaternion());

    // Sleep transforms: Snap to Bed Logic
    // Bed Location: [0, 0, -2] (Centered)
    // Height: 0.25 to stay on Cushion
    const finalPos: [number, number, number] = isSleeping ? [0, 0.25, 0] : [0, -0.05, 0];
    // Side Roll for Sleep
    const sleepRot: [number, number, number] = [0, 0, Math.PI / 2];

    // Zzz Text Component (Billboarded)
    const ZzzOverlay = () => (
        isSleeping ? (
            <group position={[0, 0.5, 0.5]} rotation={[0, 0, -Math.PI / 2]}> {/* Counter-rotate text */}
                <Text
                    fontSize={0.5}
                    color="#FFD700"
                    outlineWidth={0.04}
                    outlineColor="#000000"
                    anchorX="center"
                    anchorY="bottom"
                >
                    Zzz
                </Text>
            </group>
        ) : null
    );

    // Pick the right model based on pet type
    switch (petType) {
        case 'cat':
            return (
                <group scale={1.1} position={finalPos} rotation={isSleeping ? sleepRot : [0, Math.PI, 0]}>
                    <CatModel state={state} onPetTap={noopFn} accessories={accessories} />
                    <ZzzOverlay />
                </group>
            );
        case 'panda':
            return (
                <group scale={1.1} position={finalPos} rotation={isSleeping ? sleepRot : [0, Math.PI, 0]}>
                    <PandaModel state={state} onPetTap={noopFn} accessories={accessories} />
                    <ZzzOverlay />
                </group>
            );
        default:
            return ( // Dog
                <group scale={1.2} position={finalPos} rotation={isSleeping ? sleepRot : [0, -Math.PI / 6, 0]}>
                    <DogModel
                        state={state}
                        onPetTap={noopFn}
                        targetRef={targetRef}
                        isMovingRef={isMovingRef}
                        rotationRef={rotationRef}
                        accessories={accessories}
                    />
                    <ZzzOverlay />
                </group>
            );
    }
}

export function PetViewer3D({
    petType,
    breed = 'labrador',
    accessories = [],
    interactive = false,
    size,
    currentRoom = 'living',
    onSwitchRoom,
    isSleeping = false,
}: PetViewer3DProps) {
    // If size is provided, use fixed dimensions; otherwise fill parent
    const containerStyle: React.CSSProperties = size
        ? { width: size, height: size }
        : { position: 'absolute', inset: 0, width: '100%', height: '100%', backgroundColor: '#FFDAB9' };

    return (
        <div style={containerStyle}>
            <Canvas
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
                shadows
            >
                <Suspense fallback={null}>
                    <PerspectiveCamera makeDefault position={[0, 5, 12]} fov={35} />

                    {/* Golden Hour Lighting - Cozy Overhaul */}
                    {/* Soft Lavender Ambient for better shadow visibility */}
                    <ambientLight intensity={0.6} color="#E6E6FA" />

                    {/* Low Warm Sun - Softened */}
                    <directionalLight
                        position={[5, 5, 5]}
                        intensity={1.2}
                        color="#ff9800"
                        castShadow
                        shadow-mapSize={[1024, 1024]}
                        shadow-camera-far={40}
                        shadow-camera-left={-12}
                        shadow-camera-right={12}
                        shadow-camera-top={12}
                        shadow-camera-bottom={-12}
                        shadow-bias={-0.0001}
                        shadow-radius={10}
                    />

                    {/* Subtle Fill from front */}
                    <directionalLight position={[0, 2, 5]} intensity={0.4} color="#ffffff" />

                    {/* === POOL OF LIGHT (Dollhouse Effect) === */}
                    <SpotLight
                        position={[5, 8, 5]}
                        angle={0.5}
                        penumbra={0.5}
                        intensity={1}
                        castShadow
                        shadow-bias={-0.0001}
                        color="#FFF8E1"
                    />

                    {/* === GALLERY ART LIGHTING === */}
                    <spotLight position={[0, 4, -1]} target-position={[0, 1.5, -4]} angle={0.6} penumbra={1} intensity={2} color="#FFF0E0" />

                    {/* Grounded Soft Contact Shadows */}
                    <ContactShadows
                        position={[0, -0.75, 0]}
                        opacity={0.7}
                        scale={40}
                        blur={2.5}
                        far={4}
                        color="#000000"
                    />

                    {/* House Shell (Background) */}
                    <HouseShell />

                    {/* Room Stage (Foreground Props) */}
                    <RoomStage currentActivity={currentRoom} isSleeping={isSleeping} />

                    {/* The actual pet model from main game */}
                    <PetModelViewer
                        petType={petType}
                        breed={breed}
                        accessories={accessories}
                        isSleeping={isSleeping}
                    />

                    {/* Controls - Strictly Locked Viewport */}
                    {interactive && (
                        <OrbitControls
                            makeDefault
                            target={[0, 1, 0]}
                            enablePan={false}
                            enableZoom={false}
                            // Strict horizontal clamp (prevent peeking backstage)
                            minAzimuthAngle={-0.2}
                            maxAzimuthAngle={0.2}
                            // Vertical: High Angle "Sims" View
                            minPolarAngle={0.5}
                            maxPolarAngle={1.4}
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
