/**
 * KitchenFurniture.tsx - GEOMETRY LOCKED
 * 
 * COORDINATE LOCKED DIMENSIONS:
 * 
 * BACK RUN:
 *   Start X: -3.0 | End X: +5.0 | WIDTH: 8.0 units
 *   Center X: 1.0 (calculated: (-3 + 5) / 2 = 1)
 *   Z Position: -4.0 (against back wall)
 *   Depth: 1.5 units
 * 
 * SIDE RUN:
 *   Start Z: -4.5 | End Z: +2.0 | DEPTH: 6.5 units
 *   Center Z: -1.25 (calculated: (-4.5 + 2) / 2 = -1.25)
 *   X Position: 4.25 (against right wall)
 *   Width: 1.5 units
 * 
 * CORNER UNION: Overlap at x=4.25, z=-4.0
 */

import React from 'react';

export function KitchenFurniture() {
    // Colors
    const applianceColor = "#E0E0E0";
    const cabinetColor = "#ECEFF1";
    const countertopColor = "#1A1A1A"; // Black marble
    const accentColor = "#CFD8DC"; // Chrome
    const handleColor = "#212121"; // Black handles
    const bowlColor = "#1565C0";
    const waterColor = "#64B5F6";
    const foodColor = "#8D6E63";
    const woodColor = "#D7CCC8";
    const rugColor = "#E64A19"; // Terracotta

    return (
        <group>
            {/* ============================================================ */}
            {/* === REFRIGERATOR (Built-In) === */}
            {/* ============================================================ */}
            <group position={[-4, 0, -3.8]}>
                {/* Main Body */}
                <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
                    <boxGeometry args={[1.6, 5, 1.2]} />
                    <meshStandardMaterial color="#BDBDBD" metalness={0.3} roughness={0.4} />
                </mesh>

                {/* Freezer Door */}
                <mesh position={[0, 4.3, 0.62]} castShadow>
                    <boxGeometry args={[1.5, 1.3, 0.05]} />
                    <meshStandardMaterial color={applianceColor} metalness={0.5} roughness={0.25} />
                </mesh>

                {/* Fridge Door */}
                <mesh position={[0, 2.0, 0.62]} castShadow>
                    <boxGeometry args={[1.5, 2.6, 0.05]} />
                    <meshStandardMaterial color={applianceColor} metalness={0.5} roughness={0.25} />
                </mesh>

                {/* Door Gap */}
                <mesh position={[0, 3.5, 0.6]}>
                    <boxGeometry args={[1.55, 0.08, 0.02]} />
                    <meshStandardMaterial color="#424242" />
                </mesh>

                {/* Handles */}
                <mesh position={[0.6, 4.3, 0.7]} castShadow>
                    <boxGeometry args={[0.08, 0.8, 0.08]} />
                    <meshStandardMaterial color={accentColor} metalness={0.95} roughness={0.1} />
                </mesh>
                <mesh position={[0.6, 2.0, 0.7]} castShadow>
                    <boxGeometry args={[0.08, 1.4, 0.08]} />
                    <meshStandardMaterial color={accentColor} metalness={0.95} roughness={0.1} />
                </mesh>
            </group>

            {/* Fridge Cabinet Surround */}
            <group position={[-4, 0, -3.8]}>
                {/* Side Panel */}
                <mesh position={[0.9, 2.5, 0]} castShadow>
                    <boxGeometry args={[0.1, 5, 1.2]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>
                {/* Top Cabinet */}
                <mesh position={[0, 5.8, 0]} castShadow>
                    <boxGeometry args={[1.8, 1.4, 1.2]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>
            </group>


            {/* ============================================================ */}
            {/* === L-SHAPED COUNTER - GEOMETRY LOCKED === */}
            {/* ============================================================ */}

            {/* --- BACK RUN: WIDTH = 8.0 (x from -3 to +5) --- */}
            {/* Center X = 1.0, Z = -4.0 */}
            <group>
                {/* Base Cabinet - FULL WIDTH */}
                <mesh position={[1, 0.75, -4]} castShadow receiveShadow>
                    <boxGeometry args={[8, 1.5, 1.5]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.5} />
                </mesh>

                {/* Black Marble Countertop - FULL WIDTH */}
                <mesh position={[1, 1.55, -4]} castShadow>
                    <boxGeometry args={[8.1, 0.1, 1.6]} />
                    <meshStandardMaterial color={countertopColor} metalness={0.4} roughness={0.15} />
                </mesh>

                {/* Cabinet Door Panels (6 doors across 8 units) */}
                <mesh position={[-2.5, 0.75, -3.22]}>
                    <boxGeometry args={[1.2, 1.2, 0.03]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>
                <mesh position={[-1.2, 0.75, -3.22]}>
                    <boxGeometry args={[1.2, 1.2, 0.03]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>
                <mesh position={[0.1, 0.75, -3.22]}>
                    <boxGeometry args={[1.2, 1.2, 0.03]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>
                <mesh position={[1.4, 0.75, -3.22]}>
                    <boxGeometry args={[1.2, 1.2, 0.03]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>
                <mesh position={[2.7, 0.75, -3.22]}>
                    <boxGeometry args={[1.2, 1.2, 0.03]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>
                <mesh position={[4.0, 0.75, -3.22]}>
                    <boxGeometry args={[1.2, 1.2, 0.03]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>

                {/* Cabinet Handles (Black) */}
                <mesh position={[-2.5, 0.75, -3.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.3, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
                <mesh position={[-1.2, 0.75, -3.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.3, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
                <mesh position={[0.1, 0.75, -3.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.3, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
                <mesh position={[1.4, 0.75, -3.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.3, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
                <mesh position={[2.7, 0.75, -3.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.3, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
                <mesh position={[4.0, 0.75, -3.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.3, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
            </group>

            {/* --- SIDE RUN: DEPTH = 6.5 (z from -4.5 to +2) --- */}
            {/* Center Z = -1.25, X = 4.25 */}
            <group>
                {/* Base Cabinet - FULL DEPTH */}
                <mesh position={[4.25, 0.75, -1.25]} castShadow receiveShadow>
                    <boxGeometry args={[1.5, 1.5, 6.5]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.5} />
                </mesh>

                {/* Black Marble Countertop - FULL DEPTH */}
                <mesh position={[4.25, 1.55, -1.25]} castShadow>
                    <boxGeometry args={[1.6, 0.1, 6.6]} />
                    <meshStandardMaterial color={countertopColor} metalness={0.4} roughness={0.15} />
                </mesh>

                {/* Cabinet Door Panels (4 doors across 6.5 depth) */}
                <mesh position={[3.48, 0.75, -3.5]}>
                    <boxGeometry args={[0.03, 1.2, 1.4]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>
                <mesh position={[3.48, 0.75, -2.0]}>
                    <boxGeometry args={[0.03, 1.2, 1.4]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>
                <mesh position={[3.48, 0.75, -0.5]}>
                    <boxGeometry args={[0.03, 1.2, 1.4]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>
                <mesh position={[3.48, 0.75, 1.0]}>
                    <boxGeometry args={[0.03, 1.2, 1.4]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>

                {/* Cabinet Handles (Black) */}
                <mesh position={[3.44, 0.75, -3.5]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.3, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
                <mesh position={[3.44, 0.75, -2.0]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.3, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
                <mesh position={[3.44, 0.75, -0.5]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.3, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
                <mesh position={[3.44, 0.75, 1.0]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.3, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
            </group>

            {/* --- CORNER UNION: Seam filler at intersection --- */}
            <mesh position={[4.25, 1.55, -4]} castShadow>
                <boxGeometry args={[1.6, 0.1, 1.6]} />
                <meshStandardMaterial color={countertopColor} metalness={0.4} roughness={0.15} />
            </mesh>


            {/* ============================================================ */}
            {/* === SINK with GOOSENECK FAUCET === */}
            {/* ============================================================ */}
            <group position={[0, 1.55, -4]}>
                {/* Basin Rim */}
                <mesh position={[0, 0.02, 0]} receiveShadow>
                    <boxGeometry args={[1.3, 0.08, 0.8]} />
                    <meshStandardMaterial color="#37474F" roughness={0.2} metalness={0.7} />
                </mesh>
                {/* Basin Inner */}
                <mesh position={[0, -0.03, 0]}>
                    <boxGeometry args={[1.1, 0.12, 0.6]} />
                    <meshStandardMaterial color="#1A1A1A" roughness={0.3} />
                </mesh>

                {/* Gooseneck Faucet */}
                <mesh position={[0, 0.08, -0.5]} castShadow>
                    <cylinderGeometry args={[0.12, 0.14, 0.08, 16]} />
                    <meshStandardMaterial color={accentColor} metalness={0.98} roughness={0.05} />
                </mesh>
                <mesh position={[0, 0.35, -0.5]} castShadow>
                    <cylinderGeometry args={[0.04, 0.05, 0.5, 16]} />
                    <meshStandardMaterial color={accentColor} metalness={0.98} roughness={0.05} />
                </mesh>
                <mesh position={[0, 0.55, -0.35]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <torusGeometry args={[0.15, 0.03, 12, 24, Math.PI / 2]} />
                    <meshStandardMaterial color={accentColor} metalness={0.98} roughness={0.05} />
                </mesh>
                <mesh position={[0, 0.55, -0.2]} rotation={[Math.PI / 6, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.025, 0.03, 0.25, 12]} />
                    <meshStandardMaterial color={accentColor} metalness={0.98} roughness={0.05} />
                </mesh>

                {/* Faucet Handles */}
                <mesh position={[-0.2, 0.15, -0.5]} castShadow>
                    <cylinderGeometry args={[0.04, 0.04, 0.1, 12]} />
                    <meshStandardMaterial color={accentColor} metalness={0.95} roughness={0.1} />
                </mesh>
                <mesh position={[0.2, 0.15, -0.5]} castShadow>
                    <cylinderGeometry args={[0.04, 0.04, 0.1, 12]} />
                    <meshStandardMaterial color={accentColor} metalness={0.95} roughness={0.1} />
                </mesh>
            </group>


            {/* ============================================================ */}
            {/* === UPPER CABINETS (Right Wall) === */}
            {/* ============================================================ */}
            <group position={[4.5, 5.5, -1]}>
                <mesh position={[0, 0, -2]} castShadow>
                    <boxGeometry args={[0.8, 1.8, 1.2]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>
                <mesh position={[0, 0, -0.7]} castShadow>
                    <boxGeometry args={[0.8, 1.8, 1.2]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>
                <mesh position={[0, 0, 0.6]} castShadow>
                    <boxGeometry args={[0.8, 1.8, 1.2]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>

                {/* Door Fronts */}
                <mesh position={[-0.42, 0, -2]}>
                    <boxGeometry args={[0.03, 1.6, 1.0]} />
                    <meshStandardMaterial color="#FAFAFA" roughness={0.3} />
                </mesh>
                <mesh position={[-0.42, 0, -0.7]}>
                    <boxGeometry args={[0.03, 1.6, 1.0]} />
                    <meshStandardMaterial color="#FAFAFA" roughness={0.3} />
                </mesh>
                <mesh position={[-0.42, 0, 0.6]}>
                    <boxGeometry args={[0.03, 1.6, 1.0]} />
                    <meshStandardMaterial color="#FAFAFA" roughness={0.3} />
                </mesh>

                {/* Handles (Black) */}
                <mesh position={[-0.46, 0, -1.65]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.25, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
                <mesh position={[-0.46, 0, -0.35]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.25, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
                <mesh position={[-0.46, 0, 0.95]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.25, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
            </group>


            {/* ============================================================ */}
            {/* === RUNNER RUG (Terracotta) === */}
            {/* ============================================================ */}
            <mesh position={[1, 0.02, -1.5]} receiveShadow>
                <boxGeometry args={[6, 0.05, 1.5]} />
                <meshStandardMaterial color={rugColor} roughness={0.9} />
            </mesh>
            <mesh position={[1, 0.025, -0.7]}>
                <boxGeometry args={[6.1, 0.03, 0.08]} />
                <meshStandardMaterial color="#BF360C" roughness={0.95} />
            </mesh>
            <mesh position={[1, 0.025, -2.3]}>
                <boxGeometry args={[6.1, 0.03, 0.08]} />
                <meshStandardMaterial color="#BF360C" roughness={0.95} />
            </mesh>


            {/* ============================================================ */}
            {/* === COUNTER CLUTTER === */}
            {/* ============================================================ */}

            {/* Microwave */}
            <group position={[3.5, 1.7, -3.5]}>
                <mesh position={[0, 0.25, 0]} castShadow>
                    <boxGeometry args={[0.9, 0.5, 0.6]} />
                    <meshStandardMaterial color="#2C2C2C" roughness={0.3} />
                </mesh>
                <mesh position={[-0.1, 0.25, 0.31]}>
                    <planeGeometry args={[0.4, 0.35]} />
                    <meshStandardMaterial color="#1A1A1A" />
                </mesh>
                <mesh position={[0.35, 0.25, 0.31]}>
                    <planeGeometry args={[0.15, 0.35]} />
                    <meshStandardMaterial color="#3A3A3A" />
                </mesh>
            </group>

            {/* Toaster */}
            <group position={[2.2, 1.7, -3.8]}>
                <mesh position={[0, 0.15, 0]} castShadow>
                    <boxGeometry args={[0.4, 0.3, 0.25]} />
                    <meshStandardMaterial color="#9E9E9E" metalness={0.6} roughness={0.3} />
                </mesh>
            </group>

            {/* Cutting Board */}
            <mesh position={[-1.5, 1.62, -3.5]} castShadow>
                <boxGeometry args={[0.6, 0.04, 0.4]} />
                <meshStandardMaterial color={woodColor} roughness={0.8} />
            </mesh>

            {/* Coffee Mug */}
            <group position={[4.25, 1.7, 0.5]}>
                <mesh position={[0, 0.1, 0]} castShadow>
                    <cylinderGeometry args={[0.08, 0.07, 0.2, 16]} />
                    <meshStandardMaterial color="#E3F2FD" roughness={0.3} />
                </mesh>
            </group>

            {/* Fruit Bowl */}
            <group position={[4.2, 1.7, 1.5]}>
                <mesh position={[0, 0.08, 0]} castShadow>
                    <cylinderGeometry args={[0.2, 0.15, 0.12, 16]} />
                    <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
                </mesh>
                <mesh position={[-0.05, 0.2, 0]} castShadow>
                    <sphereGeometry args={[0.08, 12, 12]} />
                    <meshStandardMaterial color="#E53935" roughness={0.6} />
                </mesh>
                <mesh position={[0.08, 0.18, 0.05]} castShadow>
                    <sphereGeometry args={[0.07, 12, 12]} />
                    <meshStandardMaterial color="#FF9800" roughness={0.7} />
                </mesh>
            </group>


            {/* ============================================================ */}
            {/* === PET FOOD BOWLS === */}
            {/* ============================================================ */}
            <group position={[-2, 0, 2]}>
                {/* Feeding Mat */}
                <mesh position={[0, 0.01, 0]} receiveShadow>
                    <boxGeometry args={[1.8, 0.02, 1]} />
                    <meshStandardMaterial color="#455A64" roughness={0.9} />
                </mesh>

                {/* Food Bowl */}
                <group position={[-0.45, 0, 0]}>
                    <mesh position={[0, 0.1, 0]} castShadow>
                        <cylinderGeometry args={[0.25, 0.2, 0.14, 20]} />
                        <meshStandardMaterial color={bowlColor} roughness={0.4} />
                    </mesh>
                    <mesh position={[0, 0.14, 0]}>
                        <sphereGeometry args={[0.15, 8, 8]} />
                        <meshStandardMaterial color={foodColor} roughness={0.9} />
                    </mesh>
                </group>

                {/* Water Bowl */}
                <group position={[0.45, 0, 0]}>
                    <mesh position={[0, 0.1, 0]} castShadow>
                        <cylinderGeometry args={[0.25, 0.2, 0.14, 20]} />
                        <meshStandardMaterial color={bowlColor} roughness={0.4} />
                    </mesh>
                    <mesh position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[0.18, 20]} />
                        <meshStandardMaterial color={waterColor} transparent opacity={0.9} />
                    </mesh>
                </group>
            </group>


            {/* === PLANT === */}
            <group position={[4.2, 0, 2.5]}>
                <mesh position={[0, 0.12, 0]} castShadow>
                    <cylinderGeometry args={[0.15, 0.12, 0.24]} />
                    <meshStandardMaterial color="#A1887F" />
                </mesh>
                <mesh position={[0, 0.35, 0]}>
                    <sphereGeometry args={[0.22]} />
                    <meshStandardMaterial color="#66BB6A" roughness={0.8} />
                </mesh>
            </group>
        </group>
    );
}
