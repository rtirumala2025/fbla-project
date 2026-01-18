import React, { useRef, useMemo, useState } from 'react';
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

function getHeartGeometry() {
    const x = 0, y = 0;
    const shape = new THREE.Shape();
    shape.moveTo(x + 5, y + 5);
    shape.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y);
    shape.bezierCurveTo(x - 6, y, x - 6, y + 7, x - 6, y + 7);
    shape.bezierCurveTo(x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19);
    shape.bezierCurveTo(x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7);
    shape.bezierCurveTo(x + 16, y + 7, x + 16, y, x + 10, y);
    shape.bezierCurveTo(x + 7, y, x + 5, y + 5, x + 5, y + 5);

    const geom = new THREE.ExtrudeGeometry(shape, { depth: 2, bevelEnabled: false });
    geom.center();
    geom.scale(0.02, 0.02, 0.02);
    geom.rotateX(Math.PI);
    return geom;
}

function ParticleInstance({
    velocity,
    color,
    phase,
    duration
}: {
    velocity: THREE.Vector3;
    color: string;
    phase: number;
    duration: number;
}) {
    const ref = useRef<any>(null);
    const [mountTime] = useState(() => 0); // Placeholder, will replace in useFrame
    const startTimeElem = useRef<number | null>(null);

    useFrame((state) => {
        if (!ref.current) return;

        // Capture start time on first frame
        if (startTimeElem.current === null) {
            startTimeElem.current = state.clock.getElapsedTime();
        }

        const t = state.clock.getElapsedTime();
        // Age relative to this instance's mount + phase delay
        const age = (t - startTimeElem.current) + phase;

        // If age exceeds duration, hide it
        if (age > duration) {
            ref.current.scale.setScalar(0);
            return;
        }

        if (age < 0) {
            ref.current.scale.setScalar(0);
            return;
        }

        const progress = age / duration;

        // Position Update
        ref.current.position.x = velocity.x * age;
        ref.current.position.y = velocity.y * age + (0.5 * age);
        ref.current.position.z = velocity.z * age;

        // Scale and Rotation
        const scale = Math.sin(progress * Math.PI) * (1 - progress * 0.5);
        ref.current.scale.setScalar(scale);
        ref.current.rotation.y += 0.05;
        ref.current.rotation.z += 0.02;
    });

    return <Instance ref={ref} color={color} />;
}

export function ParticleSystem({ type, count = 5, color, position, duration = 2 }: ParticleProps) {
    const geometry = useMemo(() => {
        if (type === 'heart') return getHeartGeometry();
        if (type === 'star') return new THREE.OctahedronGeometry(0.3, 0);
        return new THREE.SphereGeometry(0.2, 8, 8);
    }, [type]);

    const particles = useMemo(() => {
        return Array.from({ length: count }).map(() => ({
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2 + 1,
                (Math.random() - 0.5) * 2
            ).normalize().multiplyScalar(1 + Math.random()),
            phase: Math.random() * 0.5, // Reduced phase for tighter burst
        }));
    }, [count]);

    // Position is handled by parent Group usually, or we pass it to Instances
    // But SceneVfx renders multiple ParticleSystems at custom offsets.
    // If we pass 'position' to Instances, it moves the whole system.

    return (
        <Instances range={count} geometry={geometry} position={position}>
            <meshStandardMaterial
                emissive={color}
                emissiveIntensity={2}
                toneMapped={false}
                color={color}
            />

            {particles.map((p, i) => (
                <ParticleInstance
                    key={i}
                    velocity={p.velocity}
                    color={color}
                    phase={p.phase}
                    duration={duration}
                />
            ))}
        </Instances>
    );
}
