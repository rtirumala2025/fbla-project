/**
 * KitchenFurniture.tsx
 * 
 * Kitchen scene furniture: Fridge, Counter, and Pet Bowls.
 * Rendered conditionally when currentActivity === 'kitchen'
 */

import React from 'react';

export function KitchenFurniture() {
    // Colors
    const applianceColor = "#E0E0E0"; // Light grey for fridge/appliances
    const cabinetColor = "#ECEFF1"; // Off-white cabinets
    const countertopColor = "#37474F"; // Dark granite countertop
    const accentColor = "#D4AF37"; // Gold accents
    const bowlColor = "#1565C0"; // Blue pet bowl
    const waterColor = "#64B5F6"; // Light blue water
    const foodColor = "#8D6E63"; // Brown kibble

    return (
        <group>
            {/* --- KITCHEN FLOOR MAT (Anti-Fatigue Mat) --- */}
            <mesh position={[0, 0.015, 1]} receiveShadow>
                <boxGeometry args={[4, 0.02, 2.5]} />
                <meshStandardMaterial color="#455A64" roughness={1.0} />
            </mesh>

            {/* --- REFRIGERATOR (Back Left) --- */}
            <group position={[-4, 0, -2]}>
                {/* Main Body */}
                <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
                    <boxGeometry args={[2.2, 5, 1.8]} />
                    <meshStandardMaterial color={applianceColor} metalness={0.3} roughness={0.4} />
                </mesh>

                {/* Freezer Door (Top) */}
                <mesh position={[0, 4.2, 0.92]} castShadow>
                    <boxGeometry args={[2.1, 1.4, 0.05]} />
                    <meshStandardMaterial color={applianceColor} metalness={0.4} roughness={0.3} />
                </mesh>

                {/* Fridge Door (Bottom) */}
                <mesh position={[0, 2.0, 0.92]} castShadow>
                    <boxGeometry args={[2.1, 2.8, 0.05]} />
                    <meshStandardMaterial color={applianceColor} metalness={0.4} roughness={0.3} />
                </mesh>

                {/* Door Handles */}
                <mesh position={[0.85, 4.2, 1.0]} castShadow>
                    <boxGeometry args={[0.08, 0.8, 0.08]} />
                    <meshStandardMaterial color={accentColor} metalness={0.9} roughness={0.1} />
                </mesh>
                <mesh position={[0.85, 2.0, 1.0]} castShadow>
                    <boxGeometry args={[0.08, 1.2, 0.08]} />
                    <meshStandardMaterial color={accentColor} metalness={0.9} roughness={0.1} />
                </mesh>

                {/* Door Divider Line */}
                <mesh position={[0, 3.45, 0.95]}>
                    <boxGeometry args={[2.15, 0.05, 0.02]} />
                    <meshStandardMaterial color="#9E9E9E" />
                </mesh>
            </group>

            {/* --- KITCHEN COUNTER (L-Shape, Back Right) --- */}
            <group position={[3, 0, -2]}>
                {/* Base Cabinets */}
                <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
                    <boxGeometry args={[3, 1.8, 1.5]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.5} />
                </mesh>

                {/* Countertop */}
                <mesh position={[0, 1.85, 0]} castShadow>
                    <boxGeometry args={[3.2, 0.1, 1.7]} />
                    <meshStandardMaterial color={countertopColor} metalness={0.2} roughness={0.3} />
                </mesh>

                {/* Cabinet Doors (2 panels) */}
                <mesh position={[-0.55, 0.9, 0.77]}>
                    <boxGeometry args={[1.2, 1.5, 0.03]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>
                <mesh position={[0.55, 0.9, 0.77]}>
                    <boxGeometry args={[1.2, 1.5, 0.03]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>

                {/* Cabinet Handles */}
                <mesh position={[-0.1, 0.9, 0.82]} castShadow>
                    <boxGeometry args={[0.06, 0.4, 0.06]} />
                    <meshStandardMaterial color={accentColor} metalness={0.9} roughness={0.1} />
                </mesh>
                <mesh position={[1.0, 0.9, 0.82]} castShadow>
                    <boxGeometry args={[0.06, 0.4, 0.06]} />
                    <meshStandardMaterial color={accentColor} metalness={0.9} roughness={0.1} />
                </mesh>

                {/* Sink (Inset in Countertop) */}
                <mesh position={[0, 1.82, 0]} receiveShadow>
                    <boxGeometry args={[1.2, 0.2, 0.8]} />
                    <meshStandardMaterial color="#78909C" metalness={0.6} roughness={0.2} />
                </mesh>

                {/* Faucet */}
                <mesh position={[0, 2.1, -0.35]} castShadow>
                    <cylinderGeometry args={[0.04, 0.04, 0.4]} />
                    <meshStandardMaterial color="#9E9E9E" metalness={0.8} roughness={0.2} />
                </mesh>
                <mesh position={[0, 2.25, -0.15]} rotation={[Math.PI / 3, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.03, 0.03, 0.4]} />
                    <meshStandardMaterial color="#9E9E9E" metalness={0.8} roughness={0.2} />
                </mesh>
            </group>

            {/* --- PET FOOD BOWLS (Center Stage) --- */}
            <group position={[0, 0, 0.5]}>
                {/* Feeding Mat */}
                <mesh position={[0, 0.01, 0]} receiveShadow>
                    <boxGeometry args={[2, 0.02, 1.2]} />
                    <meshStandardMaterial color="#37474F" roughness={0.9} />
                </mesh>

                {/* Left Bowl - Food */}
                <group position={[-0.5, 0, 0]}>
                    {/* Bowl Outer */}
                    <mesh position={[0, 0.12, 0]} castShadow>
                        <cylinderGeometry args={[0.35, 0.28, 0.18, 24]} />
                        <meshStandardMaterial color={bowlColor} roughness={0.4} />
                    </mesh>
                    {/* Bowl Inner */}
                    <mesh position={[0, 0.15, 0]}>
                        <cylinderGeometry args={[0.28, 0.22, 0.12, 24]} />
                        <meshStandardMaterial color="#1976D2" roughness={0.3} />
                    </mesh>
                    {/* Kibble (Pile of spheres) */}
                    <mesh position={[0, 0.18, 0]}>
                        <sphereGeometry args={[0.22, 8, 8]} />
                        <meshStandardMaterial color={foodColor} roughness={0.9} />
                    </mesh>
                    <mesh position={[0.08, 0.22, 0.05]}>
                        <sphereGeometry args={[0.06, 6, 6]} />
                        <meshStandardMaterial color="#795548" roughness={0.9} />
                    </mesh>
                    <mesh position={[-0.06, 0.21, -0.04]}>
                        <sphereGeometry args={[0.05, 6, 6]} />
                        <meshStandardMaterial color="#6D4C41" roughness={0.9} />
                    </mesh>
                </group>

                {/* Right Bowl - Water */}
                <group position={[0.5, 0, 0]}>
                    {/* Bowl Outer */}
                    <mesh position={[0, 0.12, 0]} castShadow>
                        <cylinderGeometry args={[0.35, 0.28, 0.18, 24]} />
                        <meshStandardMaterial color={bowlColor} roughness={0.4} />
                    </mesh>
                    {/* Bowl Inner */}
                    <mesh position={[0, 0.15, 0]}>
                        <cylinderGeometry args={[0.28, 0.22, 0.12, 24]} />
                        <meshStandardMaterial color="#1976D2" roughness={0.3} />
                    </mesh>
                    {/* Water Surface */}
                    <mesh position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[0.26, 24]} />
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

            {/* --- DECORATIVE: Kitchen Window Plants --- */}
            <group position={[5, 0, -2]}>
                {/* Small Pot */}
                <mesh position={[0, 0.15, 0]} castShadow>
                    <cylinderGeometry args={[0.25, 0.2, 0.3]} />
                    <meshStandardMaterial color="#A1887F" />
                </mesh>
                {/* Herb (Small herb plant) */}
                <mesh position={[0, 0.5, 0]}>
                    <sphereGeometry args={[0.35]} />
                    <meshStandardMaterial color="#66BB6A" roughness={0.8} />
                </mesh>
            </group>
        </group>
    );
}
