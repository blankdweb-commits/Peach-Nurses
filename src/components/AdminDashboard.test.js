import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';
import { AdminContext } from '../context/AdminContext';
import { UserContext } from '../context/UserContext';

const renderAdmin = (ui, { isAdmin, loginAdmin, logoutAdmin, deleteUser, banUser, subscription, potentialMatches }) => {
  return render(
    <UserContext.Provider value={{ subscription, potentialMatches }}>
      <AdminContext.Provider value={{ isAdmin, loginAdmin, logoutAdmin, deleteUser, banUser }}>
        {ui}
      </AdminContext.Provider>
    </UserContext.Provider>
  );
};

const mockUser = { id: 1, alias: "User1", realName: "Real1", banned: false };
const mockSubscription = { isPremium: false, dailyUnripes: 0, lastReset: '2023-01-01' };

describe('Admin Dashboard', () => {
  test('shows login form when not logged in', () => {
    renderAdmin(<AdminDashboard />, {
      isAdmin: false,
      loginAdmin: jest.fn(),
      logoutAdmin: jest.fn(),
      deleteUser: jest.fn(),
      banUser: jest.fn(),
      subscription: mockSubscription,
      potentialMatches: []
    });

    expect(screen.getByText("Admin Login")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Admin Password")).toBeInTheDocument();
  });

  test('calls loginAdmin with password', () => {
    const loginAdmin = jest.fn();
    renderAdmin(<AdminDashboard />, {
      isAdmin: false,
      loginAdmin,
      logoutAdmin: jest.fn(),
      deleteUser: jest.fn(),
      banUser: jest.fn(),
      subscription: mockSubscription,
      potentialMatches: []
    });

    fireEvent.change(screen.getByPlaceholderText("Enter Admin Password"), { target: { value: 'password' } });
    fireEvent.click(screen.getByText("Login"));

    expect(loginAdmin).toHaveBeenCalledWith('password');
  });

  test('shows dashboard when logged in', () => {
    renderAdmin(<AdminDashboard />, {
      isAdmin: true,
      loginAdmin: jest.fn(),
      logoutAdmin: jest.fn(),
      deleteUser: jest.fn(),
      banUser: jest.fn(),
      subscription: mockSubscription,
      potentialMatches: [mockUser]
    });

    expect(screen.getByText("Admin Dashboard 🛠️")).toBeInTheDocument();
    expect(screen.getByText("User1")).toBeInTheDocument();
  });

  test('calls banUser when Ban button clicked', () => {
    const banUser = jest.fn();
    renderAdmin(<AdminDashboard />, {
      isAdmin: true,
      loginAdmin: jest.fn(),
      logoutAdmin: jest.fn(),
      deleteUser: jest.fn(),
      banUser,
      subscription: mockSubscription,
      potentialMatches: [mockUser]
    });

    fireEvent.click(screen.getByText("Ban"));
    expect(banUser).toHaveBeenCalledWith(1);
  });

  test('calls deleteUser when Delete button clicked', () => {
    const deleteUser = jest.fn();
    renderAdmin(<AdminDashboard />, {
      isAdmin: true,
      loginAdmin: jest.fn(),
      logoutAdmin: jest.fn(),
      deleteUser,
      banUser: jest.fn(),
      subscription: mockSubscription,
      potentialMatches: [mockUser]
    });

    fireEvent.click(screen.getByText("Delete"));
    expect(deleteUser).toHaveBeenCalledWith(1);
  });
});
