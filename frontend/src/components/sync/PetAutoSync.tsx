/**
 * PetAutoSync Component
 * Handles automatic syncing when pet state changes
 * Must be rendered inside PetProvider to access usePet hook
 */
import { useAutoSync } from '../../hooks/useAutoSync';

export const PetAutoSync: React.FC = () => {
  useAutoSync();
  return null;
};

