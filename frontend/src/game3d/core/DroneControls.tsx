import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';

export function DroneControls({ active, onExit }: { active: boolean; onExit?: () => void }) {
    console.log('[DroneControls] active:', active);
    const { camera, gl } = useThree();
    const moveState = useRef({
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false,
        down: false
    });

    const velocity = useRef(new THREE.Vector3());
    const speed = 25.0; // Max speed
    const damping = 0.85; // Damping factor

    useEffect(() => {
        if (!active) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.code) {
                case 'KeyW': moveState.current.forward = true; break;
                case 'KeyS': moveState.current.backward = true; break;
                case 'KeyA': moveState.current.left = true; break;
                case 'KeyD': moveState.current.right = true; break;
                case 'Space': moveState.current.up = true; break;
                case 'ShiftLeft': moveState.current.down = true; break;
                case 'ArrowUp': moveState.current.up = true; break;
                case 'ArrowDown': moveState.current.down = true; break;
                case 'ArrowLeft': moveState.current.left = true; break;
                case 'ArrowRight': moveState.current.right = true; break;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            switch (e.code) {
                case 'KeyW': moveState.current.forward = false; break;
                case 'KeyS': moveState.current.backward = false; break;
                case 'KeyA': moveState.current.left = false; break;
                case 'KeyD': moveState.current.right = false; break;
                case 'Space': moveState.current.up = false; break;
                case 'ShiftLeft': moveState.current.down = false; break;
                case 'ArrowUp': moveState.current.up = false; break;
                case 'ArrowDown': moveState.current.down = false; break;
                case 'ArrowLeft': moveState.current.left = false; break;
                case 'ArrowRight': moveState.current.right = false; break;
                case 'Escape':
                    // Optional: could exit here, but onUnlock handles visually
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            // Reset move state on deactivate
            moveState.current = { forward: false, backward: false, left: false, right: false, up: false, down: false };
        };
    }, [active]);

    useFrame((state, delta) => {
        if (!active) return;

        const acceleration = new THREE.Vector3();
        const front = new THREE.Vector3(0, 0, Number(moveState.current.backward) - Number(moveState.current.forward));
        const side = new THREE.Vector3(Number(moveState.current.left) - Number(moveState.current.right), 0, 0);
        const up = new THREE.Vector3(0, Number(moveState.current.up) - Number(moveState.current.down), 0);

        acceleration.subVectors(front, side);

        // ONLY NORMALIZE IF MOVING
        if (acceleration.lengthSq() > 0) {
            acceleration.normalize();
            acceleration.applyQuaternion(camera.quaternion);
        }

        // Add vertical world movement (Space/Shift)
        acceleration.y += up.y;

        velocity.current.add(acceleration.multiplyScalar(speed * 2 * delta));
        velocity.current.multiplyScalar(damping);

        camera.position.add(velocity.current.clone().multiplyScalar(delta));
    });

    const handleCanvasClick = (e: any) => {
        if (!active) return;
        // Re-lock if clicked while active
        const el = gl.domElement;
        if (document.pointerLockElement !== el) {
            el.requestPointerLock();
        }
    };

    return active ? <PointerLockControls onUnlock={() => {
        console.log('[DroneControls] Mouse unlocked');
    }} /> : null;
}
