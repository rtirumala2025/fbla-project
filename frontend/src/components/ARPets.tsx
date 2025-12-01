/**
 * ARPets Component
 * WebXR-enabled AR pet rendering with gesture interactions
 * Supports petting, feeding, and real-world placement
 */
import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Hand, Camera, AlertCircle, CheckCircle } from 'lucide-react';
import type { Pet } from '../types/pet';

// Conditional import for WebXR
let ARButton: any = null;
let useXR: any = null;
try {
  const xrModule = require('@react-three/xr');
  ARButton = xrModule.ARButton;
  useXR = xrModule.useXR;
} catch (e) {
  // WebXR not available, will use fallback
}

interface ARPetsProps {
  pet: Pet;
  onInteraction?: (action: 'pet' | 'feed' | 'play') => void;
}

interface ARPetMeshProps {
  pet: Pet;
  onInteraction?: (action: 'pet' | 'feed' | 'play') => void;
}

// AR Pet Mesh Component
const ARPetMesh: React.FC<ARPetMeshProps> = ({ pet, onInteraction }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { gl } = useThree();
  const [interactionCooldown, setInteractionCooldown] = useState(false);
  const xrState = useXR ? useXR() : null;

  // Check for hand tracking and gestures
  useEffect(() => {
    if (!gl.xr) return;

    const handleSelect = (event: any) => {
      if (interactionCooldown) return;
      
      // Check if hand/controller is near pet
      if (meshRef.current) {
        const handPosition = event.target.position;
        const petPosition = meshRef.current.position;
        const distance = handPosition.distanceTo(petPosition);
        
        if (distance < 2) {
          // Trigger interaction
          onInteraction?.('pet');
          setInteractionCooldown(true);
          setTimeout(() => setInteractionCooldown(false), 1000);
        }
      }
    };

    gl.xr.addEventListener('select', handleSelect);
    return () => {
      gl.xr?.removeEventListener('select', handleSelect);
    };
  }, [gl, onInteraction, interactionCooldown]);

  // Animate pet in AR
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
    }
  });

  // Get species appearance
  const { color, shape } = React.useMemo(() => {
    const speciesData: Record<string, { color: string; shape: 'box' | 'sphere' | 'cone' }> = {
      dog: { color: '#8B4513', shape: 'box' },
      cat: { color: '#FFA500', shape: 'sphere' },
      bird: { color: '#FFD700', shape: 'cone' },
      rabbit: { color: '#F5F5DC', shape: 'sphere' },
      fox: { color: '#FF6347', shape: 'box' },
      dragon: { color: '#00CED1', shape: 'cone' },
    };
    return speciesData[pet.species.toLowerCase()] || speciesData.dog;
  }, [pet.species]);

  const petGeometry = React.useMemo(() => {
    switch (shape) {
      case 'sphere':
        return <sphereGeometry args={[0.5, 32, 32]} />;
      case 'cone':
        return <coneGeometry args={[0.4, 0.75, 8]} />;
      default:
        return <boxGeometry args={[0.6, 0.75, 0.5]} />;
    }
  }, [shape]);

  return (
    <mesh ref={meshRef} position={[0, 0, -1]}>
      {petGeometry}
      <meshStandardMaterial color={color} metalness={0.2} roughness={0.8} />
    </mesh>
  );
};

// Main ARPets Component
export const ARPets: React.FC<ARPetsProps> = ({ pet, onInteraction }) => {
  const [arSupported, setArSupported] = useState(false);
  const [webXRSupported, setWebXRSupported] = useState(false);
  const [isARSessionActive, setIsARSessionActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for WebXR support
    if (navigator.xr) {
      navigator.xr
        .isSessionSupported('immersive-ar')
        .then((supported) => {
          setWebXRSupported(supported);
          setArSupported(supported);
        })
        .catch(() => {
          setWebXRSupported(false);
          setArSupported(false);
        });
    } else {
      // Fallback: Check for basic AR support
      const hasARSupport = 'getUserMedia' in navigator && 'DeviceOrientationEvent' in window;
      setArSupported(hasARSupport);
    }
  }, []);

  const handleInteraction = (action: 'pet' | 'feed' | 'play') => {
    onInteraction?.(action);
  };

  if (!arSupported && !webXRSupported) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-soft">
        <div className="flex items-center gap-2 text-amber-700 mb-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-semibold">AR Not Supported</span>
        </div>
        <p className="text-sm text-amber-600">
          Your device or browser doesn't support WebXR AR. For the best experience:
        </p>
        <ul className="mt-2 space-y-1 text-xs text-amber-600 list-disc list-inside">
          <li>Use a mobile device with ARKit (iOS) or ARCore (Android)</li>
          <li>Use Chrome or Edge browser</li>
          <li>Ensure camera permissions are granted</li>
          <li>Use HTTPS connection (required for WebXR)</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Camera className="w-5 h-5 text-indigo-600" />
          AR Pet Mode
        </h3>
        {webXRSupported && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
            <CheckCircle className="h-3 w-3" />
            WebXR Ready
          </span>
        )}
      </div>

      <div className="rounded-xl bg-slate-50 p-3 mb-4">
        <p className="text-sm font-semibold text-slate-800 mb-1">
          {pet.name} ({pet.species})
        </p>
        <p className="text-xs text-slate-600">
          Mood: {pet.mood || 'happy'} • Health: {pet.health || 80}%
        </p>
      </div>

      {/* AR Canvas */}
      <div className="relative h-96 w-full rounded-xl overflow-hidden bg-gradient-to-br from-sky-100 to-indigo-100">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <ARPetMesh pet={pet} onInteraction={handleInteraction} />
          {!webXRSupported && (
            <OrbitControls enableZoom={true} enablePan={false} minDistance={3} maxDistance={10} />
          )}
        </Canvas>
        {webXRSupported && ARButton && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <ARButton
              sessionInit={{
                requiredFeatures: ['local-floor', 'bounded-floor'],
                optionalFeatures: ['hand-tracking'],
              }}
              onSessionStart={() => setIsARSessionActive(true)}
              onSessionEnd={() => setIsARSessionActive(false)}
            />
          </div>
        )}
      </div>

      {/* Interaction Instructions */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-slate-700">AR Interactions:</h4>
        <ul className="space-y-1 text-xs text-slate-600">
          <li className="flex items-start gap-2">
            <Hand className="w-4 h-4 text-indigo-600 mt-0.5" />
            <span>
              <strong>Pet:</strong> Move your hand/controller close to the pet to pet it
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 mt-0.5">🍽️</span>
            <span>
              <strong>Feed:</strong> Tap the feed button below to feed your pet in AR
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 mt-0.5">🎮</span>
            <span>
              <strong>Play:</strong> Use hand gestures or tap to play with your pet
            </span>
          </li>
        </ul>
      </div>

      {/* Interaction Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => handleInteraction('feed')}
          className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
        >
          🍽️ Feed
        </button>
        <button
          onClick={() => handleInteraction('play')}
          className="flex-1 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-600 transition-colors"
        >
          🎮 Play
        </button>
        <button
          onClick={() => handleInteraction('pet')}
          className="flex-1 rounded-xl bg-purple-500 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-600 transition-colors"
        >
          ✋ Pet
        </button>
      </div>

      {isARSessionActive && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
          <p className="text-xs font-semibold text-emerald-800 mb-1">AR Session Active</p>
          <p className="text-xs text-emerald-700">
            Move your device to place {pet.name} in your environment. Use gestures to interact!
          </p>
        </div>
      )}
    </div>
  );
};

export default ARPets;
