import { render, screen, fireEvent } from '@testing-library/react';
import Onboarding from './Onboarding';
import { UserContext } from '../context/UserContext';

const mockUpdateUserProfile = jest.fn();
const mockSetOnboardingComplete = jest.fn();
const mockOnComplete = jest.fn();

const renderWithContext = (ui) => {
  return render(
    <UserContext.Provider value={{
        updateUserProfile: mockUpdateUserProfile,
        setOnboardingComplete: mockSetOnboardingComplete
    }}>
      {ui}
    </UserContext.Provider>
  );
};

describe('Onboarding Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
    window.confirm = jest.fn(() => true); // Auto-confirm warnings
  });

  test('Step 1: Verification requires email', () => {
    renderWithContext(<Onboarding onComplete={mockOnComplete} />);

    // Check initial render
    expect(screen.getByText(/Step 1: Verification/i)).toBeInTheDocument();

    const verifyButton = screen.getByText('Verify Email');

    // Click without email
    fireEvent.click(verifyButton);
    expect(window.alert).toHaveBeenCalledWith("Please enter a valid email.");

    // Fill invalid email
    fireEvent.change(screen.getByPlaceholderText(/nurse.joy@example.com/i), { target: { value: 'bademail' } });
    fireEvent.click(verifyButton);
    expect(window.alert).toHaveBeenCalledWith("Please enter a valid email.");
  });

  test('Step 2: Can skip profile setup', async () => {
    // Mock valid state for step 2 by starting there? Hard to control internal state.
    // Instead, simulate flow.
    renderWithContext(<Onboarding onComplete={mockOnComplete} />);

    // Step 1 Success
    fireEvent.change(screen.getByPlaceholderText(/nurse.joy@example.com/i), { target: { value: 'test@email.com' } });
    fireEvent.click(screen.getByText('Verify Email'));

    // Wait for timeout in component (1s)
    await new Promise(r => setTimeout(r, 1100));

    // Should be on Step 2
    expect(screen.getByText(/Step 2: Profile Setup/i)).toBeInTheDocument();

    // Click Skip
    fireEvent.click(screen.getByText('Skip'));

    // Should confirm (mocked true) and move to Step 3
    expect(screen.getByText(/Step 3: Vibe Check/i)).toBeInTheDocument();
  });

  test('Step 3: Can skip vibe check', async () => {
    renderWithContext(<Onboarding onComplete={mockOnComplete} />);

    // Fast forward to Step 3
    // Step 1
    fireEvent.change(screen.getByPlaceholderText(/nurse.joy@example.com/i), { target: { value: 'test@email.com' } });
    fireEvent.click(screen.getByText('Verify Email'));
    await new Promise(r => setTimeout(r, 1100));

    // Step 2
    fireEvent.click(screen.getByText('Skip'));

    // Step 3
    expect(screen.getByText(/Step 3: Vibe Check/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Skip'));

    // Step 4
    expect(screen.getByText(/Tutorial/i)).toBeInTheDocument();
  });

  test('Step 4: Completes onboarding', async () => {
    renderWithContext(<Onboarding onComplete={mockOnComplete} />);

    // Fast forward
    fireEvent.change(screen.getByPlaceholderText(/nurse.joy@example.com/i), { target: { value: 'test@email.com' } });
    fireEvent.click(screen.getByText('Verify Email'));
    await new Promise(r => setTimeout(r, 1100));

    fireEvent.click(screen.getByText('Skip')); // Step 2
    fireEvent.click(screen.getByText('Skip')); // Step 3

    // Step 4
    fireEvent.click(screen.getByText(/Get Started/i));

    expect(mockUpdateUserProfile).toHaveBeenCalled();
    expect(mockSetOnboardingComplete).toHaveBeenCalledWith(true);
    expect(mockOnComplete).toHaveBeenCalled();
  });
});
