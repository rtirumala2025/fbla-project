/**
 * Pet3DVisualization Component
 * 3D pet visualization using Three.js with accessories support
 */
import React, { Suspense, useMemo, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { Pet } from '../../types/pet';
import { AccessoryEquipResponse } from '../../types/accessories';

interface Pet3DVisualizationProps {
  pet: Pet;
  accessories?: AccessoryEquipResponse[];
  size?: 'sm' | 'md' | 'lg';
}

// Simple 3D Pet Model Component (using a basic geometry for now)
function PetModel({ 
  species, 
  mood, 
  accessories = [] 
}: { 
  species: string; 
  mood?: string; 
  accessories?: AccessoryEquipResponse[];
}) {
  // Determine pet color based on species
  const petColor = useMemo(() => {
    const colors: Record<string, string> = {
      dog: '#8B4513',
      cat: '#FFA500',
      bird: '#FFD700',
      rabbit: '#FFFFFF',
      fox: '#FF6347',
      dragon: '#FF0000',
    };
    return colors[species.toLowerCase()] || '#6366f1';
  }, [species]);

  // Determine scale based on mood
  const scale = useMemo(() => {
    if (mood === 'joyful' || mood === 'playful') return 1.1;
    if (mood === 'sleepy') return 0.95;
    return 1.0;
  }, [mood]);

  return (
    <group>
      {/* Main pet body - using a sphere as placeholder */}
      <mesh position={[0, 0, 0]} scale={scale}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color={petColor} roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Pet head */}
      <mesh position={[0, 1.2, 0]} scale={scale * 0.7}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color={petColor} roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.2, 1.3, 0.5]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0.2, 1.3, 0.5]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Accessories rendering */}
      {accessories
        .filter(acc => acc.equipped)
        .map((accessory, index) => {
          const slot = accessory.equipped_slot || 'default';
          const color = accessory.equipped_color || '#6366f1';
          
          // Position accessories based on slot
          const positions: Record<string, [number, number, number]> = {
            hat: [0, 1.8, 0],
            collar: [0, 0.3, 0.6],
            outfit: [0, 0, 0],
          };

          const pos = positions[slot] || [0, 0, 0];

          if (slot === 'hat') {
            return (
              <mesh key={accessory.accessory_id} position={pos}>
                <cylinderGeometry args={[0.7, 0.6, 0.3, 32]} />
                <meshStandardMaterial color={color} roughness={0.5} metalness={0.8} />
              </mesh>
            );
          }

          if (slot === 'collar') {
            return (
              <mesh key={accessory.accessory_id} position={pos} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.65, 0.05, 16, 32]} />
                <meshStandardMaterial color={color} roughness={0.3} metalness={0.9} />
              </mesh>
            );
          }

          return null;
        })}
    </group>
  );
}

// Loading fallback (available for future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LoadingFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="text-center">
        <div className="mb-2 text-4xl">🐾</div>
        <div className="text-sm text-gray-500">Loading 3D pet...</div>
      </div>
    </div>
  );
}

export const Pet3DVisualization: React.FC<Pet3DVisualizationProps> = memo(({
  pet,
  accessories = [],
  size = 'md',
}) => {
  const height = useMemo(() => {
    const sizes = { sm: 300, md: 400, lg: 500 };
    return sizes[size];
  }, [size]);

  const mood = useMemo(() => {
    const stats = pet.stats;
    if (stats.happiness >= 80 && stats.health >= 80) return 'joyful';
    if (stats.energy < 30) return 'sleepy';
    if (stats.happiness >= 60) return 'playful';
    if (stats.health < 50) return 'concerned';
    return 'calm';
  }, [pet.stats]);

  return (
    <div 
      className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 shadow-lg"
      style={{ height: `${height}px` }}
    >
      <Canvas
        camera={{ position: [0, 2, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 2, 5]} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <pointLight position={[-5, 5, -5]} intensity={0.4} />
          
          <PetModel 
            species={pet.species} 
            mood={mood}
            accessories={accessories}
          />
          
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            minDistance={3}
            maxDistance={8}
            autoRotate
            autoRotateSpeed={1}
          />
          
          <Environment preset="sunset" />
        </Suspense>
      </Canvas>
      
      {/* Pet name overlay */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <div className="inline-block rounded-full bg-white/90 px-4 py-2 shadow-md backdrop-blur-sm">
          <div className="text-lg font-bold text-gray-800">{pet.name}</div>
          {pet.level && (
            <div className="text-xs text-gray-600">Level {pet.level}</div>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if pet or accessories change
  return (
    prevProps.pet.id === nextProps.pet.id &&
    prevProps.pet.name === nextProps.pet.name &&
    prevProps.pet.species === nextProps.pet.species &&
    JSON.stringify(prevProps.accessories) === JSON.stringify(nextProps.accessories) &&
    prevProps.size === nextProps.size
  );
});

Pet3DVisualization.displayName = 'Pet3DVisualization';

export default Pet3DVisualization;

