import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import FeedScreen from '../pages/feed/FeedScreen';

// Minimal mocks for contexts to allow rendering
jest.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ currentUser: { uid: 'u1' } }) }));
jest.mock('../context/PetContext', () => ({ usePet: () => ({ pet: { name: 'Buddy', stats: { hunger: 50, happiness: 50, health: 90 } }, updatePetStats: jest.fn() }) }));
jest.mock('../contexts/ToastContext', () => ({ useToast: () => ({ success: jest.fn(), error: jest.fn(), info: jest.fn() }) }));

describe('FeedScreen', () => {
  it('renders food options', () => {
    render(
      <MemoryRouter>
        <FeedScreen />
      </MemoryRouter>
    );
    expect(screen.getByText(/Feed Buddy/i)).toBeInTheDocument();
    expect(screen.getByText(/Basic Kibble/i)).toBeInTheDocument();
  });
});


