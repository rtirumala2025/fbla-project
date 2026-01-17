/**
 * KitchenFurniture.tsx
 * 
 * Kitchen scene furniture snapped to new wall depth (z=-4.5).
 * - Fridge: Back left against wall
 * - Counter/Sink: Back right under window
 * - Pet Bowls: Center foreground
 */

import React from 'react';

export function KitchenFurniture() {
    // Colors
    const applianceColor = "#E0E0E0"; // Light grey for fridge
    const cabinetColor = "#ECEFF1"; // Off-white cabinets
    const countertopColor = "#37474F"; // Dark granite
    const accentColor = "#B0BEC5"; // Silver/Chrome
    const bowlColor = "#1565C0"; // Blue pet bowl
    const waterColor = "#64B5F6"; // Light blue water
    const foodColor = "#8D6E63"; // Brown kibble

    return (
        <group>
            {/* === REFRIGERATOR (Back Left, Against Wall) === */}
            <group position={[-5, 0, -4]}>
                {/* Main Body (Slightly darker base) */}
                <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
                    <boxGeometry args={[1.8, 5, 1.2]} />
                    <meshStandardMaterial color="#BDBDBD" metalness={0.2} roughness={0.5} />
                </mesh>

                {/* Freezer Door (Top - Lighter panel) */}
                <mesh position={[0, 4.3, 0.62]} castShadow>
                    <boxGeometry args={[1.65, 1.3, 0.06]} />
                    <meshStandardMaterial color={applianceColor} metalness={0.4} roughness={0.3} />
                </mesh>

                {/* Fridge Door (Bottom - Lighter panel) */}
                <mesh position={[0, 2.0, 0.62]} castShadow>
                    <boxGeometry args={[1.65, 2.6, 0.06]} />
                    <meshStandardMaterial color={applianceColor} metalness={0.4} roughness={0.3} />
                </mesh>

                {/* === DOOR GAP (Dark horizontal line at y=3.5) === */}
                <mesh position={[0, 3.5, 0.59]}>
                    <boxGeometry args={[1.75, 0.12, 0.02]} />
                    <meshStandardMaterial color="#424242" />
                </mesh>

                {/* === HANDLES (Vertical Cylinders - Silver) === */}
                {/* Freezer Handle */}
                <mesh position={[0.7, 4.3, 0.72]} rotation={[0, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.04, 0.04, 0.8, 12]} />
                    <meshStandardMaterial color={accentColor} metalness={0.9} roughness={0.15} />
                </mesh>
                {/* Fridge Handle */}
                <mesh position={[0.7, 2.0, 0.72]} rotation={[0, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.04, 0.04, 1.4, 12]} />
                    <meshStandardMaterial color={accentColor} metalness={0.9} roughness={0.15} />
                </mesh>

                {/* Handle Mounting Brackets */}
                <mesh position={[0.7, 4.7, 0.68]} castShadow>
                    <boxGeometry args={[0.1, 0.06, 0.1]} />
                    <meshStandardMaterial color={accentColor} metalness={0.8} roughness={0.2} />
                </mesh>
                <mesh position={[0.7, 3.9, 0.68]} castShadow>
                    <boxGeometry args={[0.1, 0.06, 0.1]} />
                    <meshStandardMaterial color={accentColor} metalness={0.8} roughness={0.2} />
                </mesh>
                <mesh position={[0.7, 2.7, 0.68]} castShadow>
                    <boxGeometry args={[0.1, 0.06, 0.1]} />
                    <meshStandardMaterial color={accentColor} metalness={0.8} roughness={0.2} />
                </mesh>
                <mesh position={[0.7, 1.3, 0.68]} castShadow>
                    <boxGeometry args={[0.1, 0.06, 0.1]} />
                    <meshStandardMaterial color={accentColor} metalness={0.8} roughness={0.2} />
                </mesh>
            </group>

            {/* === SINK COUNTER (Back Right, Under Window) === */}
            <group position={[2, 0, -4]}>
                {/* Base Cabinets */}
                <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
                    <boxGeometry args={[3.5, 1.5, 1.2]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.5} />
                </mesh>

                {/* Countertop */}
                <mesh position={[0, 1.55, 0]} castShadow>
                    <boxGeometry args={[3.7, 0.1, 1.4]} />
                    <meshStandardMaterial color={countertopColor} metalness={0.2} roughness={0.3} />
                </mesh>

                {/* Cabinet Doors (2 panels) */}
                <mesh position={[-0.6, 0.75, 0.62]}>
                    <boxGeometry args={[1.0, 1.2, 0.03]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>
                <mesh position={[0.6, 0.75, 0.62]}>
                    <boxGeometry args={[1.0, 1.2, 0.03]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>

                {/* Cabinet Handles (Silver) */}
                <mesh position={[-0.15, 0.75, 0.66]} castShadow>
                    <boxGeometry args={[0.04, 0.3, 0.04]} />
                    <meshStandardMaterial color={accentColor} metalness={0.8} roughness={0.2} />
                </mesh>
                <mesh position={[1.05, 0.75, 0.66]} castShadow>
                    <boxGeometry args={[0.04, 0.3, 0.04]} />
                    <meshStandardMaterial color={accentColor} metalness={0.8} roughness={0.2} />
                </mesh>

                {/* === UPDATED SINK DETAIL (User Requested) === */}
                {/* 1. The Basin: Thin Black Box on top of counter */}
                <mesh position={[0, 1.61, 0]} receiveShadow>
                    <boxGeometry args={[1.4, 0.1, 0.8]} />
                    <meshStandardMaterial color="#212121" roughness={0.2} metalness={0.5} />
                </mesh>

                {/* 2. Faucet (Cylinder) */}
                <mesh position={[0, 1.7, -0.35]} castShadow>
                    <cylinderGeometry args={[0.05, 0.07, 0.2]} />
                    <meshStandardMaterial color={accentColor} metalness={0.9} roughness={0.2} />
                </mesh>
                {/* Spout */}
                <mesh position={[0, 1.9, -0.2]} rotation={[Math.PI / 3, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.03, 0.03, 0.4]} />
                    <meshStandardMaterial color={accentColor} metalness={0.9} roughness={0.2} />
                </mesh>
            </group>

            {/* === PET FOOD BOWLS (Center Foreground) === */}
            <group position={[0, 0, 0.5]}>
                {/* Feeding Mat */}
                <mesh position={[0, 0.01, 0]} receiveShadow>
                    <boxGeometry args={[2, 0.02, 1.2]} />
                    <meshStandardMaterial color="#455A64" roughness={0.9} />
                </mesh>

                {/* Left Bowl - Food */}
                <group position={[-0.5, 0, 0]}>
                    <mesh position={[0, 0.12, 0]} castShadow>
                        <cylinderGeometry args={[0.3, 0.24, 0.16, 20]} />
                        <meshStandardMaterial color={bowlColor} roughness={0.4} />
                    </mesh>
                    <mesh position={[0, 0.14, 0]}>
                        <cylinderGeometry args={[0.24, 0.2, 0.1, 20]} />
                        <meshStandardMaterial color="#1976D2" roughness={0.3} />
                    </mesh>
                    {/* Kibble */}
                    <mesh position={[0, 0.16, 0]}>
                        <sphereGeometry args={[0.18, 8, 8]} />
                        <meshStandardMaterial color={foodColor} roughness={0.9} />
                    </mesh>
                </group>

                {/* Right Bowl - Water */}
                <group position={[0.5, 0, 0]}>
                    <mesh position={[0, 0.12, 0]} castShadow>
                        <cylinderGeometry args={[0.3, 0.24, 0.16, 20]} />
                        <meshStandardMaterial color={bowlColor} roughness={0.4} />
                    </mesh>
                    <mesh position={[0, 0.14, 0]}>
                        <cylinderGeometry args={[0.24, 0.2, 0.1, 20]} />
                        <meshStandardMaterial color="#1976D2" roughness={0.3} />
                    </mesh>
                    {/* Water Surface */}
                    <mesh position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[0.22, 20]} />
                        <meshStandardMaterial
                            color={waterColor}
                            metalness={0.1}
                            roughness={0.1}
                            transparent
                            opacity={0.9}
                        />
                    </mesh>
                </group>
            </group>

            {/* === SMALL DECORATIVE PLANT (Corner) === */}
            <group position={[6, 0, -3]}>
                <mesh position={[0, 0.15, 0]} castShadow>
                    <cylinderGeometry args={[0.2, 0.15, 0.3]} />
                    <meshStandardMaterial color="#A1887F" />
                </mesh>
                <mesh position={[0, 0.45, 0]}>
                    <sphereGeometry args={[0.28]} />
                    <meshStandardMaterial color="#66BB6A" roughness={0.8} />
                </mesh>
            </group>
        </group>
    );
}
