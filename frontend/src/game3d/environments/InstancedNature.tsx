import React, { useMemo, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';

interface InstancedNatureProps {
    trees: { pos: [number, number, number]; scale: number; rotation: number; lean: [number, number] }[];
    bushes: { pos: [number, number, number]; scale: number; rotation: number }[];
}

export function InstancedNature({ trees, bushes }: InstancedNatureProps) {
    // --- TREES ---
    // A tree is composed of a Trunk (Cylinder) and Foliage (Dodecahedron)
    // We need two InstancedMeshes for the trees.

    const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.15, 0.25, 1.6, 8), []);
    const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#4a3b2f", roughness: 0.9 }), []);

    const foliageGeo = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
    const foliageMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#4d7e36", roughness: 0.8 }), []);

    const trunkMeshRef = useRef<THREE.InstancedMesh>(null);
    const foliageMeshRef = useRef<THREE.InstancedMesh>(null);

    useLayoutEffect(() => {
        if (!trunkMeshRef.current || !foliageMeshRef.current) return;

        const draggingObject = new THREE.Object3D();
        const leaningObject = new THREE.Object3D();

        // We hierarchically transform: Position -> Lean -> Scale
        // Since InstancedMesh doesn't support hierarchy natively per instance easily without matrix math,
        // we use a dummy object chain or just manual matrix composition.
        // Easier: dummy objects.

        // Parent object for position/rotation
        const parent = new THREE.Object3D();
        // Child object for lean
        const child = new THREE.Object3D();
        parent.add(child);

        trees.forEach((data, i) => {
            const { pos, scale, rotation, lean } = data;
            const baseScale = scale;

            // Reset transforms
            parent.position.set(pos[0], pos[1], pos[2]);
            parent.rotation.set(0, rotation, 0);
            parent.scale.setScalar(baseScale);
            parent.updateMatrix();

            // Apply LEAN to the inner group logic simulation
            // Actually, in the original code:
            // Group (Pos, Scale, RotY) -> Group (Lean) -> Mesh (Offset)

            // We can just construct the matrix for Trunk and Foliage separately.

            // Trunk:
            // Local: Position(0, 0.8, 0)
            // Parent: Lean
            // Grandparent: Pos, Scale, Rot

            child.rotation.set(lean[1], 0, lean[0]);
            child.updateMatrix();

            // Calculate Trunk World Matrix (relative to the InstancedMesh, which is at 0,0,0)
            // T_trunk = T_parent * T_child * T_offset_trunk

            const matrix = new THREE.Matrix4();

            // 1. Setup Parent Matrix (World Pos, Rot Y, Uniform Scale)
            const parentMatrix = new THREE.Matrix4().compose(
                new THREE.Vector3(...pos),
                new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotation),
                new THREE.Vector3(baseScale, baseScale, baseScale)
            );

            // 2. Setup Lean Matrix
            const leanMatrix = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(lean[1], 0, lean[0]));

            // 3. Setup Offset Matrices
            const trunkOffset = new THREE.Matrix4().makeTranslation(0, 0.8, 0);
            const foliageOffset = new THREE.Matrix4().makeTranslation(0, 2.2, 0);

            // Combine for Trunk
            const trunkMatrix = parentMatrix.clone().multiply(leanMatrix).multiply(trunkOffset);
            trunkMeshRef.current!.setMatrixAt(i, trunkMatrix);

            // Combine for Foliage
            const foliageMatrix = parentMatrix.clone().multiply(leanMatrix).multiply(foliageOffset);
            foliageMeshRef.current!.setMatrixAt(i, foliageMatrix);
        });

        trunkMeshRef.current.instanceMatrix.needsUpdate = true;
        foliageMeshRef.current.instanceMatrix.needsUpdate = true;

        // Shadows
        trunkMeshRef.current.castShadow = true;
        trunkMeshRef.current.receiveShadow = true;
        foliageMeshRef.current.castShadow = true;
        foliageMeshRef.current.receiveShadow = true;

    }, [trees, trunkGeo, foliageGeo]);


    // --- BUSHES ---
    const bushGeo = useMemo(() => new THREE.DodecahedronGeometry(0.5, 0), []);
    const bushMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3a5e2a", roughness: 0.9 }), []);
    const bushMeshRef = useRef<THREE.InstancedMesh>(null);

    useLayoutEffect(() => {
        if (!bushMeshRef.current) return;

        bushes.forEach((data, i) => {
            const { pos, scale, rotation } = data;

            const dummy = new THREE.Object3D();
            dummy.position.set(pos[0], pos[1], pos[2]);
            dummy.rotation.set(0, rotation, 0);
            dummy.scale.setScalar(scale);

            // Offset y=0.4 in local space
            // Original: Group(Pos, Scale, Rot) -> Mesh(0, 0.4, 0)
            // So we effectively just translate the dummy object logic or apply offset

            // Let's do matrix path again for clarity
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
    }, [bushes, bushGeo]);


    return (
        <group>
            <instancedMesh ref={trunkMeshRef} args={[trunkGeo, trunkMat, trees.length]} />
            <instancedMesh ref={foliageMeshRef} args={[foliageGeo, foliageMat, trees.length]} />
            <instancedMesh ref={bushMeshRef} args={[bushGeo, bushMat, bushes.length]} />
        </group>
    );
}
