import React, { useState } from 'react';
import { Box, Cylinder, Text } from '@react-three/drei';

interface SignPostProps {
    position: [number, number, number];
    onSignClick?: () => void;
    label?: string;
}

export function SignPost({ position, onSignClick, label = "PARK" }: SignPostProps) {
    const [isHovered, setIsHovered] = useState(false);

    const sharedSignProps = {
        onPointerEnter: () => {
            setIsHovered(true);
            document.body.style.cursor = 'pointer';
        },
        onPointerLeave: () => {
            setIsHovered(false);
            document.body.style.cursor = 'auto';
        },
        onPointerDown: (e: any) => {
            e.stopPropagation();
            onSignClick?.();
        }
    };

    return (
        <group position={position}>
            {/* Wooden Post */}
            <Cylinder args={[0.15, 0.15, 3, 8]} position={[0, 1.5, 0]} castShadow>
                <meshStandardMaterial color="#5d4037" roughness={0.9} />
            </Cylinder>

            {/* Main Sign Board */}
            <Box args={[2.5, 0.8, 0.2]} position={[0, 2.4, 0]} castShadow>
                <meshStandardMaterial
                    color={isHovered ? "#8d6e63" : "#795548"}
                    roughness={0.8}
                />
            </Box>

            {/* Front Side */}
            <group position={[0, 2.4, 0.101]} {...sharedSignProps}>
                <Text
                    fontSize={0.4}
                    color={isHovered ? "#ffff00" : "#ffffff"}
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.02}
                    outlineColor="#000000"
                >
                    {label}
                </Text>

                {/* Decorative Nails */}
                <mesh position={[-1, 0.2, 0.01]}>
                    <circleGeometry args={[0.03, 8]} />
                    <meshStandardMaterial color="#444444" />
                </mesh>
                <mesh position={[1, 0.2, 0.01]}>
                    <circleGeometry args={[0.03, 8]} />
                    <meshStandardMaterial color="#444444" />
                </mesh>
                <mesh position={[-1, -0.2, 0.01]}>
                    <circleGeometry args={[0.03, 8]} />
                    <meshStandardMaterial color="#444444" />
                </mesh>
                <mesh position={[1, -0.2, 0.01]}>
                    <circleGeometry args={[0.03, 8]} />
                    <meshStandardMaterial color="#444444" />
                </mesh>
            </group>

            {/* Back Side */}
            <group position={[0, 2.4, -0.101]} rotation={[0, Math.PI, 0]} {...sharedSignProps}>
                <Text
                    fontSize={0.4}
                    color={isHovered ? "#ffff00" : "#ffffff"}
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.02}
                    outlineColor="#000000"
                >
                    {label}
                </Text>

                {/* Decorative Nails */}
                <mesh position={[-1, 0.2, 0.01]}>
                    <circleGeometry args={[0.03, 8]} />
                    <meshStandardMaterial color="#444444" />
                </mesh>
                <mesh position={[1, 0.2, 0.01]}>
                    <circleGeometry args={[0.03, 8]} />
                    <meshStandardMaterial color="#444444" />
                </mesh>
                <mesh position={[-1, -0.2, 0.01]}>
                    <circleGeometry args={[0.03, 8]} />
                    <meshStandardMaterial color="#444444" />
                </mesh>
                <mesh position={[1, -0.2, 0.01]}>
                    <circleGeometry args={[0.03, 8]} />
                    <meshStandardMaterial color="#444444" />
                </mesh>
            </group>

            {/* Top Cap */}
            <Box args={[0.4, 0.1, 0.4]} position={[0, 3, 0]} castShadow>
                <meshStandardMaterial color="#3e2723" />
            </Box>
        </group>
    );
}
