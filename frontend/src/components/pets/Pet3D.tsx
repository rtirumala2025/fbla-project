/**
 * Pet3D Component
 * Renders a 3D pet model using React Three Fiber with accessory support
 * Updates in real-time when accessories are equipped/unequipped
 */
import React, { useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { AccessoryEquipResponse } from '../../types/accessories';
import type { Pet } from '../../types/pet';

interface Pet3DProps {
  pet: Pet;
  accessories: AccessoryEquipResponse[];
  className?: string;
}

interface PetMeshProps {
  species: string;
  accessories: AccessoryEquipResponse[];
}

// 3D Pet Model Component
const PetMesh: React.FC<PetMeshProps> = ({ species, accessories }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Animate the pet
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
    }
  });

  // Get species color and shape
  const { color, shape } = useMemo(() => {
    const speciesColors: Record<string, { color: string; shape: 'box' | 'sphere' | 'cone' }> = {
      dog: { color: '#8B4513', shape: 'box' },
      cat: { color: '#FFA500', shape: 'sphere' },
      bird: { color: '#FFD700', shape: 'cone' },
      rabbit: { color: '#F5F5DC', shape: 'sphere' },
      fox: { color: '#FF6347', shape: 'box' },
      dragon: { color: '#00CED1', shape: 'cone' },
    };
    return speciesColors[species.toLowerCase()] || speciesColors.dog;
  }, [species]);

  // Render accessories
  const accessoryMeshes = useMemo(() => {
    return accessories.map((acc, index) => {
      const accessoryType = acc.equipped_slot || 'default';
      const color = acc.equipped_color || '#6366f1';
      
      let position: [number, number, number] = [0, 0, 0];
      let scale: [number, number, number] = [1, 1, 1];
      let rotation: [number, number, number] = [0, 0, 0];

      switch (accessoryType) {
        case 'hat':
          position = [0, 1.2, 0];
          scale = [1.2, 0.3, 1.2];
          break;
        case 'collar':
          position = [0, 0.3, 0.6];
          scale = [1.3, 0.2, 1.3];
          rotation = [Math.PI / 2, 0, 0];
          break;
        case 'outfit':
          position = [0, 0, 0];
          scale = [1.1, 1.3, 1.1];
          break;
        default:
          position = [0, 0.8, 0];
          scale = [0.5, 0.5, 0.5];
      }

      return (
        <mesh key={`${acc.accessory_id}-${index}`} position={position} scale={scale} rotation={rotation}>
          {accessoryType === 'hat' ? (
            <coneGeometry args={[0.5, 0.3, 8]} />
          ) : accessoryType === 'collar' ? (
            <torusGeometry args={[0.8, 0.1, 8, 16]} />
          ) : (
            <boxGeometry args={[1, 1.5, 1]} />
          )}
          <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
        </mesh>
      );
    });
  }, [accessories]);

  // Render pet body
  const petGeometry = useMemo(() => {
    switch (shape) {
      case 'sphere':
        return <sphereGeometry args={[1, 32, 32]} />;
      case 'cone':
        return <coneGeometry args={[0.8, 1.5, 8]} />;
      default:
        return <boxGeometry args={[1.2, 1.5, 1]} />;
    }
  }, [shape]);

  console.log('🎨 Pet3D: Rendering pet', { species, color, accessoriesCount: accessories.length });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef}>
        {petGeometry}
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.8} />
      </mesh>
      {accessoryMeshes}
    </group>
  );
};

// Main Pet3D Component
export const Pet3D: React.FC<Pet3DProps> = ({ pet, accessories, className = '' }) => {
  const equippedAccessories = useMemo(
    () => accessories.filter((acc) => acc.equipped),
    [accessories]
  );

  useEffect(() => {
    console.log('🔄 Pet3D: Accessories updated', {
      petId: pet.id,
      petName: pet.name,
      equippedCount: equippedAccessories.length,
      accessories: equippedAccessories.map((acc) => ({
        id: acc.accessory_id,
        slot: acc.equipped_slot,
        color: acc.equipped_color,
      })),
    });
  }, [pet.id, pet.name, equippedAccessories]);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <Canvas shadows className="rounded-lg bg-gradient-to-br from-sky-100 to-indigo-100">
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <pointLight position={[-5, -5, -5]} intensity={0.5} />
        
        <PetMesh species={pet.species} accessories={equippedAccessories} />
        
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={3}
          maxDistance={10}
          autoRotate={false}
        />
        
        <gridHelper args={[10, 10, '#888888', '#cccccc']} />
      </Canvas>
      <div className="absolute bottom-2 left-2 rounded-lg bg-black/50 px-3 py-1 text-xs text-white">
        {pet.name} • {equippedAccessories.length} accessory{equippedAccessories.length !== 1 ? 'ies' : 'y'} equipped
      </div>
    </div>
  );
};

export default Pet3D;
