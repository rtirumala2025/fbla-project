import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type LightingPreset = 'park' | 'room' | 'bamboo';

export function Lighting({ preset }: { preset: LightingPreset }) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const rimRef = useRef<THREE.DirectionalLight>(null);

  // AAA Lighting: Forza-style physically based illumination
  // Key principle: Low ambient (0.15-0.25), strong directional sun (5-8× ambient), proper color temperature
  const config = useMemo(() => {
    if (preset === 'room') {
      // Indoor: Warm tungsten primary, cool window fill
      return {
        ambient: { intensity: 0.18, color: new THREE.Color('#ffe8d4') }, // Warm ambient (3000K)
        sun: { intensity: 2.4, color: new THREE.Color('#fff5e6'), position: new THREE.Vector3(4, 7, 3) }, // Key lamp (3200K)
        fill: { intensity: 0.45, color: new THREE.Color('#d4e3ff'), position: new THREE.Vector3(-4, 3, -2) }, // Window bounce (5600K)
        rim: { intensity: 1.1, color: new THREE.Color('#ffead0'), position: new THREE.Vector3(0, 3, -5) }, // Edge definition
      };
    }

    if (preset === 'bamboo') {
      // Forest: Green-tinted ambient, dappled sun, strong rim for silhouette
      return {
        ambient: { intensity: 0.22, color: new THREE.Color('#d4ead8') }, // Green ambient (forest canopy)
        sun: { intensity: 2.0, color: new THREE.Color('#fffae6'), position: new THREE.Vector3(3, 8, 2) }, // Sun through leaves (5000K)
        fill: { intensity: 0.5, color: new THREE.Color('#a8d4c4'), position: new THREE.Vector3(-4, 2.5, -3) }, // Cool fill (reflected sky)
        rim: { intensity: 1.4, color: new THREE.Color('#ffe8c0'), position: new THREE.Vector3(0, 2, -4) }, // CRITICAL: Panda needs strong rim vs green BG
      };
    }

    // Park: Outdoor daylight (5500K sun, blue sky fill)
    return {
      ambient: { intensity: 0.25, color: new THREE.Color('#e6f2ff') }, // Sky ambient (6000K)
      sun: { intensity: 2.2, color: new THREE.Color('#fff5e6'), position: new THREE.Vector3(6, 9, 4) }, // Sun (5500K)
      fill: { intensity: 0.55, color: new THREE.Color('#d4e3ff'), position: new THREE.Vector3(-6, 4, -2) }, // Sky fill (6500K)
      rim: { intensity: 1.2, color: new THREE.Color('#ffe4b8'), position: new THREE.Vector3(0, 4, -6) }, // Warm rim (sun scatter)
    };
  }, [preset]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const variation = Math.sin(t * 0.25) * 0.05;

    if (ambientRef.current) {
      ambientRef.current.intensity = config.ambient.intensity * (1 + variation * 0.5);
    }

    if (sunRef.current) {
      sunRef.current.intensity = config.sun.intensity * (1 + variation);
    }

    if (fillRef.current) {
      fillRef.current.intensity = config.fill.intensity * (1 + variation * 0.8);
    }

    if (rimRef.current) {
      rimRef.current.intensity = config.rim.intensity * (1 + variation * 0.6);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={config.ambient.intensity} color={config.ambient.color} />
      <directionalLight
        ref={sunRef}
        castShadow
        intensity={config.sun.intensity}
        color={config.sun.color}
        position={config.sun.position}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.00015}
        shadow-normalBias={0.015}
        shadow-radius={3}
      />
      <directionalLight
        ref={fillRef}
        intensity={config.fill.intensity}
        color={config.fill.color}
        position={config.fill.position}
      />
      {/* Rim light for pet silhouette pop */}
      <directionalLight
        ref={rimRef}
        intensity={config.rim.intensity}
        color={config.rim.color}
        position={config.rim.position}
      />
    </>
  );
}
