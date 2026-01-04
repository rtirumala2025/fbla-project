import React from 'react';
import { Box, Text, Cylinder } from '@react-three/drei';
import { ActivityGuide } from './ActivityGuide';
import { makeWoodTexture } from '../core/AssetLoader';

export function AgilityInterior() {
    const woodTex = React.useMemo(() => makeWoodTexture(), []);

    return (
        <group position={[0, 0, 0]}>
            {/* Padded Floor */}
            <Box args={[12, 0.2, 12]} position={[0, 0.1, 0]}>
                <meshStandardMaterial color="#222" roughness={1} />
            </Box>

            {/* Ramps and Tunnels (Abstracted for interior) */}
            <group position={[0, 0.2, 0]}>
                <Box args={[4, 1.5, 0.5]} position={[-3, 0.75, 0]} rotation={[0, 0.5, 0]}>
                    <meshStandardMaterial color="#cc4444" />
                </Box>
                <Cylinder args={[0.5, 0.5, 3, 16]} position={[3, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <meshStandardMaterial color="#4444cc" />
                </Cylinder>
            </group>

            {/* Instructor Guide */}
            <ActivityGuide
                position={[0, 1.2, -4]}
                name="Coach"
                message="Let's build some muscle! Follow my lead for the agility drills. Ready to run?"
                color="#cc4444"
            />

            {/* Wall Posters */}
            <group position={[0, 2.5, -5.9]}>
                <Box args={[4, 2, 0.1]} position={[0, 0, 0]}>
                    <meshStandardMaterial color="#eee" />
                </Box>
                <Text position={[0, 0, 0.06]} fontSize={0.2} color="#333">Training Schedule</Text>
            </group>

            <pointLight position={[0, 4, 0]} intensity={1.5} color="#fff" />
        </group>
    );
}
