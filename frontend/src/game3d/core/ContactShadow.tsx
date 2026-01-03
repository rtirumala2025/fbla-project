import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Contact Shadow Component
 * Creates a soft blob shadow beneath pets for ground contact anchoring
 */

interface ContactShadowProps {
    position?: [number, number, number];
    scale?: number | [number, number, number];
    opacity?: number;
    blur?: number;
    far?: number;
    rotation?: [number, number, number];
    color?: string;
}

export function ContactShadow({
    position = [0, 0.005, 0],
    scale = 1.0,
    opacity = 0.4,
    blur = 0.5,
    far = 1.0,
    rotation = [-Math.PI / 2, 0, 0],
    color = '#000000',
}: ContactShadowProps) {
    const meshRef = useRef<THREE.Mesh>(null);

    // Create radial gradient texture for soft blob shadow
    const shadowTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('2D canvas not supported');

        // Create radial gradient (center = dark, edges = transparent)
        const gradient = ctx.createRadialGradient(
            size / 2, size / 2, size * 0.1,
            size / 2, size / 2, size * 0.5
        );

        // Apply blur parameter to gradient falloff
        const innerAlpha = Math.min(1, opacity * 1.5);
        const edgeFalloff = blur * 0.3;

        gradient.addColorStop(0, `rgba(0, 0, 0, ${innerAlpha})`);
        gradient.addColorStop(0.4 + edgeFalloff, `rgba(0, 0, 0, ${opacity * 0.6})`);
        gradient.addColorStop(0.7 + edgeFalloff, `rgba(0, 0, 0, ${opacity * 0.2})`);
        gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        return tex;
    }, [opacity, blur]);

    useFrame(() => {
        if (meshRef.current) {
            // Subtle pulsing for organic feel (very subtle)
            const breath = Math.sin(performance.now() * 0.0008) * 0.03;
            const s = 1 + breath;
            if (Array.isArray(scale)) {
                meshRef.current.scale.set(scale[0] * s, scale[1] * s, scale[2] * s);
            } else {
                meshRef.current.scale.setScalar(scale * s);
            }
        }
    });

    return (
        <mesh
            ref={meshRef}
            position={position}
            rotation={rotation}
            scale={scale}
            renderOrder={-1} // Render before other transparent objects
        >
            <planeGeometry args={[far * 2, far * 2]} />
            <meshBasicMaterial
                map={shadowTexture}
                transparent
                opacity={opacity}
                depthWrite={false}
                color={color}
            />
        </mesh>
    );
}
