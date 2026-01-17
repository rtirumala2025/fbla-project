/**
 * KitchenFurniture.tsx
 * 
 * L-Shaped Kitchen Layout with Continuous Countertop
 * - Fridge: Left corner (x=-4)
 * - L-Counter: Back wall + Right wall return
 * - Upper Cabinets: Above counter on right wall
 * - Counter Clutter: Microwave, Toaster, Cutting Board
 * - Pet Bowls: Center foreground
 */

import React from 'react';

export function KitchenFurniture() {
    // Colors
    const applianceColor = "#E0E0E0"; // Light grey for fridge
    const cabinetColor = "#ECEFF1"; // Off-white cabinets
    const countertopColor = "#1A1A1A"; // Black marble
    const accentColor = "#B0BEC5"; // Silver/Chrome
    const bowlColor = "#1565C0"; // Blue pet bowl
    const waterColor = "#64B5F6"; // Light blue water
    const foodColor = "#8D6E63"; // Brown kibble
    const woodColor = "#D7CCC8"; // Cutting board

    return (
        <group>
            {/* === REFRIGERATOR (Left Corner, Tucked In) === */}
            <group position={[-4, 0, -3.5]}>
                {/* Main Body */}
                <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
                    <boxGeometry args={[1.6, 5, 1]} />
                    <meshStandardMaterial color="#BDBDBD" metalness={0.2} roughness={0.5} />
                </mesh>

                {/* Freezer Door (Top) */}
                <mesh position={[0, 4.3, 0.52]} castShadow>
                    <boxGeometry args={[1.5, 1.3, 0.05]} />
                    <meshStandardMaterial color={applianceColor} metalness={0.4} roughness={0.3} />
                </mesh>

                {/* Fridge Door (Bottom) */}
                <mesh position={[0, 2.0, 0.52]} castShadow>
                    <boxGeometry args={[1.5, 2.6, 0.05]} />
                    <meshStandardMaterial color={applianceColor} metalness={0.4} roughness={0.3} />
                </mesh>

                {/* Door Gap Line */}
                <mesh position={[0, 3.5, 0.5]}>
                    <boxGeometry args={[1.55, 0.1, 0.02]} />
                    <meshStandardMaterial color="#424242" />
                </mesh>

                {/* Handles */}
                <mesh position={[0.6, 4.3, 0.6]} castShadow>
                    <cylinderGeometry args={[0.03, 0.03, 0.7, 12]} />
                    <meshStandardMaterial color={accentColor} metalness={0.9} roughness={0.15} />
                </mesh>
                <mesh position={[0.6, 2.0, 0.6]} castShadow>
                    <cylinderGeometry args={[0.03, 0.03, 1.2, 12]} />
                    <meshStandardMaterial color={accentColor} metalness={0.9} roughness={0.15} />
                </mesh>
            </group>


            {/* === L-SHAPED COUNTER SYSTEM === */}
            <group>
                {/* --- Segment A: Back Run (Along Back Wall, to right of window) --- */}
                <group position={[1, 0, -4]}>
                    {/* Base Cabinet */}
                    <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
                        <boxGeometry args={[6, 1.5, 1.5]} />
                        <meshStandardMaterial color={cabinetColor} roughness={0.5} />
                    </mesh>

                    {/* Cabinet Door Panels */}
                    <mesh position={[-2, 0.75, 0.77]}>
                        <boxGeometry args={[1.4, 1.2, 0.03]} />
                        <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                    </mesh>
                    <mesh position={[-0.5, 0.75, 0.77]}>
                        <boxGeometry args={[1.4, 1.2, 0.03]} />
                        <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                    </mesh>
                    <mesh position={[1, 0.75, 0.77]}>
                        <boxGeometry args={[1.4, 1.2, 0.03]} />
                        <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                    </mesh>
                    <mesh position={[2.5, 0.75, 0.77]}>
                        <boxGeometry args={[1.0, 1.2, 0.03]} />
                        <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                    </mesh>

                    {/* Cabinet Handles */}
                    <mesh position={[-1.25, 0.75, 0.8]} castShadow>
                        <boxGeometry args={[0.04, 0.25, 0.04]} />
                        <meshStandardMaterial color={accentColor} metalness={0.8} roughness={0.2} />
                    </mesh>
                    <mesh position={[0.25, 0.75, 0.8]} castShadow>
                        <boxGeometry args={[0.04, 0.25, 0.04]} />
                        <meshStandardMaterial color={accentColor} metalness={0.8} roughness={0.2} />
                    </mesh>
                    <mesh position={[1.75, 0.75, 0.8]} castShadow>
                        <boxGeometry args={[0.04, 0.25, 0.04]} />
                        <meshStandardMaterial color={accentColor} metalness={0.8} roughness={0.2} />
                    </mesh>
                </group>

                {/* --- Segment B: Right Return (Along Right Wall) --- */}
                <group position={[4.25, 0, -2]}>
                    {/* Base Cabinet */}
                    <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
                        <boxGeometry args={[1.5, 1.5, 4]} />
                        <meshStandardMaterial color={cabinetColor} roughness={0.5} />
                    </mesh>

                    {/* Cabinet Door Panels (facing into room) */}
                    <mesh position={[-0.77, 0.75, -1]}>
                        <boxGeometry args={[0.03, 1.2, 1.4]} />
                        <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                    </mesh>
                    <mesh position={[-0.77, 0.75, 0.5]}>
                        <boxGeometry args={[0.03, 1.2, 1.4]} />
                        <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                    </mesh>

                    {/* Cabinet Handles */}
                    <mesh position={[-0.8, 0.75, -0.25]} castShadow>
                        <boxGeometry args={[0.04, 0.25, 0.04]} />
                        <meshStandardMaterial color={accentColor} metalness={0.8} roughness={0.2} />
                    </mesh>
                    <mesh position={[-0.8, 0.75, 1.25]} castShadow>
                        <boxGeometry args={[0.04, 0.25, 0.04]} />
                        <meshStandardMaterial color={accentColor} metalness={0.8} roughness={0.2} />
                    </mesh>
                </group>

                {/* --- Unified Black Marble Countertop --- */}
                {/* Back Run Countertop */}
                <mesh position={[1, 1.55, -4]} castShadow>
                    <boxGeometry args={[6.2, 0.1, 1.7]} />
                    <meshStandardMaterial color={countertopColor} metalness={0.3} roughness={0.2} />
                </mesh>
                {/* Right Return Countertop */}
                <mesh position={[4.25, 1.55, -2]} castShadow>
                    <boxGeometry args={[1.7, 0.1, 4.2]} />
                    <meshStandardMaterial color={countertopColor} metalness={0.3} roughness={0.2} />
                </mesh>
                {/* Corner Fill Piece */}
                <mesh position={[3.4, 1.55, -3.25]} castShadow>
                    <boxGeometry args={[0.5, 0.1, 0.5]} />
                    <meshStandardMaterial color={countertopColor} metalness={0.3} roughness={0.2} />
                </mesh>
            </group>


            {/* === SINK (Cut into countertop at window position) === */}
            <group position={[0, 1.55, -4]}>
                {/* Sink Basin (Recessed) */}
                <mesh position={[0, 0.02, 0]} receiveShadow>
                    <boxGeometry args={[1.2, 0.08, 0.7]} />
                    <meshStandardMaterial color="#37474F" roughness={0.2} metalness={0.6} />
                </mesh>
                {/* Basin Inner (Dark) */}
                <mesh position={[0, -0.02, 0]}>
                    <boxGeometry args={[1.0, 0.08, 0.5]} />
                    <meshStandardMaterial color="#212121" roughness={0.3} />
                </mesh>

                {/* Faucet Base */}
                <mesh position={[0, 0.15, -0.45]} castShadow>
                    <cylinderGeometry args={[0.06, 0.08, 0.2]} />
                    <meshStandardMaterial color={accentColor} metalness={0.95} roughness={0.1} />
                </mesh>
                {/* Faucet Neck */}
                <mesh position={[0, 0.35, -0.45]} castShadow>
                    <cylinderGeometry args={[0.03, 0.04, 0.4]} />
                    <meshStandardMaterial color={accentColor} metalness={0.95} roughness={0.1} />
                </mesh>
                {/* Faucet Spout */}
                <mesh position={[0, 0.5, -0.25]} rotation={[Math.PI / 3, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.4]} />
                    <meshStandardMaterial color={accentColor} metalness={0.95} roughness={0.1} />
                </mesh>
                {/* Faucet Handles */}
                <mesh position={[-0.15, 0.2, -0.45]} castShadow>
                    <cylinderGeometry args={[0.03, 0.03, 0.08]} />
                    <meshStandardMaterial color={accentColor} metalness={0.9} roughness={0.15} />
                </mesh>
                <mesh position={[0.15, 0.2, -0.45]} castShadow>
                    <cylinderGeometry args={[0.03, 0.03, 0.08]} />
                    <meshStandardMaterial color={accentColor} metalness={0.9} roughness={0.15} />
                </mesh>
            </group>


            {/* === UPPER CABINETS (Right Wall, Above Counter) === */}
            <group position={[4.5, 5.5, -2]}>
                {/* Cabinet Box Row */}
                <mesh position={[0, 0, -1]} castShadow receiveShadow>
                    <boxGeometry args={[0.8, 1.8, 1.2]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>
                <mesh position={[0, 0, 0.5]} castShadow receiveShadow>
                    <boxGeometry args={[0.8, 1.8, 1.2]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>

                {/* Cabinet Door Fronts */}
                <mesh position={[-0.42, 0, -1]}>
                    <boxGeometry args={[0.03, 1.6, 1.0]} />
                    <meshStandardMaterial color="#FAFAFA" roughness={0.3} />
                </mesh>
                <mesh position={[-0.42, 0, 0.5]}>
                    <boxGeometry args={[0.03, 1.6, 1.0]} />
                    <meshStandardMaterial color="#FAFAFA" roughness={0.3} />
                </mesh>

                {/* Cabinet Handles */}
                <mesh position={[-0.45, 0, -0.65]} castShadow>
                    <boxGeometry args={[0.04, 0.2, 0.04]} />
                    <meshStandardMaterial color={accentColor} metalness={0.8} roughness={0.2} />
                </mesh>
                <mesh position={[-0.45, 0, 0.85]} castShadow>
                    <boxGeometry args={[0.04, 0.2, 0.04]} />
                    <meshStandardMaterial color={accentColor} metalness={0.8} roughness={0.2} />
                </mesh>
            </group>


            {/* === COUNTER CLUTTER (Lived-In Look) === */}

            {/* Microwave (Corner of L) */}
            <group position={[3.5, 1.7, -3.5]}>
                {/* Body */}
                <mesh position={[0, 0.25, 0]} castShadow>
                    <boxGeometry args={[0.9, 0.5, 0.6]} />
                    <meshStandardMaterial color="#2C2C2C" roughness={0.3} />
                </mesh>
                {/* Window */}
                <mesh position={[-0.1, 0.25, 0.31]}>
                    <planeGeometry args={[0.4, 0.35]} />
                    <meshStandardMaterial color="#1A1A1A" metalness={0.1} roughness={0.2} />
                </mesh>
                {/* Control Panel */}
                <mesh position={[0.35, 0.25, 0.31]}>
                    <planeGeometry args={[0.15, 0.35]} />
                    <meshStandardMaterial color="#3A3A3A" />
                </mesh>
                {/* Handle */}
                <mesh position={[0.15, 0.25, 0.32]} castShadow>
                    <boxGeometry args={[0.04, 0.25, 0.04]} />
                    <meshStandardMaterial color={accentColor} metalness={0.8} roughness={0.2} />
                </mesh>
            </group>

            {/* Toaster */}
            <group position={[2.5, 1.7, -3.8]}>
                <mesh position={[0, 0.15, 0]} castShadow>
                    <boxGeometry args={[0.4, 0.3, 0.25]} />
                    <meshStandardMaterial color="#9E9E9E" metalness={0.6} roughness={0.3} />
                </mesh>
                {/* Slots */}
                <mesh position={[-0.08, 0.32, 0]}>
                    <boxGeometry args={[0.1, 0.02, 0.15]} />
                    <meshStandardMaterial color="#424242" />
                </mesh>
                <mesh position={[0.08, 0.32, 0]}>
                    <boxGeometry args={[0.1, 0.02, 0.15]} />
                    <meshStandardMaterial color="#424242" />
                </mesh>
                {/* Lever */}
                <mesh position={[0.22, 0.2, 0]} castShadow>
                    <boxGeometry args={[0.04, 0.1, 0.08]} />
                    <meshStandardMaterial color="#616161" />
                </mesh>
            </group>

            {/* Cutting Board */}
            <group position={[1.8, 1.62, -3.5]}>
                <mesh position={[0, 0, 0]} castShadow>
                    <boxGeometry args={[0.6, 0.04, 0.4]} />
                    <meshStandardMaterial color={woodColor} roughness={0.8} />
                </mesh>
            </group>

            {/* Coffee Mug */}
            <group position={[4.25, 1.7, -0.5]}>
                <mesh position={[0, 0.1, 0]} castShadow>
                    <cylinderGeometry args={[0.08, 0.07, 0.2, 16]} />
                    <meshStandardMaterial color="#E3F2FD" roughness={0.3} />
                </mesh>
                {/* Handle */}
                <mesh position={[0.12, 0.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                    <torusGeometry args={[0.05, 0.015, 8, 16, Math.PI]} />
                    <meshStandardMaterial color="#E3F2FD" roughness={0.3} />
                </mesh>
            </group>


            {/* === PET FOOD BOWLS (Center Foreground) === */}
            <group position={[0, 0, 1]}>
                {/* Feeding Mat */}
                <mesh position={[0, 0.01, 0]} receiveShadow>
                    <boxGeometry args={[1.8, 0.02, 1]} />
                    <meshStandardMaterial color="#455A64" roughness={0.9} />
                </mesh>

                {/* Left Bowl - Food */}
                <group position={[-0.45, 0, 0]}>
                    <mesh position={[0, 0.1, 0]} castShadow>
                        <cylinderGeometry args={[0.25, 0.2, 0.14, 20]} />
                        <meshStandardMaterial color={bowlColor} roughness={0.4} />
                    </mesh>
                    <mesh position={[0, 0.12, 0]}>
                        <cylinderGeometry args={[0.2, 0.16, 0.08, 20]} />
                        <meshStandardMaterial color="#1976D2" roughness={0.3} />
                    </mesh>
                    {/* Kibble */}
                    <mesh position={[0, 0.14, 0]}>
                        <sphereGeometry args={[0.15, 8, 8]} />
                        <meshStandardMaterial color={foodColor} roughness={0.9} />
                    </mesh>
                </group>

                {/* Right Bowl - Water */}
                <group position={[0.45, 0, 0]}>
                    <mesh position={[0, 0.1, 0]} castShadow>
                        <cylinderGeometry args={[0.25, 0.2, 0.14, 20]} />
                        <meshStandardMaterial color={bowlColor} roughness={0.4} />
                    </mesh>
                    <mesh position={[0, 0.12, 0]}>
                        <cylinderGeometry args={[0.2, 0.16, 0.08, 20]} />
                        <meshStandardMaterial color="#1976D2" roughness={0.3} />
                    </mesh>
                    {/* Water Surface */}
                    <mesh position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[0.18, 20]} />
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


            {/* === SMALL DECORATIVE PLANT (Near Right Wall) === */}
            <group position={[4.2, 0, 0.5]}>
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
