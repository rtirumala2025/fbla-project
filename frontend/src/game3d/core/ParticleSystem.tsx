import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Instance, Instances } from '@react-three/drei';

export type ParticleType = 'heart' | 'star' | 'bubble';

interface ParticleProps {
    type: ParticleType;
    count: number;
    color: string;
    position: [number, number, number];
    duration?: number;
}

function HeartGeometry() {
    const shape = useMemo(() => {
        const x = 0, y = 0;
        const shape = new THREE.Shape();
        shape.moveTo(x + 5, y + 5);
        shape.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y);
        shape.bezierCurveTo(x - 6, y, x - 6, y + 7, x - 6, y + 7);
        shape.bezierCurveTo(x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19);
        shape.bezierCurveTo(x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7);
        shape.bezierCurveTo(x + 16, y + 7, x + 16, y, x + 10, y);
        shape.bezierCurveTo(x + 7, y, x + 5, y + 5, x + 5, y + 5);
        return shape;
    }, []);

    // Create geometry and center it
    const geom = useMemo(() => {
        const g = new THREE.ExtrudeGeometry(shape, { depth: 2, bevelEnabled: false });
        g.center();
        g.scale(0.02, 0.02, 0.02);
        g.rotateX(Math.PI); // Flip it upright
        return g;
    }, [shape]);

    return <primitive object={geom} />;
}

function StarGeometry() {
    const geom = useMemo(() => {
        const g = new THREE.OctahedronGeometry(0.3, 0);
        return g;
    }, []);
    return <primitive object={geom} />;
}

function BubbleGeometry() {
    const geom = useMemo(() => {
        const g = new THREE.SphereGeometry(0.2, 8, 8);
        return g;
    }, []);
    return <primitive object={geom} />;
}

function ParticleInstance({
    position,
    velocity,
    color,
    phase,
    duration
}: {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    color: string;
    phase: number;
    duration: number;
}) {
    const ref = useRef<any>(null);
    const startPos = useMemo(() => position.clone(), [position]);

    useFrame((state) => {
        if (!ref.current) return;
        const t = state.clock.getElapsedTime();
        const age = (t + phase) % duration;
        const progress = age / duration;

        // Position Update: Move up and slightly outward
        ref.current.position.x = startPos.x + velocity.x * age;
        ref.current.position.y = startPos.y + velocity.y * age + (0.5 * age); // Floating up
        ref.current.position.z = startPos.z + velocity.z * age;

        // Scale and Rotation (Juice)
        const scale = Math.sin(progress * Math.PI) * (1 - progress * 0.5); // Pop in, fade out
        ref.current.scale.setScalar(scale);
        ref.current.rotation.y += 0.05;
        ref.current.rotation.z += 0.02;

        // Color fade handled by material opacity elsewhere if needed, 
        // but scaling to 0 effectively hides it.
    });

    return <Instance ref={ref} color={color} />;
}

export function ParticleSystem({ type, count = 5, color, position, duration = 2 }: ParticleProps) {
    // Generate random velocities for the burst
    const particles = useMemo(() => {
        return Array.from({ length: count }).map(() => ({
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2 + 1,
                (Math.random() - 0.5) * 2
            ).normalize().multiplyScalar(1 + Math.random()),
            phase: Math.random() * duration, // Random start time overlap
        }));
    }, [count, duration]);

    const posVec = useMemo(() => new THREE.Vector3(...position), [position]);

    return (
        <Instances range={count} position={position}>
            {type === 'heart' && <HeartGeometry />}
            {type === 'star' && <StarGeometry />}
            {type === 'bubble' && <BubbleGeometry />}

            <meshStandardMaterial
                emissive={color}
                emissiveIntensity={2}
                toneMapped={false}
                color={color}
            />

            {particles.map((p, i) => (
                <ParticleInstance
                    key={i}
                    position={new THREE.Vector3(0, 0, 0)}
                    velocity={p.velocity}
                    color={color}
                    phase={p.phase}
                    duration={duration}
                />
            ))}
        </Instances>
    );
}
