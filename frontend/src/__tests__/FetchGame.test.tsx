import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import FetchGame from '../pages/minigames/FetchGame';

const toastMock = { success: vi.fn(), error: vi.fn(), info: vi.fn() };
const mockStartRound = vi.fn().mockResolvedValue(undefined);
const mockSubmitScore = vi.fn().mockResolvedValue({
  rewards: [],
  score: 0,
  multiplier: 1,
  earned_coins: 0,
});
const cycleDifficultyMock = vi.fn().mockResolvedValue(undefined);
const useMiniGameRoundMock = {
  difficulty: 'easy',
  aiProfile: null as null | {
    recommended_difficulty: string;
    confidence: number;
    recent_average: number;
    skill_rating: number;
    current_streak?: number;
    daily_streak?: number;
    pet_mood?: string;
  },
  leaderboard: [] as unknown[],
  submitScore: mockSubmitScore,
  cycleDifficulty: cycleDifficultyMock,
  rewardsRefreshKey: 'test-key',
  roundError: null as string | null,
  longestStreak: 0,
  loadingRound: false,
  startRound: mockStartRound,
};

vi.mock('../contexts/ToastContext', () => ({
  useToast: () => toastMock,
}));

vi.mock('../hooks/useMiniGameRound', () => ({
  useMiniGameRound: () => useMiniGameRoundMock,
}));

vi.mock('../components/minigames/GameRewardsSummary', () => ({
  GameRewardsSummary: () => null,
}));

vi.mock('../components/minigames/GameLeaderboardPanel', () => ({
  GameLeaderboardPanel: () => null,
}));

vi.mock('../components/minigames/GameResultOverlay', () => ({
  GameResultOverlay: () => null,
}));

vi.mock('../components/minigames/DailyChallengeCard', () => ({
  DailyChallengeCard: () => null,
}));

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(useMiniGameRoundMock, {
    difficulty: 'easy',
    aiProfile: null,
    leaderboard: [],
    submitScore: mockSubmitScore,
    cycleDifficulty: cycleDifficultyMock,
    rewardsRefreshKey: 'test-key',
    roundError: null,
    longestStreak: 0,
    loadingRound: false,
    startRound: mockStartRound,
  });
  toastMock.success.mockClear();
  toastMock.error.mockClear();
  toastMock.info.mockClear();
  cycleDifficultyMock.mockResolvedValue(undefined);
  mockSubmitScore.mockResolvedValue({
    rewards: [],
    score: 0,
    multiplier: 1,
    earned_coins: 0,
  });
});

describe('FetchGame', () => {
  it('renders and requests a new round on reset', () => {
    render(
      <MemoryRouter>
        <FetchGame />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText(/Reset/i));
    expect(mockStartRound).toHaveBeenCalled();
  });

  it('submits score after completing all rounds', async () => {
    render(
      <MemoryRouter>
        <FetchGame />
      </MemoryRouter>
    );

    const catchButton = screen.getByRole('button', { name: /Catch the ball/i });

    fireEvent.click(catchButton);
    fireEvent.click(catchButton);
    fireEvent.click(catchButton);

    await waitFor(() => expect(mockSubmitScore).toHaveBeenCalled());
  });

  it('displays AI profile insights with confidence label', () => {
    useMiniGameRoundMock.aiProfile = {
      recommended_difficulty: 'medium',
      confidence: 0.72,
      recent_average: 87.5,
      skill_rating: 92.4,
      current_streak: 2,
      daily_streak: 5,
      pet_mood: 'Playful',
    };

    render(
      <MemoryRouter>
        <FetchGame />
      </MemoryRouter>
    );

    expect(screen.getByText(/72%/)).toBeInTheDocument();
    expect(screen.getByText(/Recommended difficulty/i)).toBeInTheDocument();
  });

  it('surfaces async round errors', () => {
    useMiniGameRoundMock.roundError = 'Network issue';

    render(
      <MemoryRouter>
        <FetchGame />
      </MemoryRouter>
    );

    expect(toastMock.error).toHaveBeenCalledWith('Network issue');
  });

  it('cycles difficulty on button click', async () => {
    render(
      <MemoryRouter>
        <FetchGame />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /easy/i }));
    await waitFor(() => expect(cycleDifficultyMock).toHaveBeenCalled());
  });

  it('shows errors when score submission fails', async () => {
    mockSubmitScore.mockRejectedValueOnce(new Error('score failed'));

    render(
      <MemoryRouter>
        <FetchGame />
      </MemoryRouter>
    );

    const catchButton = screen.getByRole('button', { name: /Catch the ball/i });

    fireEvent.click(catchButton);
    fireEvent.click(catchButton);
    fireEvent.click(catchButton);

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith('score failed'));
  });
});


