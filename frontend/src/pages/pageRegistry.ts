import React, { lazy } from 'react';

// Centralized page registry - single source of truth for all page imports
// This eliminates fragile dynamic imports and ensures compile-time visibility

// Core pages with explicit default export handling
export const Pages = {
  // Public pages
  LandingPage: lazy(() => import('./LandingPage').then(m => ({ default: m.LandingPage }))),
  Login: lazy(() => import('./Login').then(m => ({ default: m.Login }))),
  Register: lazy(() => import('./Register').then(m => ({ default: m.Register }))),
  SignUp: lazy(() => import('./Signup').then(m => ({ default: m.SignUp }))),
  AuthCallback: lazy(() => import('./AuthCallback').then(m => ({ default: m.AuthCallback }))),
  
  // Onboarding pages
  SetupProfile: lazy(() => import('./SetupProfile').then(m => ({ default: m.SetupProfile }))),
  SpeciesSelection: lazy(() => import('./SpeciesSelection').then(m => ({ default: m.SpeciesSelection }))),
  BreedSelection: lazy(() => import('./BreedSelection').then(m => ({ default: m.BreedSelection }))),
  PetNaming: lazy(() => import('./PetNaming').then(m => ({ default: m.PetNaming }))),
  PetSelectionPage: lazy(() => import('./PetSelectionPage')),
  CreatePetPage: lazy(() => import('./CreatePetPage').then(m => ({ default: m.CreatePetPage }))),
  
  // Main app pages
  DashboardPage: lazy(() => import('./DashboardPage').then(m => ({ default: m.DashboardPage }))),
  Shop: lazy(() => import('./Shop').then(m => ({ default: m.Shop }))),
  Inventory: lazy(() => import('./Inventory').then(m => ({ default: m.Inventory }))),
  ProfilePage: lazy(() => import('./ProfilePage').then(m => ({ default: m.ProfilePage }))),
  GameUI: lazy(() => import('./GameUI').then(m => ({ default: m.GameUI }))),
  
  // Feature pages with default exports
  BudgetDashboard: lazy(() => import('./budget/BudgetDashboard')),
  CleanScreen: lazy(() => import('./clean/CleanScreen')),
  RestScreen: lazy(() => import('./rest/RestScreen')),
  HealthCheckScreen: lazy(() => import('./health/HealthCheckScreen')),
  SettingsScreen: lazy(() => import('./settings/SettingsScreen')),
  HelpScreen: lazy(() => import('./help/HelpScreen')),
  
  // Mini-games
  FetchGame: lazy(() => import('./minigames/FetchGame')),
  PuzzleGame: lazy(() => import('./minigames/PuzzleGame')),
  ReactionGame: lazy(() => import('./minigames/ReactionGame')),
  DreamWorld: lazy(() => import('./minigames/DreamWorld')),
  MemoryMatchGame: lazy(() => import('./minigames/MemoryMatchGame')),
  
  // Advanced features
  EventCalendarPage: lazy(() => import('./events/EventCalendarPage').then(m => ({ default: m.EventCalendarPage }))),
  NextGenHub: lazy(() => import('./nextgen/NextGenHub').then(m => ({ default: m.NextGenHub }))),
  AvatarStudio: lazy(() => import('./pets/AvatarStudio').then(m => ({ default: m.AvatarStudio }))),
  SocialHub: lazy(() => import('./social/SocialHub').then(m => ({ default: m.SocialHub }))),
  SocialFeaturesPage: lazy(() => import('./social/SocialFeaturesPage').then(m => ({ default: m.SocialFeaturesPage }))),
  AnalyticsDashboard: lazy(() => import('./analytics/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard }))),
  ARPetModePage: lazy(() => import('./ar/ARPetModePage').then(m => ({ default: m.ARPetModePage }))),
  HabitPredictionPage: lazy(() => import('./habits/HabitPredictionPage').then(m => ({ default: m.HabitPredictionPage }))),
  FinanceSimulatorPage: lazy(() => import('./finance_sim/FinanceSimulatorPage').then(m => ({ default: m.FinanceSimulatorPage }))),
  ReportsPage: lazy(() => import('./reports/ReportsPage').then(m => ({ default: m.ReportsPage }))),
  
  // Special case: PetGameScreen with error handling
  PetGameScreen: lazy(() => import('./PetGameScreen')),
  PetGame2Screen: lazy(() => import('./PetGame2Screen').then(m => ({ default: m.PetGame2Screen }))),
} as const;

// Type definition for page keys to enable compile-time checking
export type PageKey = keyof typeof Pages;

// Export a type-safe page getter function (optional, for additional type safety)
export function getPage<T extends PageKey>(key: T): typeof Pages[T] {
  return Pages[key];
}
