import React, { useMemo, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';

interface TreeData {
    pos: [number, number, number];
    scale: number;
    rotation: number;
    lean: [number, number];
    type: 'oak' | 'maple' | 'birch' | 'pine';
}

interface BushData {
    pos: [number, number, number];
    scale: number;
    rotation: number;
    hasFlowers?: boolean;
    flowerColor?: string;
}

interface GroundScatterData {
    pos: [number, number, number];
    scale: number;
    rotation: number;
    type: 'leaf' | 'rock' | 'flower';
    color?: string;
}

interface InstancedNatureProps {
    trees: TreeData[];
    bushes: BushData[];
    groundScatter?: GroundScatterData[];
}

// Tree type configurations
const TREE_CONFIGS = {
    oak: {
        trunkColor: '#4a3b2f',
        foliageColor: '#3d6b2f',
        foliageScale: { x: 1.4, y: 1.0, z: 1.4 }, // Wide crown
        foliageHeight: 2.0,
    },
    maple: {
        trunkColor: '#5a4a3f',
        foliageColor: '#5a8f3a',
        foliageScale: { x: 1.1, y: 1.1, z: 1.1 }, // Spherical
        foliageHeight: 2.2,
    },
    birch: {
        trunkColor: '#e8e0d8', // White bark
        foliageColor: '#7db34a',
        foliageScale: { x: 0.7, y: 1.4, z: 0.7 }, // Tall narrow
        foliageHeight: 2.4,
    },
    pine: {
        trunkColor: '#3a2a1f',
        foliageColor: '#2b5a30',
        foliageScale: { x: 0.8, y: 1.6, z: 0.8 }, // Cone shape
        foliageHeight: 2.0,
    },
};

export function InstancedNature({ trees, bushes, groundScatter = [] }: InstancedNatureProps) {
    // Group trees by type for instanced rendering
    const treesByType = useMemo(() => {
        const grouped: Record<string, TreeData[]> = { oak: [], maple: [], birch: [], pine: [] };
        trees.forEach(t => grouped[t.type].push(t));
        return grouped;
    }, [trees]);

    // --- SHARED GEOMETRIES ---
    const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.12, 0.22, 1.8, 6), []);
    const foliageGeo = useMemo(() => new THREE.DodecahedronGeometry(1, 1), []);
    const pineFoliageGeo = useMemo(() => new THREE.ConeGeometry(1, 2.2, 6), []);

    // --- TREE MATERIALS ---
    const treeMaterials = useMemo(() => ({
        oak: {
            trunk: new THREE.MeshStandardMaterial({ color: TREE_CONFIGS.oak.trunkColor, roughness: 0.9 }),
            foliage: new THREE.MeshStandardMaterial({ color: TREE_CONFIGS.oak.foliageColor, roughness: 0.8 }),
        },
        maple: {
            trunk: new THREE.MeshStandardMaterial({ color: TREE_CONFIGS.maple.trunkColor, roughness: 0.9 }),
            foliage: new THREE.MeshStandardMaterial({ color: TREE_CONFIGS.maple.foliageColor, roughness: 0.8 }),
        },
        birch: {
            trunk: new THREE.MeshStandardMaterial({ color: TREE_CONFIGS.birch.trunkColor, roughness: 0.7 }),
            foliage: new THREE.MeshStandardMaterial({ color: TREE_CONFIGS.birch.foliageColor, roughness: 0.8 }),
        },
        pine: {
            trunk: new THREE.MeshStandardMaterial({ color: TREE_CONFIGS.pine.trunkColor, roughness: 0.9 }),
            foliage: new THREE.MeshStandardMaterial({ color: TREE_CONFIGS.pine.foliageColor, roughness: 0.85 }),
        },
    }), []);

    // --- TREE INSTANCE REFS ---
    const oakTrunkRef = useRef<THREE.InstancedMesh>(null);
    const oakFoliageRef = useRef<THREE.InstancedMesh>(null);
    const mapleTrunkRef = useRef<THREE.InstancedMesh>(null);
    const mapleFoliageRef = useRef<THREE.InstancedMesh>(null);
    const birchTrunkRef = useRef<THREE.InstancedMesh>(null);
    const birchFoliageRef = useRef<THREE.InstancedMesh>(null);
    const pineTrunkRef = useRef<THREE.InstancedMesh>(null);
    const pineFoliageRef = useRef<THREE.InstancedMesh>(null);

    // Setup tree instances
    useLayoutEffect(() => {
        const setupTreeType = (
            type: 'oak' | 'maple' | 'birch' | 'pine',
            trunkRef: React.RefObject<THREE.InstancedMesh>,
            foliageRef: React.RefObject<THREE.InstancedMesh>
        ) => {
            if (!trunkRef.current || !foliageRef.current) return;
            const treeData = treesByType[type];
            const config = TREE_CONFIGS[type];

            treeData.forEach((data, i) => {
                const { pos, scale, rotation, lean } = data;

                // Parent transform
                const parentMatrix = new THREE.Matrix4().compose(
                    new THREE.Vector3(...pos),
                    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotation),
                    new THREE.Vector3(scale, scale, scale)
                );

                // Lean matrix
                const leanMatrix = new THREE.Matrix4().makeRotationFromEuler(
                    new THREE.Euler(lean[1], 0, lean[0])
                );

                // Trunk
                const trunkOffset = new THREE.Matrix4().makeTranslation(0, 0.9, 0);
                const trunkMatrix = parentMatrix.clone().multiply(leanMatrix).multiply(trunkOffset);
                trunkRef.current!.setMatrixAt(i, trunkMatrix);

                // Foliage with type-specific scaling
                const foliageOffset = new THREE.Matrix4()
                    .makeTranslation(0, config.foliageHeight, 0)
                    .multiply(new THREE.Matrix4().makeScale(
                        config.foliageScale.x,
                        config.foliageScale.y,
                        config.foliageScale.z
                    ));
                const foliageMatrix = parentMatrix.clone().multiply(leanMatrix).multiply(foliageOffset);
                foliageRef.current!.setMatrixAt(i, foliageMatrix);
            });

            trunkRef.current.instanceMatrix.needsUpdate = true;
            foliageRef.current.instanceMatrix.needsUpdate = true;
            trunkRef.current.castShadow = true;
            foliageRef.current.castShadow = true;
        };

        setupTreeType('oak', oakTrunkRef, oakFoliageRef);
        setupTreeType('maple', mapleTrunkRef, mapleFoliageRef);
        setupTreeType('birch', birchTrunkRef, birchFoliageRef);
        setupTreeType('pine', pineTrunkRef, pineFoliageRef);
    }, [treesByType]);

    // --- BUSHES ---
    const bushGeo = useMemo(() => new THREE.DodecahedronGeometry(0.5, 0), []);
    const bushMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3a5e2a', roughness: 0.9 }), []);
    const flowerBushMat = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#4a6e3a',
        roughness: 0.85
    }), []);

    const bushMeshRef = useRef<THREE.InstancedMesh>(null);
    const regularBushes = useMemo(() => bushes.filter(b => !b.hasFlowers), [bushes]);

    useLayoutEffect(() => {
        if (!bushMeshRef.current) return;

        regularBushes.forEach((data, i) => {
            const { pos, scale, rotation } = data;
            const matrix = new THREE.Matrix4().compose(
                new THREE.Vector3(pos[0], pos[1] + 0.3, pos[2]),
                new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotation),
                new THREE.Vector3(scale, scale * 0.8, scale)
            );
            bushMeshRef.current!.setMatrixAt(i, matrix);
        });

        bushMeshRef.current.instanceMatrix.needsUpdate = true;
        bushMeshRef.current.castShadow = true;
    }, [regularBushes]);

    // --- FLOWERING BUSHES ---
    const floweringBushes = useMemo(() => bushes.filter(b => b.hasFlowers), [bushes]);
    const flowerBushRef = useRef<THREE.InstancedMesh>(null);
    const flowerDotsRef = useRef<THREE.InstancedMesh>(null);
    const flowerDotGeo = useMemo(() => new THREE.SphereGeometry(0.08, 4, 4), []);
    const flowerDotMat = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#ff9999',
        emissive: '#ff6666',
        emissiveIntensity: 0.3
    }), []);

    useLayoutEffect(() => {
        if (!flowerBushRef.current) return;

        floweringBushes.forEach((data, i) => {
            const { pos, scale, rotation } = data;
            const matrix = new THREE.Matrix4().compose(
                new THREE.Vector3(pos[0], pos[1] + 0.35, pos[2]),
                new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotation),
                new THREE.Vector3(scale, scale * 0.7, scale)
            );
            flowerBushRef.current!.setMatrixAt(i, matrix);
        });

        flowerBushRef.current.instanceMatrix.needsUpdate = true;
        flowerBushRef.current.castShadow = true;
    }, [floweringBushes]);

    // --- GROUND SCATTER (Leaves, Rocks, Flowers) ---
    const leaves = useMemo(() => groundScatter.filter(g => g.type === 'leaf'), [groundScatter]);
    const rocks = useMemo(() => groundScatter.filter(g => g.type === 'rock'), [groundScatter]);
    const flowers = useMemo(() => groundScatter.filter(g => g.type === 'flower'), [groundScatter]);

    const leafGeo = useMemo(() => new THREE.CircleGeometry(0.15, 5), []);
    const leafMat = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#8b6b3a',
        side: THREE.DoubleSide,
        roughness: 1
    }), []);
    const leafRef = useRef<THREE.InstancedMesh>(null);

    const rockGeo = useMemo(() => new THREE.DodecahedronGeometry(0.12, 0), []);
    const rockMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6a6a6a', roughness: 1 }), []);
    const rockRef = useRef<THREE.InstancedMesh>(null);

    const wildflowerGeo = useMemo(() => new THREE.SphereGeometry(0.06, 4, 4), []);
    const wildflowerMats = useMemo(() => ({
        red: new THREE.MeshStandardMaterial({ color: '#ff6b6b', emissive: '#ff4444', emissiveIntensity: 0.2 }),
        yellow: new THREE.MeshStandardMaterial({ color: '#ffdd44', emissive: '#ffcc00', emissiveIntensity: 0.2 }),
        purple: new THREE.MeshStandardMaterial({ color: '#bb77ff', emissive: '#9944ff', emissiveIntensity: 0.2 }),
        white: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#eeeeee', emissiveIntensity: 0.15 }),
    }), []);
    const wildflowerRefs = {
        red: useRef<THREE.InstancedMesh>(null),
        yellow: useRef<THREE.InstancedMesh>(null),
        purple: useRef<THREE.InstancedMesh>(null),
        white: useRef<THREE.InstancedMesh>(null),
    };
    const flowersByColor = useMemo(() => {
        const grouped: Record<string, GroundScatterData[]> = { red: [], yellow: [], purple: [], white: [] };
        flowers.forEach(f => {
            const color = f.color || 'white';
            if (grouped[color]) grouped[color].push(f);
        });
        return grouped;
    }, [flowers]);

    useLayoutEffect(() => {
        // Leaves
        if (leafRef.current && leaves.length > 0) {
            leaves.forEach((data, i) => {
                const matrix = new THREE.Matrix4().compose(
                    new THREE.Vector3(data.pos[0], 0.02, data.pos[2]),
                    new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, data.rotation)),
                    new THREE.Vector3(data.scale, data.scale, data.scale)
                );
                leafRef.current!.setMatrixAt(i, matrix);
            });
            leafRef.current.instanceMatrix.needsUpdate = true;
        }

        // Rocks
        if (rockRef.current && rocks.length > 0) {
            rocks.forEach((data, i) => {
                const matrix = new THREE.Matrix4().compose(
                    new THREE.Vector3(data.pos[0], 0.05, data.pos[2]),
                    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), data.rotation),
                    new THREE.Vector3(data.scale, data.scale * 0.6, data.scale)
                );
                rockRef.current!.setMatrixAt(i, matrix);
            });
            rockRef.current.instanceMatrix.needsUpdate = true;
        }

        // Wildflowers by color
        (['red', 'yellow', 'purple', 'white'] as const).forEach(color => {
            const ref = wildflowerRefs[color];
            const colorFlowers = flowersByColor[color];
            if (ref.current && colorFlowers.length > 0) {
                colorFlowers.forEach((data, i) => {
                    const matrix = new THREE.Matrix4().compose(
                        new THREE.Vector3(data.pos[0], 0.15, data.pos[2]),
                        new THREE.Quaternion(),
                        new THREE.Vector3(data.scale, data.scale, data.scale)
                    );
                    ref.current!.setMatrixAt(i, matrix);
                });
                ref.current.instanceMatrix.needsUpdate = true;
            }
        });
    }, [leaves, rocks, flowersByColor]);

    return (
        <group>
            {/* OAK TREES */}
            {treesByType.oak.length > 0 && (
                <>
                    <instancedMesh ref={oakTrunkRef} args={[trunkGeo, treeMaterials.oak.trunk, treesByType.oak.length]} />
                    <instancedMesh ref={oakFoliageRef} args={[foliageGeo, treeMaterials.oak.foliage, treesByType.oak.length]} />
                </>
            )}

            {/* MAPLE TREES */}
            {treesByType.maple.length > 0 && (
                <>
                    <instancedMesh ref={mapleTrunkRef} args={[trunkGeo, treeMaterials.maple.trunk, treesByType.maple.length]} />
                    <instancedMesh ref={mapleFoliageRef} args={[foliageGeo, treeMaterials.maple.foliage, treesByType.maple.length]} />
                </>
            )}

            {/* BIRCH TREES */}
            {treesByType.birch.length > 0 && (
                <>
                    <instancedMesh ref={birchTrunkRef} args={[trunkGeo, treeMaterials.birch.trunk, treesByType.birch.length]} />
                    <instancedMesh ref={birchFoliageRef} args={[foliageGeo, treeMaterials.birch.foliage, treesByType.birch.length]} />
                </>
            )}

            {/* PINE TREES */}
            {treesByType.pine.length > 0 && (
                <>
                    <instancedMesh ref={pineTrunkRef} args={[trunkGeo, treeMaterials.pine.trunk, treesByType.pine.length]} />
                    <instancedMesh ref={pineFoliageRef} args={[pineFoliageGeo, treeMaterials.pine.foliage, treesByType.pine.length]} />
                </>
            )}

            {/* REGULAR BUSHES */}
            {regularBushes.length > 0 && (
                <instancedMesh ref={bushMeshRef} args={[bushGeo, bushMat, regularBushes.length]} />
            )}

            {/* FLOWERING BUSHES */}
            {floweringBushes.length > 0 && (
                <instancedMesh ref={flowerBushRef} args={[bushGeo, flowerBushMat, floweringBushes.length]} />
            )}

            {/* GROUND SCATTER */}
            {leaves.length > 0 && (
                <instancedMesh ref={leafRef} args={[leafGeo, leafMat, leaves.length]} />
            )}
            {rocks.length > 0 && (
                <instancedMesh ref={rockRef} args={[rockGeo, rockMat, rocks.length]} />
            )}
            {flowersByColor.red.length > 0 && (
                <instancedMesh ref={wildflowerRefs.red} args={[wildflowerGeo, wildflowerMats.red, flowersByColor.red.length]} />
            )}
            {flowersByColor.yellow.length > 0 && (
                <instancedMesh ref={wildflowerRefs.yellow} args={[wildflowerGeo, wildflowerMats.yellow, flowersByColor.yellow.length]} />
            )}
            {flowersByColor.purple.length > 0 && (
                <instancedMesh ref={wildflowerRefs.purple} args={[wildflowerGeo, wildflowerMats.purple, flowersByColor.purple.length]} />
            )}
            {flowersByColor.white.length > 0 && (
                <instancedMesh ref={wildflowerRefs.white} args={[wildflowerGeo, wildflowerMats.white, flowersByColor.white.length]} />
            )}
        </group>
    );
}
