import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types.ts';
import { api } from '../services/api.ts';
import { logger } from '../utils/logger.ts';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: React.PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
          const parsedUser = JSON.parse(savedUser);
          api.setToken(token);
          setUser(parsedUser);
          setIsAuthenticated(true);
          logger.info('Session restored', { userId: parsedUser.id });
        }
      } catch (error) {
        logger.error('Failed to restore session', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    api.onUnauthorized(() => {
      logger.warn('Received unauthorized signal from API. Logging out.');
      logout();
    });
  }, []);

  const login = (userData: User, token: string) => {
    logger.info('User logged in', { userId: userData.id, role: userData.role });
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    api.setToken(token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    logger.info('User logged out');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    api.clearToken();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};