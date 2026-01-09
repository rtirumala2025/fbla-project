import React, { useMemo, useRef } from 'react';
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
      // Indoor: Photorealistic Late Afternoon
      // Low-angle warm sun (Golden Hour), cool indirect bounce (Skylight)
      return {
        ambient: { intensity: 0.35, color: new THREE.Color('#dbeaf9') }, // Cool/Desaturated bounce (7500K shadows)
        sun: { intensity: 3.2, color: new THREE.Color('#ffcfa3'), position: new THREE.Vector3(8, 2, 4) }, // Low sun, Golden warmth (2800K)
        fill: { intensity: 0.4, color: new THREE.Color('#bed7ff'), position: new THREE.Vector3(-4, 3, -4) }, // Blue sky fill from window
        rim: { intensity: 1.5, color: new THREE.Color('#ffe8d4'), position: new THREE.Vector3(-2, 4, -4) }, // Warm rim catch
      };
    }

    if (preset === 'bamboo') {
      return {
        ambient: { intensity: 0.6, color: new THREE.Color('#1a3c2f') }, // Strong deep green ambient
        sun: { intensity: 0.8, color: new THREE.Color('#cce6d0'), position: new THREE.Vector3(2, 8, 1) }, // Weak, diffused, pale green sun
        fill: { intensity: 0.3, color: new THREE.Color('#1e4f45') }, // Darker cool green fill
        rim: { intensity: 0.8, color: new THREE.Color('#a8dbba'), position: new THREE.Vector3(0, 3, -4) }, // Soft rim to separate panda from bg
      };
    }

    // Park: Realistic Early Morning Trail - Updated for Lead Dev Polish
    // Pale Warm Grey/Blue atmosphere, Warm Sun
    return {
      ambient: { intensity: 0.4, color: new THREE.Color('#cce0ff') }, // Pale warm grey/blue
      sun: { intensity: 3.8, color: new THREE.Color('#ffa570'), position: new THREE.Vector3(12, 8, 8) }, // Warm sun, slightly higher
      fill: { intensity: 0.6, color: new THREE.Color('#b0c4de'), position: new THREE.Vector3(-10, 5, -5) }, // Cool blue fill
      rim: { intensity: 1.2, color: new THREE.Color('#ffe0c0'), position: new THREE.Vector3(-5, 4, -8) }, // Soft Rim
    };
  }, [preset]);

  // Light intensity animation removed for performance - static lighting is sufficient

  return (
    <>
      <ambientLight ref={ambientRef} intensity={config.ambient.intensity} color={config.ambient.color} />
      <directionalLight
        ref={sunRef}
        castShadow
        intensity={config.sun.intensity}
        color={config.sun.color}
        position={config.sun.position}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
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
