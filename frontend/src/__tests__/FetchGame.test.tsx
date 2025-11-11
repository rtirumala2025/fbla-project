import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import FetchGame from '../pages/minigames/FetchGame';

describe('FetchGame', () => {
  it('renders and allows throw and skip', () => {
    const onComplete = jest.fn();
    render(
      <MemoryRouter>
        <FetchGame onComplete={onComplete} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText(/Throw/i));
    fireEvent.click(screen.getByText(/Skip for demo/i));
    expect(onComplete).toHaveBeenCalled();
  });
});


