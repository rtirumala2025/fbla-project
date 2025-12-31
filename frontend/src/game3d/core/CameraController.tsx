import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { PetGame2CameraMode } from './SceneManager';

export function CameraController({ mode, target }: { mode: PetGame2CameraMode; target: THREE.Vector3 }) {
  const { camera } = useThree();
  const tRef = useRef(0);

  const followOffset = useMemo(() => new THREE.Vector3(0, 2.4, 5.2), []);
  const focusOffset = useMemo(() => new THREE.Vector3(0.2, 1.8, 3.4), []);

  const tmpDesired = useMemo(() => new THREE.Vector3(), []);
  const tmpLookAt = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    tRef.current += dt;

    // More noticeable sway - visible within 5 seconds
    const swayX = Math.sin(tRef.current * 0.7) * 0.08;
    const swayY = Math.sin(tRef.current * 0.9) * 0.06;

    // Slow but visible orbital rotation
    const orbitAngle = Math.sin(tRef.current * 0.25) * 0.4;

    // Vertical bob for variety
    const verticalBob = Math.sin(tRef.current * 0.4) * 0.04;

    const offset = mode === 'focus' ? focusOffset : followOffset;

    // Apply orbital rotation to offset
    const rotatedOffset = offset.clone();
    const cosA = Math.cos(orbitAngle);
    const sinA = Math.sin(orbitAngle);
    const x = rotatedOffset.x * cosA - rotatedOffset.z * sinA;
    const z = rotatedOffset.x * sinA + rotatedOffset.z * cosA;
    rotatedOffset.x = x;
    rotatedOffset.z = z;

    tmpDesired.copy(target).add(rotatedOffset);
    tmpDesired.x += swayX;
    tmpDesired.y += swayY + verticalBob;

    const lerpFactor = 1 - Math.pow(0.001, dt);
    camera.position.lerp(tmpDesired, lerpFactor);

    tmpLookAt.copy(target);
    tmpLookAt.y += 0.9;
    camera.lookAt(tmpLookAt);
  });

  return null;
}
