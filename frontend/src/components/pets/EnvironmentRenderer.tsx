/**
 * EnvironmentRenderer Component
 * PHASE 3: PET VISUAL GROUNDING
 * 
 * Renders the environment (room/background) based on environment config.
 * This is a VISUAL GROUNDING step ONLY - no gameplay mechanics, stats, or interactions.
 * 
 * Requirements:
 * - Pure React + CSS (NO Three.js, NO Canvas, NO WebGL)
 * - Uses environmentConfig.ts for pet-specific theming
 * - Environment only (pet is handled separately by PetVisual)
 */

import React, { useMemo } from 'react';
import { getEnvironmentConfig, type EnvironmentConfig } from './environmentConfig';
import './EnvironmentRenderer.css';

export type PetType = 'dog' | 'cat' | 'panda';

export interface EnvironmentRendererProps {
  petType: PetType;
}

/**
 * EnvironmentRenderer Component
 * Renders the environment (room/background) based on environment config
 */
export const EnvironmentRenderer: React.FC<EnvironmentRendererProps> = ({ petType }) => {
  // Defensive: normalize petType and provide safe fallback
  const normalizedPetType: PetType = useMemo(() => {
    if (petType === 'dog' || petType === 'cat' || petType === 'panda') {
      return petType;
    }
    return 'dog';
  }, [petType]);

  const environment = useMemo(() => {
    try {
      return getEnvironmentConfig(normalizedPetType);
    } catch (error) {
      console.error('[EnvironmentRenderer] Error getting environment config:', error);
      return getEnvironmentConfig('dog'); // Fallback to dog
    }
  }, [normalizedPetType]);

  // Ensure we have valid environment config
  if (!environment) {
    console.error('[EnvironmentRenderer] No environment config available');
    return (
      <div className="environment-renderer" style={{ background: '#B4D7E8', width: '100%', height: '100%' }}>
        <div style={{ padding: '20px', color: 'red' }}>Environment Error</div>
      </div>
    );
  }

  return (
    <div 
      className="environment-renderer"
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        background: `linear-gradient(to bottom, ${environment.room.wallTop} 0%, ${environment.room.wallBottom} 50%, ${environment.room.floor} 50%, ${environment.room.floorLight} 100%)`,
      }}
    >
      {/* Floor Pattern */}
      <div 
        className="floor-pattern"
        style={{
          background: `repeating-linear-gradient(
            90deg,
            ${environment.room.floor} 0px,
            ${environment.room.floorAccent} 2px,
            ${environment.room.floor} 4px
          )`,
        }}
      />

      {/* Window (if enabled) */}
      {environment.window.show && (
        <div className="window-container">
          <div 
            className="window"
            style={{
              background: environment.window.style === 'outdoor' 
                ? 'radial-gradient(circle, rgba(135, 206, 250, 0.3), rgba(176, 224, 230, 0.1))'
                : 'linear-gradient(to bottom, rgba(135, 206, 250, 0.2), rgba(255, 255, 255, 0.1))',
            }}
          >
            <div 
              className="sun"
              style={{
                background: environment.window.sunColor,
                boxShadow: `0 0 20px ${environment.window.sunColor}`,
              }}
            />
          </div>
        </div>
      )}

      {/* Decorative Elements */}
      {environment.decorations.map((decoration, index) => (
        <div
          key={`decoration-${index}`}
          className="decoration"
          style={{
            ...decoration.position,
            opacity: decoration.opacity,
            width: decoration.size || '64px',
            height: decoration.size || '64px',
            minWidth: decoration.size || '64px',
            minHeight: decoration.size || '64px',
            zIndex: 2,
          }}
        >
          {decoration.imagePath ? (
            <img
              src={decoration.imagePath}
              alt={decoration.emoji}
              className="decoration-image"
              style={{
                width: '100%',
                height: '100%',
                minWidth: '100%',
                minHeight: '100%',
                objectFit: 'contain',
                display: 'block',
                filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.35)) brightness(1.05)',
                pointerEvents: 'none',
              }}
              onError={(e) => {
                console.error(`[EnvironmentRenderer] Failed to load decoration asset: ${decoration.imagePath}`);
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                // Find the fallback span in the same container
                const container = target.parentElement;
                if (container) {
                  const fallback = container.querySelector('.decoration-emoji-fallback') as HTMLElement;
                  if (fallback) {
                    fallback.style.display = 'block';
                    console.warn(`[EnvironmentRenderer] Falling back to emoji for decoration`);
                  }
                }
              }}
              onLoad={() => {
                console.log(`[EnvironmentRenderer] Successfully loaded decoration: ${decoration.imagePath}`);
              }}
            />
          ) : null}
          <span
            className="decoration-emoji-fallback"
            style={{
              display: decoration.imagePath ? 'none' : 'block',
              fontSize: decoration.size || '48px',
            }}
            aria-hidden={!!decoration.imagePath}
          >
            {decoration.emoji}
          </span>
        </div>
      ))}

      {/* Zone highlights removed - items now sit directly in world without visible background indicators */}

      {/* Spotlight Effect */}
      <div 
        className="spotlight"
        style={{
          background: `radial-gradient(ellipse at center, ${environment.spotlight.color} 0%, transparent 70%)`,
          opacity: environment.spotlight.opacity,
        }}
      />
    </div>
  );
};

export default EnvironmentRenderer;

