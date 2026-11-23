import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { RegistrationInput, User } from '../models/auth';
import { authService } from '../models/auth_service';

type AuthStateContextValue = {
  user: User | null;
  isRestoring: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegistrationInput) => Promise<User>;
  logout: () => Promise<void>;
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
    setUser(registeredUser);
    await authService.login(normalizeEmail(input.email), input.password);
    return registeredUser;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value = useMemo(() => ({ user, isRestoring, login, register, logout }), [user, isRestoring]);
  return <AuthStateContext.Provider value={value}>{children}</AuthStateContext.Provider>;
}

function normalizeEmail(email: string) { return email.trim().toLowerCase(); }

export function useAuthState(): AuthStateContextValue {
  const context = useContext(AuthStateContext);
  if (!context) throw new Error('useAuthState must be used within AuthStateProvider');
  return context;
}
