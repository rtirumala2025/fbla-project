import React from 'react';

export function LampPost({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <mesh position={[0, 2, 0]} castShadow>
                <cylinderGeometry args={[0.08, 0.12, 4, 8]} />
                <meshStandardMaterial color="#222" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0, 4.2, 0]}>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial color="#fffdba" emissive="#fffdba" emissiveIntensity={2} toneMapped={false} />
            </mesh>
            <pointLight position={[0, 4.2, 0]} intensity={1.5} distance={10} color="#fffdba" castShadow />
        </group>
    );
}
