/**
 * AR Pet Mode - WebXR AR experience using three.js and WebXR
 * Allows users to view their virtual pet in augmented reality
 */

import React, { useState, useEffect } from 'react';
import { Text } from '@react-three/drei';
import { motion } from 'framer-motion';
import { X, Loader2, AlertCircle } from 'lucide-react';

// Dynamically import AR components to handle compatibility issues
let ARCanvas: any = null;
let XRButton: any = null;
// AR components are loaded dynamically but not currently used due to compatibility issues
// let DefaultXRControllers: any = null;
// let Hands: any = null;
// let useHitTest: any = null;
// let XR: any = null;
let useXR: any = null;

// Try to load AR module, but don't fail if it's not available
if (typeof window !== 'undefined') {
  try {
    // Use dynamic import to avoid build-time errors
    import('@react-three/xr').then((xrModule: any) => {
      ARCanvas = xrModule.ARCanvas || xrModule.default?.ARCanvas;
      XRButton = xrModule.XRButton || xrModule.default?.XRButton;
      // AR components are loaded but not currently used due to compatibility issues
      // DefaultXRControllers = xrModule.DefaultXRControllers || xrModule.default?.DefaultXRControllers;
      // Hands = xrModule.Hands || xrModule.default?.Hands;
      // useHitTest = xrModule.useHitTest || xrModule.default?.useHitTest;
      // XR = xrModule.XR || xrModule.default?.XR;
      useXR = xrModule.useXR || xrModule.default?.useXR;
    }).catch((error) => {
      console.warn('@react-three/xr not available:', error);
    });
  } catch (error) {
    console.warn('Failed to load @react-three/xr:', error);
  }
}

interface ARPetModeProps {
  petName?: string;
  petType?: string;
  onClose?: () => void;
}

// Simple 3D Pet Model Component (placeholder - replace with actual pet model)
function PetModel({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Simple placeholder geometry - replace with actual pet model */}
      <mesh>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#4F46E5" />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#EF4444" />
      </mesh>
    </group>
  );
}

// AR Hit Test Component - places pet in real world space
// Temporarily disabled due to AR module compatibility issues
function ARPetPlacement({ petName }: { petName?: string }) {
  const [placed] = useState(false);
  const [petPosition] = useState<[number, number, number]>([0, 0, -1]);
  // const petRef = useRef<any>(null); // Unused due to AR being disabled

  // useHitTest is temporarily disabled
  /*
  useHitTest((hitMatrix: Float32Array) => {
    if (!placed) {
      // Extract position from hit test matrix
      const position: [number, number, number] = [
        hitMatrix[12],
        hitMatrix[13],
        hitMatrix[14],
      ];
      setPetPosition(position);
      setPlaced(true);
    }
  });
  */

  return (
    <>
      {placed && (
        <>
          <PetModel position={petPosition} />
          {petName && (
            <Text
              position={[petPosition[0], petPosition[1] + 0.8, petPosition[2]]}
              fontSize={0.1}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {petName}
            </Text>
          )}
        </>
      )}
      {!placed && (
        <Text
          position={[0, 0, -1]}
          fontSize={0.1}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          Point your device at a surface to place your pet
        </Text>
      )}
    </>
  );
}

// Component to track AR session state
function ARSessionTracker({ onSessionChange }: { onSessionChange: (isActive: boolean) => void }) {
  const { isPresenting } = useXR();
  
  useEffect(() => {
    onSessionChange(isPresenting);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPresenting]);
  
  return null;
}

// Main AR Scene Component (currently unused due to AR being disabled)
// function ARScene({ petName, onSessionChange }: { petName?: string; onSessionChange: (isActive: boolean) => void }) {
//   return (
//     <>
//       <ambientLight intensity={0.5} />
//       <directionalLight position={[10, 10, 5]} intensity={1} />
//       <ARPetPlacement petName={petName} />
//       <ARSessionTracker onSessionChange={onSessionChange} />
//     </>
//   );
// }

export function ARPetMode({ petName = 'Your Pet', petType, onClose }: ARPetModeProps) {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  // const [isARActive, setIsARActive] = useState(false); // Unused - AR is disabled
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [arModuleError, setArModuleError] = useState<boolean>(false);

  // Check if AR module is available
  useEffect(() => {
    if (!ARCanvas || !XRButton) {
      setArModuleError(true);
      setError('AR features are currently unavailable due to a compatibility issue. Please try again later.');
      setIsChecking(false);
      setIsSupported(false);
    }
  }, []);

  useEffect(() => {
    // Check WebXR support
    const checkWebXRSupport = async () => {
      try {
        if (navigator.xr) {
          const supported = await navigator.xr.isSessionSupported('immersive-ar');
          setIsSupported(supported);
        } else {
          setIsSupported(false);
          setError('WebXR is not supported in this browser. Please use a compatible browser like Chrome on Android or Safari on iOS.');
        }
      } catch (err) {
        setIsSupported(false);
        setError(err instanceof Error ? err.message : 'Failed to check WebXR support');
      } finally {
        setIsChecking(false);
      }
    };

    checkWebXRSupport();
  }, []);

  if (arModuleError || !ARCanvas || !XRButton) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-gray-800 rounded-lg p-6 text-center"
        >
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">AR Feature Unavailable</h2>
          <p className="text-gray-300 mb-4">
            AR features are currently unavailable due to a compatibility issue with the AR library.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-white">Checking AR support...</p>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-gray-800 rounded-lg p-6 text-center"
        >
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">AR Not Available</h2>
          <p className="text-gray-300 mb-4">{error || 'WebXR AR is not supported on this device or browser.'}</p>
          <p className="text-sm text-gray-400 mb-6">
            Try using Chrome on Android or Safari on iOS with ARKit support.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700 transition-colors"
          aria-label="Close AR"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* AR Canvas - Temporarily disabled due to compatibility issues */}
      {/* TODO: Re-enable when @react-three/xr is updated to support Three.js 0.181.2 */}
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-center text-white">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-2xl font-bold mb-2">AR Feature Temporarily Unavailable</h2>
          <p className="text-gray-300 mb-4">
            The AR feature requires a library update to be compatible with the current version of Three.js.
          </p>
        </div>
      </div>
      {/*
      <ARCanvas
        style={{ width: '100%', height: '100%' }}
        camera={{ position: [0, 1.6, 0], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        sessionInit={{
          requiredFeatures: ['hit-test'],
          optionalFeatures: ['dom-overlay'],
          domOverlay: { root: document.body },
        }}
      >
        <XR>
          <Suspense fallback={null}>
            <ARScene petName={petName} onSessionChange={setIsARActive} />
          </Suspense>
        </XR>
      </ARCanvas>
      */}

      {/* AR Button Overlay - Temporarily disabled */}
      {/*
      {!isARActive && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <XRButton
            mode="AR"
            sessionInit={{
              requiredFeatures: ['hit-test'],
              optionalFeatures: ['dom-overlay'],
              domOverlay: { root: document.body },
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Start AR Experience
          </XRButton>
        </div>
      )}
      */}

      {/* Instructions - AR is currently disabled */}
      {/* {isARActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-black/70 text-white px-4 py-2 rounded-lg text-sm text-center max-w-xs"
        >
          Point your device at a flat surface to place your pet in AR
        </motion.div>
      )} */}
    </div>
  );
}
