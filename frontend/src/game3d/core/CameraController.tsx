import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { DroneControls } from './DroneControls';
import type { PetGame2CameraMode, PetGame2Interaction } from './SceneManager';

export function CameraController({
  mode,
  interaction,
  currentPosition,
  onDroneExit,
}: {
  mode: PetGame2CameraMode;
  interaction: PetGame2Interaction;
  currentPosition: [number, number, number];
  onDroneExit?: () => void;
}) {
  const controlsRef = useRef<any>(null);
  const { camera, scene } = useThree();
  const targetVec = useMemo(() => new THREE.Vector3(), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  useFrame((state, delta) => {
    if (mode === 'drone') {
      return;
    }
    if (!controlsRef.current) return;

    // 1. Update look-at target to pet position (plus offset to look at head/upper body)
    targetVec.set(currentPosition[0], currentPosition[1] + 1.25, currentPosition[2]);
    controlsRef.current.target.lerp(targetVec, 0.1);

    // 2. Navigation Chase Cam Logic
    let intendedMaxDist = 20; // Default
    let intendedMinDist = 5;

    if (interaction.kind === 'navigating') {
      const idealOffset = new THREE.Vector3(0, 4, 6);
      const targetPos = new THREE.Vector3().set(
        currentPosition[0] + idealOffset.x,
        currentPosition[1] + idealOffset.y,
        currentPosition[2] + idealOffset.z
      );
      camera.position.lerp(targetPos, 0.05);

      intendedMinDist = 6;
      intendedMaxDist = 8;
    } else {
      intendedMinDist = 5;
      intendedMaxDist = 20;
    }

    // 3. Collision / Occlusion Detection
    // Raycast from Pet (slightly up) towards Camera
    const petCenter = new THREE.Vector3(currentPosition[0], currentPosition[1] + 1.0, currentPosition[2]);
    const camPos = camera.position;
    const dir = new THREE.Vector3().subVectors(camPos, petCenter).normalize();
    const currentDist = petCenter.distanceTo(camPos);

    raycaster.set(petCenter, dir);
    // Only care about hits closer than our current intended max
    raycaster.far = intendedMaxDist;

    const intersects = raycaster.intersectObjects(scene.children, true);

    let collisionCapsule = intendedMaxDist;

    // Find the first hit that is NOT the pet (we assume pet is within small radius or specific names)
    // Simple heuristic: ignore hits very close to origin (pet itself)
    for (const hit of intersects) {
      // Ignore hits < 1.5 units (pet radius roughly)
      // Also ignore hits that are further than where the camera currently is if we only want to pull in?
      // Actually we want to limit the CAP.
      if (hit.distance > 1.5 && hit.distance < intendedMaxDist) {
        collisionCapsule = hit.distance - 0.5; // pull in slightly in front of wall
        break;
      }
    }

    // Apply limits
    controlsRef.current.minDistance = intendedMinDist;
    controlsRef.current.maxDistance = Math.max(intendedMinDist, collisionCapsule);

    controlsRef.current.update();
  });

  return (
    <>
      {mode !== 'drone' && (
        <OrbitControls
          ref={controlsRef}
          enableDamping={true}
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minPolarAngle={0.1}
          makeDefault
          enabled={true}
        />
      )}
      <DroneControls
        active={mode === 'drone'}
        onExit={onDroneExit}
      />
    </>
  );
}
