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

  const environment = useMemo(() => getEnvironmentConfig(normalizedPetType), [normalizedPetType]);

  return (
    <div 
      className="environment-renderer"
      style={{
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
          }}
        >
          {decoration.emoji}
        </div>
      ))}

      {/* Zone Highlights (subtle background indicators) */}
      <div className="zone-highlights">
        <div 
          className="zone-highlight feed-zone"
          style={{
            left: environment.layout.feed.x,
            top: environment.layout.feed.y,
            backgroundColor: environment.floorHighlights.feed,
          }}
        />
        <div 
          className="zone-highlight rest-zone"
          style={{
            left: environment.layout.rest.x,
            top: environment.layout.rest.y,
            backgroundColor: environment.floorHighlights.rest,
          }}
        />
        <div 
          className="zone-highlight play-zone"
          style={{
            left: environment.layout.play.x,
            top: environment.layout.play.y,
            backgroundColor: environment.floorHighlights.play,
          }}
        />
        <div 
          className="zone-highlight clean-zone"
          style={{
            left: environment.layout.clean.x,
            top: environment.layout.clean.y,
            backgroundColor: environment.floorHighlights.clean,
          }}
        />
      </div>

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

