/**
 * BathroomFurniture.tsx - Bathroom Props and Fixtures
 * 
 * A simple bathtub with water for the pet bathroom scene.
 */

import React from 'react';

export function BathroomFurniture() {
    // Colors
    const tubColor = "#FFFFFF";        // White porcelain
    const waterColor = "#4FC3F7";       // Light blue water
    const faucetColor = "#C0C0C0";      // Chrome

    return (
        <group>
            {/* ============================================================ */}
            {/* === BATHTUB (Center-Back of Room) === */}
            {/* ============================================================ */}
            <group position={[0, 0, -3]}>
                {/* Tub Outer Shell */}
                <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
                    <boxGeometry args={[2.5, 1, 1.5]} />
                    <meshStandardMaterial color={tubColor} roughness={0.15} metalness={0.1} />
                </mesh>

                {/* Tub Inner Cavity (darker indent) */}
                <mesh position={[0, 0.6, 0]}>
                    <boxGeometry args={[2.2, 0.7, 1.2]} />
                    <meshStandardMaterial color="#ECEFF1" roughness={0.2} />
                </mesh>

                {/* Water Surface (Blue Plane) */}
                <mesh position={[0, 0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[2.1, 1.1]} />
                    <meshStandardMaterial
                        color={waterColor}
                        transparent
                        opacity={0.8}
                        roughness={0.1}
                        metalness={0.2}
                    />
                </mesh>

                {/* Faucet Assembly */}
                <group position={[0, 1.1, -0.6]}>
                    {/* Main Faucet */}
                    <mesh castShadow>
                        <cylinderGeometry args={[0.08, 0.08, 0.4, 16]} />
                        <meshStandardMaterial color={faucetColor} roughness={0.1} metalness={0.8} />
                    </mesh>
                    {/* Spout */}
                    <mesh position={[0, 0, 0.2]} rotation={[Math.PI / 4, 0, 0]} castShadow>
                        <cylinderGeometry args={[0.04, 0.04, 0.25, 12]} />
                        <meshStandardMaterial color={faucetColor} roughness={0.1} metalness={0.8} />
                    </mesh>
                    {/* Handles */}
                    <mesh position={[-0.2, 0, 0]} castShadow>
                        <sphereGeometry args={[0.06, 12, 12]} />
                        <meshStandardMaterial color={faucetColor} roughness={0.1} metalness={0.8} />
                    </mesh>
                    <mesh position={[0.2, 0, 0]} castShadow>
                        <sphereGeometry args={[0.06, 12, 12]} />
                        <meshStandardMaterial color={faucetColor} roughness={0.1} metalness={0.8} />
                    </mesh>
                </group>
            </group>

            {/* ============================================================ */}
            {/* === FLOOR MAT (in front of tub) === */}
            {/* ============================================================ */}
            <mesh position={[0, 0.02, -1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[1.5, 1]} />
                <meshStandardMaterial color="#81D4FA" roughness={0.9} />
            </mesh>

            {/* ============================================================ */}
            {/* === TOWEL RACK (Right Wall) === */}
            {/* ============================================================ */}
            <group position={[4.5, 1.5, 0]}>
                {/* Rack Bar */}
                <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.03, 0.03, 1.5, 12]} />
                    <meshStandardMaterial color={faucetColor} roughness={0.1} metalness={0.8} />
                </mesh>
                {/* Towel (Blue) */}
                <mesh position={[0, -0.2, 0.02]} castShadow>
                    <boxGeometry args={[0.05, 0.6, 1]} />
                    <meshStandardMaterial color="#29B6F6" roughness={0.8} />
                </mesh>
            </group>

            {/* ============================================================ */}
            {/* === SOAP BUBBLES (Decorative) === */}
            {/* ============================================================ */}
            <group position={[0.5, 0.7, -3]}>
                {[...Array(5)].map((_, i) => (
                    <mesh key={i} position={[
                        Math.random() * 0.8 - 0.4,
                        Math.random() * 0.2,
                        Math.random() * 0.5 - 0.25
                    ]}>
                        <sphereGeometry args={[0.05 + Math.random() * 0.03, 8, 8]} />
                        <meshStandardMaterial
                            color="#FFFFFF"
                            transparent
                            opacity={0.6}
                            roughness={0.05}
                        />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

export default BathroomFurniture;
