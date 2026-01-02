import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { PetGame2CameraMode, PetGame2Interaction } from './SceneManager';

export function CameraController({
  mode,
  interaction,
  currentPosition
}: {
  mode: PetGame2CameraMode;
  interaction: PetGame2Interaction;
  currentPosition: [number, number, number];
}) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const targetVec = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    // 1. Update look-at target to pet position
    targetVec.set(...currentPosition);
    controlsRef.current.target.lerp(targetVec, 0.1);

    // 2. Navigation Chase Cam Logic
    if (interaction.kind === 'navigating') {
      // Create a "chase" effect: Camera stays slightly above and behind the pet
      // Relative offset: [0, 4, 6] relative to pet position
      const idealOffset = new THREE.Vector3(0, 4, 6);

      // We want the camera to be at currentPosition + idealOffset
      // But we also want it to smoothly transition
      const targetPos = new THREE.Vector3().set(
        currentPosition[0] + idealOffset.x,
        currentPosition[1] + idealOffset.y,
        currentPosition[2] + idealOffset.z
      );

      camera.position.lerp(targetPos, 0.05);

      // Constrain Zoom/Rotation slightly during navigation to focus on the movement
      controlsRef.current.minDistance = 6;
      controlsRef.current.maxDistance = 8;
    } else {
      // Default behavior: free orbit
      controlsRef.current.minDistance = 2;
      controlsRef.current.maxDistance = 10;
    }

    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping={true}
      dampingFactor={0.05}
      maxPolarAngle={Math.PI / 2 - 0.05}
      minPolarAngle={0.1}
      makeDefault
    />
  );
}
