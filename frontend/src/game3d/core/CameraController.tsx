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

    const swayX = Math.sin(tRef.current * 0.55) * 0.06;
    const swayY = Math.sin(tRef.current * 0.75) * 0.04;

    const offset = mode === 'focus' ? focusOffset : followOffset;

    tmpDesired.copy(target).add(offset);
    tmpDesired.x += swayX;
    tmpDesired.y += swayY;

    const lerpFactor = 1 - Math.pow(0.001, dt);
    camera.position.lerp(tmpDesired, lerpFactor);

    tmpLookAt.copy(target);
    tmpLookAt.y += 0.9;
    camera.lookAt(tmpLookAt);
  });

  return null;
}
