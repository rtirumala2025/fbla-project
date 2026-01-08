import React, { useMemo, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';

interface InstancedNatureProps {
    trees: { pos: [number, number, number]; scale: number; rotation: number; lean: [number, number] }[];
    bushes: { pos: [number, number, number]; scale: number; rotation: number }[];
}

export function InstancedNature({ trees, bushes }: InstancedNatureProps) {
    // --- TREES ---
    const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.15, 0.25, 1.6, 5), []);
    const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#4a3b2f", roughness: 0.9 }), []);

    const foliageGeo = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
    const foliageMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#4d7e36", roughness: 0.8 }), []);

    const trunkMeshRef = useRef<THREE.InstancedMesh>(null);
    const foliageMeshRef = useRef<THREE.InstancedMesh>(null);

    useLayoutEffect(() => {
        if (!trunkMeshRef.current || !foliageMeshRef.current) return;

        trees.forEach((data, i) => {
            const { pos, scale, rotation, lean } = data;

            // 1. Setup Parent Matrix (World Pos, Rot Y, Uniform Scale)
            const parentMatrix = new THREE.Matrix4().compose(
                new THREE.Vector3(...pos),
                new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotation),
                new THREE.Vector3(scale, scale, scale)
            );

            // 2. Setup Lean Matrix
            const leanMatrix = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(lean[1], 0, lean[0]));

            // 3. Setup Offset Matrices (Trunk centered vertically at y=0.8, Foliage at top)
            const trunkOffset = new THREE.Matrix4().makeTranslation(0, 0.8, 0);
            const foliageOffset = new THREE.Matrix4().makeTranslation(0, 2.2, 0);

            // Combine for Trunk: T_trunk = T_parent * T_lean * T_offset
            const trunkMatrix = parentMatrix.clone().multiply(leanMatrix).multiply(trunkOffset);
            trunkMeshRef.current!.setMatrixAt(i, trunkMatrix);

            // Combine for Foliage
            const foliageMatrix = parentMatrix.clone().multiply(leanMatrix).multiply(foliageOffset);
            foliageMeshRef.current!.setMatrixAt(i, foliageMatrix);
        });

        trunkMeshRef.current.instanceMatrix.needsUpdate = true;
        foliageMeshRef.current.instanceMatrix.needsUpdate = true;

        trunkMeshRef.current.castShadow = true;
        trunkMeshRef.current.receiveShadow = true;
        foliageMeshRef.current.castShadow = true;
        foliageMeshRef.current.receiveShadow = true;
    }, [trees, trunkGeo, trunkMat, foliageGeo, foliageMat]);


    // --- BUSHES ---
    const bushGeo = useMemo(() => new THREE.DodecahedronGeometry(0.5, 0), []);
    const bushMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3a5e2a", roughness: 0.9 }), []);
    const bushMeshRef = useRef<THREE.InstancedMesh>(null);

    useLayoutEffect(() => {
        if (!bushMeshRef.current) return;

        bushes.forEach((data, i) => {
            const { pos, scale, rotation } = data;

            // Matrix for world pos, rotation, and scale with y-offset
            const parentMatrix = new THREE.Matrix4().compose(
                new THREE.Vector3(...pos),
                new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotation),
                new THREE.Vector3(scale, scale, scale)
            );

            const offsetMatrix = new THREE.Matrix4().makeTranslation(0, 0.4, 0);
            const finalMatrix = parentMatrix.multiply(offsetMatrix);

            bushMeshRef.current!.setMatrixAt(i, finalMatrix);
        });

        bushMeshRef.current.instanceMatrix.needsUpdate = true;
        bushMeshRef.current.castShadow = true;
        bushMeshRef.current.receiveShadow = true;
    }, [bushes, bushGeo, bushMat]);


    return (
        <group>
            <instancedMesh ref={trunkMeshRef} args={[trunkGeo, trunkMat, trees.length]} />
            <instancedMesh ref={foliageMeshRef} args={[foliageGeo, foliageMat, trees.length]} />
            <instancedMesh ref={bushMeshRef} args={[bushGeo, bushMat, bushes.length]} />
        </group>
    );
}
