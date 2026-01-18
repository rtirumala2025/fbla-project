/**
 * KitchenFurniture.tsx - GEOMETRY LOCKED
 * 
 * COORDINATE LOCKED DIMENSIONS:
 * 
 * BACK RUN (Base):
 *   Start X: -3.0 | End X: +5.0 | WIDTH: 8.0 units
 *   Center X: 1.0 (calculated: (-3 + 5) / 2 = 1)
 *   Z Position: -4.0 (against back wall)
 *   Depth: 1.5 units
 * 
 * SIDE RUN (Base) - EXTENDED:
 *   Start Z: -4.5 | End Z: +3.5 | DEPTH: 8.0 units
 *   Center Z: -0.5 (calculated: (-4.5 + 3.5) / 2 = -0.5)
 *   X Position: 4.2 (against right wall)
 *   Width: 1.6 units
 * 
 * UPPER CABINETS (L-Shaped):
 *   Height: Y = 6.0 (bottom at y=4.75)
 *   Depth: 1.0 units (shallower than base)
 *   Back Run: x=1, z=-3.8 | args=[8, 2.5, 1]
 *   Side Run: x=4.5, z=-0.5 | args=[1, 2.5, 8]
 * 
 * CORNER UNION: Overlap at x=4.25, z=-4.0
 */

import React, { useMemo } from 'react';

interface KitchenFurnitureProps {
    hasFood?: boolean;
    foodType?: string; // Type of food for dynamic colors
}

// Food color mapping for dynamic bowl appearance
const FOOD_COLORS: Record<string, string[]> = {
    // Fruits
    apple: ['#E53935', '#C62828', '#F44336', '#D32F2F', '#EF5350', '#B71C1C'],
    banana: ['#FDD835', '#FBC02D', '#F9A825', '#FFD600', '#FFEB3B', '#F57F17'],
    // Protein
    kibble: ['#8D6E63', '#6D4C41', '#795548', '#5D4037', '#A1887F', '#4E342E'],
    dog_food: ['#8D6E63', '#6D4C41', '#795548', '#5D4037', '#A1887F', '#4E342E'],
    meat: ['#D32F2F', '#C62828', '#B71C1C', '#8D6E63', '#E53935', '#5D4037'],
    steak: ['#C62828', '#8D6E63', '#D32F2F', '#6D4C41', '#B71C1C', '#795548'],
    chicken: ['#FFCC80', '#FFB74D', '#FFA726', '#FFE0B2', '#FB8C00', '#F57C00'],
    fish: ['#4DB6AC', '#26A69A', '#00897B', '#80CBC4', '#009688', '#00796B'],
    salmon: ['#FF8A65', '#FF7043', '#F4511E', '#FF5722', '#E64A19', '#FFAB91'],
    sushi: ['#FF7043', '#FFCC80', '#E0E0E0', '#26A69A', '#F4511E', '#4DB6AC'],
    // Treats
    bone: ['#EFEBE9', '#D7CCC8', '#BCAAA4', '#E0E0E0', '#BDBDBD', '#A1887F'],
    treat: ['#D7CCC8', '#BCAAA4', '#8D6E63', '#EFEBE9', '#A1887F', '#6D4C41'],
    cookie: ['#D7CCC8', '#A1887F', '#8D6E63', '#BCAAA4', '#6D4C41', '#5D4037'],
    // Vegetables
    carrot: ['#FF9800', '#F57C00', '#EF6C00', '#FFB74D', '#E65100', '#FFE0B2'],
    veggie: ['#66BB6A', '#43A047', '#2E7D32', '#81C784', '#388E3C', '#A5D6A7'],
    // Other
    water: ['#64B5F6', '#42A5F5', '#2196F3', '#90CAF9', '#1E88E5', '#BBDEFB'],
    pizza: ['#FFAB91', '#FF8A65', '#FDD835', '#D32F2F', '#FFB74D', '#8D6E63'],
    cheese: ['#FDD835', '#FBC02D', '#FFD54F', '#FFEB3B', '#F9A825', '#FFE082'],
    gourmet: ['#8D6E63', '#D32F2F', '#FFB74D', '#43A047', '#6D4C41', '#C62828'],
    wet: ['#8D6E63', '#A1887F', '#795548', '#6D4C41', '#BCAAA4', '#5D4037'],
};

export function KitchenFurniture({ hasFood = false, foodType = 'kibble' }: KitchenFurnitureProps) {
    // Colors
    const applianceColor = "#E0E0E0";
    const cabinetColor = "#ECEFF1";
    const countertopColor = "#1A1A1A"; // Black marble
    const accentColor = "#CFD8DC"; // Chrome
    const handleColor = "#212121"; // Black handles
    const woodColor = "#D7CCC8";

    // Get food colors based on type (with smart keyword matching)
    const foodColors = useMemo(() => {
        const typeLower = foodType.toLowerCase();
        // Direct match
        if (FOOD_COLORS[typeLower]) return FOOD_COLORS[typeLower];
        // Keyword matching
        for (const [key, colors] of Object.entries(FOOD_COLORS)) {
            if (typeLower.includes(key)) return colors;
        }
        // Default to kibble
        return FOOD_COLORS.kibble;
    }, [foodType]);

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

            {/* --- SIDE RUN: DEPTH = 8.0 (z from -4.5 to +3.5) --- */}
            {/* Center Z = -0.5, X = 4.2 */}
            <group>
                {/* Base Cabinet - EXTENDED FULL DEPTH */}
                <mesh position={[4.2, 0.75, -0.5]} castShadow receiveShadow>
                    <boxGeometry args={[1.6, 1.5, 8]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.5} />
                </mesh>

                {/* Black Marble Countertop - EXTENDED FULL DEPTH */}
                <mesh position={[4.2, 1.55, -0.5]} castShadow>
                    <boxGeometry args={[1.7, 0.1, 8.1]} />
                    <meshStandardMaterial color={countertopColor} metalness={0.4} roughness={0.15} />
                </mesh>

                {/* Cabinet Door Panels (6 doors across 8 units depth) */}
                <mesh position={[3.38, 0.75, -3.5]}>
                    <boxGeometry args={[0.03, 1.2, 1.2]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>
                <mesh position={[3.38, 0.75, -2.2]}>
                    <boxGeometry args={[0.03, 1.2, 1.2]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>
                <mesh position={[3.38, 0.75, -0.9]}>
                    <boxGeometry args={[0.03, 1.2, 1.2]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>
                <mesh position={[3.38, 0.75, 0.4]}>
                    <boxGeometry args={[0.03, 1.2, 1.2]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>
                <mesh position={[3.38, 0.75, 1.7]}>
                    <boxGeometry args={[0.03, 1.2, 1.2]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>
                <mesh position={[3.38, 0.75, 3.0]}>
                    <boxGeometry args={[0.03, 1.2, 1.2]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>

                {/* Cabinet Handles (Black) */}
                <mesh position={[3.34, 0.75, -3.5]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.3, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
                <mesh position={[3.34, 0.75, -2.2]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.3, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
                <mesh position={[3.34, 0.75, -0.9]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.3, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
                <mesh position={[3.34, 0.75, 0.4]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.3, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
                <mesh position={[3.34, 0.75, 1.7]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.3, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
                <mesh position={[3.34, 0.75, 3.0]} castShadow>
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
            {/* === UPPER CABINETS (L-Shaped System) === */}
            {/* Height: y=5.25 (bottom at y=5.5), Depth: 1.0 units */}
            {/* ============================================================ */}

            {/* --- UPPER BACK RUN: Spans from Fridge (-3) to Corner (+5) --- */}
            <group>
                {/* Main Cabinet Body */}
                <mesh position={[1, 5.25, -3.8]} castShadow receiveShadow>
                    <boxGeometry args={[8, 2.5, 1]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>

                {/* Door Fronts (6 doors across 8 units) */}
                <mesh position={[-2.5, 5.25, -3.28]}>
                    <boxGeometry args={[1.2, 2.2, 0.03]} />
                    <meshStandardMaterial color="#FAFAFA" roughness={0.3} />
                </mesh>
                <mesh position={[-1.2, 5.25, -3.28]}>
                    <boxGeometry args={[1.2, 2.2, 0.03]} />
                    <meshStandardMaterial color="#FAFAFA" roughness={0.3} />
                </mesh>
                <mesh position={[0.1, 5.25, -3.28]}>
                    <boxGeometry args={[1.2, 2.2, 0.03]} />
                    <meshStandardMaterial color="#FAFAFA" roughness={0.3} />
                </mesh>
                <mesh position={[1.4, 5.25, -3.28]}>
                    <boxGeometry args={[1.2, 2.2, 0.03]} />
                    <meshStandardMaterial color="#FAFAFA" roughness={0.3} />
                </mesh>
                <mesh position={[2.7, 5.25, -3.28]}>
                    <boxGeometry args={[1.2, 2.2, 0.03]} />
                    <meshStandardMaterial color="#FAFAFA" roughness={0.3} />
                </mesh>
                <mesh position={[4.0, 5.25, -3.28]}>
                    <boxGeometry args={[1.2, 2.2, 0.03]} />
                    <meshStandardMaterial color="#FAFAFA" roughness={0.3} />
                </mesh>

                {/* Segmentation Gaps (vertical dark lines between doors) */}
                <mesh position={[-1.85, 5.25, -3.27]}>
                    <boxGeometry args={[0.04, 2.3, 0.02]} />
                    <meshStandardMaterial color="#212121" />
                </mesh>
                <mesh position={[-0.55, 5.25, -3.27]}>
                    <boxGeometry args={[0.04, 2.3, 0.02]} />
                    <meshStandardMaterial color="#212121" />
                </mesh>
                <mesh position={[0.75, 5.25, -3.27]}>
                    <boxGeometry args={[0.04, 2.3, 0.02]} />
                    <meshStandardMaterial color="#212121" />
                </mesh>
                <mesh position={[2.05, 5.25, -3.27]}>
                    <boxGeometry args={[0.04, 2.3, 0.02]} />
                    <meshStandardMaterial color="#212121" />
                </mesh>
                <mesh position={[3.35, 5.25, -3.27]}>
                    <boxGeometry args={[0.04, 2.3, 0.02]} />
                    <meshStandardMaterial color="#212121" />
                </mesh>

                {/* Vertical Handles (Black) */}
                <mesh position={[-2.5, 5.25, -3.24]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.4, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
                <mesh position={[-1.2, 5.25, -3.24]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.4, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
                <mesh position={[0.1, 5.25, -3.24]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.4, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
                <mesh position={[1.4, 5.25, -3.24]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.4, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
                <mesh position={[2.7, 5.25, -3.24]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.4, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
                <mesh position={[4.0, 5.25, -3.24]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.4, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
            </group>

            {/* --- UPPER RIGHT RUN: Spans from Corner (-4.5) to Front (+3.5) --- */}
            <group>
                {/* Main Cabinet Body */}
                <mesh position={[4.5, 5.25, -0.5]} castShadow receiveShadow>
                    <boxGeometry args={[1, 2.5, 8]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.4} />
                </mesh>

                {/* Door Fronts (6 doors across 8 units) */}
                <mesh position={[3.98, 5.25, -3.5]}>
                    <boxGeometry args={[0.03, 2.2, 1.2]} />
                    <meshStandardMaterial color="#FAFAFA" roughness={0.3} />
                </mesh>
                <mesh position={[3.98, 5.25, -2.2]}>
                    <boxGeometry args={[0.03, 2.2, 1.2]} />
                    <meshStandardMaterial color="#FAFAFA" roughness={0.3} />
                </mesh>
                <mesh position={[3.98, 5.25, -0.9]}>
                    <boxGeometry args={[0.03, 2.2, 1.2]} />
                    <meshStandardMaterial color="#FAFAFA" roughness={0.3} />
                </mesh>
                <mesh position={[3.98, 5.25, 0.4]}>
                    <boxGeometry args={[0.03, 2.2, 1.2]} />
                    <meshStandardMaterial color="#FAFAFA" roughness={0.3} />
                </mesh>
                <mesh position={[3.98, 5.25, 1.7]}>
                    <boxGeometry args={[0.03, 2.2, 1.2]} />
                    <meshStandardMaterial color="#FAFAFA" roughness={0.3} />
                </mesh>
                <mesh position={[3.98, 5.25, 3.0]}>
                    <boxGeometry args={[0.03, 2.2, 1.2]} />
                    <meshStandardMaterial color="#FAFAFA" roughness={0.3} />
                </mesh>

                {/* Segmentation Gaps (horizontal dark lines between doors) */}
                <mesh position={[3.97, 5.25, -2.85]}>
                    <boxGeometry args={[0.02, 2.3, 0.04]} />
                    <meshStandardMaterial color="#212121" />
                </mesh>
                <mesh position={[3.97, 5.25, -1.55]}>
                    <boxGeometry args={[0.02, 2.3, 0.04]} />
                    <meshStandardMaterial color="#212121" />
                </mesh>
                <mesh position={[3.97, 5.25, -0.25]}>
                    <boxGeometry args={[0.02, 2.3, 0.04]} />
                    <meshStandardMaterial color="#212121" />
                </mesh>
                <mesh position={[3.97, 5.25, 1.05]}>
                    <boxGeometry args={[0.02, 2.3, 0.04]} />
                    <meshStandardMaterial color="#212121" />
                </mesh>
                <mesh position={[3.97, 5.25, 2.35]}>
                    <boxGeometry args={[0.02, 2.3, 0.04]} />
                    <meshStandardMaterial color="#212121" />
                </mesh>

                {/* Vertical Handles (Black) */}
                <mesh position={[3.94, 5.25, -3.5]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.4, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
                <mesh position={[3.94, 5.25, -2.2]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.4, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
                <mesh position={[3.94, 5.25, -0.9]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.4, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
                <mesh position={[3.94, 5.25, 0.4]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.4, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
                <mesh position={[3.94, 5.25, 1.7]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.4, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
                <mesh position={[3.94, 5.25, 3.0]} castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.4, 12]} />
                    <meshStandardMaterial color={handleColor} />
                </mesh>
            </group>

            {/* --- UPPER CORNER POST: Covers the seam where Back Run and Right Run meet --- */}
            <mesh position={[4.5, 5.25, -3.8]} castShadow receiveShadow>
                <boxGeometry args={[1.6, 2.5, 1.6]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
            </mesh>


            {/* ============================================================ */}
            {/* === STOVE (Slide-in Range) === */}
            {/* ============================================================ */}
            <group position={[-1, 0, -3.7]}>
                {/* Stove Body (Stainless Steel) */}
                <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
                    <boxGeometry args={[1.5, 1.6, 1.5]} />
                    <meshStandardMaterial color="#424242" metalness={0.6} roughness={0.3} />
                </mesh>

                {/* Oven Door */}
                <mesh position={[0, 0.6, 0.76]} castShadow>
                    <boxGeometry args={[1.4, 1.0, 0.05]} />
                    <meshStandardMaterial color="#212121" metalness={0.4} roughness={0.4} />
                </mesh>

                {/* Oven Door Handle */}
                <mesh position={[0, 1.0, 0.82]} castShadow>
                    <boxGeometry args={[1.0, 0.08, 0.08]} />
                    <meshStandardMaterial color="#CFD8DC" metalness={0.95} roughness={0.1} />
                </mesh>

                {/* Oven Window */}
                <mesh position={[0, 0.5, 0.77]}>
                    <boxGeometry args={[0.8, 0.6, 0.02]} />
                    <meshStandardMaterial color="#1A1A1A" roughness={0.1} />
                </mesh>

                {/* Cooktop Surface */}
                <mesh position={[0, 1.62, 0]} castShadow>
                    <boxGeometry args={[1.5, 0.05, 1.5]} />
                    <meshStandardMaterial color="#1A1A1A" roughness={0.2} />
                </mesh>

                {/* Burners (4 circles) */}
                {/* Front Left Burner */}
                <mesh position={[-0.4, 1.66, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.15, 0.22, 24]} />
                    <meshStandardMaterial color="#B71C1C" emissive="#FF5722" emissiveIntensity={0.3} />
                </mesh>
                <mesh position={[-0.4, 1.66, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.12, 24]} />
                    <meshStandardMaterial color="#2C2C2C" />
                </mesh>

                {/* Front Right Burner */}
                <mesh position={[0.4, 1.66, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.12, 0.18, 24]} />
                    <meshStandardMaterial color="#B71C1C" emissive="#FF5722" emissiveIntensity={0.3} />
                </mesh>
                <mesh position={[0.4, 1.66, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.1, 24]} />
                    <meshStandardMaterial color="#2C2C2C" />
                </mesh>

                {/* Back Left Burner */}
                <mesh position={[-0.4, 1.66, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.12, 0.18, 24]} />
                    <meshStandardMaterial color="#B71C1C" emissive="#FF5722" emissiveIntensity={0.3} />
                </mesh>
                <mesh position={[-0.4, 1.66, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.1, 24]} />
                    <meshStandardMaterial color="#2C2C2C" />
                </mesh>

                {/* Back Right Burner */}
                <mesh position={[0.4, 1.66, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.15, 0.22, 24]} />
                    <meshStandardMaterial color="#B71C1C" emissive="#FF5722" emissiveIntensity={0.3} />
                </mesh>
                <mesh position={[0.4, 1.66, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.12, 24]} />
                    <meshStandardMaterial color="#2C2C2C" />
                </mesh>

                {/* Control Knobs */}
                <mesh position={[-0.5, 1.55, 0.72]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
                    <meshStandardMaterial color="#212121" />
                </mesh>
                <mesh position={[-0.2, 1.55, 0.72]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
                    <meshStandardMaterial color="#212121" />
                </mesh>
                <mesh position={[0.2, 1.55, 0.72]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
                    <meshStandardMaterial color="#212121" />
                </mesh>
                <mesh position={[0.5, 1.55, 0.72]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
                    <meshStandardMaterial color="#212121" />
                </mesh>
            </group>


            {/* ============================================================ */}
            {/* === FOOD BOWL (Redesigned: Bigger, Open Top, No Handle) === */}
            {/* ============================================================ */}
            <group position={[0, 0, 2]}>
                {/* Bowl Outer Shell - Open cylinder (no top) */}
                <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[1.0, 0.8, 0.5, 32, 1, true]} />
                    <meshStandardMaterial color="#E8E8E8" roughness={0.3} side={2} />
                </mesh>
                {/* Bowl Bottom - Flat disc inside */}
                <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                    <circleGeometry args={[0.78, 32]} />
                    <meshStandardMaterial color="#F0F0F0" roughness={0.4} />
                </mesh>
                {/* Food Mound (conditionally rendered based on hasFood prop) */}
                {hasFood && (
                    <group position={[0, 0.1, 0]}>
                        {/* Dynamic Food Cluster - colors based on foodType */}
                        {[...Array(20)].map((_, i) => {
                            const angle = (i / 20) * Math.PI * 2 + Math.random() * 0.5;
                            const radius = Math.random() * 0.5 + 0.1;
                            const x = Math.cos(angle) * radius;
                            const z = Math.sin(angle) * radius;
                            const y = Math.random() * 0.15 + 0.05;
                            const size = 0.06 + Math.random() * 0.04;
                            const color = foodColors[i % foodColors.length];
                            return (
                                <mesh key={i} position={[x, y, z]} castShadow>
                                    <sphereGeometry args={[size, 8, 8]} />
                                    <meshStandardMaterial color={color} roughness={0.9} />
                                </mesh>
                            );
                        })}
                    </group>
                )}
            </group>

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
