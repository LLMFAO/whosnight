import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'mom' | 'dad' | 'teen';

interface UserContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  userId: number;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('mom');
  
  const getUserId = (role: UserRole): number => {
    switch (role) {
      case 'mom': return 1;
      case 'dad': return 2;
      case 'teen': return 3;
      default: return 1;
    }
  };

  return (
    <UserContext.Provider 
      value={{ 
        currentRole, 
        setCurrentRole, 
        userId: getUserId(currentRole) 
      }}
    >
      {children}
    </UserContext.Provider>
  );
};