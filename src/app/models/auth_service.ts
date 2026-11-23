import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AuthAccount, RegistrationInput, User } from './auth';

const ACCOUNTS_KEY = 'medsupply.auth.accounts.v1';
const SESSION_KEY = 'medsupply.auth.session.v1';

const ADMIN: AuthAccount = {
  user: {
    id: 'admin-1',
    fullName: 'MedSupply Admin',
    email: 'admin@medsupply.app',
    phone: '+20 100 000 0000',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  passwordHash: mockHash('Admin123!'),
};

function mockHash(value: string): string {
  // Development-only non-reversible mock hash. Replace with secure backend hashes.
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `mock-${(hash >>> 0).toString(16)}`;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class AuthService {
  async getStoredAccounts(): Promise<AuthAccount[]> {
    const stored = await AsyncStorage.getItem(ACCOUNTS_KEY);
    if (!stored) return [ADMIN];

    try {
      const accounts = JSON.parse(stored) as AuthAccount[];
      const hasAdmin = accounts.some((account) => account.user.role === 'admin');
      return hasAdmin ? accounts : [ADMIN, ...accounts];
    } catch {
      return [ADMIN];
    }
  }

  async register(input: RegistrationInput): Promise<User> {
    const fullName = input.fullName.trim();
    const email = normalizeEmail(input.email);
    const phone = input.phone.trim();

    if (!fullName || !email || !phone || !input.password || !input.confirmPassword) {
      throw new Error('Please complete all required fields.');
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Please enter a valid email address.');
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(input.password)) {
      throw new Error('Password must be at least 8 characters and include a letter and number.');
    }
    if (input.password !== input.confirmPassword) throw new Error('Passwords do not match.');

    const accounts = await this.getStoredAccounts();
    if (accounts.some((account) => normalizeEmail(account.user.email) === email)) {
      throw new Error('An account with this email already exists.');
    }

    const user: User = {
      id: `pharmacist-${Date.now()}`,
      fullName,
      email,
      phone,
      role: 'pharmacist',
      createdAt: new Date().toISOString(),
    };

    const nextAccounts: AuthAccount[] = [
      ...accounts.filter((account) => account.user.role !== 'admin'),
      { user, passwordHash: mockHash(input.password) },
    ];

    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(nextAccounts));
    return user;
  }

  async login(email: string, password: string): Promise<User> {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password) throw new Error('Please enter your email and password.');

    const accounts = await this.getStoredAccounts();
    const account = accounts.find((item) => normalizeEmail(item.user.email) === normalizedEmail);
    if (!account || account.passwordHash !== mockHash(password)) {
      throw new Error('Invalid email or password.');
    }

    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(account.user));
    return account.user;
  }

  async restoreSession(): Promise<User | null> {
    const stored = await AsyncStorage.getItem(SESSION_KEY);
    if (!stored) return null;

    try {
      const user = JSON.parse(stored) as User;
      if ((user.role !== 'pharmacist' && user.role !== 'admin') || !user.id) return null;
      return user;
    } catch {
      await AsyncStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(SESSION_KEY);
  }
}

export const authService = new AuthService();

export const MOCK_ADMIN_CREDENTIALS = {
  email: 'admin@medsupply.app',
  password: 'Admin123!',
} as const;
