import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { NavigationState } from '../core/SceneManager';

export function NavigationGuide({ navigationState, currentPosition }: {
    navigationState: NavigationState;
    currentPosition: [number, number, number];
}) {
    const markerRef = useRef<THREE.Mesh>(null);

    // Only render if actively navigating
    if (!navigationState.target || navigationState.progress >= 1) {
        return null;
    }

    const { startPosition, endPosition, progress } = navigationState;

    // Animate pulsing marker at destination
    useFrame(({ clock }) => {
        if (markerRef.current) {
            const pulse = Math.sin(clock.getElapsedTime() * 3) * 0.15 + 1;
            markerRef.current.scale.setScalar(pulse);
        }
    });

    // Create dashed line from current position to destination
    const lineGeometry = useMemo(() => {
        const points = [
            new THREE.Vector3(...currentPosition),
            new THREE.Vector3(...endPosition),
        ];
        return new THREE.BufferGeometry().setFromPoints(points);
    }, [currentPosition, endPosition]);

    return (
        <group>
            {/* Dashed path line */}
            <line geometry={lineGeometry}>
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
