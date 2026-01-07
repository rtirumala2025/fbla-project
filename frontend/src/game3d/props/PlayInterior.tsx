import React from 'react';
import { Box, Sphere, Cylinder, Text, Torus } from '@react-three/drei';
import { ActivityGuide } from './ActivityGuide';

export function PlayInterior() {
    return (
        <group position={[0, 0, 0]}>
            {/* ========== PLAY MAT FLOOR ========== */}
            <Box args={[12, 0.2, 12]} position={[0, 0.1, 0]}>
                <meshStandardMaterial color="#81d4fa" roughness={0.8} />
            </Box>
            {/* Floor Patterns (Circles) */}
            {[[-3, -3], [3, -3], [-3, 3], [3, 3], [0, 0]].map((pos, i) => (
                <Cylinder key={i} args={[2, 2, 0.05, 32]} position={[pos[0], 0.2, pos[1]]}>
                    <meshStandardMaterial color={['#ff8a65', '#ffd54f', '#aed581', '#9575cd', '#4fc3f7'][i]} />
                </Cylinder>
            ))}

            {/* ========== BALL PIT ========== */}
            <group position={[-3.5, 0.2, -3.5]}>
                {/* Pit Walls */}
                <Box args={[4.5, 0.8, 0.2]} position={[0, 0.4, 2.15]}><meshStandardMaterial color="#ef5350" /></Box>
                <Box args={[4.5, 0.8, 0.2]} position={[0, 0.4, -2.15]}><meshStandardMaterial color="#ef5350" /></Box>
                <Box args={[0.2, 0.8, 4.5]} position={[2.15, 0.4, 0]}><meshStandardMaterial color="#ef5350" /></Box>
                <Box args={[0.2, 0.8, 4.5]} position={[-2.15, 0.4, 0]}><meshStandardMaterial color="#ef5350" /></Box>

                {/* Balls */}
                {Array.from({ length: 40 }).map((_, i) => (
                    <Sphere key={i} args={[0.2]} position={[
                        (Math.random() - 0.5) * 3.8,
                        0.1 + Math.random() * 0.5,
                        (Math.random() - 0.5) * 3.8
                    ]}>
                        <meshStandardMaterial color={['#f44336', '#4caf50', '#2196f3', '#ffeb3b', '#9c27b0'][i % 5]} />
                    </Sphere>
                ))}
            </group>

            {/* ========== SLIDE ========== */}
            <group position={[3.5, 0.2, -3]} rotation={[0, -Math.PI / 4, 0]}>
                {/* Platform */}
                <Box args={[1.5, 1.5, 1.5]} position={[0, 0.75, 0]} castShadow>
                    <meshStandardMaterial color="#ffca28" />
                </Box>
                {/* Stairs */}
                {[0.3, 0.6, 0.9, 1.2].map((y, i) => (
                    <Box key={i} args={[0.8, 0.1, 0.3]} position={[0, y, 0.8 + i * 0.2]}><meshStandardMaterial color="#ffa000" /></Box>
                ))}
                {/* Slide Ramp */}
                <Box args={[1, 0.1, 3]} position={[0, 0.75, -1.8]} rotation={[0.4, 0, 0]} castShadow>
                    <meshStandardMaterial color="#fb8c00" metalness={0.5} roughness={0.2} />
                </Box>
                {/* Slide Walls */}
                <Box args={[0.1, 0.4, 3]} position={[0.45, 0.85, -1.8]} rotation={[0.4, 0, 0]}><meshStandardMaterial color="#e65100" /></Box>
                <Box args={[0.1, 0.4, 3]} position={[-0.45, 0.85, -1.8]} rotation={[0.4, 0, 0]}><meshStandardMaterial color="#e65100" /></Box>
            </group>

            {/* ========== TOY HANGING ========== */}
            <group position={[0, 5, 0]}>
                {/* Hanging Ropes */}
                {[[-2, 2], [2, -2]].map((pos, i) => (
                    <group key={i} position={[pos[0], 0, pos[1]]}>
                        <Cylinder args={[0.02, 0.02, 3, 8]} position={[0, -1.5, 0]}><meshStandardMaterial color="#5d4037" /></Cylinder>
                        {/* Hanging Toy */}
                        <Torus args={[0.4, 0.1, 8, 16]} position={[0, -3.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
                            <meshStandardMaterial color={i === 0 ? "#e91e63" : "#2196f3"} />
                        </Torus>
                    </group>
                ))}
            </group>

            {/* ========== REFRESHMENT CORNER ========== */}
            <group position={[4.5, 0.2, 4.5]}>
                {/* Colorful Bowls */}
                <Cylinder args={[0.4, 0.3, 0.2, 16]} position={[-0.6, 0.1, 0]}><meshStandardMaterial color="#ff5252" /></Cylinder>
                <Cylinder args={[0.3, 0.3, 0.05, 16]} position={[-0.6, 0.15, 0]}><meshStandardMaterial color="#8d6e63" /></Cylinder>

                <Cylinder args={[0.4, 0.3, 0.2, 16]} position={[0.6, 0.1, 0]}><meshStandardMaterial color="#448aff" /></Cylinder>
                <Cylinder args={[0.3, 0.3, 0.05, 16]} position={[0.6, 0.15, 0]}><meshStandardMaterial color="#b3e5fc" /></Cylinder>

                <Text position={[0, 0.6, 0.5]} fontSize={0.15} color="#333">SNACK TIME</Text>
            </group>

            {/* ========== ACTIVITY GUIDE ========== */}
            <ActivityGuide
                position={[0, 1.2, 4]}
                name="Play-Master Pip"
                message="Wanna play catch? Or maybe the ball pit? The slide is fresh and waxed for maximum speed!"
                color="#ffeb3b"
            />

            {/* ========== LIGHTING ========== */}
            <pointLight position={[0, 5, 0]} intensity={2.5} color="#fff" distance={20} />
            <pointLight position={[-4, 3, 4]} intensity={1} color="#ffecb3" distance={10} />
            <ambientLight intensity={0.6} />
        </group>
    );
}
