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

export const EnvironmentRenderer: React.FC<EnvironmentRendererProps> = ({ petType }) => {
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
      return getEnvironmentConfig('dog');
    }
  }, [normalizedPetType]);

  if (!environment) {
    return (
      <div className="environment-renderer" style={{ background: '#B4D7E8' }}>
        <div style={{ padding: '20px', color: 'red' }}>Environment Error</div>
      </div>
    );
  }

  return (
    <div
      className="environment-renderer"
      style={{
        background: `linear-gradient(
          to bottom,
          ${environment.room.wallTop} 0%,
          ${environment.room.wallBottom} 48%,
          ${environment.room.wallBottom} 52%,
          ${environment.room.floor} 58%,
          ${environment.room.floorLight} 100%
        )`,
      }}
    >
      {/* Background light */}
      <div
        className="background-layer"
        style={{
          background: `radial-gradient(
            ellipse at center 30%,
            ${environment.room.wallTop} 0%,
            transparent 60%
          )`,
          opacity: 0.18,
          filter: 'blur(28px) saturate(0.85)',
        }}
      />

      {/* Floor */}
      <div className="midground-layer" style={{ bottom: 0, height: '38%' }}>
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

        {/* Zone tints */}
        <div className="zone-tints">
          <div
            className="zone-tint"
            style={{
              left: '10%',
              bottom: '20%',
              width: '25%',
              height: '30%',
              background: `radial-gradient(ellipse, ${environment.floorHighlights.feed} 0%, transparent 70%)`,
              opacity: 0.28,
            }}
          />
          <div
            className="zone-tint"
            style={{
              right: '10%',
              bottom: '20%',
              width: '25%',
              height: '30%',
              background: `radial-gradient(ellipse, ${environment.floorHighlights.rest} 0%, transparent 70%)`,
              opacity: 0.28,
            }}
          />
          <div
            className="zone-tint"
            style={{
              right: '10%',
              top: '35%',
              width: '25%',
              height: '30%',
              background: `radial-gradient(ellipse, ${environment.floorHighlights.play} 0%, transparent 70%)`,
              opacity: 0.22,
            }}
          />
          <div
            className="zone-tint"
            style={{
              left: '10%',
              top: '35%',
              width: '25%',
              height: '30%',
              background: `radial-gradient(ellipse, ${environment.floorHighlights.clean} 0%, transparent 70%)`,
              opacity: 0.22,
            }}
          />
        </div>
      </div>

      {/* Window & decor */}
      <div className="midground-layer">
        {environment.window.show && (
          <div className="window-container">
            <div
              className="window"
              style={{
                background:
                  environment.window.style === 'outdoor'
                    ? 'radial-gradient(circle, rgba(135,206,250,0.35), rgba(176,224,230,0.15))'
                    : 'linear-gradient(to bottom, rgba(135,206,250,0.25), rgba(255,255,255,0.1))',
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

        {environment.decorations.map((decoration, index) => (
          <div
            key={`decoration-${index}`}
            className="decoration"
            style={{
              ...decoration.position,
              opacity: decoration.opacity,
              width: decoration.size || '64px',
              height: decoration.size || '64px',
            }}
          >
            <div className="decoration-shadow" />
            {decoration.imagePath ? (
              <img
                src={decoration.imagePath}
                alt={decoration.emoji}
                className="decoration-image"
              />
            ) : (
              <span className="decoration-emoji-fallback">{decoration.emoji}</span>
            )}
          </div>
        ))}
      </div>

      {/* Spotlight */}
      <div
        className="spotlight"
        style={{
          background: `radial-gradient(
            ellipse at center top,
            ${environment.spotlight.color} 0%,
            rgba(255,255,255,0.12) 30%,
            transparent 65%
          )`,
          opacity: environment.spotlight.opacity,
        }}
      />
    </div>
  );
};

export default EnvironmentRenderer;