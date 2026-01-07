import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { DroneControls } from './DroneControls';
import type { PetGame2CameraMode, PetGame2Interaction, ActivityZone } from './SceneManager';

export function CameraController({
  mode,
  interaction,
  currentPosition,
  indoorLocation,
  onDroneExit,
  targetRef,
  isMovingRef,
  rotationRef
}: {
  mode: PetGame2CameraMode;
  interaction: PetGame2Interaction;
  currentPosition: [number, number, number];
  indoorLocation?: ActivityZone | null;
  onDroneExit?: () => void;
  targetRef?: React.MutableRefObject<THREE.Vector3>;
  isMovingRef?: React.MutableRefObject<boolean>;
  rotationRef?: React.MutableRefObject<THREE.Quaternion>;
}) {
  const controlsRef = useRef<any>(null);
  const { camera, scene } = useThree();
  // Optimize: Reuse vectors
  const petCenter = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const dummyVec = useMemo(() => new THREE.Vector3(), []);
  const targetVec = useMemo(() => new THREE.Vector3(), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  // Optimize: Interleaved Raycasting (every 2 frames)
  const frameCount = useRef(0);
  const currentCollisionDist = useRef(20);

  useFrame((state, delta) => {
    if (mode === 'drone') {
      return;
    }
    if (!controlsRef.current) return;

    // 1. Update look-at target to pet position (plus offset to look at head/upper body)
    // Updated for Pro Scale (1.2x)
    // Use targetRef if available (Smooth 60fps), else fallback to prop
    const smoothPos = targetRef?.current || dummyVec.set(...currentPosition);
    targetVec.set(smoothPos.x, smoothPos.y + 0.75, smoothPos.z);

    // Lerp controls target (OrbitControls has its own damping, checking if we need manual lerp)
    // Actually controls.target IS the look-at point. setting it directly is fine if damping is on.
    // But manual lerp helps smoothness if input is choppy.
    controlsRef.current.target.lerp(targetVec, 0.15);

    // 2. Navigation Chase Cam Logic OR Strict Movement Chase
    let intendedMaxDist = 20; // Default
    let intendedMinDist = 5;

    const isMoving = isMovingRef?.current || false;

    // Strict Chase when Moving
    if (isMoving && rotationRef && targetRef && interaction.kind === 'idle') {
      // Disable manual control & damping for immediate lock
      controlsRef.current.enabled = false;
      controlsRef.current.enableDamping = false;

      // Calculate offset Behind the pet
      // Offset: 0, 1.5(up), -4.5(back) - Lower angle to see environment
      dummyVec.set(0, 1.5, -4.5).applyQuaternion(rotationRef.current);

      const targetPos = petCenter.set(
        smoothPos.x + dummyVec.x,
        smoothPos.y + dummyVec.y,
        smoothPos.z + dummyVec.z
      );

      // Tight Lerp for "Locked" feeling but smooth enough to not jitter
      camera.position.lerp(targetPos, 0.2);

      intendedMinDist = 3;
      intendedMaxDist = 6;

      // Ensure target is set correctly and sync controls
      controlsRef.current.target.copy(targetVec);
      controlsRef.current.update();

    } else if (interaction.kind === 'navigating') {
      controlsRef.current.enabled = false;
      controlsRef.current.enableDamping = true; // Smooth auto-nav

      const idealOffset = dummyVec.set(0, 2.5, 6);
      const targetPos = petCenter.set(
        smoothPos.x + idealOffset.x,
        smoothPos.y + idealOffset.y,
        smoothPos.z + idealOffset.z
      );
      camera.position.lerp(targetPos, 0.05);

      intendedMinDist = 6;
      intendedMaxDist = 8;
      controlsRef.current.update();

    } else {
      // Idle / Stopped
      controlsRef.current.enabled = true; // Enable manual orbit
      controlsRef.current.enableDamping = true;

      if (indoorLocation) {
        intendedMinDist = 2;
        intendedMaxDist = 4;
      } else {
        intendedMinDist = 4;
        intendedMaxDist = 12; // Reduced from 20 for closer pet focus
      }
      controlsRef.current.update();
    }

    // 3. Collision / Occlusion Detection (Optimized)
    frameCount.current++;
    // Only raycast every 3rd frame to save CPU
    if (frameCount.current % 3 === 0) {
      // Raycast from Pet (slightly up) towards Camera
      petCenter.set(smoothPos.x, smoothPos.y + 1.0, smoothPos.z);
      const camPos = camera.position;

      dir.subVectors(camPos, petCenter).normalize();
      const currentDist = petCenter.distanceTo(camPos);

      raycaster.set(petCenter, dir);
      // Only care about hits closer than our current intended max
      raycaster.far = intendedMaxDist;

      // OPTIMIZATION: intersectObjects(scene.children, true) is very expensive.
      // Ideally we only check known static geometry.
      // For now, relies on 'far' being small to cull broadphase.
      const intersects = raycaster.intersectObjects(scene.children, true);

      let collisionCapsule = intendedMaxDist;

      // Find the first hit that is NOT the pet (we assume pet is within small radius or specific names)
      for (const hit of intersects) {
        // Ignore hits < 1.5 units (pet radius roughly)
        // Check for specific userData flag if available to prioritize walls/ground
        if (hit.distance > 1.5 && hit.distance < intendedMaxDist) {
          // If object is "transparent" logic-wise (like a particle or trigger), ignore?
          // For now, accept all physical hits > 1.5m
          collisionCapsule = hit.distance - 0.5; // pull in slightly in front of wall
          break;
        }
      }
      currentCollisionDist.current = collisionCapsule;
    }

    // Smoothly interpolate the collision limit
    // This prevents camera "snapping" when raycast updates
    const smoothLimit = Math.max(intendedMinDist, currentCollisionDist.current);

    // Apply limits
    controlsRef.current.minDistance = intendedMinDist;
    // Lerp the maxDistance for smoothness
    controlsRef.current.maxDistance = THREE.MathUtils.lerp(controlsRef.current.maxDistance, smoothLimit, 0.1);

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
