import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { PetGame2CameraMode } from './SceneManager';

export function CameraController({ mode, target }: { mode: PetGame2CameraMode; target: THREE.Vector3 }) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  // Initial camera positioning
  useEffect(() => {
    // Set initial position if needed, but OrbitControls usually handles interaction from there
    // We only force position on mount or drastic mode changes if required
    // For now, let's just ensure we look at the target
    if (controlsRef.current) {
      controlsRef.current.target.copy(target);
      controlsRef.current.update();
    }
  }, []);

  // Update target when pet moves (smoothly ideally, but direct update is fine for OrbitControls target)
  useEffect(() => {
    if (controlsRef.current) {
      // Smoothly interpolate target if we wanted, but direct assignment is standard for controls
      // damping will handle the camera lag
      controlsRef.current.target.copy(target);
    }
  }, [target]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping={true}
      dampingFactor={0.05}
      minDistance={2}
      maxDistance={10}
      maxPolarAngle={Math.PI / 2 - 0.05} // Don't go below ground
      minPolarAngle={0.1}
      target={target}
      makeDefault // Critical for interaction to work automatically
    />
  );
}
