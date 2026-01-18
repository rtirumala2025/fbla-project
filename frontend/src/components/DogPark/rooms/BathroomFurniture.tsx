/**
 * BathroomFurniture.tsx - Premium Bathroom Props
 * 
 * Features: Oval Soaking Tub, Vanity Station, Bath Mat, Towel Rack
 */

import React from 'react';

export function BathroomFurniture() {
    // Colors
    const tubColor = "#FFFFFF";
    const waterColor = "#4FC3F7";
    const chromeColor = "#C0C0C0";
    const cabinetColor = "#FFFFFF";
    const mirrorColor = "#E0F7FA";
    const matColor = "#F8BBD0";  // Soft pink rug

    return (
        <group>
            {/* ============================================================ */}
            {/* === HERO BATHTUB (Pushed to Back Wall) === */}
            {/* ============================================================ */}
            <group position={[0, 0, -4]}>
                {/* === TUB PLINTH (Chrome Base touching floor) === */}
                <mesh position={[0, 0.05, 0]} scale={[1, 1, 0.7]} castShadow receiveShadow>
                    <cylinderGeometry args={[2.2, 2.2, 0.1, 32]} />
                    <meshStandardMaterial color="#757575" roughness={0.3} metalness={0.6} />
                </mesh>

                {/* Outer Tub Shell - Flattened cylinder for oval shape */}
                <mesh position={[0, 0.7, 0]} scale={[1, 1, 0.7]} castShadow receiveShadow>
                    <cylinderGeometry args={[2, 1.8, 1.2, 32]} />
                    <meshStandardMaterial color={tubColor} roughness={0.15} metalness={0.05} />
                </mesh>

                {/* Inner Tub Cavity */}
                <mesh position={[0, 0.8, 0]} scale={[1, 1, 0.7]}>
                    <cylinderGeometry args={[1.7, 1.6, 0.9, 32]} />
                    <meshStandardMaterial color="#ECEFF1" roughness={0.2} />
                </mesh>

                {/* Water Surface */}
                <mesh position={[0, 0.75, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.7, 1]}>
                    <circleGeometry args={[1.6, 32]} />
                    <meshStandardMaterial
                        color={waterColor}
                        transparent
                        opacity={0.85}
                        roughness={0.05}
                        metalness={0.3}
                    />
                </mesh>

                {/* Tub Rim */}
                <mesh position={[0, 1.3, 0]} scale={[1, 1, 0.7]}>
                    <torusGeometry args={[1.85, 0.08, 16, 32]} />
                    <meshStandardMaterial color={tubColor} roughness={0.1} />
                </mesh>

                {/* === Tall Faucet Assembly === */}
                <group position={[0, 1.3, -1.2]}>
                    {/* Faucet Stem */}
                    <mesh castShadow>
                        <cylinderGeometry args={[0.06, 0.06, 0.8, 16]} />
                        <meshStandardMaterial color={chromeColor} roughness={0.05} metalness={0.95} />
                    </mesh>
                    {/* Curved Spout */}
                    <mesh position={[0, 0.3, 0.15]} rotation={[Math.PI / 3, 0, 0]} castShadow>
                        <cylinderGeometry args={[0.04, 0.04, 0.4, 12]} />
                        <meshStandardMaterial color={chromeColor} roughness={0.05} metalness={0.95} />
                    </mesh>
                    {/* Spout End */}
                    <mesh position={[0, 0.15, 0.32]} castShadow>
                        <sphereGeometry args={[0.05, 12, 12]} />
                        <meshStandardMaterial color={chromeColor} roughness={0.05} metalness={0.95} />
                    </mesh>
                    {/* Hot/Cold Handles */}
                    <mesh position={[-0.2, 0, 0]} castShadow>
                        <boxGeometry args={[0.1, 0.08, 0.08]} />
                        <meshStandardMaterial color="#EF5350" roughness={0.3} />
                    </mesh>
                    <mesh position={[0.2, 0, 0]} castShadow>
                        <boxGeometry args={[0.1, 0.08, 0.08]} />
                        <meshStandardMaterial color="#2196F3" roughness={0.3} />
                    </mesh>
                </group>

                {/* Soap Bubbles (Decorative) */}
                {[...Array(8)].map((_, i) => (
                    <mesh key={i} position={[
                        (Math.random() - 0.5) * 2.5,
                        0.7 + Math.random() * 0.15,
                        (Math.random() - 0.5) * 1.5
                    ]}>
                        <sphereGeometry args={[0.03 + Math.random() * 0.04, 8, 8]} />
                        <meshStandardMaterial
                            color="#FFFFFF"
                            transparent
                            opacity={0.5}
                            roughness={0.02}
                        />
                    </mesh>
                ))}
            </group>

            {/* ============================================================ */}
            {/* === VANITY STATION (Snapped to Left Wall) === */}
            {/* ============================================================ */}
            <group position={[-5.2, 0, -2]}>
                {/* === VANITY PEDESTAL (Floor-Standing Base) === */}
                <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
                    <boxGeometry args={[1.6, 1.6, 0.7]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.25} />
                </mesh>

                {/* Pedestal Kick Plate (Recessed) */}
                <mesh position={[0, 0.05, 0.05]} castShadow receiveShadow>
                    <boxGeometry args={[1.4, 0.1, 0.6]} />
                    <meshStandardMaterial color="#9E9E9E" roughness={0.4} />
                </mesh>

                {/* Counter Top Cabinet */}
                <mesh position={[0, 2, 0]} castShadow receiveShadow>
                    <boxGeometry args={[1.8, 0.8, 0.8]} />
                    <meshStandardMaterial color={cabinetColor} roughness={0.2} />
                </mesh>

                {/* Cabinet Drawer Lines */}
                <mesh position={[0, 2.15, 0.41]}>
                    <boxGeometry args={[1.6, 0.02, 0.01]} />
                    <meshStandardMaterial color="#BDBDBD" />
                </mesh>
                <mesh position={[0, 1.85, 0.41]}>
                    <boxGeometry args={[1.6, 0.02, 0.01]} />
                    <meshStandardMaterial color="#BDBDBD" />
                </mesh>

                {/* Sink Basin */}
                <mesh position={[0, 2.45, 0]} castShadow>
                    <cylinderGeometry args={[0.5, 0.45, 0.15, 24]} />
                    <meshStandardMaterial color="#FAFAFA" roughness={0.1} />
                </mesh>

                {/* Sink Water Spot */}
                <mesh position={[0, 2.38, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.35, 24]} />
                    <meshStandardMaterial color="#B3E5FC" transparent opacity={0.6} />
                </mesh>

                {/* Sink Faucet */}
                <mesh position={[0, 2.7, -0.25]} castShadow>
                    <cylinderGeometry args={[0.03, 0.03, 0.3, 12]} />
                    <meshStandardMaterial color={chromeColor} roughness={0.05} metalness={0.95} />
                </mesh>
                <mesh position={[0, 2.8, -0.1]} rotation={[Math.PI / 4, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
                    <meshStandardMaterial color={chromeColor} roughness={0.05} metalness={0.95} />
                </mesh>

                {/* Large Round Mirror (Mounted on Left Wall Surface) */}
                <group position={[0.5, 4.2, -0.1]} rotation={[0, 0, 0]}>
                    {/* Mirror Frame */}
                    <mesh>
                        <torusGeometry args={[0.9, 0.05, 16, 32]} />
                        <meshStandardMaterial color={chromeColor} roughness={0.1} metalness={0.8} />
                    </mesh>
                    {/* Mirror Glass */}
                    <mesh position={[0, 0, 0.02]}>
                        <circleGeometry args={[0.85, 32]} />
                        <meshStandardMaterial
                            color={mirrorColor}
                            roughness={0.02}
                            metalness={0.9}
                        />
                    </mesh>
                </group>

                {/* Toothbrush Cup */}
                <mesh position={[0.5, 2.55, 0.2]} castShadow>
                    <cylinderGeometry args={[0.06, 0.05, 0.15, 12]} />
                    <meshStandardMaterial color="#81D4FA" roughness={0.4} />
                </mesh>

                {/* Soap Dispenser */}
                <mesh position={[-0.5, 2.55, 0.2]} castShadow>
                    <boxGeometry args={[0.1, 0.15, 0.08]} />
                    <meshStandardMaterial color="#FFECB3" roughness={0.5} />
                </mesh>
            </group>

            {/* ============================================================ */}
            {/* === CIRCULAR BATH MAT === */}
            {/* ============================================================ */}
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <circleGeometry args={[1.5, 32]} />
                <meshStandardMaterial color={matColor} roughness={0.95} />
            </mesh>

            {/* ============================================================ */}
            {/* === TOWEL RACK (Snapped to Right Wall) === */}
            {/* ============================================================ */}
            <group position={[5.8, 2.5, -2]}>
                {/* Wall Mount Brackets */}
                <mesh position={[0, 0.4, 0]} castShadow>
                    <boxGeometry args={[0.08, 0.15, 0.15]} />
                    <meshStandardMaterial color={chromeColor} roughness={0.1} metalness={0.9} />
                </mesh>
                <mesh position={[0, -0.4, 0]} castShadow>
                    <boxGeometry args={[0.08, 0.15, 0.15]} />
                    <meshStandardMaterial color={chromeColor} roughness={0.1} metalness={0.9} />
                </mesh>
                {/* Rack Bar */}
                <mesh position={[-0.15, 0, 0]} castShadow rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.03, 0.03, 1.2, 12]} />
                    <meshStandardMaterial color={chromeColor} roughness={0.05} metalness={0.9} />
                </mesh>
                {/* Towel (Blue) */}
                <mesh position={[-0.3, 0, 0.02]} castShadow>
                    <boxGeometry args={[0.08, 0.8, 0.8]} />
                    <meshStandardMaterial color="#29B6F6" roughness={0.85} />
                </mesh>
            </group>

            {/* ============================================================ */}
            {/* === RUBBER DUCK (In Tub, adjusted for new tub position) === */}
            {/* ============================================================ */}
            <group position={[0.8, 0.85, -3.8]}>
                {/* Body */}
                <mesh castShadow>
                    <sphereGeometry args={[0.12, 16, 16]} />
                    <meshStandardMaterial color="#FFEB3B" roughness={0.4} />
                </mesh>
                {/* Head */}
                <mesh position={[0.08, 0.08, 0]} castShadow>
                    <sphereGeometry args={[0.08, 12, 12]} />
                    <meshStandardMaterial color="#FFEB3B" roughness={0.4} />
                </mesh>
                {/* Beak */}
                <mesh position={[0.15, 0.06, 0]} rotation={[0, 0, -0.3]} castShadow>
                    <coneGeometry args={[0.03, 0.06, 8]} />
                    <meshStandardMaterial color="#FF9800" roughness={0.5} />
                </mesh>
            </group>
        </group>
    );
}

export default BathroomFurniture;
