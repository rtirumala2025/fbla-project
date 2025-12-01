import React from 'react';
import { ARPetMode } from '../../features/ar';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function ARPetModePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  return (
    <ARPetMode
      petName={currentUser?.displayName || 'Your Pet'}
      onClose={() => navigate('/dashboard')}
    />
  );
}
