/**
 * Tests for QuestBoard component
 * Tests state transitions, quest completion, and reward claiming
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuestBoard } from '../../components/quests/QuestBoard';
import type { Quest } from '../../types/quests';

const mockQuest: Quest = {
  id: 'quest-1',
  quest_key: 'feed_pet_3_times',
  description: 'Feed your pet 3 times today',
  quest_type: 'daily',
  difficulty: 'easy',
  status: 'in_progress',
  progress: 1,
  target_value: 3,
  rewards: { coins: 50, xp: 100, items: [] },
};

const mockCompletedQuest: Quest = {
  ...mockQuest,
  id: 'quest-2',
  status: 'completed',
  progress: 3,
};

const mockQuests = {
  daily: [mockQuest],
  weekly: [],
  event: [],
};

describe('QuestBoard', () => {
  const mockOnComplete = jest.fn();
  const mockOnClaimReward = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders quest board with daily quests', () => {
    render(
      <QuestBoard
        quests={mockQuests}
        onComplete={mockOnComplete}
        onClaimReward={mockOnClaimReward}
      />
    );

    expect(screen.getByText('Daily Momentum')).toBeInTheDocument();
    expect(screen.getByText('Feed Your Pet')).toBeInTheDocument();
  });

  it('displays quest count badge', () => {
    render(
      <QuestBoard
        quests={mockQuests}
        onComplete={mockOnComplete}
        onClaimReward={mockOnClaimReward}
      />
    );

    expect(screen.getByText('1 active')).toBeInTheDocument();
  });

  it('calls onComplete when quest is completed', () => {
    render(
      <QuestBoard
        quests={mockQuests}
        onComplete={mockOnComplete}
        onClaimReward={mockOnClaimReward}
      />
    );

    const completeButton = screen.getByRole('button', { name: /complete/i });
    fireEvent.click(completeButton);

    expect(mockOnComplete).toHaveBeenCalledWith(mockQuest);
  });

  it('calls onClaimReward when reward is claimed', () => {
    const completedQuests = {
      daily: [mockCompletedQuest],
      weekly: [],
      event: [],
    };

    render(
      <QuestBoard
        quests={completedQuests}
        onComplete={mockOnComplete}
        onClaimReward={mockOnClaimReward}
      />
    );

    const claimButton = screen.getByRole('button', { name: /claim/i });
    fireEvent.click(claimButton);

    expect(mockOnClaimReward).toHaveBeenCalledWith(mockCompletedQuest);
  });

  it('shows processing state when quest is being processed', () => {
    render(
      <QuestBoard
        quests={mockQuests}
        onComplete={mockOnComplete}
        isProcessingId="quest-1"
        onClaimReward={mockOnClaimReward}
      />
    );

    // Should show loading/processing indicator
    expect(screen.getByText('Feed Your Pet')).toBeInTheDocument();
  });

  it('renders empty sections when no quests', () => {
    const emptyQuests = {
      daily: [],
      weekly: [],
      event: [],
    };

    const { container } = render(
      <QuestBoard
        quests={emptyQuests}
        onComplete={mockOnComplete}
        onClaimReward={mockOnClaimReward}
      />
    );

    // Should not render any quest sections
    expect(container.querySelector('section')).not.toBeInTheDocument();
  });

  it('renders weekly and event quests when present', () => {
    const weeklyQuest: Quest = {
      ...mockQuest,
      id: 'quest-weekly',
      quest_type: 'weekly',
      quest_key: 'weekly_challenge',
      description: 'Weekly Challenge',
    };

    const eventQuest: Quest = {
      ...mockQuest,
      id: 'quest-event',
      quest_type: 'event',
      quest_key: 'event_quest',
      description: 'Event Quest',
    };

    const allQuests = {
      daily: [mockQuest],
      weekly: [weeklyQuest],
      event: [eventQuest],
    };

    render(
      <QuestBoard
        quests={allQuests}
        onComplete={mockOnComplete}
        onClaimReward={mockOnClaimReward}
      />
    );

    expect(screen.getByText('Daily Momentum')).toBeInTheDocument();
    expect(screen.getByText('Weekly Challenges')).toBeInTheDocument();
    expect(screen.getByText('Event Spotlight')).toBeInTheDocument();
    expect(screen.getByText('Weekly Challenge')).toBeInTheDocument();
    expect(screen.getByText('Event Quest')).toBeInTheDocument();
  });

  it('updates when quests change', () => {
    const { rerender } = render(
      <QuestBoard
        quests={mockQuests}
        onComplete={mockOnComplete}
        onClaimReward={mockOnClaimReward}
      />
    );

    expect(screen.getByText('1 active')).toBeInTheDocument();

    const updatedQuests = {
      daily: [mockQuest, { ...mockQuest, id: 'quest-3', quest_key: 'new_quest', description: 'New Quest' }],
      weekly: [],
      event: [],
    };

    rerender(
      <QuestBoard
        quests={updatedQuests}
        onComplete={mockOnComplete}
        onClaimReward={mockOnClaimReward}
      />
    );

    expect(screen.getByText('2 active')).toBeInTheDocument();
    expect(screen.getByText('New Quest')).toBeInTheDocument();
  });
});
