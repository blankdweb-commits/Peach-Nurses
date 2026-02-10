import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Discover from './Discover';
import { UserContext } from '../context/UserContext';
import { act } from 'react';

// Helper to provide context
const renderWithContext = (ui, { subscription, userProfile, potentialMatches, ripenMatch, isRipped, incrementAdsSeen }) => {
  return render(
    <UserContext.Provider value={{ subscription, userProfile, potentialMatches, ripenMatch, isRipped, incrementAdsSeen }}>
      {ui}
    </UserContext.Provider>
  );
};

const mockUserProfile = {
  alias: "TestUser",
  basics: { fun: ["A"], media: ["X"] },
  life: { based: "Sapele", upbringing: "Strict" },
  work: { job: "Nurse", reason: "Love it" },
  relationships: { values: ["Honesty"], lookingFor: "Long-term" },
  vision: "Peace",
  special: "Love"
};

const mockMatch = {
  id: 1,
  alias: "Match1",
  level: "Year 2",
  realName: "Name1",
  photoUrl: "url",
  distance: 1,
  basics: { fun: ["A"], media: ["X"] },
  life: { based: "Sapele", upbringing: "Strict" },
  work: { job: "Nurse", reason: "Love it" },
  relationships: { values: ["Honesty"], lookingFor: "Long-term" },
  vision: "Peace",
  special: "Love"
};

const mockMatch2 = { ...mockMatch, id: 2, alias: "Match2" };
const mockMatch3 = { ...mockMatch, id: 3, alias: "Match3" };
const mockMatch4 = { ...mockMatch, id: 4, alias: "Match4" };

const mockSubscription = { isPremium: false, dailyUnripes: 0, lastReset: '2023-01-01' };

describe('Discover Component Ads', () => {
  let originalMathRandom;

  beforeEach(() => {
    originalMathRandom = Math.random;
    Math.random = jest.fn(() => 0.1); // Avoid random notifications interfering too much
    jest.useFakeTimers();
  });

  afterEach(() => {
    Math.random = originalMathRandom;
    jest.useRealTimers();
  });

  test('shows ad after 3 skips', async () => {
    const incrementAdsSeen = jest.fn();
    renderWithContext(
      <Discover onNavigateToStore={jest.fn()} />,
      {
        subscription: mockSubscription,
        userProfile: mockUserProfile,
        potentialMatches: [mockMatch, mockMatch2, mockMatch3, mockMatch4],
        ripenMatch: jest.fn(),
        isRipped: () => false,
        incrementAdsSeen
      }
    );

    // Initial state: Match 1
    expect(screen.getByText("Match1")).toBeInTheDocument();

    // Action 1: Skip
    fireEvent.click(screen.getByText("Skip"));
    expect(screen.getByText("Match2")).toBeInTheDocument();

    // Action 2: Skip
    fireEvent.click(screen.getByText("Skip"));
    expect(screen.getByText("Match3")).toBeInTheDocument();

    // Action 3: Skip -> Should trigger Ad
    fireEvent.click(screen.getByText("Skip"));

    // Check for Ad
    expect(screen.getByText("Sponsored Ad")).toBeInTheDocument();
    expect(screen.queryByText("Match4")).not.toBeInTheDocument();

    // Fast-forward ad timer
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Check Ad gone and Match 4 visible
    expect(screen.queryByText("Sponsored Ad")).not.toBeInTheDocument();
    expect(screen.getByText("Match4")).toBeInTheDocument(); // Index updated to 3 (Match4)
    expect(incrementAdsSeen).toHaveBeenCalled();
  });
});
