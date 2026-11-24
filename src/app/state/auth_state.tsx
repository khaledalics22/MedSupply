import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { PasswordChangeInput, ProfileUpdateInput, RegistrationInput, User } from '../models/auth';
import { authService } from '../models/auth_service';

type AuthStateContextValue = {
  user: User | null;
  isRestoring: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegistrationInput) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (input: ProfileUpdateInput) => Promise<User>;
  changePassword: (input: PasswordChangeInput) => Promise<void>;
};

const AuthStateContext = createContext<AuthStateContextValue | undefined>(undefined);

export function AuthStateProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    authService.restoreSession().then((restored) => {
      setUser(restored);
      setIsRestoring(false);
    }).catch(() => setIsRestoring(false));
  }, []);

  const login = async (email: string, password: string) => {
    const authenticatedUser = await authService.login(email, password);
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  const register = async (input: RegistrationInput) => {
    const registeredUser = await authService.register(input);
    setUser(null);
    await authService.logout();
    return registeredUser;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateProfile = async (input: ProfileUpdateInput) => {
    if (!user) throw new Error('You must be logged in to update your profile.');
    const updatedUser = await authService.updateProfile(user.id, input);
    setUser(updatedUser);
    return updatedUser;
  };

  const changePassword = async (input: PasswordChangeInput) => {
    if (!user) throw new Error('You must be logged in to change your password.');
    await authService.changePassword(user.id, input);
  };

  const value = useMemo(() => ({ user, isRestoring, login, register, updateProfile, changePassword, logout }), [user, isRestoring]);
  return <AuthStateContext.Provider value={value}>{children}</AuthStateContext.Provider>;
}

function normalizeEmail(email: string) { return email.trim().toLowerCase(); }

export function useAuthState(): AuthStateContextValue {
  const context = useContext(AuthStateContext);
  if (!context) throw new Error('useAuthState must be used within AuthStateProvider');
  return context;
}
