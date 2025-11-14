/**
 * PetInteractionPanel Usage Examples
 * 
 * This file demonstrates how to use the PetInteractionPanel component
 * in various scenarios.
 */

import React from 'react';
import { PetInteractionPanel } from './PetInteractionPanel';

// ============================================================================
// Example 1: Basic Usage (Both Sections)
// ============================================================================

export const BasicExample: React.FC = () => {
  const handlePetNameSubmit = (name: string) => {
    console.log('Pet name submitted:', name);
    // Here you would typically:
    // 1. Save the name to your backend
    // 2. Update your pet state
    // 3. Navigate to the next page
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PetInteractionPanel
        onPetNameSubmit={handlePetNameSubmit}
      />
    </div>
  );
};

// ============================================================================
// Example 2: Naming Only
// ============================================================================

export const NamingOnlyExample: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <PetInteractionPanel
        showNaming={true}
        showCommands={false}
        initialPetName=""
        onPetNameSubmit={(name) => {
          console.log('Pet name:', name);
        }}
      />
    </div>
  );
};

// ============================================================================
// Example 3: Commands Only
// ============================================================================

export const CommandsOnlyExample: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <PetInteractionPanel
        showNaming={false}
        showCommands={true}
      />
    </div>
  );
};

// ============================================================================
// Example 4: With Custom API URL
// ============================================================================

export const CustomApiUrlExample: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <PetInteractionPanel
        apiBaseUrl="https://api.example.com"
        onPetNameSubmit={(name) => {
          console.log('Pet name:', name);
        }}
      />
    </div>
  );
};

// ============================================================================
// Example 5: With Initial Pet Name
// ============================================================================

export const WithInitialNameExample: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <PetInteractionPanel
        initialPetName="Buddy"
        onPetNameSubmit={(name) => {
          console.log('Pet name updated:', name);
        }}
      />
    </div>
  );
};

// ============================================================================
// Example 6: Full Page Layout
// ============================================================================

export const FullPageExample: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Virtual Pet App
          </h1>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8">
        <PetInteractionPanel
          onPetNameSubmit={(name) => {
            // Handle pet name submission
            console.log('Pet name:', name);
          }}
        />
      </main>
    </div>
  );
};

