/**
 * AR Session View Component
 * Provides AR functionality with WebXR support or experimental mode
 * 
 * Features:
 * - Device capability detection
 * - WebXR integration (when supported)
 * - Experimental mode with instructions
 * - Session persistence
 */
import React, { useEffect, useState } from 'react';
import { Camera, Smartphone, AlertCircle } from 'lucide-react';
import type { ARSessionResponse } from '../../types/nextGen';

interface ARSessionViewProps {
  session: ARSessionResponse | null;
  petName?: string;
}

export const ARSessionView: React.FC<ARSessionViewProps> = ({ session, petName = 'your pet' }) => {
  const [arSupported, setArSupported] = useState(false);
  const [webXRSupported, setWebXRSupported] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<string>('');
  const [isExperimental, setIsExperimental] = useState(true);

  useEffect(() => {
    // Check for WebXR support
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        setWebXRSupported(supported);
        setArSupported(supported);
        setIsExperimental(!supported);
      }).catch(() => {
        setWebXRSupported(false);
        setArSupported(false);
        setIsExperimental(true);
      });
    } else {
      // Check for AR.js or other AR libraries
      const hasARSupport = 'getUserMedia' in navigator && 'DeviceOrientationEvent' in window;
      setArSupported(hasARSupport);
      setIsExperimental(!hasARSupport);
    }

    // Detect device info
    const userAgent = navigator.userAgent;
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    const deviceType = isMobile ? 'Mobile Device' : 'Desktop';
    setDeviceInfo(`${deviceType} - ${navigator.platform}`);
  }, []);

  const handleStartAR = async () => {
    if (!webXRSupported) {
      alert(
        'AR is currently in experimental mode. Full WebXR support is not available on this device.\n\n' +
        'For the best AR experience:\n' +
        '- Use a mobile device with AR support (iOS ARKit or Android ARCore)\n' +
        '- Use Chrome or Edge browser\n' +
        '- Ensure camera permissions are granted'
      );
      return;
    }

    try {
      // Request AR session
      const session = await navigator.xr!.requestSession('immersive-ar', {
        requiredFeatures: ['local-floor', 'bounded-floor'],
        optionalFeatures: ['hand-tracking'],
      });

      // AR session started - in a full implementation, this would render the 3D pet
      console.log('AR session started:', session);
      
      // End session after 30 seconds (demo)
      setTimeout(() => {
        session.end();
      }, 30000);
    } catch (error) {
      console.error('Failed to start AR session:', error);
      alert('Failed to start AR session. Please check your device compatibility and camera permissions.');
    }
  };

  if (!session) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-slate-800">AR Companion</h2>
        <p className="mt-2 text-sm text-slate-600">Loading AR session...</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">AR Companion</h2>
        {isExperimental && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
            <AlertCircle className="h-3 w-3" />
            Experimental
          </span>
        )}
      </div>

      {session.pet_data && (
        <div className="rounded-xl bg-indigo-50 p-3">
          <p className="text-sm font-semibold text-indigo-800">
            {session.pet_data.name} ({session.pet_data.species})
          </p>
          <p className="text-xs text-indigo-600">
            Mood: {session.pet_data.mood} • Health: {session.pet_data.stats.health}%
          </p>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Camera className="h-4 w-4" />
          <span>Device: {deviceInfo}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Smartphone className="h-4 w-4" />
          <span>AR Support: {arSupported ? 'Available' : 'Limited'}</span>
        </div>
        <p className="text-xs font-mono text-slate-500">Session: {session.session_id}</p>
      </div>

      <p className="text-xs text-slate-500">{session.anchor_description}</p>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">Instructions:</h3>
        <ul className="space-y-1 text-xs text-slate-600">
          {session.instructions.map((instruction, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-indigo-500">•</span>
              <span>{instruction}</span>
            </li>
          ))}
        </ul>
      </div>

      {isExperimental && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs font-semibold text-amber-800 mb-1">Experimental Feature</p>
          <p className="text-xs text-amber-700">
            AR functionality is currently in experimental mode. Full WebXR support requires:
          </p>
          <ul className="mt-2 space-y-1 text-xs text-amber-700 list-disc list-inside">
            <li>Mobile device with ARKit (iOS) or ARCore (Android)</li>
            <li>Chrome or Edge browser</li>
            <li>Camera permissions enabled</li>
            <li>HTTPS connection (required for WebXR)</li>
          </ul>
        </div>
      )}

      <button
        onClick={handleStartAR}
        className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!arSupported && !isExperimental}
      >
        {webXRSupported ? 'Start AR Session' : 'Try Experimental AR'}
      </button>
    </div>
  );
};

