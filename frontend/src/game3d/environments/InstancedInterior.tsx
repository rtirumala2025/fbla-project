import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Generic scattering system for interior props
// Uses InstancedMesh for performance

export function InstancedInterior() {
    const bookRef = useRef<THREE.InstancedMesh>(null);
    const mugRef = useRef<THREE.InstancedMesh>(null);
    const pillowRef = useRef<THREE.InstancedMesh>(null);
    const particleRef = useRef<THREE.InstancedMesh>(null); // Floating dust motes

    // Generate scatter transform matrices
    // 1. Books: Scattered on floor, tables, shelves
    const bookData = useMemo(() => {
        const count = 50;
        const temp = new THREE.Object3D();
        const colors = [];
        const matrices = [];

        for (let i = 0; i < count; i++) {
            // Randomly pick a zone or random floor spot
            const r = Math.random();
            if (r < 0.3) {
                // Shelf area (Agility)
                temp.position.set(35 + (Math.random() - 0.5) * 5, 0.2 + Math.random() * 20, -30 + (Math.random() - 0.5) * 5);
            } else if (r < 0.6) {
                // Desk Area
                temp.position.set(-40 + (Math.random() - 0.5) * 10, 3.5, -10 + (Math.random() - 0.5) * 5);
            } else {
                // Random floor
                temp.position.set((Math.random() - 0.5) * 80, 0.1, (Math.random() - 0.5) * 80);
            }

            temp.rotation.set(Math.random() * 0.2, Math.random() * Math.PI, Math.random() * 0.2);
            temp.scale.setScalar(0.8 + Math.random() * 0.4);
            temp.updateMatrix();
            matrices.push(temp.matrix.clone());

            const col = new THREE.Color().setHSL(Math.random(), 0.6, 0.5);
            colors.push(col.r, col.g, col.b);
        }
        return { matrices, colors: new Float32Array(colors) };
    }, []);

    // 2. Mugs: Coffe table, desk
    const mugData = useMemo(() => {
        const count = 15;
        const temp = new THREE.Object3D();
        const matrices = [];

        for (let i = 0; i < count; i++) {
            // Desk or Table or Kitchen
            const r = Math.random();
            if (r < 0.5) temp.position.set(-40 + (Math.random() - 0.5) * 8, 3.5, -10 + (Math.random() - 0.5) * 2); // Desk
            else if (r < 0.8) temp.position.set(3 + (Math.random() - 0.5) * 2, 2.5, 3 + (Math.random() - 0.5) * 2); // Coffee Table
            else temp.position.set(35 + (Math.random() - 0.5) * 10, 7.2, 30 + (Math.random() - 0.5) * 2); // Kitchen

            temp.rotation.y = Math.random() * Math.PI;
            temp.updateMatrix();
            matrices.push(temp.matrix.clone());
        }
        return { matrices };
    }, []);

    // 3. Dust Motes (Atmosphere)
    const dustData = useMemo(() => {
        const count = 200;
        const items = new Array(count).fill(0).map(() => ({
            x: (Math.random() - 0.5) * 100,
            y: Math.random() * 40,
            z: (Math.random() - 0.5) * 100,
            speed: Math.random() * 0.05,
            offset: Math.random() * 100
        }));
        return items;
    }, []);

    // Apply static matrices once
    useEffect(() => {
        if (bookRef.current) {
            bookData.matrices.forEach((m, i) => bookRef.current!.setMatrixAt(i, m));
            bookRef.current.instanceMatrix.needsUpdate = true;
            if (bookRef.current.instanceColor) return; // if already set? no, setting attribute needs check
            // Set colors requires custom attribute or looping? simpler to use one material if needed or set color buffer
            // For now standard material color is single, instanced color is via InstanceColor attribute
        }
        if (mugRef.current) {
            mugData.matrices.forEach((m, i) => mugRef.current!.setMatrixAt(i, m));
            mugRef.current.instanceMatrix.needsUpdate = true;
        }
    }, []);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        // Animate dust
        if (particleRef.current) {
            dustData.forEach((d, i) => {
                const y = (d.y + t * d.speed) % 40;
                const x = d.x + Math.sin(t * 0.2 + d.offset) * 2;
                dummy.position.set(x, y, d.z);
                dummy.scale.setScalar(Math.sin(t * 2 + d.offset) * 0.5 + 0.5); // Twinkle
                dummy.updateMatrix();
                particleRef.current!.setMatrixAt(i, dummy.matrix);
            });
            particleRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <group>
            {/* BOOKS */}
            <instancedMesh ref={bookRef} args={[undefined, undefined, 50]} castShadow receiveShadow>
                <boxGeometry args={[1.5, 0.4, 2]} />
                <meshStandardMaterial color="#ba4a4a" /> {/* Fallback color, could use instanceColor */}
            </instancedMesh>

            {/* MUGS */}
            <instancedMesh ref={mugRef} args={[undefined, undefined, 15]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.8]} />
                <meshStandardMaterial color="#fff" />
            </instancedMesh>

            {/* DUST PARTICLES */}
            <instancedMesh ref={particleRef} args={[undefined, undefined, 200]}>
                <sphereGeometry args={[0.05]} />
                <meshBasicMaterial color="#fff" transparent opacity={0.4} />
            </instancedMesh>
        </group>
    );
}
