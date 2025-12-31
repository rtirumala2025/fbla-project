import React, { useMemo } from 'react';
import * as THREE from 'three';

export type LightingPreset = 'park' | 'room' | 'bamboo';

export function Lighting({ preset }: { preset: LightingPreset }) {
  const config = useMemo(() => {
    if (preset === 'room') {
      return {
        ambient: { intensity: 0.7, color: new THREE.Color('#ffd6a6') },
        sun: { intensity: 1.15, color: new THREE.Color('#fff0d6'), position: new THREE.Vector3(4, 7, 3) },
        fill: { intensity: 0.35, color: new THREE.Color('#b7c8ff'), position: new THREE.Vector3(-4, 3, -2) },
      };
    }

    if (preset === 'bamboo') {
      return {
        ambient: { intensity: 0.55, color: new THREE.Color('#cbead3') },
        sun: { intensity: 0.9, color: new THREE.Color('#e0ffd9'), position: new THREE.Vector3(3, 8, 2) },
        fill: { intensity: 0.25, color: new THREE.Color('#9fd0c7'), position: new THREE.Vector3(-4, 2.5, -3) },
      };
    }

    return {
      ambient: { intensity: 0.55, color: new THREE.Color('#cfe6ff') },
      sun: { intensity: 1.2, color: new THREE.Color('#fff6df'), position: new THREE.Vector3(6, 9, 4) },
      fill: { intensity: 0.3, color: new THREE.Color('#d6e2ff'), position: new THREE.Vector3(-6, 4, -2) },
    };
  }, [preset]);

  return (
    <>
      <ambientLight intensity={config.ambient.intensity} color={config.ambient.color} />
      <directionalLight
        castShadow
        intensity={config.sun.intensity}
        color={config.sun.color}
        position={config.sun.position}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight intensity={config.fill.intensity} color={config.fill.color} position={config.fill.position} />
    </>
  );
}
