import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';
import { UserContext } from '../context/UserContext';
import { AdminContext } from '../context/AdminContext';

const renderAdmin = (ui, { isAdmin, loginAdmin, deleteUser, banUser, potentialMatches }) => {
  const fetchAllProfiles = jest.fn();
  return render(
    <UserContext.Provider value={{ potentialMatches, fetchAllProfiles }}>
      <AdminContext.Provider value={{ isAdmin, loginAdmin, deleteUser, banUser }}>
        {ui}
      </AdminContext.Provider>
    </UserContext.Provider>
  );
};

const mockUser = { id: 1, username: "User1", email: "user1@example.com", banned: false };

describe('Admin Dashboard', () => {
  test('shows login form when not logged in', () => {
    renderAdmin(<AdminDashboard onBack={jest.fn()} />, {
      isAdmin: false,
      loginAdmin: jest.fn(),
      deleteUser: jest.fn(),
      banUser: jest.fn(),
      potentialMatches: []
    });

    expect(screen.getByText("Admin Login")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Admin Password")).toBeInTheDocument();
  });

  test('calls loginAdmin when Login button clicked', () => {
    const loginAdmin = jest.fn();
    renderAdmin(<AdminDashboard onBack={jest.fn()} />, {
      isAdmin: false,
      loginAdmin,
      deleteUser: jest.fn(),
      banUser: jest.fn(),
      potentialMatches: []
    });

    fireEvent.change(screen.getByPlaceholderText("Enter Admin Password"), { target: { value: 'password' } });
    fireEvent.click(screen.getByText("Login"));
    expect(loginAdmin).toHaveBeenCalledWith('password');
  });

  test('shows dashboard when logged in', () => {
    renderAdmin(<AdminDashboard onBack={jest.fn()} />, {
      isAdmin: true,
      loginAdmin: jest.fn(),
      deleteUser: jest.fn(),
      banUser: jest.fn(),
      potentialMatches: [mockUser]
    });

    expect(screen.getByText("Admin Console")).toBeInTheDocument();
    expect(screen.getByText("User1")).toBeInTheDocument();
  });

  test('calls banUser when Ban button clicked', () => {
    const banUser = jest.fn();
    renderAdmin(<AdminDashboard onBack={jest.fn()} />, {
      isAdmin: true,
      loginAdmin: jest.fn(),
      deleteUser: jest.fn(),
      banUser,
      potentialMatches: [mockUser]
    });

    fireEvent.click(screen.getByText("Ban"));
    expect(banUser).toHaveBeenCalledWith(1);
  });

  test('calls deleteUser when Delete button clicked', () => {
    const deleteUser = jest.fn();
    renderAdmin(<AdminDashboard onBack={jest.fn()} />, {
      isAdmin: true,
      loginAdmin: jest.fn(),
      deleteUser,
      banUser: jest.fn(),
      potentialMatches: [mockUser]
    });

    fireEvent.click(screen.getByText("Delete"));
    expect(deleteUser).toHaveBeenCalledWith(1);
  });
});
