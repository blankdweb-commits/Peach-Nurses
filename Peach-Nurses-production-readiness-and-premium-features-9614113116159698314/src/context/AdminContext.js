import React, { createContext, useState, useContext } from 'react';
import { useUser } from './UserContext';

export const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const { deleteUser, banUser } = useUser(); // Access actions from UserContext

  const loginAdmin = (password) => {
    // Simple password check for prototype
    const adminPass = process.env.REACT_APP_ADMIN_PASSWORD || 'admin123';
    if (password === adminPass) {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
  };

  return (
    <AdminContext.Provider value={{
      isAdmin,
      loginAdmin,
      logoutAdmin,
      // Pass through user management functions
      deleteUser,
      banUser
    }}>
      {children}
    </AdminContext.Provider>
  );
};
