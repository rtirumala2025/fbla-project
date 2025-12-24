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

// REMOVED: All decoration idle animations to fix performance regression
// Decorations remain static for stability

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
        // Soft gradient transition: sky ~55-60%, ground ~40-45%, no hard split
        background: `linear-gradient(to bottom, ${environment.room.wallTop} 0%, ${environment.room.wallBottom} 40%, ${environment.room.wallBottom} 55%, ${environment.room.floor} 60%, ${environment.room.floorLight} 100%)`,
      }}
    >
      {/* Background Layer - distant decorative elements with reduced saturation and blur */}
      <div 
        className="background-layer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(ellipse at center 30%, ${environment.room.wallTop} 0%, transparent 60%)`,
          opacity: 0.25,
          filter: 'blur(50px) saturate(0.7)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      
      {/* Midground Layer - floor pattern and zone tints */}
      <div 
        className="midground-layer"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '45%',
          zIndex: 2,
        }}
      >
        {/* Floor Pattern */}
        <div 
          className="floor-pattern"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '100%',
            background: `repeating-linear-gradient(
              90deg,
              ${environment.room.floor} 0px,
              ${environment.room.floorAccent} 2px,
              ${environment.room.floor} 4px
            )`,
            opacity: 0.6,
            pointerEvents: 'none',
          }}
        />

        {/* Subtle Zone Tints - Visual grouping only, no visible UI */}
        <div className="zone-tints">
          {/* Feeding Zone - bottom left */}
          <div 
            className="zone-tint zone-tint-feed"
            style={{
              position: 'absolute',
              left: '10%',
              bottom: '20%',
              width: '25%',
              height: '30%',
              background: `radial-gradient(ellipse, ${environment.floorHighlights.feed} 0%, transparent 70%)`,
              borderRadius: '50%',
              pointerEvents: 'none',
              opacity: 0.3,
            }}
          />
          {/* Resting Zone - bottom right */}
          <div 
            className="zone-tint zone-tint-rest"
            style={{
              position: 'absolute',
              right: '10%',
              bottom: '20%',
              width: '25%',
              height: '30%',
              background: `radial-gradient(ellipse, ${environment.floorHighlights.rest} 0%, transparent 70%)`,
              borderRadius: '50%',
              pointerEvents: 'none',
              opacity: 0.3,
            }}
          />
          {/* Play Zone - top right */}
          <div 
            className="zone-tint zone-tint-play"
            style={{
              position: 'absolute',
              right: '10%',
              top: '35%',
              width: '25%',
              height: '30%',
              background: `radial-gradient(ellipse, ${environment.floorHighlights.play} 0%, transparent 70%)`,
              borderRadius: '50%',
              pointerEvents: 'none',
              opacity: 0.3,
            }}
          />
          {/* Clean Zone - top left */}
          <div 
            className="zone-tint zone-tint-clean"
            style={{
              position: 'absolute',
              left: '10%',
              top: '35%',
              width: '25%',
              height: '30%',
              background: `radial-gradient(ellipse, ${environment.floorHighlights.clean} 0%, transparent 70%)`,
              borderRadius: '50%',
              pointerEvents: 'none',
              opacity: 0.3,
            }}
          />
        </div>
      </div>

      {/* Midground Layer - Window and decorative elements */}
      <div 
        className="midground-layer"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 3,
          pointerEvents: 'none',
        }}
      >
        {/* Window (if enabled) - midground with slight blur */}
        {environment.window.show && (
          <div className="window-container">
            <div 
              className="window"
              style={{
                background: environment.window.style === 'outdoor' 
                  ? 'radial-gradient(circle, rgba(135, 206, 250, 0.3), rgba(176, 224, 230, 0.1))'
                  : 'linear-gradient(to bottom, rgba(135, 206, 250, 0.2), rgba(255, 255, 255, 0.1))',
                filter: 'blur(1px) saturate(0.9)',
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

        {/* Decorative Elements - midground with reduced saturation */}
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
          {/* Contact shadow for decoration */}
          <div 
            className="decoration-shadow"
            style={{
              position: 'absolute',
              bottom: '-8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60%',
              height: '12px',
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none',
              zIndex: -1,
              filter: 'blur(4px)',
            }}
          />
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
                filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.35)) brightness(1.05) saturate(0.85) blur(0.5px)',
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
              filter: 'saturate(0.85) blur(0.5px)',
            }}
            aria-hidden={!!decoration.imagePath}
          >
            {decoration.emoji}
          </span>
        </div>
      ))}
      </div>

      {/* Spotlight Effect - background layer */}
      <div 
        className="spotlight"
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          height: '60%',
          background: `radial-gradient(ellipse at center, ${environment.spotlight.color} 0%, transparent 70%)`,
          opacity: environment.spotlight.opacity,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
    </div>
  );
};

export default EnvironmentRenderer;

