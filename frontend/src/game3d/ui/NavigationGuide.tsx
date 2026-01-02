import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { NavigationState } from '../core/SceneManager';

export function NavigationGuide({ navigationState, currentPosition }: {
    navigationState: NavigationState;
    currentPosition: [number, number, number];
}) {
    const markerRef = useRef<THREE.Mesh>(null);
    const lineRef = useRef<THREE.Line>(null);
    const { target, endPosition, progress } = navigationState;

    // Animate pulsing marker at destination and update line
    useFrame(({ clock }) => {
        if (!target || progress >= 1) return;

        if (markerRef.current) {
            const pulse = Math.sin(clock.getElapsedTime() * 3) * 0.15 + 1;
            markerRef.current.scale.setScalar(pulse);
        }

        // Update line to start from current position
        if (lineRef.current) {
            const positions = lineRef.current.geometry.attributes.position.array as Float32Array;
            positions[0] = currentPosition[0];
            positions[1] = currentPosition[1] + 0.1; // Slightly above ground
            positions[2] = currentPosition[2];
            positions[3] = endPosition[0];
            positions[4] = endPosition[1] + 0.1;
            positions[5] = endPosition[2];
            lineRef.current.geometry.attributes.position.needsUpdate = true;
            lineRef.current.computeLineDistances(); // Needed for dashed material
        }
    });

    // Only render if actively navigating
    if (!target || progress >= 1) {
        return null;
    }

    return (
        <group>
            {/* Dashed path line */}
            <line ref={lineRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={2}
                        array={new Float32Array(6)}
                        itemSize={3}
                    />
                </bufferGeometry>
                <lineDashedMaterial
                    color="#ffaa00"
                    dashSize={0.5}
                    gapSize={0.3}
                    linewidth={2}
                    transparent
                    opacity={0.7}
                />
            </line>

            {/* Pulsing marker at destination */}
            <mesh
                ref={markerRef}
                position={[endPosition[0], 0.5, endPosition[2]]}
            >
                <cylinderGeometry args={[1.5, 1.5, 0.1, 32]} />
                <meshStandardMaterial
                    color="#ffaa00"
                    emissive="#ffaa00"
                    emissiveIntensity={0.8}
                    transparent
                    opacity={0.6}
                />
            </mesh>

            {/* Arrow cone pointing down */}
            <mesh position={[endPosition[0], 3, endPosition[2]]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.5, 1.5, 8]} />
                <meshStandardMaterial
                    color="#ffaa00"
                    emissive="#ffaa00"
                    emissiveIntensity={1}
                />
            </mesh>
        </group>
    );
}
