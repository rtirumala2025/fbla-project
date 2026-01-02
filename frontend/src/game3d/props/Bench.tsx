import React, { useMemo } from 'react';
import { makeWoodTexture } from '../core/AssetLoader';

export function Bench({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
    const woodTex = useMemo(() => makeWoodTexture(), []);
    return (
        <group position={position} rotation={[0, rotation, 0]}>
            {/* Legs */}
            <mesh position={[-0.8, 0.2, 0.2]} castShadow>
                <boxGeometry args={[0.1, 0.4, 0.1]} />
                <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0.8, 0.2, 0.2]} castShadow>
                <boxGeometry args={[0.1, 0.4, 0.1]} />
                <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[-0.8, 0.2, -0.2]} castShadow>
                <boxGeometry args={[0.1, 0.4, 0.1]} />
                <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0.8, 0.2, -0.2]} castShadow>
                <boxGeometry args={[0.1, 0.4, 0.1]} />
                <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Seat */}
            <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
                <boxGeometry args={[2, 0.05, 0.6]} />
                <meshStandardMaterial map={woodTex} color="#a07e5e" roughness={0.6} />
            </mesh>

            {/* Backrest */}
            <mesh position={[0, 0.85, -0.28]} rotation={[0.2, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[2, 0.6, 0.05]} />
                <meshStandardMaterial map={woodTex} color="#a07e5e" roughness={0.6} />
            </mesh>
        </group>
    );
}
