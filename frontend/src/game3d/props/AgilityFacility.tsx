import React, { useState, useMemo } from 'react';
import { Box, Cylinder, Text } from '@react-three/drei';
import { AgilityCourse } from './AgilityCourse';
import { AgilityTrainingCenter } from './AgilityTrainingCenter';
import { makeWoodTexture } from '../core/AssetLoader';

export function AgilityFacility(props: any & { onSignClick?: () => void }) {
    const [isHovered, setIsHovered] = useState(false);
    const woodTex = useMemo(() => makeWoodTexture(), []);

    return (
        <group {...props}>
            {/* ========== AGILITY TRAINING CENTER BUILDING ========== */}
            <AgilityTrainingCenter
                position={[0, 0, -5]}
                onSignClick={props.onSignClick}
            />

            {/* ========== OUTDOOR AGILITY ZONE ========== */}

            {/* Low Rustic Fence Perimeter */}
            <group>
                {/* Back Fence */}
                <FenceLine position={[0, 0, -11]} length={22} woodTex={woodTex} />
                {/* Left Fence */}
                <FenceLine position={[-11, 0, 0]} length={22} rotation={[0, Math.PI / 2, 0]} woodTex={woodTex} />
                {/* Right Fence */}
                <FenceLine position={[11, 0, 0]} length={22} rotation={[0, Math.PI / 2, 0]} woodTex={woodTex} />
                {/* Front Left Fence */}
                <FenceLine position={[-7.5, 0, 11]} length={7} woodTex={woodTex} />
                {/* Front Right Fence */}
                <FenceLine position={[7.5, 0, 11]} length={7} woodTex={woodTex} />
            </group>

            {/* Entrance Gate Posts */}
            <group position={[0, 0, 11]}>
                <mesh position={[-3, 0.6, 0]} castShadow>
                    <boxGeometry args={[0.25, 1.4, 0.25]} />
                    <meshStandardMaterial map={woodTex} color="#5e5044" />
                </mesh>
                <mesh position={[3, 0.6, 0]} castShadow>
                    <boxGeometry args={[0.25, 1.4, 0.25]} />
                    <meshStandardMaterial map={woodTex} color="#5e5044" />
                </mesh>
            </group>

            {/* Weathered Wooden Sign - CLICKABLE */}
            <group
                position={[0, 1.2, 11.2]}
                onPointerEnter={(e) => {
                    e.stopPropagation();
                    setIsHovered(true);
                    document.body.style.cursor = 'pointer';
                }}
                onPointerLeave={(e) => {
                    e.stopPropagation();
                    setIsHovered(false);
                    document.body.style.cursor = 'auto';
                }}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    props.onSignClick?.();
                }}
            >
                {/* Sign Board */}
                <Box args={[3.2, 0.8, 0.15]} castShadow>
                    <meshStandardMaterial
                        map={woodTex}
                        color={isHovered ? "#9e8e7e" : "#7e6d5d"}
                        roughness={0.9}
                    />
                </Box>

                {/* Faded Painted Text */}
                <Text
                    position={[0, 0, 0.08]}
                    fontSize={isHovered ? 0.35 : 0.3}
                    color={isHovered ? "#ffffdd" : "#eeeeee"}
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.02}
                    outlineColor="#000000"
                >
                    TRAIL AGILITY
                </Text>

                {/* Scrawled Subtext */}
                <Text
                    position={[0, -0.25, 0.08]}
                    fontSize={0.12}
                    color="#cccccc"
                    anchorX="center"
                    anchorY="middle"
                    fillOpacity={0.8}
                >
                    MAINTAINED BY PARK VOLUNTEERS
                </Text>
            </group>

            {/* Weathering Details: Scattered "Leaves" on ground */}
            {Array.from({ length: 15 }).map((_, i) => (
                <mesh
                    key={i}
                    position={[(Math.random() - 0.5) * 20, 0.06, (Math.random() - 0.5) * 20]}
                    rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]}
                >
                    <planeGeometry args={[0.2, 0.2]} />
                    <meshStandardMaterial color={i % 2 === 0 ? "#8a5a2a" : "#6a7a2a"} transparent opacity={0.6} />
                </mesh>
            ))}

            {/* The Actual Agility Equipment */}
            <AgilityCourse position={[0, 0, 0]} scale={1.2} />

        </group>
    );
}

function FenceLine({ position, length, rotation = [0, 0, 0], woodTex }: any) {
    const segments = Math.floor(length / 2.5);
    return (
        <group position={position} rotation={rotation}>
            {Array.from({ length: segments + 1 }).map((_, i) => {
                const x = -length / 2 + i * 2.5;
                if (x > length / 2 + 0.1) return null;
                return (
                    <group key={i} position={[x, 0, 0]}>
                        {/* Post */}
                        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
                            <boxGeometry args={[0.15, 1.1, 0.15]} />
                            <meshStandardMaterial map={woodTex} color="#5e5044" />
                        </mesh>
                        {/* Horizontal Rail */}
                        {i < segments && (
                            <mesh position={[1.25, 0.8, 0]} castShadow receiveShadow>
                                <boxGeometry args={[2.5, 0.08, 0.05]} />
                                <meshStandardMaterial map={woodTex} color="#5e5044" />
                            </mesh>
                        )}
                        {/* Lower Rail */}
                        {i < segments && (
                            <mesh position={[1.25, 0.4, 0]} castShadow receiveShadow>
                                <boxGeometry args={[2.5, 0.08, 0.05]} />
                                <meshStandardMaterial map={woodTex} color="#5e5044" />
                            </mesh>
                        )}
                    </group>
                )
            })}
        </group>
    );
}

